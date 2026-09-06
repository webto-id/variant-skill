# Changelog

## 0.1.0 — 2026-08-27

- First public release, matching `@webto-id/variant-check@0.1.x` (compiler 0.1.0).

## 0.1.1 — 2026-09-01

- `references/tailwind.md`: new section **Heading sizes belong to the site** —
  `h1`–`h4` take their size from the buyer's site theme (unlayered rule beats
  `@layer wvf`), so `text-*` on them compiles but does nothing; the compiler
  (`@webto-id/variant-check` ≥ 0.1.4) warns `heading-size-inert`.
- Documented the three size tiers: plain `text-*` follows the site owner's
  body-size settings (theme and per-section); `!text-*` is honored everywhere
  and never rewritten by the platform — use it when an element's size is part
  of the design; an inline `style="font-size"` is absolute.
- `references/wvf.md`: `heading-size-inert` added to the lint-code table.
- `references/tailwind.md`: **Negative utilities** section — `-mt-16` etc.
  compile since compiler 0.1.2 (0.1.0 dropped them silently); unaccepted class
  tokens raise `tailwind-skipped` (an error under `--strict`).

## 0.1.2 — 2026-09-03

- `references/wvf.md`: new `<AddImageButton path label? mode="inline|floating" visible?>`
  macro — the editor's "Tambah Gambar" pill for image lists (renders nothing on the
  live site; a variant without it gets a fallback pill at the section's tail, but that
  placement is a guess — place the macro at the list's bottom seam yourself).
  Requires `@webto-id/variant-check` ≥ 0.1.5 (older CLIs reject the component).
- `references/wvf.md` §3: scoping now documents CSS-nesting flattening (compiler
  0.1.5): a nested `&` means the parent rule (standard semantics), a top-level `&`
  is still the variant root; nested `@media`/`@supports` are hoisted. This is the
  fix for hover:/before:/after: being dead on live sites.

## 0.1.3 — 2026-09-03

- `references/tailwind.md`: **Sources built on another CSS framework** — leftover
  framework classes (`btn btn-primary`) are candidate-shaped, so Tailwind silently
  emits nothing; rewrite completely. The compiler CLI (≥ 0.1.6) warns `unknown-class`,
  deliberately sparing `group`/`peer` markers, `js-*`/`wv-*` script hooks, and any
  class the variant's own `<style>`/`<script>` mentions; advisory, not strict-fatal.
- `references/wvf.md`: `unknown-class` added to the lint-code table.

## 0.1.4 — 2026-09-04

- `references/wvf.md` §4b: **site chrome** (navbar/banner/footer) may now be WVF.
  Renderer-injected context props (`pages`, `currentSlug`, `linkPrefix`,
  `siteName`, `colorMode`; footer also `footerPages`/`imageCredits`) are read
  from Props and never become editor fields. Roots must stay in normal flow:
  `position: fixed` is now a compile error for every type — the platform makes
  the section wrapper sticky (a `u:` navbar gets "bar" mode automatically).

## 0.1.5 — 2026-09-04

- `references/wvf.md` §4c: **DB-driven sections** (products/blog) — a variant
  renders the same base card arrays in both source modes (`manual` |
  `database`); the platform fills `products[]`/`posts[]` from the site's real
  data before render. Render `price` verbatim (pre-formatted), survive the
  empty list, keep `url` optional, never hide `source`; pagination is the
  page's job, not the section's.

## 0.1.6 — 2026-09-04

- `@webto-id/variant-check` **0.1.7** validates chrome types: `--type navbar` /
  `banner` / `footer` now work (the bundled base schemas carry all 24 types).
- products/blog: the compiler now GUARANTEES the `source` (manual/database)
  switch stays visible in the editor even when the variant never reads it.
- `references/wvf.md` §4b clarified: `siteName` is an ORDINARY editable base
  field — the renderer only injects a fallback; the true context props are
  `pages`, `currentSlug`, `linkPrefix`, `colorMode` (+ `footerPages`,
  `imageCredits` on footers).

## 2026-09-06

- New reference section **wvf.md 5b: platform effect library** — declarative
  `data-wv-effect` motion (reveal-up/down/left/right, fade, stagger, counter,
  parallax-soft, zoom-hover) animated by the platform's audited runtime, so
  effect-using variants carry no script and skip the script-review queue.
  Params `data-wv-delay` (100ms steps, 0-10) / `data-wv-duration`
  (100-5000ms) / `data-wv-strength`; unknown values are lint error
  `effect-unknown`; reduced-motion is honored centrally. `variant-check
  --out` previews include the runtime.

## CLI 0.1.8 — 2026-09-06

- Effect-library lint shipped in `@webto-id/variant-check@0.1.8`:
  `effect-unknown` / `effect-param` (errors), `effect-on-editable` (warning).
- `--out` previews embed the platform effect runtime, so `data-wv-effect`
  motion is visible locally before upload.

