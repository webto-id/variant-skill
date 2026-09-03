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
