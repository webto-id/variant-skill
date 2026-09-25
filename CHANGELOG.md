# Changelog

## 0.1.45 — 2026-09-25

- **Anchor links were never banned. Every section already has one** (new §2.3c). A template author asked whether `href="#kontak"` is allowed, because the only signal was the `id-attr` warning on a hand-made `<section id="layanan">`. It is allowed, statically or through `url()`. The renderer gives each section's wrapper an id from its type: `#hero`, `#features`, `#pricing`, `#faq`, `#contact`, with `#features-2` for a second one, and it adds `scroll-margin-top` so a sticky navbar does not cover the heading. §2.3c has the full table, kept equal to the renderer's map by a test. It also covers the rules: hidden sections are not counted, anchors are per page, and header and footer chrome are counted separately.
- Do not add your own `id`. It duplicates the platform's anchor and stops the editor's click walker. An anchor to an element inside a section is not supported.
- `id-attr` (`variant-check` ≥ 0.1.36, compiler 0.1.25) now says an id is not needed for anchor links and that `#…` links are fine. It is still a warning.

## 0.1.44 — 2026-09-24

- **`data-lightbox` belongs on the `<img>`, and `data-lightbox-group` on the container around all of them** (§2.6). Wrapping each photo in `<a href={img(url, 1600)} data-lightbox data-lightbox-group="…">` was the tempting shape, and six approved galleries used it. Until now it opened an empty overlay without prev/next: an `<a>` has no `src`, and a group attribute on the trigger groups only itself. It was fixed on the platform side (needs an `apps/site` deploy). The lightbox now takes the link's href, falling back to the image inside it, and pages through same-named triggers within the section, never beyond it. Published variants need no re-upload. Write the documented shape anyway.
- New lints, `variant-check` ≥ 0.1.34 (compiler 0.1.24), both warnings: **`lightbox-not-img`** fires when `data-lightbox` sits on something other than the `<img>`, and **`lightbox-group-on-trigger`** fires when `data-lightbox-group` sits on the same element as `data-lightbox`.
- §2.3b: the click-through-to-the-photo rule now covers an ordinary `<img data-edit-image>` under an empty scrim, not only `data-edit-image-bg`. `pointer-events-none` on such a scrim is optional. A production hero built as an in-flow photo under a full-bleed `bg-foreground/45` scrim could not open the image dialog until this platform fix.

## 0.1.43 — 2026-09-24

- **Clicking a background photo opens the image dialog again.** The §2.3b pattern (a `-z-10` photo layer under a transparent `Container`) left no way to open ImageEditDialog: every click "on the photo" landed on the Container, and the 📷 pill was painted inside the `-z` layer, visible but not clickable. Every seller variant with a background photo was affected, 6 of 6 on staging and production. It was fixed on the platform side (needs an `apps/site` deploy): the editor now opens the dialog when the photo is the first visible thing under the pointer. Content (text, links, buttons, fields, images, opaque or glass cards) still opens the section panel. Published variants need no re-upload.
- §2.3b now spells out the click contract. Always render the photo element, even when its field is empty. Keep tint and scrim layers empty. Always pair `data-edit-image-bg` with `data-edit-image`.
- New lints, `variant-check` 0.1.33 / compiler 0.1.23, both warnings: **`edit-image-bg-conditional`** fires when the photo layer renders only when its own field is set (`{images[0]?.url && <div data-edit-image-bg …>}`), which leaves an empty section with nothing to click to ADD a photo. One of the six production variants had this. **`edit-image-bg-no-field`** fires when `data-edit-image-bg` appears without `data-edit-image`.
- There is deliberately no lint for a negative z-index on the photo layer. That is the recommended pattern, and it works now.

## 0.1.42 — 2026-09-21

