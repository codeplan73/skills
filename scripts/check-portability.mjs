#!/usr/bin/env node
// Portability / convention guard for the skill suite.
// Run: node scripts/check-portability.mjs   (exit 1 on any violation)
//
// Enforces the cross-tool conventions we standardized so they don't drift:
//  1. Every skill declares `allowed-tools` in frontmatter.
//  2. No skill hardcodes a Claude-only model alias as a spawn directive
//     (`model: "haiku|sonnet|opus|fable"`) — use role words instead.
//     Convention: spawn instructions SET the subagent model explicitly as an
//     action ("set the model explicitly; do not inherit the session model"),
//     phrased in role words (a fast, low-cost tier / a strong model) with the
//     per-tool alias only as an unquoted example — subagents otherwise inherit
//     the (often expensive) main-session model.
//  3. No skill names THE subagent tool in prose ("the Agent tool",
//     "spawn an Agent", "the Task tool") — stay capability-first.
//  4. No non-git shell glue that breaks on PowerShell in a SKILL body
//     (`>/dev/null`, `&& BASE=`, `|| BASE=`) — express base-branch
//     selection as prose (git commands themselves are fine).
//  5. SKILL.md and bundled prompt assets stay within byte budgets — the
//     SKILL body loads into the main context on every invocation, and the
//     prompt assets load into subagent contexts when used.
//  6. Frontmatter `description` stays under 400 characters — every installed
//     skill's description loads into every session.
//  7. Every skill ships its OpenAI Codex adapter (`agents/openai.yaml`)
//     with the `interface:` fields present.
//
// Note: `.md` files under templates/ are reference data and are skipped for
// rules 2-4 (they show generated output, not instructions to run).

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = new URL('../skills/', import.meta.url).pathname;
const violations = [];

// Rule 5 budgets. Default is the ceiling for a lean phase skill; overrides
// are grandfathered exceptions — ratchet them DOWN as files shrink, never up.
const SKILL_BYTE_BUDGET = 32 * 1024;
const SKILL_BYTE_OVERRIDES = {};
const SUPPORT_MD_BYTE_BUDGET = 24 * 1024;
const SUPPORT_MD_OVERRIDES = {
  'architect/agent-prompt.md': 28 * 1024, // common ADR writer prompt; ratchet down after more common-rule trimming
  'architect/internal/design-conversation.md': 27 * 1024, // main-thread design walk; carries the deliberate depth mandate + completeness gate (raised on purpose for question depth); split by stage if it grows further
};
const DESCRIPTION_CHAR_CAP = 400;
const HOT_PATH_BUDGETS = [
  {
    name: 'architect main full-design path',
    budget: 62 * 1024,
    required: ['architect/SKILL.md', 'architect/internal/design-conversation.md', 'architect/internal/after-subagent.md'],
  },
  {
    name: 'architect subagent write path',
    budget: 48 * 1024,
    required: ['architect/agent-prompt.md', 'architect/adr-template.md'],
    oneOf: [
      'architect/agent-modes/feature.md',
      'architect/agent-modes/architecture.md',
      'architect/agent-modes/enhancement.md',
      'architect/agent-modes/cross-cutting.md',
    ],
  },
  {
    // Plan reads the router + one repo-shape variant + one chosen build-approach
    // persona (all four personas are ~2.7KB, so facade.md stands in for the set).
    name: 'roadmap plan path',
    budget: 44 * 1024,
    required: ['roadmap/SKILL.md', 'roadmap/modes/plan.md', 'roadmap/roadmap-template.md', 'roadmap/approaches/facade.md'],
    oneOf: ['roadmap/modes/plan-greenfield.md', 'roadmap/modes/plan-brownfield.md', 'roadmap/modes/plan-monorepo.md'],
  },
  {
    name: 'roadmap replan/add path',
    budget: 24 * 1024,
    required: ['roadmap/SKILL.md', 'roadmap/roadmap-template.md'],
    oneOf: ['roadmap/modes/replan.md', 'roadmap/modes/add.md'],
  },
  {
    name: 'develop UI path',
    budget: 42 * 1024,
    required: ['develop/ui-guide.md', 'develop/ui/implementation.md'],
    oneOf: ['develop/ui/mcp.md', 'develop/ui/image.md', 'develop/ui/existing.md', 'develop/ui/generate.md'],
  },
  {
    // Worst-case main-thread read: router + the tool-skills sweep (greenfield/
    // whole-repo only) + the largest single phase mode file.
    name: 'audit phase path',
    budget: 22 * 1024,
    required: ['audit/SKILL.md', 'audit/modes/tool-skills.md'],
    oneOf: ['audit/modes/greenfield.md', 'audit/modes/whole-repo.md', 'audit/modes/area.md', 'audit/modes/gapfill.md'],
  },
  {
    // First-run setup path reads the router spine plus modes/setup.md; the
    // common write path reads the router alone (SKILL.md budget covers it).
    name: 'test setup path',
    budget: 24 * 1024,
    required: ['test/SKILL.md', 'test/modes/setup.md'],
  },
  {
    // Build path: gate router + post-gate build flow + the larger track guide.
    // The gate-only path (route to /architect) reads SKILL.md alone.
    name: 'develop build path',
    budget: 44 * 1024,
    required: ['develop/SKILL.md', 'develop/flow/build.md'],
    oneOf: ['develop/ui-guide.md', 'develop/logical-guide.md'],
  },
];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (entry.endsWith('.md')) check(p);
  }
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

