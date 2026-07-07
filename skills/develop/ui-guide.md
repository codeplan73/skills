# /develop — UI track guide

UI build track for `/develop`, read after the ADR gate (`SKILL.md` Step 0) classifies a task as UI: components, pages, or full layouts with semantic HTML, design tokens, and strict accessibility. Any web stack (Next.js, Vite, Nuxt, Svelte, plain HTML). A root `design.md` is the single source of truth. With a screenshot, replicate pixel-perfectly; without one, pick a curated template, a `design.md` URL, or a described style.

## What this track does

Entry points, checked in order:

1. Existing `design.md`: implement strictly to it as a professional frontend engineer.
2. Image provided: extract tokens, replicate pixel-perfectly.
3. Neither: guide template selection or custom style generation, create `design.md`, implement.

All paths: component-or-screen → stack detection → styling library → dark mode → token sync → font → five phases.

## How the UI build fits the project's approach

The UI build serves the project's build approach (read in `SKILL.md` Step 2), never dictates one. Shell-first on placeholder data, wired later, is the Facade mode: one strategy, not the universal default. An end-to-end / tracer-bullet slice lands the data layer in the same pass, so bind to the real source; a Journey completes the whole user path for the phase. The phases below apply under every approach; only when real data arrives differs. No recorded approach: build the UI as part of a coherent end-to-end slice.

---

## Portability (any OS, any agent)

Any Agent Skills client, macOS/Linux/Windows. Detection snippets (`find`, `cat | grep`, `cp`) are POSIX reference, not literal scripts: use your agent's own cross-platform file tools to find files, read `package.json`/config, and copy a template to `design.md`. Bundled files (`templates/*.md`, `checklist.md`) are paths relative to this skill's folder, read on demand: load only the ONE chosen template (full file only after selection), never all of them, and read this guide's phases as reached, not front-loaded. The UI build runs inline (it is interactive); heavy code exploration (finding existing components/tokens to match) goes to a read-only subagent per `SKILL.md` Step 2.5. App code/CSS is inherently cross-platform. No interactive-question picker: ask the prompts as plain text with the same options.

## Step 0 — Did the ADR already decide the design system?

Check the governing ADR first (`/develop` read it in Step 2). If it settled the design direction (named template, "extract from existing UI", described style, or page composition), execute it; never re-ask, `/architect` already grilled the engineer on this. Create `design.md` from the ADR's decision (e.g. "use the Raycast template" → copy that template; "extract from existing UI" → Step 0.2 extraction), then implement.

Only if no ADR governs this UI, or it is silent on the design system, fall through to the detection below.

## Step 0.0 — Check for existing design.md

File-search for `design.md` within about 3 levels of the project root, ignoring `node_modules`, `.git`, `.claude`. Found: validate; it needs at least a `colors:` block and a `typography:` block. Either missing, or file empty: treat as not found and warn the user.

Found and valid → **Design.md path**, skip Steps 1 onward.
Not found → **Step 0.1 (brownfield check)**.

---

## Step 0.0 — Follow the design source the ADR recorded (don't assume)

The design source is the engineer's choice, recorded in the ADR by `/architect` (Figma frames, screenshot, existing `design.md`, or described direction). Follow the record; never default to Figma just because an MCP is connected.
- ADR says Figma → pull the real design via the Figma MCP (tokens, spacing, components, the named frames) into `./design.md` (real values, not invented), show a short summary, confirm, build to it. No MCP connected: say so, ask to connect it or pick another source.
- ADR says screenshot / existing UI / described direction → the matching step below.
- No ADR record (direct UI task, no source given) → ask *"How should I get the design for this?"* with options **From Figma (its MCP)** · **From a screenshot / images** · **From the existing `design.md` / current UI** · **No design, suggest a direction** (the picker adds Other), then proceed by their pick.

## Step 0.1 — Brownfield check (no design.md, but is there existing UI?)

Before generating a fresh design system, check for an existing visual language to match; a new one over an existing app clashes with what's shipped. File-search (ignoring `node_modules`) for:
- Styling/token files: `globals.css`, `tokens.css`, `theme.*`, `tailwind.config.*`.
- Component directories: a `components/` tree or a `ui` directory.

Found (brownfield): ask before proceeding, via your agent's interactive option picker (`AskUserQuestion` on Claude Code) or plain-text options with the same choices:
- **question**: "There's no `design.md`, but this project already has UI. How should I get the design system?"
- **header**: "Design system"
- **options**:
  1. `Extract from existing code` — "Recommended — reverse-engineer `design.md` from the current tokens/components so new UI matches what's shipped." → **Step 0.2**.
  2. `Use a reference` — "I'll give a screenshot or a `design.md` URL, or pick a template." → **Step 1**.
  3. `Match a specific file` — "Build to mirror an existing component/page I name; I'll point you at it." → read that file's styles, treat them as the local source of truth.