- **`rounded-full` and `rounded-none` never follow the site theme**, and until now nothing said so. Only `rounded-sm|md|lg|xl` are derived from `--radius`; the other two compile to a fixed `3.40282e38px` and `0`. That is right for a pill button, an avatar or a dot, and wrong anywhere the rounding is meant to be the owner's — a site set to sharp corners still gets your pill. Nothing flags it either: `hardcoded-radius` only catches a numeric `border-radius` in a `style` attribute.
- Prompted by a real question: one form variant's submit button ignored the theme radius while its card and inputs followed it. The card was `rounded-xl`, the inputs `rounded-lg`, the button `rounded-full` — three deliberate choices that looked like a platform bug.
- Written into `tailwind.md` (radius section), `wvf.md` (the Tailwind availability line) and `SKILL.md` step 3.

## 0.1.41 — 2026-09-19

- **The owner's per-page navigation switches reach a variant only through `pages` / `footerPages`** — and the docs got both wrong. `pages` was described as "already filtered": it was not, because every platform navbar filters `showInNavbar` inside its own component, so a WVF navbar received the raw list and kept showing pages the owner had unticked. `footerPages` was documented as `{ title, slug }` while the renderer sent `{ label, url }`, so a footer that followed this skill rendered a column of empty links and "show in footer" looked broken. Both fixed platform-side (needs an `apps/site` deploy): the WVF context now carries the filtered list, and footer items carry both spellings.
- New lints, `variant-check` 0.1.31 / compiler 0.1.22: **`chrome-nav-pages-missing`** (a `navbar` that never reads `pages`) and **`chrome-footer-pages-missing`** (a `footer` that never reads `footerPages`). Warnings, like `chrome-logo-missing` — a chrome variant can fail this in complete silence, since nothing errors and the links simply are not the site's.
- `wvf.md` §4b and `schema.md` state the rule: render `pages` in a navbar and `footerPages` in a footer as-is; `links[]` is for EXTRA destinations, never a replacement for the site's own pages.

## 0.1.40 — 2026-09-19

- **Image fields have a shape, and `--content` now checks it** (`@webto-id/variant-check` 0.1.30, compiler 0.1.21). Every base image field accepts only an absolute `http(s)` URL, an uploaded path (`/r2/`, `/media/`, `/illu/`), one of the sentinels `__IMG__:` / `__ILLU__:` / `asset:`, or empty — a relative path such as `assets/logo.png` is rejected by the upload. It used to lint clean here: the platform rule is a Zod `.refine()`, which JSON Schema cannot carry, so the bundled schemas saw a bare string. The fields ship tagged now and the new code is `content-image-url`.
- Related platform fix (needs an `apps/server` deploy): the upload's own validator rejected `__ILLU__:` in those fields although every import resolves it, so a bundle using platform illustrations for its logo cloud failed the dry run while the identical content written as `__IMG__:` passed.

## 0.1.39 — 2026-09-18

- **`variant-check` now checks the manifest, not just the `.astro`** (`@webto-id/variant-check` 0.1.29). `variant.json` is picked up automatically when it sits beside the file, and a bundle's `template.json` when it sits one level above `sections/`; `--manifest <file>` points at one explicitly and `--no-manifest` opts out. The rules are generated from the platform's own schema at publish time, so the `mood` enum in the CLI is the enum the upload enforces — a 12-variant bundle that linted clean and was then rejected for four invented moods is what prompted this.
- **Error**: a mood outside the enum, more than 4 of them, a `description` under 15 characters, an unknown `sectionType`, a malformed or duplicated `key`, more than 12 variants in one `template.json`, or a `sectionType` that disagrees with `--type`. **Warning**: `description`/`mood` absent (legal for a draft and for a patch-mode re-upload, refused at "Ajukan review" — so `--strict` promotes both to errors), a field name the upload would strip in silence (`moods`, `tags`), a legacy `hero-*` alias, and an `.astro` with no matching entry.
- `SKILL.md` step 6 says to write `variant.json` before running the check, so the metadata half is validated on the same run.
- Detection also accepts `<key>.variant.json`, the way several variants share one folder (these examples do). A standalone `variant.json` needs no `key`: the uploader takes it from the filename, and a key that disagrees only warns.

## 0.1.38 — 2026-09-18

