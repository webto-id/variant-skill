# Webto Variant Format (WVF) — exact compiler reference

Extracted from `@webto/variant-compiler` (the same code that runs in the uploader, on the server, and in `npx @webto-id/variant-check`). Every identifier is verbatim from the compiler. When this file and your intuition disagree, this file wins.

## 0. File shape

One `.astro` file: a `---` frontmatter block containing `interface Props`, then the template. The file is split with `/^\s*---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?([\s\S]*)$/` (CRLF normalized).

- No frontmatter → `error` `frontmatter`: "file must start with a `---` frontmatter block containing `interface Props`".
- No markup → `error` `empty`.
- Source upload limit **128 KB**; `*.sample.json` ≤ **16 KB** (measured as its RE-SERIALIZED JSON, so pretty-printing costs nothing); compiled IR ≤ **256 KB**; compiled CSS ≤ **64 KB**; script ≤ **8 KB**. `variant-check` ≥ 0.1.17 enforces the first two locally (`source-size`, `content-size`) — older CLIs reported `0 error(s)` for a file the uploader then rejected.
- Per ACCOUNT: **300 standalone variants**. Variants that came from a template bundle belong to that template and do NOT count against it (they have their own per-template ceiling) — so authoring variants for templates never eats this budget.

## 1. Frontmatter

### 1.1 Imports

Canonical: `import { t, img, url, video, Container, Button, EditUrlPill, ViewMoreLink, AddImageButton } from "webto/variant";` — import only what you use. Legacy aliases also accepted: `sanitizeUrl` (= `url`), `withUnsplashWidth` (= `img`), `resolveVideoSource` (= `video`), `sectionT`. Relative platform paths (`../lib/sanitize`, `../ui/Button.astro`, …) are tolerated. Any other module → `error` `import`. Unknown name → `error` `import`. `import type` is ignored.

### 1.2 `interface Props`

Required (`interface Props { … }` or `type Props = { … }`). `extends` → error. Fields: `name?: type;` — **every field should be optional** (`props-optional` warning; error in strict).

| TS type | JSON Schema |
|---|---|
| `string` / `number` / `boolean` | primitive |
| `"a" \| "b"` | string enum |
| `T[]`, `Array<T>`, `ReadonlyArray<T>` | array |
| `{ a: string; b?: number }` (nested ok) | object |
| `\| undefined` / `\| null` | stripped |

Anything else (`Date`, `Record`, `unknown`, named interfaces, non-literal unions) → `error` `props-type`.

**`/** … */` doc comments are the AI's prompt for that field, never an editor label** — the editor derives its label from the key name and never reads this text. Nested fields keep their own doc too (`facts?: Array<{ /** … */ label: string }>` — `label`'s comment survives independently of `facts`'s). Write it as an instruction: what the text is, how long, one concrete example.

```astro
/** Profession line under the name, ≤4 words. @example Konsultan Pajak */
roleTitle?: string;
/** Quick facts under the buttons. @max 4 */
facts?: Array<{ /** Fact label, e.g. Pengalaman */ label: string; /** Fact value, e.g. 8+ tahun */ value: string }>;
```

