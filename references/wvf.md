# Webto Variant Format (WVF) — exact compiler reference

Extracted from `@webto/variant-compiler` (the same code that runs in the uploader, on the server, and in `npx @webto-id/variant-check`). Every identifier is verbatim from the compiler. When this file and your intuition disagree, this file wins.

## 0. File shape

One `.astro` file: a `---` frontmatter block containing `interface Props`, then the template. The file is split with `/^\s*---[ \t]*\n([\s\S]*?)\n---[ \t]*\n?([\s\S]*)$/` (CRLF normalized).

- No frontmatter → `error` `frontmatter`: "file must start with a `---` frontmatter block containing `interface Props`".
- No markup → `error` `empty`.
- Source upload limit **128 KB**; compiled IR ≤ **256 KB**; compiled CSS ≤ **64 KB**; script ≤ **8 KB**.

## 1. Frontmatter

### 1.1 Imports

Canonical: `import { t, img, url, Container, Button, EditUrlPill, ViewMoreLink } from "webto/variant";` — import only what you use. Legacy aliases also accepted: `sanitizeUrl` (= `url`), `withUnsplashWidth` (= `img`), `sectionT`. Relative platform paths (`../lib/sanitize`, `../ui/Button.astro`, …) are tolerated. Any other module → `error` `import`. Unknown name → `error` `import`. `import type` is ignored.

### 1.2 `interface Props`

Required (`interface Props { … }` or `type Props = { … }`). `extends` → error. Fields: `name?: type;` — **every field should be optional** (`props-optional` warning; error in strict).

| TS type | JSON Schema |
|---|---|
| `string` / `number` / `boolean` | primitive |
| `"a" \| "b"` | string enum |
| `T[]`, `Array<T>`, `ReadonlyArray<T>` | array |
| `{ a: string; b?: number }` (nested ok) | object |
| `\| undefined` / `\| null` | stripped |

Anything else (`Date`, `Record`, `unknown`, named interfaces, non-literal unions) → `error` `props-type`. A `/** … */` comment right before a field becomes its editor description (extension fields only).

### 1.3 Destructuring and consts

- Only `const { a, b = "default", key: local } = Astro.props;`. Rest `...x`, nested patterns → error `props`.
- `const x = <expr>` with the expression subset below (a TS annotation on the const is ignored). `let`/`var`/`function`/`if`/`for`/`return`/`await`/`export` → error `statement`. `as` casts → error `ts-cast`. `Astro.*` other than `Astro.props` → error `astro`. Two special forms are allowed: `const t = sectionT(Astro.locals)` and `const editChrome = (Astro.locals as {…})?.editChrome === true`.

### 1.4 Expression subset (frontmatter and `{}` in template)

Literals (strings, template literals, numbers, `true/false/null/undefined`), identifiers, `a.b`, `a[i]`, `f(x)`, optional chaining `?.`, unary `! - + typeof`, binary `?? || && === !== == != < > <= >= + - * / %`, ternary, array/object literals (shorthand ok, no computed keys, no spread), **expression-bodied** arrow functions `(x, i) => …` (block bodies → error `arrow-block`), and JSX inside expressions (`cond && <div/>`, `items.map(i => <li/>)`).

Rejected: spread (`spread`), `new class function await yield import this super delete void in instanceof` (`forbidden`), `**`, bitwise ops, assignments.

Identifiers in scope: props, consts, imports, arrow params, and builtins `t img url editChrome Math String Number Boolean Array undefined`. Anything else → `error` `unknown-id`.

Runtime evaluation is sandboxed: own properties only (no `__proto__`/`constructor`); `Math.{min,max,floor,ceil,round,abs,trunc,sign,sqrt,pow}`; `Array.isArray`/`Array.from`; array methods `map filter slice join includes indexOf some every find findIndex flat concat at`; string methods `slice substring includes startsWith endsWith trim toUpperCase toLowerCase split replace replaceAll indexOf padStart padEnd charAt at repeat`; number `toFixed toLocaleString toString`. Other methods return `undefined`. Arrays > 5000 items throw; 200 000 evaluation steps per render.

### 1.5 Schema derivation

`base` = the section type's content schema (see `schema.md`). For each `Props` field: if the name exists in the base → it is a **base field** (`usedFields`; the editor uses the base type; a type mismatch is warning `props-type-mismatch`). Otherwise → **extension field** shown in the editor under "Pengaturan Variant". A key destructured but not declared → warning `props-undeclared` (added as string). `hiddenFields` = base fields the variant never reads — they disappear from the editor for this variant.

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