- **New mood value: `calm`** (platform enum; needs an `apps/server` deploy). The vocabulary had three words for the loud end — `bold`, `brutal`, `playful` — and none for the quiet one, so `minimal` and `airy` had become the overflow bucket: across one seller's 101 variants they accounted for 45 and 21 uses, four variants carried the identical pair `["minimal","airy"]` across four unrelated registers, and a deliberately quiet CTA ended up tagged `bold` because nothing else fit. `calm` = slow pace, low contrast, nothing demanding attention first.
- `catalog.md` now states the distinction the enum is easiest to get wrong on: **energy is not composition.** `airy` means empty space and `minimal` means few elements; neither implies a slow pace, and a spacious section with a 96px accent headline is `bold` AND `airy`. Guardrails so `calm` does not become the next bucket: not "simple" (`minimal`), not "lots of room" (`airy`), not "warm" (`warm`), not "expensive-looking" (`luxurious`).
- Also recorded: **mood describes the LOOK, never the subject.** "Personal" or "for a clinic" belong in `description`/`fits` — a value that can sit on both a `brutal` and a `luxurious` variant tells the wizard nothing. New mappings: "structured" → `precise`, "direct" → `bold`.
- Existing variants stay valid; nothing needs re-uploading.

## 0.1.37 — 2026-09-18

- **A doc tag's value now runs to the next KNOWN tag, not to the next `@`** (`@webto-id/variant-check` 0.1.28, compiler 0.1.20). `@example halo@studio.design` used to store just `halo` and leak `@studio.design` into the description, and `@example @nadiraayu` produced no example at all — while still failing `ext-field-doc-thin`, with no way to satisfy it. Email addresses, social handles and profile URLs like `https://unsplash.com/@name` all work now, and no quoting is needed (quotes are stored verbatim if you use them). `@max 6` after an email still parses. Reported by a seller who found three already-uploaded variants with mangled AI instructions.

## 0.1.36 — 2026-09-18

- **Content-driven CSS backgrounds, including `background-attachment: fixed`** (`@webto-id/variant-check` 0.1.27, compiler 0.1.19; the site needs a deploy). `bg-fixed` always compiled, but nothing could say WHICH image stays still: a dynamic `style` holding `url(...)` passed the lint and was then dropped at serialization — 0 errors, no background, no clue. Mark the element instead and the platform fills it, sanitized and capped at 1600px, merged with your own `style`:

  ```astro
  <div data-edit-image="images.0.url" data-edit-image-bg
       class="absolute inset-0 -z-10 bg-fixed bg-cover bg-center"></div>
  ```

  `background-attachment: fixed` is not `position: fixed` (still a compile error): the paint stays clipped to the element's own box, takes no clicks, and cannot cover the editor. An empty field emits no `background-image` at all.
- A dynamic `style` that assembles `url(...)` is now **`error` `style-url`** and names the alternative, instead of being discarded in silence.
- `wvf.md` §2.3b also records why `position: sticky` cannot stand in for it: clipping the tall image needs `overflow: hidden` on the wrapper, which makes that wrapper the sticky element's scrollport — so it sticks to a box that never scrolls, and unclipped it bleeds into the next section.

## 0.1.35 — 2026-09-18

- **`schema.md` said site chrome could not be authored as WVF** — stale since 2026-09-04 — and listed no chrome fields at all. So every navbar written from this skill was missing `logoUrl`, `logoUrlDark` and `showSiteNameWithLogo`: all nine of one seller's templates, reported 2026-09-18. The damage is not just a missing logo. A base field no variant reads becomes a HIDDEN field, so the Logo settings also vanish from the site owner's editor — they upload a logo and nothing explains why it never appears.
- New **Site chrome base fields** section: the `navbar` / `banner` / `footer` field tables, the injected context props, and a worked logo snippet that handles both dark-mode mechanisms (forced `dark` resolves from `colorMode` server-side because there is no `data-theme` to key off; `system` renders both logos and lets `dark:` swap them). `wvf.md` §4b repeats the rule next to `data-site-name`.
- New lint **`chrome-logo-missing`** (warning, `@webto-id/variant-check` 0.1.26 / compiler 0.1.18): a `navbar` variant whose Props never read `logoUrl`. A warning, not a `--strict` error — it is about the owner's editor, and it must not block re-uploading an existing variant.

