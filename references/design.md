# Designing a marketplace section variant — what makes it good

A variant is **one band of a page you will never see**, rendered with content you did not write, in a palette you do not choose, next to sections made by other people. Everything below follows from that.

## 1. What you control (and what the theme takes away)

| You do NOT control | You DO control |
|---|---|
| Colors (site palette) | Layout, proportion, alignment, rhythm |
| Fonts (`--font-heading` / `--font-body`) | Type scale relationships, weight, case, tracking |
| Corner radius (`--radius`) | Borders, rules, frames, elevation, overlap, asymmetry, motion |
| Content length, item count, whether images exist | How the layout degrades across that range |
| Light vs dark | Contrast strategy that works in both |

A variant that differs from existing ones only by color or radius does not differ at all once the theme is applied. **Distinctiveness must be structural**: one clear idea (asymmetry, overlap, oversized numerals, hairline grid, marquee, stagger, diagonal, a single hero item with the rest small) — commit to it.

## 2. Content-shape robustness (the real brief)

Before calling it done, render it with:

- **1 item** — a 3-column grid with one lonely card at the left edge is a bug. Use the smart-column pattern:
  ```astro
  const n = items.length;
  const cols = n >= 4 ? "md:grid-cols-2 lg:grid-cols-4" : n === 3 ? "md:grid-cols-3" : n === 2 ? "md:grid-cols-2" : "max-w-md mx-auto";
  <div class:list={["grid gap-6", cols]}>…</div>
  ```
- **Max items** (12 features, 20 FAQ, 12 testimonials) — does it still scan, or become a wall?
- **Every optional field absent** — no subheading, no icon, no image, no rating. Render nothing (`{x && (…)}`), never an empty box or a placeholder word.
- **Long text** — a 3-line headline, a 400-character description. Use `line-clamp-*` or generous wrapping; never fixed heights that overflow.
- **No image** — show a placeholder div with `data-edit-image` so the owner can click to add one; never a broken `<img>`.
- **Both themes** — swap the preview to dark; check overlays, borders and muted text.

## 3. Mobile is a different layout, not a squeeze

Decide, per variant, what happens under 640 px: stack, hide decoration, reduce type scale (`text-3xl sm:text-5xl`), turn a 4-up grid into a 1-up or a horizontal scroll (`overflow-x-auto snap-x`). Tap targets ≥ 44 px. Test at 390 px width in the preview.

## 4. Typography

- Display text: `style="font-family: var(--font-heading);"` + `font-bold tracking-tight` + a responsive size. Body: inherit.
- One scale step between heading and subheading is enough; contrast comes from weight and color (`text-muted-foreground`), not five sizes.
- Never letterspace lowercase body text; uppercase small labels (`text-xs uppercase tracking-wider`) are fine for eyebrows.

## 5. Motion

Subtle, opt-in, and never required to see content: fade/translate on enter via `IntersectionObserver` in the script, `transition-*` on hover. Respect `prefers-reduced-motion` (`@media (prefers-reduced-motion: reduce) { … { animation: none } }`). Marquees: `overflow:hidden` on the section, the animated track inside.

## 6. Accessibility floor

Semantic elements (`<section>`, `<h2>` for the section heading — the page's `<h1>` belongs to the hero only), `alt` on every image (derive from a field, e.g. `alt={item.title}`), `aria-hidden="true"` on decorative SVG/text, keyboard-reachable interactive controls (`<button>`, not `<div onclick>`), visible focus (`focus:ring-2 focus:ring-ring`), `aria-expanded`/`aria-controls` on accordions and tabs.

## 7. The "zero dead text" discipline

Every visible word is either a content field (`data-edit-field`) or a fixed chrome label via `t("…")`. Decorative characters (`✓`, `→`, `01`) are `aria-hidden="true"`. Sample copy lives in **defaults** (`const { heading = "Kenapa memilih kami" } = Astro.props;`) — Indonesian, short, replaceable — never in JSX literals.

## 8. The thumbnail test

The marketplace shows a 4:3 screenshot of the section with sample content. If the idea is not readable at 320 px wide, simplify: fewer competing elements, one focal point, clear hierarchy.

## 9. Naming and metadata (for the listing)

- Name: `<Type> <idea>` — "Hero Split Editorial", "FAQ Two-column Numbered".
- Description (1–2 sentences, factual, no superlatives — the AI reads it to decide when to use the variant): what the layout is and what content it suits. "Split hero with an editorial serif headline and a tall image; suits studios, consultants, personal brands with one strong photo."
