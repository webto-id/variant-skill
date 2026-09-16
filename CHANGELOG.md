# Changelog

## 0.1.24 — 2026-09-16

Two seller reports, one release. `@webto-id/variant-check` 0.1.20, compiler 0.1.12.

- **Correction to 0.1.23:** `data-edit-url` on an anchor no longer counts as a CTA — only `data-edit-field` does. The seller measured 0.1.23 across their 66 variants: for every 5 contact links it rescued it swept in **16 social icons and 1 photographer credit**, putting "follow us on Instagram" in the same bucket as "Pesan Sekarang". The distinction the rule was always about is whether the link's TEXT is buyer content, not whether its destination is configurable — and `data-edit-url` is how a variant spells an icon-only social link, since the pill is the only way to edit an `<svg>`-only link inline. The platform's own `SocialIcons` tracks none of them, so a seller footer now agrees with a platform footer on the same page. `mailto:`/`tel:` written the natural way stay tracked; that fix is intact.
- New **`data-track="none"`** — opts a link out and leaves no attribute in the output, for a link that does carry an editable field but is not a conversion (a photo credit, a social handle shown as text).
- **Bug fix: an apostrophe inside a NESTED doc comment no longer kills `interface Props`.** `/** Photo beside this step's panel */` inside an `Array<{ … }>` produced `✗ [props-type] unbalanced object type` pointed at the interface's own line, ten lines from the cause — the type scanner read the comment's prose as code and the apostrophe opened a phantom string. It bit on the first use of the nested-doc style this skill recommends, with English possessive being the natural way to write a field instruction. The same skip also fixes `"`, a backtick and stray `{}`/`<>` inside a doc comment, which the reporter flagged as untested and which were the same bug. Top-level docs were never affected.
- A type error now **names the prop it came from**, so `unbalanced object type` no longer leaves a manual bisect as the only way to find the offending field.

## 0.1.23 — 2026-09-16

- **Bug fix (platform, compiler 0.1.11):** `data-track="cta"` is now added to an `<a href>` whose `data-edit-field` sits on the **anchor itself**, not only on a descendant. That shape is the natural one for contact links — `<a href={url("mailto:" + email)} data-edit-field="email">{email}</a>`, where the link text IS the field value and the href derives from the same field — and it was silently going untracked while the `<span>`-wrapped equivalent was tracked. Reported by a seller acting on 0.1.22's own advice, who found 5 such links across 3 bundles. It hits the conversion a service site cares about most: a tapped phone number, not the hero button that was already counted. Nothing errored, nothing warned — the numbers were just missing. **A variant compiled before 0.1.11 keeps the markup it was uploaded with; re-upload to pick this up.** A hand-written `data-track` is still respected and never duplicated.
- Still deliberately NOT tracked, and now stated as a decision rather than an omission: a link whose label is fixed chrome (`t(…)`) or hardcoded — that is navigation — and a link wrapping only an image or icon. Counting every linked photo card or logo-cloud tile as a CTA would inflate the buyer's conversion rate instead of measuring it, so those stay opt-in: write `data-track="cta"` yourself when such a link really is one.

## 0.1.22 — 2026-09-16

From a seller proposal, every claim verified against the platform first.

- New `wvf.md` §2.6 **Host-level behaviours a variant opts into** — a home for the category, not another one-off. The site runs these centrally and a variant inherits them by marking elements, with no script and no review queue: power words, motion effects, **image lightbox**, CTA click tracking, and (chrome only) `data-site-name`. Each row says where it runs and whether it is live in the marketplace preview.
- **Image lightbox was never documented anywhere**, although `data-lightbox-src` has sat in §2.2's sanitized-URL list the whole time. It costs four attributes (`data-lightbox`, `data-lightbox-src`, `data-caption`, `data-lightbox-group`) and **11 of the platform's 12 gallery components use it** — so a seller gallery without click-to-enlarge is the one that looks broken when a buyer puts them side by side. It stands down inside the editor and is inert on the marketplace preview page (no layout); both are expected, do not remove the attributes over it. `design.md` §7b states the rule.
- New `wvf.md` §2.7 **Video: one field, two shapes**. `videoUrl` is polymorphic — the owner may paste a YouTube/Vimeo link **or** upload an MP4/WebM, into the same field — and nothing said so, so a variant broke on whichever shape it did not expect. Includes the table of what stays permanently closed (`<iframe>`, `position: fixed`, `define:vars`, `<dialog>`/`showModal`) so nobody rediscovers it one CLI rejection at a time, and points at the built-in `video` section type when a section's whole point IS an embedded player.
- New builtin **`video(videoUrl)`** → `{ kind, src, poster }` (needs `@webto-id/variant-check` ≥ 0.1.18, compiler 0.1.10). `kind` is `"file"` (play it inline — `<video>` and its attributes were always allowed, so still no script and no admin review), `"embed"` (poster + link out) or `""` (render nothing rather than a broken player). For an embed `src` is the **watch** URL, never a player URL: a variant may not create an iframe, so this widens the sandbox by exactly nothing. `poster` is the free YouTube still frame — the one piece a variant provably cannot compute itself, since reading the video id needs `new URL` and `new` is forbidden (§1.4).
- Two behaviours nobody had asked about, found while answering "is there anything else?": the compiler adds `data-track="cta"` **only** to a link that contains an editable field, so an icon-only or hardcoded CTA silently drops out of the buyer's own conversion numbers — mark those yourself; and a chrome variant that prints the site name without `data-site-name` ignores the owner's site-name type scale.

## 0.1.21 — 2026-09-16