## 0.1.34 — 2026-09-17

- **`<FormFields />` phase 2: the dropdown is the platform's own.** `select` and multi-option `product` fields now render the same custom dropdown every platform form uses (invisible native `<select>` for value and validation, a trigger styled by your `fieldClass`, keyboard-navigable listbox, product image following the selection). Its stylesheet and runtime moved out of the two Astro-scoped components into one shared module the site layout and every preview load once — which is also why 0.1.33's "native select for now" was really "unstyled": scoped styles could never reach macro markup. `@webto-id/variant-check` 0.1.25, compiler 0.1.17; the site needs a deploy.
- Platform side, no authoring change: the ten platform form components dropped their duplicated submit scripts in favour of the single layout runtime (the seller's finding). Their markup is untouched.

## 0.1.33 — 2026-09-17

- **New macro `<FormFields />`** (`@webto-id/variant-check` 0.1.24, compiler 0.1.16; the site needs a deploy) — a `form` section variant can now place the platform's whole form block inside its own layout and style it with six static class props (`class fieldClass labelClass submitClass wrapClass successClass`). The form tags stay banned for authors; the platform renders fields (every type incl. product refs and the address group), honeypot, Turnstile slot, bump, submit, error and success, and ONE site-level runtime binds submission — inbox, WhatsApp, WhatsApp+Order, Send&Checkout, lead tracking — so the variant carries no script and never enters script review. Forms were the one section a converted template could not restyle; from a seller proposal where 3 of 9 templates had the form as the only off-brand section. `wvf.md` §5c.
- Form keys the author never destructures (`formName`, `successRedirectUrl`, the bump group, ...) are read from the section content and stay **visible** in the editor — using the macro marks them as used. Lint `form-fields-type` (error outside a `form` section) and `form-fields-no-fields` (warning).
- Stated limits: native `<select>` for now (the platform's custom listbox is not ported yet); previews render the block but swallow submit.

## 0.1.32 — 2026-09-17

- **`scripts/check-docs.mjs` crashed when the skill lives in a folder with a space in its path** — `ENOENT … webto%20variant%20format` before checking a single file, so the release step introduced in 0.1.31 never ran on such a machine. `URL.pathname` keeps percent-encoding; the script now uses `fileURLToPath`, which decodes it and handles the Windows drive letter. Reported with a side-by-side run from a spaced folder. Verified the same way: from a copy under `cek docs spasi`, `clean: 8 file(s)`, exit 0.

## 0.1.31 — 2026-09-17

- **Docs fix:** the 0.1.29 example for multi-paragraph defaults, and the 0.1.29 changelog bullet describing the bug, both had their escape sequences DECODED on the way into the file — `\n` became two raw line breaks, `\t` a TAB, `\r` a line break. Copied verbatim, the example failed with `unterminated string`, the very error it announced as fixed. Reported with a copy-paste repro. The example now sits in a fenced `astro` block in `wvf.md` §1.3 with the escapes intact, next to the reminder that a RAW newline in a plain string is still rejected.
- New `scripts/check-docs.mjs` (run with `node`): fails on a TAB outside a code block or an odd number of backticks in a paragraph — the two signatures of a decoded escape. Counts backticks per paragraph, so a code span deliberately wrapped across two lines does not trip it; clean over all 8 files, zero false positives. Run before every release.

## 0.1.30 — 2026-09-17

- **Correction to 0.1.29, platform only (no CLI change):** the hidden-field exemption at upload was true for the **dry-run** but not for the actual **Update** — phase B rewrites `u:@key` refs to real `u:<id>` refs and validates again through a path the fix had not reached, so the Update failed *after* the variants were written with the very `"heading" wajib diisi` the dry-run had stopped producing. Both phases now carry each variant's `hiddenFields` (keyed by the real id in phase B). Needs an `apps/server` deploy; nothing to change in any bundle.

## 0.1.29 — 2026-09-17

Four gaps between `variant-check` and the platform, from one seller conversion (8 variants). `@webto-id/variant-check` **0.1.23**, compiler **0.1.15**.

- **`--content` now checks the section type's top-level `required` fields** — the same ones the upload dry-run enforces — minus any the variant hides. The CLI's bundled schema carried no `required` at all (it was hand-maintained and had drifted), so `--strict` said `0 error(s)` for a sample the upload then rejected with `"heading" wajib diisi`. The schema copy is now generated from the platform's own Zod with input semantics: a key that has a platform default (`ctaText`, `viewMoreAlign`, …) is never required, only what a dry-run actually rejects is. New lint code `content-required`; the per-type list is in `schema.md`.
- **Platform: a hidden base field is no longer required at upload.** A testimonials design with no title had to grow one, because the base's `required` applied regardless of what the variant renders while the editor hid the field for that variant — two rules cancelling each other. Bundle validation now exempts each variant's `hiddenFields`. Stop reading a field in `Props` and neither the CLI nor the upload will ask the buyer for it.
- **Multi-paragraph defaults are possible again.** `"Satu.\n\nDua, tiga."` died as `unterminated string` (the escaped newline was decoded and then caught by the raw-newline check, while `\t` and `\"` passed), and a template-literal default died as `unterminated template literal` on its first comma (the destructuring splitter tracked quotes but not backticks). Both fixed; `\r` decodes too. §1.3 says so.
- **The `--out` preview resets what the site resets.** Only `h1-h4 p ul ol` had their margin zeroed; the live site runs Tailwind preflight, which also zeroes `blockquote dl dd figure figcaption h5 h6 hr pre fieldset`. A `figure` + `blockquote` testimonial kept 40px per side per element in the preview and read as a real defect at 390px — the parity check in template-skill step 9 would have "fixed" it with `m-0` everywhere. Now identical.

## 0.1.28 — 2026-09-17

- **`surface-foreground` now reads every string literal in the file, not just `class` attributes** (`variant-check` 0.1.22, compiler 0.1.14). That closes blind spot A from the palette report: a class list assembled in a `const` and applied through `class:list` is the same contradiction spelled differently, and until now moving a string into a const silenced the lint with the markup unchanged. Results are deduped, so one shared class string is reported once however many elements use it.
- The predicate is unchanged — still full-strength surfaces only (`bg-accent/10` stays silent), still an explicitly named foreign foreground. Only its input widened, which is safe for the same measured reason the original scope was chosen: across every component the platform ships, **zero** string literals carry both a brand surface and a foreign foreground.
- **The blind-spot checklist is three shapes now, not four**, and all three need inference no string-level check can do: `hover:bg-accent` with no `hover:text-*`, a `bg-accent` band with no `text-*` at all, and an empty image well or `<img>` backdrop on `bg-accent`.

## 0.1.27 — 2026-09-17

Documentation only, from a seller who applied §6.1 across **38 `bg-accent` uses in 66 variants** and reported what the text did and did not prevent. The lint is unchanged — they verified the five shapes against compiler 0.1.13 and agreed that narrowing it to zero platform false positives was right.

- **`design.md` §1 was being read as a ban on accent bands**, and the reporter reverted five perfectly good bands to `bg-muted` before catching it. A full-width `bg-accent` paired with `text-accent-foreground` stays readable under every palette — that foreground is recomputed for whatever accent becomes. What changes is the section's WEIGHT: a whisper in your theme, a saturated brand band in the buyer's. That is a design decision, not a defect. The defect is only ever a brand surface under a FOREIGN foreground, and §1 now says both things together.
- **The single "cannot see an inherited foreground" caveat is now the four shapes that actually occur**, because a deliberately narrow lint makes the author the primary safety net and one blind spot out of four is worse than none: (A) classes assembled in a `const` and applied via `class:list` — the one to watch when refactoring, since moving a string into a const silences the lint without changing the markup; (B) `hover:bg-accent` with no `hover:text-*`; (C) a `bg-accent` band with no `text-*` at all; (D) an empty image well or `<img>` backdrop on `bg-accent`.
- **`hover:bg-accent` must be written as a PAIR with `hover:text-accent-foreground`.** It was listed as a safe highlight while being the most common route to exactly the inherited-foreground bug warned about three paragraphs later — a hover background almost never brings its own text token.
- **Image wells belong on `bg-muted`**, not accent: the backdrop behind an `<img>` and the placeholder for an image not uploaded yet are meant to disappear behind the picture. 14 of the reporter's 38 uses were this, and in a teal palette an empty slot became a teal rectangle.
- **Said plainly: the source's band tint has no slot anywhere.** `muted` and `card` are derived from `background`, so `#e9e2d7` becomes a derived warm grey and the literal color cannot survive re-theming. That is the trade, and it was previously left to be inferred from the derivation table.

## 0.1.26 — 2026-09-17

- New `wvf.md` **§6.1 Surfaces** — which palette tokens are safe to put text on, and why. Only five colors are authored (`primary` `secondary` `accent` `background` `foreground`); `card` and `muted` are DERIVED, mixed 2% and 6% from the background toward the foreground, which is what makes them safe under every palette and in dark mode. **`accent` is not a light tint.** A converted template usually has something like `#f0f0f8` there, so `bg-accent text-foreground` reads perfectly while you build — and then the buyer picks any palette the platform ships (teal `#0d9488`, amber `#d97706`, blue `#2563eb`, yellow `#fbbf24`) and the band goes unreadable, with nothing changed in the variant. A converted `bg-gray-50` section band is **`bg-muted`** (or `bg-card`); `bg-accent` is a highlight and only ever carries `text-accent-foreground`; `bg-accent/8` over the page background is the way to get a whisper of brand in a full-width band.
- New lint **`surface-foreground`** (warning, `variant-check` 0.1.21 / compiler 0.1.13): one element setting `bg-accent`/`bg-primary`/`bg-secondary` together with a text token belonging to a different surface. Scope picked by measurement — static class strings, full-strength surfaces, explicit foreign foreground — because that version fires on **zero** of the 85+ sections the platform ships, while looser rules flagged 7-10 of its own components. Warning, not an error under `--strict`, so variants already carrying the pattern keep uploading while their authors fix them.
- Worth knowing what it cannot do: the lint reads one element's own classes, so it cannot see a foreground **inherited** from an ancestor. A `bg-accent` band with no `text-*` on it at all is the same bug and will not be reported — check those by eye.
- `design.md` §1 states the rule where the palette is introduced.

## 0.1.25 — 2026-09-16

Two editor fixes from a seller wiring `testimonialsAvatars @pairWith testimonials` on a live template. Platform-side, no CLI change — `wvf.md` §1.2c documents both.

- **A paired array now always has exactly one slot per base item.** The editor pads it with blank objects up to the base's length (clamped by its own `@max`) and truncates when the base shrinks; its card offers no add button and no per-item delete, so a slot disappears only when its base item does. The structural sync only ever fired on an EDIT EVENT, so a section that already had 3 testimonials and 0 avatars stayed that way, and deleting one avatar silently shifted every later one onto the wrong testimonial. The seller's actual goal — an avatar on the 1st and the last testimonial only — was not expressible at all, because index 4 needs 0-3 to exist and nothing could make a blank slot. **Leaving a slot empty is now the supported way to skip an item.** Keep reading it defensively (`(avatars[i] ?? {}).url`): content saved before this may still be short.
- **`…Avatars[].url` gets the image uploader in the side panel**, not a plain URL box with the link picker. Inline edit goes by the explicit `data-edit-image` marker and was always right; the panel guesses from the NAME and only knew images/image/photo/gallery, so "avatar" — a pattern it recognises everywhere else — fell through, and the two surfaces disagreed about one field. Now any image-ish array name counts. One deliberate exception, so logo-cloud keeps working: when the item shape ALSO has a real image field (`logos[].image` + `logos[].url`), the `url` is that item's LINK, not its picture.

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
