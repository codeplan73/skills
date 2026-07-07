# UI Path: no image and no design.md

## Path B — No image, no design.md

### B1 — Present options

For the picker read only the frontmatter (lines 1–30) of each of `templates/stripe.md`, `templates/posthog.md`, `templates/nike.md`, `templates/supabase.md`, `templates/raycast.md`, not the full files. Read the full selected file in B2, after the user chooses.

Ask (as above) — question 1:
```
"What mood should this UI have?"
  - Dark & focused       → near-black, precise, technical (Raycast)
  - Light & professional → white/off-white, trustworthy (Stripe or Supabase)
  - Bold & editorial     → strong personality (PostHog or Nike)
  - Custom               → describe a style, brand, or paste a design.md URL
```

Then ask (as above) — question 2 (only for Light or Bold):
```
  Light: Stripe vs Supabase
  Bold:  PostHog vs Nike
  Dark:  auto-select Raycast
```

### B2 — Acquire the design system

**Template selected** → read the full file, copy it to `./design.md` (use your write tool: read `templates/<name>.md`, write its contents to `design.md`; don't rely on `cp`).

**URL provided** → fetch, validate it has `colors:` and `typography:`, save as `./design.md`.

**Style description** → generate `./design.md` using this schema:

```yaml
---
version: alpha
name: <style>-design-system
description: "<2–3 sentence character summary>"

colors:
  accent: ""
  on-accent: ""
  canvas: ""
  surface: ""
  ink: ""
  body: ""
  muted: ""
  hairline: ""
  success: ""
  error: ""

colors-dark:
  accent: ""
  on-accent: ""
  canvas: ""
  surface: ""
  ink: ""
  body: ""
  muted: ""
  hairline: ""

typography:
  body-md:    { fontFamily: "", fontSize: "16px", fontWeight: 400, lineHeight: 1.5 }
  heading-lg: { fontFamily: "", fontSize: "24px", fontWeight: 600, lineHeight: 1.2 }
  button-md:  { fontFamily: "", fontSize: "14px", fontWeight: 500 }

rounded:
  xs: ""  sm: ""  md: ""  lg: ""  xl: ""  full: "9999px"

spacing:
  xxs: "2px"  xs: "4px"  sm: "8px"  md: "12px"  lg: "16px"
  xl: "24px"  2xl: "32px"  section: "48px"

motion:
  duration-instant: "0ms"
  duration-fast: ""
  duration-normal: ""
  duration-slow: ""
  easing-standard: ""
  easing-out: ""
  easing-spring: ""

components:
  <key components with {token.path} references>
---

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
  ### Do
  ### Don't
## Responsive Behavior
```

Aesthetic guide:
- **Cyberpunk**: near-black canvas, neon cyan/magenta accent, 0–2px radius, mono font, dense spacing, fast motion (80ms), harsh easing
- **Brutalist**: pure black/white, 0px radius, thick borders, oversized type, zero motion (all durations 0ms)
- **Glassmorphism**: frosted canvas, translucent surfaces, 16–24px radius, slow transitions (200–400ms), gentle spring
- **Notion-like**: off-white canvas, Georgia display + Inter UI, 3px radius, generous line-height, fast subtle motion (100ms)
- **Apple consumer**: white canvas, system font stack, 10–20px radius, spring motion (200–350ms)
- **Named brand**: use that brand's documented colours/fonts; substitute proprietary fonts (see font installation)

Fill every field. No placeholders.

### B3 — Create CSS token file

Create `app/globals.css`, `src/styles/tokens.css`, or add to an existing globals file. Define CSS custom properties for:
- All colors (light): `--color-canvas`, `--color-surface`, `--color-ink`, `--color-body`, `--color-muted`, `--color-accent`, `--color-on-accent`, `--color-border`, `--color-success`, `--color-error`
- Icon sizes: `--icon-sm: 16px`, `--icon-md: 20px`, `--icon-lg: 24px`
- Typography: `--font-sans`, size scale (`--text-xs` through `--text-4xl`), weight scale
- Spacing: `--space-xxs` through `--space-section`
- Radius: `--radius-sm` through `--radius-full`
- Motion: `--duration-instant` through `--duration-slow`, `--ease-standard`, `--ease-out`, `--ease-spring`

Apply dark overrides via the detected strategy (`.dark {}` or `@media (prefers-color-scheme: dark)`); only override tokens that differ in dark mode. If Tailwind is in use, also extend `tailwind.config.ts` under `theme.extend` with all token values, wiring color tokens via `var(--color-*)` so dark mode works automatically.

---