function check(path) {
  const rel = path.slice(SKILLS_DIR.length);
  const text = readFileSync(path, 'utf8');
  const isSkillMd = rel.endsWith('/SKILL.md');
  const isTemplate = rel.includes('/templates/');

  // Rule 1 — allowed-tools on every SKILL.md
  if (isSkillMd && !/^allowed-tools:/m.test(frontmatter(text))) {
    violations.push(`${rel}: missing \`allowed-tools\` in frontmatter`);
  }

  if (isSkillMd) {
    const skill = rel.split('/')[0];

    // Rule 5 — SKILL.md byte budget
    const budget = SKILL_BYTE_OVERRIDES[skill] ?? SKILL_BYTE_BUDGET;
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > budget) {
      violations.push(`${rel}: ${bytes} bytes exceeds its budget of ${budget} — condense or split before it lands`);
    }

    // Rule 6 — description length cap
    const desc = frontmatter(text).match(/^description:\s*"([\s\S]*?)"\s*$/m);
    if (desc && desc[1].length > DESCRIPTION_CHAR_CAP) {
      violations.push(`${rel}: description is ${desc[1].length} chars (cap ${DESCRIPTION_CHAR_CAP}) — it loads into every session`);
    }
  } else if (!isTemplate) {
    // Rule 5 — bundled prompt/guide byte budget
    const budget = SUPPORT_MD_OVERRIDES[rel] ?? SUPPORT_MD_BYTE_BUDGET;
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > budget) {
      violations.push(`${rel}: ${bytes} bytes exceeds its support-file budget of ${budget} — condense or split before it lands`);
    }
  }

  if (isTemplate) return; // reference data — skip prose/shell rules

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const n = i + 1;
    const fm = isSkillMd && i < 6; // rough frontmatter guard
    if (fm) return;

    // Rule 2 — no hardcoded model-alias spawn directive
    if (/model:\s*"(haiku|sonnet|opus|fable)"/.test(line)) {
      violations.push(`${rel}:${n}: hardcoded model alias — use role words ("a fast, low-cost model" / "a strong model")`);
    }
    // Rule 3 — no tool-naming in prose
    if (/\bthe [`"]?(Agent|Task)[`"]? tool\b/i.test(line) || /spawn an [`"]?Agent\b/i.test(line)) {
      violations.push(`${rel}:${n}: names the subagent tool in prose — stay capability-first ("spawn a subagent")`);
    }
    // Rule 4 — no PowerShell-breaking shell glue in SKILL bodies
    if (isSkillMd && (/>\/dev\/null/.test(line) || /&&\s*BASE=/.test(line) || /\|\|\s*BASE=/.test(line))) {
      violations.push(`${rel}:${n}: non-portable shell glue (\`>/dev/null\`/\`&& BASE=\`) — express base-branch selection as prose`);
    }
  });

  // review keeps its cross-model table intentionally — allowlist it for rule 2
}

walk(SKILLS_DIR.replace(/\/$/, ''));

// Rule 5b — aggregate hot-path budgets. These model the largest combination
// a normal run should need after router files load their selected references.
for (const group of HOT_PATH_BUDGETS) {
  let bytes = 0;
  for (const rel of group.required) {
    bytes += Buffer.byteLength(readFileSync(join(SKILLS_DIR, rel), 'utf8'), 'utf8');
  }
  if (group.oneOf) {
    let largest = 0;
    let largestRel = '';
    for (const rel of group.oneOf) {
      const size = Buffer.byteLength(readFileSync(join(SKILLS_DIR, rel), 'utf8'), 'utf8');
      if (size > largest) {
        largest = size;
        largestRel = rel;
      }
    }
    bytes += largest;
    group.detail = ` (largest optional: ${largestRel})`;
  }
  if (bytes > group.budget) {
    violations.push(`${group.name}: ${bytes} bytes exceeds hot-path budget of ${group.budget}${group.detail ?? ''}`);
  }
}

// Rule 7 — every skill ships its OpenAI Codex adapter
for (const entry of readdirSync(SKILLS_DIR)) {
  const dir = join(SKILLS_DIR, entry);
  if (!statSync(dir).isDirectory()) continue;
  const adapter = join(dir, 'agents', 'openai.yaml');
  if (!existsSync(adapter)) {
    violations.push(`${entry}: missing agents/openai.yaml (OpenAI Codex adapter)`);
  } else {
    const y = readFileSync(adapter, 'utf8');
    for (const field of ['interface:', 'display_name:', 'short_description:', 'default_prompt:']) {
      if (!y.includes(field)) violations.push(`${entry}/agents/openai.yaml: missing \`${field.replace(':', '')}\` field`);
    }
  }
}

// review/SKILL.md's author→reviewer table legitimately names model families
// in prose (not as spawn directives); filter those false positives.
const filtered = violations.filter(v => !(v.startsWith('review/SKILL.md') && v.includes('model alias')));

if (filtered.length) {
  console.error('Portability check FAILED:\n' + filtered.map(v => '  - ' + v).join('\n'));
  process.exit(1);
}
console.log('Portability check passed — all skills follow the cross-tool conventions.');
