# Changelog

## 0.1.14 — 2026-09-10

- Fixed a doc-comment example in `SKILL.md`'s own skeleton (`/** Tampilkan
  nomor urut */`) that contradicted the English-prose rule 0.1.13 just
  established — left over from before that rule existed.
- `wvf.md`: new §1.2b **Which language, where** — a single table settling
  where English prose belongs (doc comments; catalog `description`/`fits`/
  `mood`) versus Bahasa Indonesia (destructuring/sample defaults) versus
  "not your decision" (the buyer's actual generated content, governed by
  `site.language` regardless of anything in this file). Written because the
  rule was previously scattered across four files with no single place that
  stated it plainly — and some of those places' own examples disagreed.

## 0.1.13 — 2026-09-10

- Extension-field doc comments are the model's fill-in instructions, never an
  editor label — the editor derives its label from the key name and never
  reads this text (a long-standing wording bug: earlier versions of this
  skill and the compiler itself claimed the opposite). Rewritten guidance in
  `SKILL.md`, `schema.md`, and `wvf.md` §1.2: say what the text is, how long,
  and give a concrete example, using `@example`/`@max`/`@min`/`@default`/
  `@title` tags (folded into the stored schema) or plain prose. Nested item
  fields (`facts?: Array<{ /** … */ label: string }>`) now keep their own doc
  independently of the array field's doc — previously the compiler dropped
  or clobbered them.
- New lint codes: `ext-field-undocumented` (no doc comment at all — error
  under `--strict`), `ext-field-doc-thin` (doc too short / no example
  signal — warning always), `props-unknown-item-key` (a key inside a base
  array item the base item shape doesn't declare).
- `--content` (compiler ≥ variant-check 0.1.12) now actually validates sample
  content against the base schema — a required nested field left empty or a
  base array item shaped wrong is caught here (`content-*` codes), not only
  on upload.

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

## 0.1.7 — 2026-09-06

- New reference section **wvf.md 5b: platform effect library** — declarative
  `data-wv-effect` motion (reveal-up/down/left/right, fade, stagger, counter,
  parallax-soft, zoom-hover) animated by the platform's audited runtime, so
  effect-using variants carry no script and skip the script-review queue.
  Params `data-wv-delay` (100ms steps, 0-10) / `data-wv-duration`
  (100-5000ms) / `data-wv-strength`; unknown values are lint error
  `effect-unknown`; reduced-motion is honored centrally.
- CLI `@webto-id/variant-check@0.1.8`: the effect lints, and `--out`
  previews embed the effect runtime so motion is visible locally.

## 0.1.8 — 2026-09-06

- **Fix (High)**: the runtime script wrapper listed `eval`/`Function` as
  parameter names under `"use strict"` — a strict-mode PARSE error, so every
  script-carrying variant's script died before its first line. Both are now
  out of the shadow list (the `script-forbidden` lint already rejects those
  identifiers in author code; no protection lost). wvf.md 4 snippet
  corrected (13 shadowed globals). Thanks to the seller report that came
  with a minimal control experiment.
- CLI `@webto-id/variant-check@0.1.9` ships the fixed wrapper in `--out`
  previews.

## 0.1.9 — 2026-09-07

- **Effect runtime rescan** (seller bug report): sections swapped in after
  page load (variant chips, editor apply, DB pagination) are now rescanned
  automatically via one MutationObserver — previously only elements present
  at load animated. wvf.md 5b notes the guarantee: never write your own
  IntersectionObserver for these effects.

## 0.1.10 — 2026-09-07

- New lint **`edit-image-missing`** (fails `--strict`): every `<img>` whose
  src comes from a content field must carry `data-edit-image` with that
  field's path, or the owner cannot swap the image inline. wvf.md 4 states
  the contract. From a seller field report of AI-authored variants shipping
  uneditable images.
- CLI `@webto-id/variant-check@0.1.10` is the first npm release containing
  the rescan runtime AND this lint (published 0.1.9 predates both) — use
  CLI ≥ 0.1.10.

## 0.1.11 — 2026-09-07

- `t()` is documented as a CLOSED enum of platform term keys (`address`,
  `email`, `phone`, `hours`, `menu`, `readMore`, ... — see §5 helpers), never
  display text: `t("Alamat")` used to crash the section at render while the
  preview's identity `t` showed nothing wrong. New compiler lint `t-unknown`
  (fails `--strict`) checks every literal `t()` argument, and the live
  renderer now echoes unknown keys instead of throwing. A visible label with
  no matching term key must be an optional content field with a default.
- `--strict` now also fails on `edit-image-missing` (0.1.10 introduced the
  lint but it never escalated under strict, contrary to the docs).
- Chrome `linkPrefix` contract corrected: it is a PATH prefix (today always
  `""` for uploaded chrome) — emit plain site-relative hrefs and never build
  query strings; preview/dev params are re-attached by a platform script.
  (The previous wording made prepending the preview query string look right,
  which sent every navbar link back to the current page in preview.)

## 0.1.12 — 2026-09-08

- Chrome footers: `imageCredits` is no longer injected and a footer variant
  never needs to render photo/icon credits — the platform renders required
  attribution (Unsplash/Pexels photos, CC BY icons) in its own strip below
  whatever footer the site uses. `footerPages` remains the footer's extra
  context prop.