## 3. CSS

- Any number of `<style>` blocks (concatenated, scoped). `is:global` / `define:vars` → error. Each block ≤ 64 KB.
- Rejected: `@import` (`css-import`), `@font-face` (`css-font-face`), `expression(` (`css-expression`), `behavior:`/`-moz-binding:` (`css-behavior`), `position: fixed` (`fixed`).
- `url()`: `data:image/svg+xml…` and `#fragment` allowed; `images.unsplash.com` / `images.pexels.com` → warning; any other host → `error` `css-url`.
- Theme warnings (error on submit): hex/rgb/hsl colors (`hardcoded-color`), numeric `border-radius` (`hardcoded-radius`), `font-family` without `var(--font-…)` (`hardcoded-font`). `:root`/`html`/`body` selectors are rewritten to the variant root (`css-root` warning).
- Scoping: every selector gets the root prefix; `&` = root; `@media @supports @container @layer @scope` recurse; `@keyframes @property @page @counter-style` stay verbatim (name keyframes uniquely).
- Output = scoped Tailwind CSS + scoped author CSS, total ≤ 64 KB.

## 4. JavaScript

Exactly **one** `<script is:inline>` block (no `src`, no `define:vars`, `type` bare/`text/javascript`/`module`), ≤ 8 KB UTF-8. The compiler stores the raw body; the runtime wraps it:

```js
(function(fetch,XMLHttpRequest,WebSocket,EventSource,eval,Function,localStorage,sessionStorage,indexedDB,postMessage,open,importScripts,navigator,cookieStore,caches){"use strict";
var root=document.querySelector('[data-wv-inst="<uid>"]');if(!root)return;
/* your code */
})();
```

So: `root` is pre-declared (query inside it: `root.querySelector(...)`), strict mode is on, the 15 shadowed globals are `undefined`, bare `return` is legal, and each instance on a page gets its own `root`. Scripts are re-executed when the editor swaps a section, so idempotent init is required (guard with a `data-*` flag on `root`).

Rejected (all `error`):

- Text heuristics: `\xNN`/`\uNNNN` escapes, `String.fromCharCode`/`fromCodePoint` (`script-obfuscation`); `with` (`script-with`); `import`/`export`/`import()`/`import.meta` (`script-import`); `debugger`; syntax errors (`script-syntax`).
- Identifiers: `fetch XMLHttpRequest WebSocket EventSource eval Function importScripts localStorage sessionStorage indexedDB postMessage open navigator cookieStore globalThis self top parent opener frames caches ServiceWorker Worker SharedWorker Reflect Proxy Symbol WeakRef FinalizationRegistry crypto Notification Atomics SharedArrayBuffer`; computed `window[...]`.
- Members: `.cookie .write .writeln .top .parent .opener .frames .postMessage .sendBeacon .__proto__ .constructor .prototype .location .history .execCommand .requestSubmit .submit .importNode .adoptNode .contentWindow .contentDocument .srcdoc .outerHTML .insertAdjacentHTML .createContextualFragment .referrer .domain .defineProperty .getOwnPropertyDescriptor .setPrototypeOf .getPrototypeOf`; computed access with a non-literal key on `window document globalThis self Object Array`.
- Assignments: `.innerHTML`/`.outerHTML` with a non-literal RHS (`script-html`); `.src` `.href` `.action`; `.on*` handlers (use `addEventListener`).
- Calls: `atob btoa unescape decodeURIComponent`; `setTimeout`/`setInterval` with a string; `createElement`/`createElementNS` of `script iframe object embed link meta base form frame style` or a non-literal tag; `setAttribute` of `on* src href srcdoc action formaction style xlink:href` or a non-literal name; `insertAdjacentHTML` with a non-literal; `location.assign/replace`; `requestFullscreen`; `showModal`; `new Function|Worker|SharedWorker|WebSocket|XMLHttpRequest|EventSource|Proxy|BroadcastChannel|MessageChannel`; tagged templates.
- Loops: `while(true)`/`for(;;)` without `break`/`return`/`throw` (`script-loop`).

Allowed and typical: `root.querySelector(All)`, `addEventListener`, `classList`, `dataset`, `getAttribute`/`setAttribute("aria-…")`, `IntersectionObserver`, `requestAnimationFrame`, `matchMedia`, `setTimeout(fn, ms)`, `Date`, `Math`, `JSON`, `textContent`, `style.transform`.

