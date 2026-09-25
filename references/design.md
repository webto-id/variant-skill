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

**One palette rule outranks the rest: `accent` is a brand color, not a light tint.** Your source's soft grey band is `bg-muted` (or `bg-card`), which is mixed from the page background and stays a shade off it under every palette and in dark mode. Getting this wrong is invisible while you work — a converted theme usually has a near-white accent — and then the buyer picks a platform palette, accent becomes teal or amber, and your section's text disappears. See `wvf.md` §6.1.

**This is not a ban on accent bands.** A full-width `bg-accent` paired with `text-accent-foreground` stays readable under every palette, because that foreground is recomputed for whatever accent becomes; what changes is the section's WEIGHT — a whisper in your theme, a saturated brand band in theirs. That is a design decision to make deliberately, not a defect to remove. The defect is only ever a brand surface under a FOREIGN foreground. Do not sweep legitimate accent bands into `bg-muted` on sight; you will flatten every template you convert into the same grey.

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

A buyer can also emphasize fragments of any of those fields (`==diskon==`, `**tebal**`) — the site renders those centrally, you do nothing. But a marker pair only survives inside ONE text node, so splitting a field's value across elements (per-word animation being the usual temptation) silently kills them for that field. See `wvf.md` §2.5.

## 7b. Let the site do its half

A few behaviours are already implemented centrally; the variant only marks elements and inherits them, with no script and so no script check. `wvf.md` §2.6 is the full list — two of them are design decisions, not plumbing:

- **A section that shows off photographs opens them.** Gallery, portfolio, bento, before/after: put `data-lightbox` on the images (and wrap the set in `data-lightbox-group`) unless the picture is purely decorative background. Eleven of the platform's twelve gallery components do this, so a variant without it is the one that looks broken in the comparison the buyer actually makes.
- **A call to action with no editable text field in it needs `data-track="cta"` written by hand.** The compiler adds it automatically whenever the link carries a `data-edit-field` — on the anchor itself or inside it, so `mailto:`/`tel:` links are covered — but an icon link, a linked photo card, a fixed-chrome label and an `data-edit-url`-only social icon are not. Social icons staying out is deliberate: mixing "follow us" into conversions costs the owner the ability to tell browsing from buying. Use `data-track="none"` on the rare editable-text link that is not a conversion, such as a photo credit.

## 8. The thumbnail test

The marketplace shows a 4:3 screenshot of the section with sample content. If the idea is not readable at 320 px wide, simplify: fewer competing elements, one focal point, clear hierarchy.

## 9. Naming and metadata (for the listing)

- Name: `<Type> <idea>` — "Hero Split Editorial", "FAQ Two-column Numbered".
- Description (1–2 sentences, factual, no superlatives — the AI reads it to decide when to use the variant): what the layout is and what content it suits. "Split hero with an editorial serif headline and a tall image; suits studios, consultants, personal brands with one strong photo."
