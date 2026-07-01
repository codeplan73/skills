#!/usr/bin/env node
// Portability / convention guard for the skill suite.
// Run: node scripts/check-portability.mjs   (exit 1 on any violation)
//
// Enforces the cross-tool conventions we standardized so they don't drift:
//  1. Every skill declares `allowed-tools` in frontmatter.
//  2. No skill hardcodes a Claude-only model alias as a spawn directive
//     (`model: "haiku|sonnet|opus|fable"`) — use role words instead.
//  3. No skill names THE subagent tool in prose ("the Agent tool",
//     "spawn an Agent", "the Task tool") — stay capability-first.
//  4. No non-git shell glue that breaks on PowerShell in a SKILL body
//     (`>/dev/null`, `&& BASE=`, `|| BASE=`) — express base-branch
//     selection as prose (git commands themselves are fine).
//
// Note: `.md` files under templates/ are reference data and are skipped for
// rules 2-4 (they show generated output, not instructions to run).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = new URL('../skills/', import.meta.url).pathname;
const violations = [];

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

// review/SKILL.md's author→reviewer table legitimately names model families
// in prose (not as spawn directives); filter those false positives.
const filtered = violations.filter(v => !(v.startsWith('review/SKILL.md') && v.includes('model alias')));

if (filtered.length) {
  console.error('Portability check FAILED:\n' + filtered.map(v => '  - ' + v).join('\n'));
  process.exit(1);
}
console.log('Portability check passed — all skills follow the cross-tool conventions.');
