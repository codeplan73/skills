# UI Path: image or screenshot

## Step 1 — Image vs no image

**Image attached** → **Path A**.
**No image** → **Path B**.

---

## Path A — Pixel-perfect from image

### A0 — Multiple images?

If more than one image, identify what each represents before analysis:
- **Same UI at different widths** → responsive breakpoints: extract layout changes per width, feed Phase 3
- **Same UI in different states** → default/hover/active/error: extract the visual diff per state, feed Phase 4
- **One light + one dark** → `colors:` from the light image, `colors-dark:` from the dark

Then run A1 on the primary (default/light) image.

### A1 — Extract tokens from the image

Extract exactly what is visible, never fabricate values.
- **Colors**: canvas, surface(s), ink, body, muted, accent, accent-pressed, border, semantic colors; exact hex, not approximations
- **Typography**: family name if recognizable, size scale anchored to body = 16px, weights, line-heights, letter-spacing
- **Spacing**: 4px base unit; pad, gap, section rhythm, max-width
- **Geometry**: radius per element type, border widths, shadows (`x y blur spread color/opacity`), gradients, backdrop blur
- **Motion**: infer from context; micro-interactions (~100ms), standard (~200ms), reveals (~350ms), easing character
- **Mode**: light or dark, contrast level, sharpness

### A2 — Token schema

Produce a YAML token schema using `accent` (not `primary`) as the canonical accent colour name. Include `colors-dark:` if the design has or implies a dark mode.

### A3 — Token file conflict check

Find existing token files. Conflicts between current values and the image: stop, list them before writing. Offer: `update` / `extend` / `skip`.

---
