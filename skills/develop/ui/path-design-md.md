# UI Path: existing design.md

## Design.md path — existing design system

Act as a professional frontend engineer: every colour, font family, spacing value, radius, shadow, and motion curve comes from `design.md`. Never invent values; derive anything unspecified from the nearest specified token.

**Naming note:** `colors.primary` and `colors.accent` are synonyms for the brand accent colour. Templates use `primary`; generated files use `accent`. Treat them identically.

**Component spec resolution:** `## Components` in `design.md` uses `{token.path}` references (e.g. `{colors.accent}`, `{rounded.md}`). Resolve to actual token values when generating CSS; never paste the reference literal into code.

### DS1 — Read design.md

Read the full file. Extract: color palette (light + dark variants if `colors-dark:` present); typography families, scale, weights, line-heights, letter-spacing; spacing scale and section rhythm; border radius per element type; shadows/elevation; motion durations and easing (default `200ms ease-out` if absent); component specs from `## Components`; every rule in `## Do's and Don'ts`.

### DS2 — Sync token files

Run stack, styling, and dark mode detection. File-search (ignoring `node_modules`) for existing token files: `globals.css`, `tokens.css`, or `tailwind.config.*`. Compare their values against `design.md`. Add absent tokens freely. Conflicts: never silently overwrite; list them in the report, let the engineer decide.

### DS3 — Implement

Run the implementation phases with design.md as sole source of truth.

---
