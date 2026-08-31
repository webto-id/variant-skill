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