Review rule: a variant **with** a script needs admin review before it can be sold; a new version that changes the script goes back to review.

## 5. Macros and helpers

- `<Container class?>` → `<div class="mx-auto w-full px-6 …" style="max-width: var(--site-max-width, 72rem);">`.
- `<Button href? variant="default|outline|ghost" size="sm|default|lg" class?>` → `<a … data-track="cta">` when `href`, else `<button type="button">`. Base classes: `inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`; `default` = `bg-primary text-primary-foreground hover:opacity-90 shadow-sm`, `outline` = `border border-border text-foreground hover:bg-muted`, `ghost` = `text-foreground hover:bg-muted`; sizes `px-4 py-2 text-sm` / `px-6 py-3 text-base` / `px-8 py-4 text-lg`.
- `<EditUrlPill field="ctaUrl" value={ctaUrl} anchor="below|above|right|left" />` → hidden pill the editor reveals; its `<a>` ancestor needs `class="relative"`.
- `<ViewMoreLink url={viewMoreUrl} text={viewMoreText} style="outline|link|solid" align="left|center|right" />` → renders nothing when `url` is empty; emits an editable label + pill + `data-track="cta"`.
- `t(key)` → localized fixed UI label (30 languages) — for chrome words only, never for content.
- `img(url, width = 960)` → sanitizes and sizes Unsplash/Pexels URLs (`w=`), passes other hosts through, returns `undefined` for empty input (attribute omitted). Use 480 for thumbnails, 960 for split images, 1600 for full-bleed backgrounds.
- `url(u)` → sanitizer (`javascript:` etc. → `#`); empty → `#`.
- `editChrome` → `true` inside the editor (only for editing affordances, never content).

## 6. Tailwind at upload

Tailwind v4 is compiled at upload from the class strings found in your file (static attributes, string/template literals, const initializers, prop defaults). Classes must be **literal** — never assembled from content values. Available: the full default utility set (spacing, flex/grid, typography, palette, breakpoints, `hover:`/`focus:`/`md:`, arbitrary values) **plus** theme tokens: `bg-|text-|border-|fill-|stroke-|ring-|from-|to-|via-` × `background foreground card card-foreground primary primary-foreground secondary secondary-foreground muted muted-foreground accent accent-foreground border input ring`, and `rounded-sm|md|lg|xl` (radius follows the site theme). `dark:` keys off `[data-theme="dark"]` on an ancestor (not `.dark`, not `prefers-color-scheme`). Candidate tokens ≤ 96 chars matching `^[!@]?[A-Za-z0-9_][\w:/\[\].%#(),-]*$`.

## 7. Lint code table

| code | level | meaning |
|---|---|---|
| `frontmatter` `empty` `internal` | error | file shape |
| `import` `props` `props-type` `types` `astro` `ts-cast` `statement` | error | frontmatter |
| `parse` `component` `spread` `arrow-block` `forbidden` `unknown-id` | error | template/expressions |
| `tag` `attr` `attr-handler` `url` `style-url` `fixed` | error | HTML |
| `img-alt`* `dead-text`* `hardcoded-image`* `hardcoded-color`* `hardcoded-radius`* `hardcoded-font`* `tailwind-skipped`* `heading-size-inert` `id-attr` | warning | HTML/CSS quality |
| `style-global` `style-define-vars` `style-size` `css-import` `css-font-face` `css-expression` `css-behavior` `css-url` `css-parse` `css-size` | error | CSS (`css-url` is a warning for unsplash/pexels hosts) |
| `css-root` | warning | selector rewritten to root |
| `script-inline` `script-src` `script-define-vars` `script-type` `script-size` `script-syntax` `script-obfuscation` `script-with` `script-import` `script-debugger` `script-forbidden` `script-html` `script-loop` `script-count` | error | JavaScript |
| `tailwind` `ir-size` | error | build limits |
| `props-optional`* `props-type-mismatch` `props-undeclared` | warning | schema |

`*` = becomes an **error** in strict mode (`--strict`, and always when submitting for review).

## 8. Unsupported

`navbar`, `banner`, `footer` (site-scoped chrome) and `post` cannot be WVF variants. Everything else in the section catalog can (see `schema.md`).

## 9. CLI

```
npx @webto-id/variant-check <file.astro> --type <sectionType> [--strict] [--content sample.json] [--out preview.html] [--theme light|dark|warm] [--json]
```
Exit 0 = clean, 1 = errors, 2 = usage. Run with `--strict` before submitting.