- **`variant-check` ≥ 0.1.17 now catches the two upload size limits locally** (`source-size`, `content-size`). Both live on the platform's upload path, not in the compiler, so until now the CLI happily reported `0 error(s)` for a file the uploader would reject outright — the one failure this tool exists to prevent. Measured exactly the way the server measures: the `.astro` in BYTES against **128 KB**, and the `.sample.json` as the length of its RE-SERIALIZED JSON against **16 KB** (so pretty-printing the file costs nothing).
- `wvf.md` §0 now states the **16 KB `*.sample.json`** cap (it only ever listed the 128 KB source cap and the compiled IR/CSS/script ones) and the per-account budget: **300 standalone variants**, which variants belonging to a template bundle do NOT count against — authoring variants for a template never eats it. The old flat "100 per account" number is gone from the platform entirely.

## 0.1.20 — 2026-09-16

- New `wvf.md` §2.5 **Power-word markers**: site owners emphasize fragments of ordinary text fields (`**bold**`, `==highlight==`, `%%block%%`, `@@circled@@`, `++brush++`, `__underline__`, `^^accent^^`, `[text](url)`) and the site renders them centrally over every `[data-edit-field]` — a variant does nothing to support them. Never documented here before, which mattered because two ordinary authoring choices silently break them: a marker pair only survives inside ONE text node, so splitting a field's value across elements (per-word span animation) kills it for that field, as does any `<br />`/child element interrupting the text. Also: markers do NOT render in either preview surface, so they don't belong in `sample.json`.
- `design.md` §7 and the Hard rules list gained the one-line consequence.

## 0.1.19 — 2026-09-12

- Documented that `__IMG__:<query>` resolves to a DIFFERENT photo per occurrence — the same query used in a bundle's `template.json` and in this variant's `sample.json` yields two different pictures of the same subject. Use `asset:<filename>` when a slot must be identical in both. (Platform-side, sample content now gets its sentinels resolved at upload at all — previously only the manifest half ever did.)

## 0.1.18 — 2026-09-12

- Deliverable changed from a bare `.astro` file to a small folder: `variant.json` (new manifest — `sectionType`, `name`, `description`, `mood`, `fits`) + the `.astro` + `.sample.json` + optional `asset:<filename>` images, matching how `html-to-webto-template` bundles already work. New `references/catalog.md` documents the manifest shape, the `mood` enum, and the three legal image forms. Both bundled examples now ship a matching `.variant.json`.
- Why: the platform's "Variant Baru" upload never had a way to set `mood`/`fits` at all, and an empty `description` was allowed — the AI wizard's catalog silently degrades any variant missing them to an opaque, unpickable id instead of erroring. `description`/`mood` aren't required to save a draft, only to submit it for review.
- Step 1: chrome section types (`navbar`/`banner`/`footer`) are no longer blanket-forbidden — they've been legal platform-wide since 2026-09-04, same as bundles.

## 0.1.17 — 2026-09-11

- `@pairWith` gained two more always-error validations (compiler 0.1.9,
  same day as the feature itself — before any real template used it in
  the wild): the paired field's name must start with its target's, at a
  real camelCase word boundary (`pair-with-bad-name` — `stepsDetails`
  valid, `stepsx` is not); and the paired field's items must be an
  object, never a primitive array (`pair-with-not-object`). Naming
  matters because the editor can never merge the two cards visually —
  the name is the only signal a buyer gets that they move together
  (`steps` + `avatars` reads as unrelated; `steps` + `stepsDetails`
  reads as linked). The object-shape rule closes a real gap: a
  primitive array renders through a different editor component that
  the structural sync was never wired to, so it would previously
  validate clean and silently never actually sync.

## 0.1.16 — 2026-09-11

- New `@pairWith <field>` doc tag (compiler 0.1.8, `@webto-id/variant-check`
  0.1.15) — §1.2c: pairs a NEW extension array with a base (or sibling
  extension) array so the editor keeps their add/remove/reorder in
  lockstep. This is the supported replacement for putting extra keys
  directly on a base array's item shape (`stepsMeta[]` alongside `steps[]`
  instead of adding `company`/`period` onto `steps[]` itself) — the latter
  is only ever lint-warned (now `--strict`-promoted) and the platform
  silently discards the extra keys at save time regardless. Does not merge
  the two arrays into one card visually; it only keeps their indices
  aligned. Validation (`pair-with-unknown` / `pair-with-not-array`) is
  always an error, not gated by `--strict`.

## 0.1.15 — 2026-09-11

- CLI `@webto-id/variant-check` 0.1.14: compiler bumped to **0.1.7** —
  `sm:!text-2xl`, `md:!mt-4` (a variant-prefixed `!important` utility) now
  actually compile. Previously `!` was only recognized as the very first
  character of a class token, so the bare `!text-2xl` form worked but the
  responsive form silently compiled to nothing (`tailwind-skipped`) — the
  one documented escape hatch for the theme's heading-size rule didn't work
  once a breakpoint was involved. `wvf.md`/`tailwind.md` candidate-token
  regex corrected to match.
- `props-unknown-item-key` promoted to `--strict` (was warning-only): an
  extra key inside a base array's item shape is silently stripped by Zod at
  save time on the platform (not "rejected", as some skill guidance implied)
  — a warning let a variant ship whose extra per-item data vanished on the
  first real save with no error anywhere. Now caught before submission.
- `wvf.md` §3.1 (new): documented CSS scroll-driven animation
  (`animation-timeline: view()`, `animation-range`) — no lint restricts it,
  it already compiles and ships today, it was simply never written down.
  Requires a `prefers-reduced-motion` fallback (not enforced by the
  compiler).

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
