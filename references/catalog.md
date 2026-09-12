# `variant.json` — the AI-generation catalog manifest

A standalone variant is delivered as a small folder, not a bare `.astro` file:

```
my-variant/
  variant.json          # this manifest
  hero-idcard.astro      # the WVF file (key = file basename)
  hero-idcard.sample.json  # optional showcase content
  photo.png               # optional: your own image, referenced as "asset:photo.png"
```

Uploaded at webto.id → Marketplace → Variant Saya → Variant Baru (or Update dari Bundle to re-upload an existing one). Files are matched by FILENAME only — folder placement doesn't matter (a `sections/`/`samples/`/`assets/` split is fine, so is everything flat at root).

## `variant.json` shape

```jsonc
{
  "sectionType": "hero",
  "name": "Hero Idcard",
  "description": "Personal hero with an availability badge, two buttons, and a photo shaped like an ID card hanging from a lanyard.",
  "mood": ["playful", "minimal"],
  "fits": "personal portfolios with one portrait photo"
}
```

- **`sectionType`**: one id from `schema.md` (`hero`, `features-grid`, `testimonials`, …). Chrome types (`navbar`, `banner`, `banner-inline`, `footer`) are legal here too (allowed platform-wide since 2026-09-04) — if you author one, it must read the renderer-injected context props (`pages`, `linkPrefix`, `siteName`, …) and keep its root in normal flow (`position: fixed` is a compile error).
- **`name`**: English Title Case, word-for-word from the `.astro` file's basename (`hero-idcard.astro` → `"Hero Idcard"`) — a name in another language or different wording makes the file untraceable from the dashboard.
- **`description`** and **`mood`** are what the AI wizard's variant catalog reads to decide whether this variant fits a buyer's site — not editor-facing copy, and not optional in practice: a variant can still be SAVED without them (draft), but cannot be submitted for review until both are filled in, and without them the catalog silently degrades this variant to an opaque, unpickable `u:<id>` token. Write `description` as a factual layout clause with no superlatives ("Two-column hero with a large photo on the right", not "A stunning modern hero"). **English prose**, same convention as every built-in variant's own catalog text.
- **`mood`** — 1 to 4 values from this CLOSED enum, never invent one: `editorial` `luxurious` `airy` `minimal` `technical` `precise` `corporate` `playful` `warm` `casual` `bold` `brutal` `dense` `dark`. Map the design's feel to the NEAREST listed mood ("elegant" → `luxurious`, "romantic" → `warm`, "fun" → `playful`).
- **`fits`** (optional but recommended): the content SHAPE this variant actually needs ("short headline + one strong photo"), not a restatement of `description`.

## Images

Same three legal forms the `html-to-webto-template` skill documents for bundles:

- `"asset:<filename>"` — your OWN photography/art (never someone else's stock library or icon pack). Ship the file (PNG/WebP/JPG, ≤ 2 MB, filename `[A-Za-z0-9._-]` only, ≤ 20 files / 8 MB per variant) alongside `variant.json`. SVG is not accepted yet. Use this when a specific real photo/graphic is what makes the design — most variants don't need it at all.
- `"__IMG__:<english search query>"` — resolved to a distinct Unsplash photo per occurrence at upload. The usual default for `sample.json` content. Note "per occurrence" is literal: the same query used twice (e.g. once in a bundle's `template.json` and once in this variant's `sample.json`) resolves to two DIFFERENT photos of the same subject. Use `asset:<filename>` when a slot must show the identical image in both places.
- A direct `https://images.unsplash.com/...` or pexels URL.