Recognized tags (folded into the stored schema, stripped from the prose): `@example <text>`, `@max <n>` / `@min <n>` (array → item count; string → character count), `@default <text>` (metadata only — does not seed a value; a scalar's default stays the destructuring default below), `@title <text>`. An extension field with no doc at all, or a doc under 15 characters with no example signal (`@example`, "e.g.", "mis.", "contoh", or a quoted example), is flagged — `ext-field-undocumented` (promoted to error under `--strict`) or `ext-field-doc-thin` (warning always).

### 1.2b Which language, where

Four different pieces of text live in one file, each read by a different consumer — mixing them up is the most common review bounce:

| Text | Language | Read by |
|---|---|---|
| `/** … */` doc comment on a field | **English prose** — same convention as every base field's own description and every built-in variant's `description`/`fits`/`mood` (`schema.md` §"How the compiler classifies") | The AI, as its instruction for filling this field |
| `@example …` / `e.g. …` value *inside* a doc comment | Illustrative only — Indonesian is fine, it's just a sample value | The AI, as one concrete example to imitate; not a language directive |
| Destructuring default (`heading = "Kenapa memilih kami"`) | **Bahasa Indonesia**, short, replaceable (`design.md` §"sample copy") | The buyer, in the marketplace preview before any real content is filled in |
| Final generated site content (the JSON the wizard eventually writes into this field) | The buyer's own site language — Bahasa Indonesia by default, or whatever `site.language` is | Nothing here decides this — it's a platform-wide prompt rule applied uniformly, independent of any doc comment or default in this file |

Nothing compiles differently for an Indonesian doc comment — the compiler doesn't check language — but it breaks the one convention every base field and every built-in variant already follows, and a template reviewer will bounce it back to English. The same rule applies to a bundle variant's own `description`/`fits`/`mood` when writing a `template.json` (see the template skill's `manifest.md`).

### 1.2c `@pairWith` — keep a sibling array index-aligned with a base array

Real designs often carry richer per-item metadata than a base array's fixed item shape allows — a timeline's `steps[]` has `title`/`description`/`icon`, but the source also wants `company`/`period` per step. **Do not add those keys directly onto a base array's item shape** — the compiler only warns (`props-unknown-item-key`, now promoted to error under `--strict`, §7) and the platform then silently strips them at save time; nothing stores that data.

The supported pattern: declare a **separate extension array** with its own item shape, and tag it `@pairWith <targetField>` naming the base (or another extension) array it rides alongside:

```astro
interface Props {
  steps?: Array<{ title: string; description: string; icon?: string }>; // base field, untouched
  /** Extra detail for each step — same length and order as steps. @pairWith steps */
  stepsMeta?: Array<{
    /** Company name for this step, e.g. PT Sinar Jaya */
    company?: string;
    /** Period covered, e.g. 2019-2021 */
    period?: string;
  }>;
}
```

The editor renders `steps` and `stepsMeta` as two separate array cards (this does **not** merge them into one card — that would need actual compiler/schema changes, out of scope), but keeps them **index-locked**: adding, removing, or reordering an item in either one applies the identical operation to every other field in the pairing group, so item *N* of `stepsMeta` always describes item *N* of `steps`. The AI wizard's variant catalog is told the same constraint (`describeVariantFields` appends "must have the same length and order as steps") so generated content doesn't drift out of alignment either.

**The paired array always has exactly one slot per base item.** The editor pads it with blank objects up to the base's length (clamped by the paired field's own `@max`) and offers no add/delete on its card — a slot disappears only when its base item does. That is what makes partial data possible: to give an avatar to the 1st and the 5th testimonial only, leave slots 2-4 blank. Before this, a shorter paired array silently shifted everything after the gap, so item 5's avatar landed on testimonial 2. Read it defensively anyway — `const avatarOf = (i) => (testimonialsAvatars[i] ?? {}).url;` — since old content may predate the padding.

**Name the item field so the side panel knows it holds a picture.** Inline edit goes by the explicit `data-edit-image` marker, but the side panel decides from the NAME: a `url` inside an array whose own name reads as imagery (`…Avatars`, `…Images`, `…Photos`, `…Banners`, `…Thumbnails`, `gallery…`) gets the image uploader; anywhere else it gets a plain URL box with the link picker. One exception, deliberate: if the item shape ALSO has a real image field (`logos[].image` + `logos[].url`), the `url` is treated as that item's link, not its picture.

**Naming is compiler-enforced, not a suggestion.** Since the two cards can never be visually merged, the field's name is the buyer's only clue the two cards move together — `steps` + `avatars` reads as two unrelated lists that happen to change in lockstep (confusing, not obviously a feature); `steps` + `stepsAvatars` or `stepsDetails` reads as linked at a glance. The paired field's name **must start with its target's name at a real camelCase word boundary** (`stepsDetails` ✓, `stepsx` ✗ — that's not a word boundary) — enforced as `pair-with-bad-name`. `Details` is a good default suffix when nothing more specific fits (`Meta`/`Data` read as developer jargon to a buyer); a more descriptive suffix is fine too as long as the prefix matches (`stepsTimeline` is a legitimate name for `@pairWith steps`).

**The paired field must be array-of-OBJECT, never a primitive array** (`stepsAvatars?: Array<{ url: string }>`, not `stepsAvatars?: string[]`) — enforced as `pair-with-not-object`. This isn't just style: a primitive array renders through a different editor component (`PrimitiveArrayEditor`) that the structural sync was never wired to, so a `@pairWith` on one would compile clean and silently never actually sync in the editor. Wrap even a single value in an object.

Validation (always an error, not gated by `--strict`): `pair-with-unknown` if the named target field doesn't exist (typo-check your target name), `pair-with-not-array` if either side isn't an array, `pair-with-bad-name` if the name doesn't start with the target's, `pair-with-not-object` if the paired field's items aren't an object. The target can be the base field itself, or another extension array declared anywhere in the same file (order doesn't matter). Several extension arrays may all `@pairWith` the same target — they all sync together.

### 1.3 Destructuring and consts

- Only `const { a, b = "default", key: local } = Astro.props;`. Rest `...x`, nested patterns → error `props`.
- `const x = <expr>` with the expression subset below (a TS annotation on the const is ignored). `let`/`var`/`function`/`if`/`for`/`return`/`await`/`export` → error `statement`. `as` casts → error `ts-cast`. `Astro.*` other than `Astro.props` → error `astro`. Two special forms are allowed: `const t = sectionT(Astro.locals)` and `const editChrome = (Astro.locals as {…})?.editChrome === true`.

### 1.4 Expression subset (frontmatter and `{}` in template)

Literals (strings, template literals, numbers, `true/false/null/undefined`), identifiers, `a.b`, `a[i]`, `f(x)`, optional chaining `?.`, unary `! - + typeof`, binary `?? || && === !== == != < > <= >= + - * / %`, ternary, array/object literals (shorthand ok, no computed keys, no spread), **expression-bodied** arrow functions `(x, i) => …` (block bodies → error `arrow-block`), and JSX inside expressions (`cond && <div/>`, `items.map(i => <li/>)`).

Rejected: spread (`spread`), `new class function await yield import this super delete void in instanceof` (`forbidden`), `**`, bitwise ops, assignments.

Identifiers in scope: props, consts, imports, arrow params, and builtins `t img url video editChrome Math String Number Boolean Array undefined`. Anything else → `error` `unknown-id`.

Runtime evaluation is sandboxed: own properties only (no `__proto__`/`constructor`); `Math.{min,max,floor,ceil,round,abs,trunc,sign,sqrt,pow}`; `Array.isArray`/`Array.from`; array methods `map filter slice join includes indexOf some every find findIndex flat concat at`; string methods `slice substring includes startsWith endsWith trim toUpperCase toLowerCase split replace replaceAll indexOf padStart padEnd charAt at repeat`; number `toFixed toLocaleString toString`. Other methods return `undefined`. Arrays > 5000 items throw; 200 000 evaluation steps per render.

### 1.5 Schema derivation

`base` = the section type's content schema (see `schema.md`). For each `Props` field: if the name exists in the base → it is a **base field** (`usedFields`; the editor uses the base type; a type mismatch is warning `props-type-mismatch` — checked all the way down, so `features?: string[]` against a base of `Array<{text: string}>` is flagged even though both are "array" at the top level, and a key inside a base array item that the base item shape doesn't have is `props-unknown-item-key`, since the editor's field UI for that array is generated from the base item schema and would never populate it). Otherwise → **extension field** shown in the editor under "Pengaturan Variant" (see §1.2 for its doc-comment rules). A key destructured but not declared → warning `props-undeclared` (added as string). `hiddenFields` = base fields the variant never reads — they disappear from the editor for this variant.

## 2. Template

### 2.1 Allowed tags

HTML: `a abbr address article aside b bdi bdo blockquote br button caption cite code col colgroup data dd del details dfn div dl dt em figcaption figure footer h1–h6 header hr i img ins kbd label li main mark nav ol p picture pre q s samp section small source span strong sub summary sup table tbody td tfoot th thead time tr u ul var video audio wbr track`

SVG: `svg path circle rect line polyline polygon g defs linearGradient radialGradient stop clipPath mask text tspan ellipse symbol pattern filter feGaussianBlur feOffset feBlend feColorMatrix feMerge feMergeNode title desc`

Everything else → `error` `tag` — including `iframe form input select textarea object embed link meta base template noscript canvas dialog`. `<Fragment>`/`<>` flatten. Capitalized tags must be one of the four macros (`component` error otherwise). `<style>` and `<script>` are raw blocks (cannot be self-closing).

### 2.2 Attributes

1. `on*` → `error` `attr-handler` (use a `<script is:inline>`).
2. `srcdoc`, `set:html`, `set:text`, `is:raw`, `define:vars`, `formaction` → `error` `attr`.
3. `data-*`, `aria-*`, `xlink:*`, `class:list` → always allowed.
4. Otherwise the name must be in the global allowlist: `class id style title lang dir role tabindex hidden href target rel download src srcset sizes alt width height loading decoding fetchpriority type open datetime cite start reversed value colspan rowspan scope headers for controls autoplay muted loop playsinline poster preload kind srclang label default media translate draggable inputmode itemprop itemscope itemtype` + SVG presentation attrs (`viewBox xmlns fill stroke stroke-width … d cx cy r rx ry x y x1 y1 x2 y2 points transform opacity … preserveAspectRatio vector-effect`).
5. Static `href`/`src`/`poster`: `javascript:`/`data:`/`vbscript:` → `error` `url`; `https?://` on `src`/`poster` → warning `hardcoded-image` (images must come from content fields).
6. Static `style`: `url(`/`expression(`/`@import`/`behavior:` → `error` `style-url`; `position: fixed` → `error` `fixed` (only navbar/banner, which WVF cannot target anyway); hex/rgb/hsl → warning `hardcoded-color`; numeric `border-radius` → warning `hardcoded-radius`; `font-family` without `var(--font-` → warning `hardcoded-font`.
7. `target="_top"` → error; `rel` with `preload|prefetch|import` → error. `<a target="_blank">` without `rel` gets `rel="noopener"` added.

URL attributes (`href src action formaction poster data-lightbox-src xlink:href`) are always sanitized at render (`javascript:` → `#`), so wrapping with `url()`/`img()` is belt-and-braces.

`class` and `class:list` may both be present; they are merged into one `class` attribute. `class:list` accepts strings, nested arrays (falsy dropped) and `{ "cls": bool }` objects.

### 2.3 Editor contract (what makes the variant editable)

| attribute | rule |
|---|---|
| `data-edit-field="path"` | the element's text is the content field `path` (`headline`, `items.${i}.title`) |
| `data-edit-image="path"` | an `<img>` (or empty placeholder `<div>`) bound to an image URL field |
| `data-edit-image-bg` | wrapper whose CSS background image is editable |
| `data-edit-icon="path"` | editable icon/emoji span |
| `data-edit-url="field"` on a `<a class="relative">` | compiler sugar: emits an `EditUrlPill` after the children; the link destination becomes editable |
| `<EditUrlPill field="ctaUrl" value={ctaUrl} />` inside a `relative` `<a>` | explicit form of the same pill |
| `data-track="cta"` | auto-added to any `<a href>` with an editable descendant; `Button href` and `ViewMoreLink` always emit it |
| `id="…"` | warning `id-attr` — the editor's click walker stops at ids; use `data-*` |
| `aria-hidden="true"` (static) | suppresses the dead-text rule for the subtree (decorative text) |

**Dead-text rule**: any literal text node matching `[A-Za-z]{2,}` that is not inside `aria-hidden="true"` or `<svg>` → warning `dead-text`; **error on submit (strict)**. Every visible word must come from a content field (`data-edit-field`) or `t("key")`. `<img>` without `alt` → warning `img-alt` (error on submit).

### 2.4 Root wrapper

The compiler adds no root element. At render the host wraps your nodes in `<div data-wv-root data-wv-inst="<uid>">`; CSS is scoped to `[data-wv-inst="<uid>"]`; the script's `root` variable is that wrapper. Defense in depth at serialization: `script iframe object embed form input textarea select link meta base style template frame frameset applet noscript html head body` are never emitted even if present in IR.

### 2.5 Power-word markers (automatic — but a split field kills them)

Site owners mark up fragments of ordinary text fields with paired delimiters, stored as plain strings in the content JSON:

`**bold**` · `*italic*` · `==highlight==` · `%%block highlight%%` · `@@circled@@` · `++brush underline++` · `__underline__` · `^^accent^^` · `[text](url)`

**You never parse or render these.** The site turns them into HTML in ONE central place — an HTMLRewriter pass over every `[data-edit-field]` element — so no variant component knows about markers. Write `<span data-edit-field="headline">{headline}</span>` as usual and it just works. (`set:html` is rejected by the compiler anyway.)

Three consequences worth designing around:

- **A marker pair must live inside ONE text node.** Separate text nodes are processed independently by design, so a field whose value you split across elements loses its markers silently — the buyer types `==diskon==` and the page shows a literal `==diskon==`. The usual way to trip this is per-word animation: `{headline.split(" ").map((w) => <span class="word">{w}</span>)}`. If a design needs that effect, apply it to a field you accept will never carry markers (a short eyebrow/label), not to the headline.
- **Nothing inside the field element may interrupt the text**, for the same reason: `<span data-edit-field="x">{a}<br />{b}</span>` is two text nodes.
- **Markers do NOT render in the marketplace preview** — the standalone variant preview page and the dashboard's in-browser preview both bypass that rewriter. So keep markers out of `sample.json`: they would show as raw `==…==` in your own listing and read as a bug. They belong in real site content, not showcase fixtures.

Text emitted by `t("…")` is fixed UI chrome and is not marker-processed — correct, and nothing to do about it.

### 2.6 Host-level behaviours a variant opts into

Some things the SITE does centrally: the variant only marks elements and gets the behaviour for free — no script of its own, so no script-review queue. This is the complete list as of compiler 0.1.12.

| Behaviour | What the variant writes | Where it runs | Live in the marketplace preview? |
|---|---|---|---|
| Power-word markers | nothing — automatic on every `[data-edit-field]` | HTMLRewriter over the page | **no** (§2.5) |
| Motion effects | `data-wv-effect` (+ `data-wv-delay` / `-duration` / `-strength`) | platform runtime injected by the layout | yes, and in `--out` previews (§5b) |
| **Image lightbox** | `data-lightbox` on the `<img>` | one lightbox in the layout, delegated click on `document` | **no** |
| CTA click tracking | nothing when the link holds an editable **field**; `data-track="cta"` by hand otherwise, `data-track="none"` to opt out | analytics listener in the layout | no |
| Site-name type scale (chrome only) | `data-site-name` on the brand text | layout CSS + the editor's live preview | n/a |

**Image lightbox.** Click-to-enlarge is the de-facto standard for photo sections here — 11 of the platform's 12 gallery components have it, so a seller gallery without it reads as the broken one when a buyer puts them side by side. It costs four attributes:

```astro
<div data-lightbox-group class="grid gap-4 sm:grid-cols-3">
  {images.map((im, i) => (
    <img src={img(im.url, 800)} data-lightbox data-lightbox-src={img(im.url, 1600)}
         data-edit-image={`images.${i}.url`} data-caption={im.alt} alt={im.alt ?? ""} loading="lazy" />
  ))}
</div>
```

- `data-lightbox` makes the image enlargeable; `data-lightbox-src` is the full-resolution version (falls back to the `src`, so a small thumbnail can still open at 1600px); `data-caption` shows under the big image; `data-lightbox-group` bounds prev/next — the search never escapes that container, which is exactly what keeps one gallery from paging into another.
- Free with it: close button, backdrop click, prev/next arrows, `Escape`, and a counter.
- In the editor the lightbox **stands down** (it would stack over the image-upload dialog), and it is **not active on the marketplace preview page**, which renders without the layout. Both are expected — do not pull the attributes back out because the preview looks inert.
- Use it on anything that shows off photographs (gallery, portfolio, bento, before/after) unless the image is purely decorative background.

**CTA click tracking.** The compiler adds `data-track="cta"` to any `<a href>` outside a `<Button>` that carries editable content — the `data-edit-field` / `data-edit-url` may be **on the anchor itself or on a descendant**, both count (compiler ≥ 0.1.11). That matters because the anchor-itself shape is the natural one for contact links, where the text IS the field value and the href derives from it:

```astro
<a href={url("mailto:" + email)} data-edit-field="email" class="underline">{email}</a>
```

Before 0.1.11 only descendants counted, so exactly these links went untracked — and for a service site a tapped phone number IS the conversion, not the hero button that was already tracked. A variant compiled earlier keeps the markup it was uploaded with; re-upload to pick this up.

Only `data-edit-field` counts, **not `data-edit-url`**: the first means the link's TEXT is buyer content, the second only means its destination is configurable — which is exactly how a variant spells an icon-only social link (the pill is the only way to edit an `<svg>`-only link inline). Social icons are therefore NOT counted, matching the platform's own `SocialIcons`, so a seller footer and a platform footer on the same page agree.

Still NOT counted, deliberately: a link whose label is fixed chrome (`t(…)`) or hardcoded — that is navigation — and a link wrapping only an image or icon (a linked photo card, a logo cloud). Counting every one of those would inflate the buyer's conversion rate rather than measure it. If such a link really is a call to action, write `data-track="cta"` on it yourself; a hand-written one is always respected and never duplicated.

Going the other way, **`data-track="none"`** opts a link out and leaves no attribute behind (compiler ≥ 0.1.12) — for the link that does carry an editable field but is not a conversion: a photographer credit, a social handle shown as text.

**`data-site-name`** is chrome-only (§4b): the site-name font-size setting is applied through `[data-site-name]`, so a navbar variant that prints the site name without that attribute ignores the owner's Style-tab setting and does not update live while they drag it.

### 2.7 Video: one field, two shapes

`videoUrl` is **polymorphic**. The editor's own help text says so — *"paste a YouTube/Vimeo URL, or upload a video file (MP4/WebM, max 50 MB)"* — and both land in the same string. A variant that assumes one shape breaks on the other: `<video src={videoUrl}>` shows a dead player for a pasted link, and a bare outbound link wastes a file the buyer took the trouble to upload.

Do not try to clone the platform's `VideoLightbox` — four separate rules close it, permanently and on purpose:

| It uses | WVF status |
|---|---|
| `<iframe>` | `error` `tag`, never emitted even if present in the IR, and `createElement('iframe')` is rejected too |
| `position: fixed` for the overlay | `error` `fixed`, everywhere, CSS and utilities alike |
| `define:vars` | `error` `script-define-vars` |
| `<dialog>` / `showModal()` | both on the reject list |

The supported pattern is to branch, with `video()` (§5) doing the sniffing:

```astro
const v = video(videoUrl);   // { kind: "file" | "embed" | "", src, poster }
...
{v.kind === "file" && (
  <video controls playsinline preload="none" poster={img(posterImage, 1600)} src={v.src}
         class="aspect-video w-full rounded-lg object-cover"></video>
)}
{v.kind === "embed" && (
  <a href={v.src} target="_blank" rel="noopener" class="relative block overflow-hidden rounded-lg">
    <img src={v.poster || img(posterImage, 1600)} data-edit-image="posterImage" alt="" loading="lazy" class="aspect-video w-full object-cover" />
    <span data-edit-field="watchText" class="absolute bottom-4 left-4 …">{watchText}</span>
    <EditUrlPill field="videoUrl" value={videoUrl} anchor="below" />
  </a>
)}
```

`video()` needs `variant-check` ≥ 0.1.18 (compiler 0.1.10); on an older CLI the identifier is simply unknown. The tags `video audio source track` and the attributes `controls autoplay muted loop playsinline poster preload` have always been on the allowlists — an uploaded video plays **inside** your variant, with no script and therefore no admin review. An embed can only ever be linked out to; that is the whole reason `v.src` is the watch URL and not a player URL. When a section's entire point IS an embedded YouTube player, stop authoring and use the built-in `video` section type (`schema.md`) — it owns the iframe and its own lightbox.

## 3. CSS

- Any number of `<style>` blocks (concatenated, scoped). `is:global` / `define:vars` → error. Each block ≤ 64 KB.
- Rejected: `@import` (`css-import`), `@font-face` (`css-font-face`), `expression(` (`css-expression`), `behavior:`/`-moz-binding:` (`css-behavior`), `position: fixed` (`fixed`).
- `url()`: `data:image/svg+xml…` and `#fragment` allowed; `images.unsplash.com` / `images.pexels.com` → warning; any other host → `error` `css-url`.
- Theme warnings (error on submit): hex/rgb/hsl colors (`hardcoded-color`), numeric `border-radius` (`hardcoded-radius`), `font-family` without `var(--font-…)` (`hardcoded-font`). `:root`/`html`/`body` selectors are rewritten to the variant root (`css-root` warning).
- Scoping: every selector gets the root prefix; a top-level `&` = root (`&:hover` → `root:hover`); CSS nesting inside a rule is flattened with the standard meaning (`.card { &:hover {…} .title {…} }` → `root .card:hover`, `root .card .title`; a nested `@media` is hoisted around the rule); `@media @supports @container @layer @scope` recurse; `@keyframes @property @page @counter-style` stay verbatim (name keyframes uniquely).
- Output = scoped Tailwind CSS + scoped author CSS, total ≤ 64 KB.

### 3.1 Scroll-driven animation (no script, no review queue)

CSS scroll-driven animation (`animation-timeline: view()` / `animation-timeline: scroll()`, `animation-range`) is allowed — the lint has no opinion on it, same as any other `animation-*`/`@keyframes` property. This is real capability, not an accident to route around: a timeline progress bar, a parallax layer, or a scroll-triggered reveal can all be built in `<style>` alone, with zero JavaScript and therefore no admin review.

```css
.wv-progress-line {
  animation: wv-grow linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 45%;
}
@keyframes wv-grow-<variant> { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

Always pair it with a `prefers-reduced-motion` fallback — the compiler does not enforce this, it is on you:

```css
@media (prefers-reduced-motion: reduce) {
  .wv-progress-line { animation: none; transform: scaleX(1); }
}
```

Browser support is Chromium-only as of this writing (Safari/Firefox ignore `animation-timeline` and simply show the animation's end state, which is an acceptable fallback on its own — but the reduced-motion rule above is still required).

## 4. JavaScript

Exactly **one** `<script is:inline>` block (no `src`, no `define:vars`, `type` bare/`text/javascript`/`module`), ≤ 8 KB UTF-8. The compiler stores the raw body; the runtime wraps it:

```js
(function(fetch,XMLHttpRequest,WebSocket,EventSource,localStorage,sessionStorage,indexedDB,postMessage,open,importScripts,navigator,cookieStore,caches){"use strict";
var root=document.querySelector('[data-wv-inst="<uid>"]');if(!root)return;
/* your code */
})();
```

**Every `<img>` whose src comes from a content field MUST carry `data-edit-image` with that field's path** (`data-edit-image="imageLeft"`; in a loop, `data-edit-image={\`items.\${i}.image\`}`) — without it the owner cannot swap the image inline. Lint `edit-image-missing` (fails `--strict`) enforces this.

So: `root` is pre-declared (query inside it: `root.querySelector(...)`), strict mode is on, the 13 shadowed globals are `undefined` (`eval`/`Function` are blocked by lint instead — they are illegal as strict-mode parameter names), bare `return` is legal, and each instance on a page gets its own `root`. Scripts are re-executed when the editor swaps a section, so idempotent init is required (guard with a `data-*` flag on `root`).

Rejected (all `error`):

- Text heuristics: `\xNN`/`\uNNNN` escapes, `String.fromCharCode`/`fromCodePoint` (`script-obfuscation`); `with` (`script-with`); `import`/`export`/`import()`/`import.meta` (`script-import`); `debugger`; syntax errors (`script-syntax`).
- Identifiers: `fetch XMLHttpRequest WebSocket EventSource eval Function importScripts localStorage sessionStorage indexedDB postMessage open navigator cookieStore globalThis self top parent opener frames caches ServiceWorker Worker SharedWorker Reflect Proxy Symbol WeakRef FinalizationRegistry crypto Notification Atomics SharedArrayBuffer`; computed `window[...]`.
- Members: `.cookie .write .writeln .top .parent .opener .frames .postMessage .sendBeacon .__proto__ .constructor .prototype .location .history .execCommand .requestSubmit .submit .importNode .adoptNode .contentWindow .contentDocument .srcdoc .outerHTML .insertAdjacentHTML .createContextualFragment .referrer .domain .defineProperty .getOwnPropertyDescriptor .setPrototypeOf .getPrototypeOf`; computed access with a non-literal key on `window document globalThis self Object Array`.
- Assignments: `.innerHTML`/`.outerHTML` with a non-literal RHS (`script-html`); `.src` `.href` `.action`; `.on*` handlers (use `addEventListener`).
- Calls: `atob btoa unescape decodeURIComponent`; `setTimeout`/`setInterval` with a string; `createElement`/`createElementNS` of `script iframe object embed link meta base form frame style` or a non-literal tag; `setAttribute` of `on* src href srcdoc action formaction style xlink:href` or a non-literal name; `insertAdjacentHTML` with a non-literal; `location.assign/replace`; `requestFullscreen`; `showModal`; `new Function|Worker|SharedWorker|WebSocket|XMLHttpRequest|EventSource|Proxy|BroadcastChannel|MessageChannel`; tagged templates.
- Loops: `while(true)`/`for(;;)` without `break`/`return`/`throw` (`script-loop`).

Allowed and typical: `root.querySelector(All)`, `addEventListener`, `classList`, `dataset`, `getAttribute`/`setAttribute("aria-…")`, `IntersectionObserver`, `requestAnimationFrame`, `matchMedia`, `setTimeout(fn, ms)`, `Date`, `Math`, `JSON`, `textContent`, `style.transform`.

Review rule: a variant **with** a script needs admin review before it can be sold; a new version that changes the script goes back to review.

## 4b. Site chrome (navbar / banner / footer)

Chrome types compile like any other variant, with two extra rules:

- **Context props are injected by the renderer, never edited by the owner.** Declare them in `interface Props` to read them; the compiler keeps them out of the editor schema: `pages?: Array<{ title: string; slug: string }>` (the site's nav pages, already filtered — a one-page site gets `[]`), `currentSlug?: string` (for active-link styling), `linkPrefix?: string` (path prefix to PREPEND to every internal href: `url(linkPrefix + (p.slug ? "/" + p.slug : "/"))`; today it is always `""` for uploaded chrome — emit plain site-relative paths and NEVER build query strings yourself: preview/dev params (`?_subdomain`, `_pt`, ...) are re-attached to every link by a platform script), `colorMode?: "light"|"dark"|"system"`; footers additionally get `footerPages` (photo/icon attribution is rendered by the PLATFORM in a strip below the footer — a footer variant never needs to render credits itself). `siteName` is an ORDINARY editable base field — the renderer merely injects a fallback that `content.siteName` overrides. Everything else you declare is ordinary content.
- **The root stays in normal flow — `position: fixed` is a compile error everywhere.** The platform positions the section WRAPPER: a `u:` navbar automatically gets wrapper-sticky "bar" mode (pinned solid bar). Do not try to stick or fix anything yourself; give the bar a real height and let the wrapper do the pinning. Mobile menus: a `<details>`/class-toggle drawer via the script (remember `aria-hidden` on the closed state so the overlay never traps clicks).

A navbar renders on EVERY page of a buyer's site — review is strict about it; test with 1 page (empty `pages`), many pages, and long titles.

## 4c. DB-driven sections (products / blog)

`products` and `blog` sections have two data modes the OWNER picks (`source: "manual" | "database"`); a variant sees no difference — it always renders the same base fields:

- `products?: Array<{ title: string; price: string; image?: string; description?: string; url?: string; category?: string }>` — `price` arrives PRE-FORMATTED ("Rp 150.000" or a range); render it verbatim, never parse or re-format it.
- `posts?: Array<{ title: string; excerpt: string; image?: string; date?: string; author?: string; url?: string }>`.

In manual mode the owner edits the list in the editor; in database mode the platform fills the array from the site's real products/posts before render (same shape). Rules: handle the EMPTY list (a fresh database mode has no rows yet — render the heading, not a broken grid); `url` is optional (no link → no `<a>`); `source` stays visible in the editor automatically (the compiler never hides it, even when your variant does not read it) - it is how the owner switches modes; pagination is rendered by the page OUTSIDE your section — ignore it.

## 5b. Platform effect library (data-wv-effect)

Declarative motion WITHOUT writing a script (so no script-review queue): mark elements and the platform's audited runtime animates them on the live site.

```astro
<div data-wv-effect="reveal-up" data-wv-delay="1">...</div>
<ul data-wv-effect="stagger" data-wv-delay="1">...</ul>
<span data-wv-effect="counter" data-wv-duration="1500">128</span>
```

Effects (closed enum — anything else is lint error `effect-unknown`): `reveal-up` / `reveal-down` / `reveal-left` / `reveal-right` (fade + 22px slide in the named FROM-direction, once, on viewport entry), `fade`, `stagger` (direct children reveal sequentially; `data-wv-delay` = step between children), `counter` (first number in the text counts up when visible), `parallax-soft` (gentle translateY scrub; `data-wv-strength="soft"|"medium"`), `zoom-hover` (images inside scale 1.03 on hover — give the container `overflow-hidden`).

Params: `data-wv-delay` = whole steps of 100ms, 0-10; `data-wv-duration` = ms, 100-5000. Rules the platform enforces so you don't have to: `prefers-reduced-motion` disables everything centrally (never write your own fallback), elements are only hidden after the runtime loads (no-JS/crawlers/thumbnails always see content), effects are OFF inside the editor, and sections swapped in AFTER page load (variant chips, apply, DB pagination) are rescanned automatically — never write your own IntersectionObserver for these effects. Don't put an effect on a `data-edit-field` element (warning `effect-on-editable`) — wrap it instead. `variant-check --out` previews include the runtime, so test the motion locally.

## 5. Macros and helpers

- `<Container class?>` → `<div class="mx-auto w-full px-6 …" style="max-width: var(--site-max-width, 72rem);">`.
- `<Button href? variant="default|outline|ghost" size="sm|default|lg" class?>` → `<a … data-track="cta">` when `href`, else `<button type="button">`. Base classes: `inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`; `default` = `bg-primary text-primary-foreground hover:opacity-90 shadow-sm`, `outline` = `border border-border text-foreground hover:bg-muted`, `ghost` = `text-foreground hover:bg-muted`; sizes `px-4 py-2 text-sm` / `px-6 py-3 text-base` / `px-8 py-4 text-lg`.
- `<EditUrlPill field="ctaUrl" value={ctaUrl} anchor="below|above|right|left" />` → hidden pill the editor reveals; its `<a>` ancestor needs `class="relative"`.
- `<ViewMoreLink url={viewMoreUrl} text={viewMoreText} style="outline|link|solid" align="left|center|right" />` → renders nothing when `url` is empty; emits an editable label + pill + `data-track="cta"`.
- `<AddImageButton path={`images.${images.length}.url`} visible={images.length < 20} label? mode="inline|floating" />` → the editor's "Tambah Gambar" pill for an image list; renders nothing on the live site. Put it at the list's bottom seam (after the grid, before `<ViewMoreLink>`); `path` is the **next** index of the list, `visible` gates on the list's max. `floating` pins it bottom-right of a full-bleed section, which then needs `class="relative"`. Every list of pictures with `data-edit-image` items should have one — a gallery without it has no way to add a photo in the editor (the platform appends a fallback pill at the section's end when a variant has none, but that placement is a guess).
- `t(key)` → localized fixed UI label (30 languages) — for chrome words only, never for content. **`key` is a CLOSED enum of platform term keys, never display text** — `t("Alamat")` is wrong (lint `t-unknown`, fails --strict; it used to crash the section at render, and the preview's identity `t` will not catch it for you). The ones sections typically need: `address` `email` `phone` `hours` `operatingHours` `today` `closed` `menu` `readMore` `contactUs` `price` `all` `close` `noResults` `openInMaps` `locationLabel` `customerReviews` `specialOffer` `freeLabel` `soldOut` `days` `minutes` `seconds` `minRead` `nextPage` `prevPage` `download` `questions` (the CLI validates the full list). A visible label with no matching term key is NOT a t() call — make it an optional content field with a default (`socialHeading = "Sosial"` + `data-edit-field`).
- `img(url, width = 960)` → sanitizes and sizes Unsplash/Pexels URLs (`w=`), passes other hosts through, returns `undefined` for empty input (attribute omitted). Use 480 for thumbnails, 960 for split images, 1600 for full-bleed backgrounds.
- `url(u)` → sanitizer (`javascript:` etc. → `#`); empty → `#`.
- `video(videoUrl)` → `{ kind, src, poster }` for the polymorphic video field (§2.7). `kind` is `"file"` (an uploaded `.mp4`/`.webm` — play it inline), `"embed"` (a recognized YouTube/Vimeo link — poster + link out; a variant may never embed it) or `""` (empty or unrecognized — render nothing rather than a broken player). `src` is sanitized, and for an embed it is the **watch** URL, never a player URL. `poster` is a free YouTube still frame, `""` for Vimeo and files — so write `v.poster || img(posterImage, 1600)` and keep your own poster field as the fallback. You cannot write this yourself: matching the extension needs a regex literal and reading the YouTube id needs `new URL`, and neither is in the expression subset (§1.4).
- `editChrome` → `true` inside the editor (only for editing affordances, never content).

## 6. Tailwind at upload

Tailwind v4 is compiled at upload from the class strings found in your file (static attributes, string/template literals, const initializers, prop defaults). Classes must be **literal** — never assembled from content values. Available: the full default utility set (spacing, flex/grid, typography, palette, breakpoints, `hover:`/`focus:`/`md:`, arbitrary values) **plus** theme tokens: `bg-|text-|border-|fill-|stroke-|ring-|from-|to-|via-` × `background foreground card card-foreground primary primary-foreground secondary secondary-foreground muted muted-foreground accent accent-foreground border input ring`, and `rounded-sm|md|lg|xl` (radius follows the site theme). `dark:` keys off `[data-theme="dark"]` on an ancestor (not `.dark`, not `prefers-color-scheme`). Candidate tokens ≤ 96 chars matching `^[!@]?-?[A-Za-z0-9_][\w:/\[\].%#(),!-]*$` — `!` and `-` are both accepted anywhere after the leading character too, not only at the very front, so `sm:!text-2xl` and `hover:-translate-y-1` both compile.

## 7. Lint code table

| code | level | meaning |
|---|---|---|
| `frontmatter` `empty` `internal` | error | file shape |
| `import` `props` `props-type` `types` `astro` `ts-cast` `statement` | error | frontmatter |
| `parse` `component` `spread` `arrow-block` `forbidden` `unknown-id` | error | template/expressions |
| `tag` `attr` `attr-handler` `url` `style-url` `fixed` | error | HTML |
| `img-alt`* `dead-text`* `hardcoded-image`* `hardcoded-color`* `hardcoded-radius`* `hardcoded-font`* `tailwind-skipped`* `heading-size-inert` `unknown-class` `id-attr` | warning | HTML/CSS quality |
| `style-global` `style-define-vars` `style-size` `css-import` `css-font-face` `css-expression` `css-behavior` `css-url` `css-parse` `css-size` | error | CSS (`css-url` is a warning for unsplash/pexels hosts) |
| `css-root` | warning | selector rewritten to root |
| `script-inline` `script-src` `script-define-vars` `script-type` `script-size` `script-syntax` `script-obfuscation` `script-with` `script-import` `script-debugger` `script-forbidden` `script-html` `script-loop` `script-count` | error | JavaScript |
| `tailwind` `ir-size` `source-size` `content-size` | error | build/upload limits (the last two are CLI-side, ≥ 0.1.17) |
| `props-optional`* `props-unknown-item-key`* `props-type-mismatch` `props-undeclared` | warning | schema |
| `ext-field-undocumented`* `ext-field-doc-thin` | warning | extension field docs (§1.2) |
| `pair-with-unknown` `pair-with-not-array` `pair-with-bad-name` `pair-with-not-object` | error | `@pairWith` (§1.2c) — always an error, `--strict` or not |
| `content-type` `content-required` `content-unknown-key` `content-min-items` `content-max-items` `content-enum` `content-invalid` | error | `--content` validated against the base schema (§9) — always an error, `--strict` or not |

`*` = becomes an **error** in strict mode (`--strict`, and always when submitting for review).

## 8. Unsupported

`navbar`, `banner`, `footer` (site-scoped chrome) and `post` cannot be WVF variants. Everything else in the section catalog can (see `schema.md`).

## 9. CLI

```
npx @webto-id/variant-check <file.astro> --type <sectionType> [--strict] [--content sample.json] [--out preview.html] [--theme light|dark|warm] [--json]
```
Exit 0 = clean, 1 = errors, 2 = usage. Run with `--strict` before submitting. `--content` is checked against the base schema too (`content-*` codes above) — a required nested field left empty or a base array item shaped wrong fails here, not only on upload.