No existing UI (greenfield) → **Step 0.5**.

### Step 0.2 — Extract design.md from existing code

Read the token files and 3–5 representative components/pages. Recover the real system into `design.md` (same schema as generated): colors (light + dark if present), typography (families, scale, weights), spacing scale, radii, shadows, motion, and conventions visible in components. Pull values from CSS variables / Tailwind config, never invent. Inconsistent codebase: pick the dominant value, note the variance. Write `./design.md`, show a short summary, confirm before building, then implement with it as source of truth.

---

## Step 0.5 — Component or screen?

Determines prop API design, routing integration, file placement.

| Prompt contains | Build type |
|---|---|
| "screen", "page", "layout", "route", "dashboard", "view" | **Screen** |
| "component", "button", "card", "input", "modal", "badge", "dropdown", "toggle", "chip" | **Component** |
| Ambiguous | Ask |

If ambiguous, ask (as above):
```
"Is this a reusable component or a full page?"
  - Reusable component — isolated, takes props, no routing
  - Full page / screen — owns layout, integrates with router
```

**Component rules** (apply throughout all phases): define the `interface Props` before any markup; named export from its own file; no router imports, no page-level data fetching inside the component; Storybook present (`*.stories.*`) → create a story file alongside; file naming matches the convention of existing components.

**Screen rules** (apply throughout all phases): integrate with the detected router (Next.js App Router, Vite React Router, Nuxt, SvelteKit); include loading, error, and empty states at page level; wrap with the existing layout component if the project has one.

---

## Stack detection

File-search near the project root (ignoring `node_modules`) for a framework config (`next.config.*`, `vite.config.*`, `nuxt.config.*`, `svelte.config.*`); read `package.json` dependencies for `next`, `vite`, `nuxt`, `svelte`, or `astro`. The framework affects routing integration, image primitives, and font loading.

---

## Styling library, dark mode, and icon detection

Using your file-search and read tools (ignoring `node_modules`):
- **Styling**: `package.json` dependencies for `@shadcn`, `@radix-ui`, `@mui`, `antd`, `@chakra-ui`, `@mantine`, `styled-components`, `@emotion`, `tailwindcss`; a `components/ui` directory (shadcn); any `*.module.css` / `*.module.scss` files.
- **Dark mode strategy**: `next-themes` in `package.json`; `darkMode` setting in any `tailwind.config.*`.
- **Icon library**: `package.json` dependencies for `lucide-react`, `@heroicons`, `phosphor-react`, `@phosphor-icons`, `react-icons`, `@tabler/icons`.

**Styling decision:**

| Detected | Approach |
|---|---|
| `components/ui/` (shadcn) | Use shadcn primitives with `cn()` + Tailwind token classes |
| `tailwindcss` only | Utility classes only — no `style={}` props |
| `*.module.css` | One `.module.css` per component |
| `styled-components` / `@emotion` | Tagged template literals referencing CSS variables |
| Nothing | Semantic HTML + external CSS referencing CSS custom properties |

Common cases, not exhaustive. Another styling library installed (UnoCSS, Panda, vanilla-extract, Stylex, …): use it, follow its idiom. The rule is "use what's installed, the way it's meant to be used," never "only these."

**Dark mode strategy:**

| Detected | Approach |
|---|---|
| `next-themes` in package.json | `.dark {}` class only — no `@media` as primary |
| `darkMode: 'class'` in tailwind config | `.dark {}` class only |
| `darkMode: 'media'` in tailwind config | `@media (prefers-color-scheme: dark)` |
| Nothing detected | Both: `@media` query + `.dark {}` fallback |

**Icon library:** use whatever is installed. Nothing installed: note it in the report; never emoji or placeholder SVGs. Icon size always references a spacing token, never hardcoded. Decorative icons: `aria-hidden="true"`. Standalone interactive icons: visually-hidden label or `aria-label` on the wrapping button.

---

## Step 1 — Load the selected UI path

Based on the checks above, read exactly one path file:

- `ui/path-design-md.md` when an existing `design.md` governs this build.
- `ui/path-image.md` when a screenshot or image is the visual source.
- `ui/path-no-image.md` when there is no screenshot and no `design.md`.

After the selected path has resolved tokens, assets, and design direction, read `ui/implementation.md` and follow it through the implementation phases and report. Do not read the other path files unless the source changes.

## Reference files

- Accessibility checklist: `checklist.md`
- Design templates: `templates/`
- Project design system: `./design.md`
- UI source paths: `ui/path-design-md.md`, `ui/path-image.md`, `ui/path-no-image.md`
- UI implementation phases and report: `ui/implementation.md`
