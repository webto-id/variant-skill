# Section types and their base content schema

A WVF variant targets exactly one **section type**. The type decides which content fields the editor shows by default (the *base schema*) and what the AI already knows how to fill. Your `interface Props` should reuse base field names wherever the design has an equivalent, and add optional extension fields only for what is genuinely new (a badge, a stat label, a layout switch).

The authoritative, always-current list is generated from the platform schema:
<https://docs.webto.id/marketplace/referensi-schema/> (or `npx @webto-id/variant-check --help` for the supported type ids). The CLI ships the same base schemas, so `hidden base fields` in its output tells you which base fields your variant ignores.

## Required fields per type

What the upload dry-run insists on at the top level of a section's `content` -- and, from `variant-check` 0.1.23, what `--content` checks too. A key with a platform default is never listed. **A field your variant hides (never reads in `Props`) is exempt** on both sides: the editor hides it for that variant, so demanding it would trap the buyer. Generated from the platform's schemas (`pnpm gen:schemas` in the CLI package), not maintained by hand.

| Type | Required |
|---|---|
| `banner` | `text` |
| `banner-inline` | `text` |
| `before-after` | `pairs` |
| `blog` | `heading` |
| `contact` | — |
| `countdown` | `heading`, `targetDate` |
| `cta` | `heading` |
| `faq` | `heading`, `items` |
| `features-grid` | `features`, `heading` |
| `footer` | — |
| `form` | `fields` — and the variant renders the form through `<FormFields />` (`wvf.md` §5c), never its own tags |
| `gallery` | `heading`, `images` |
| `hero` | `headline` |
| `logo-cloud` | `logos` |
| `map` | — |
| `navbar` | — (but it must render `logoUrl` — see the chrome section below) |
| `pricing` | `heading`, `plans` |
| `products` | `heading` |
| `stats` | `stats` |
| `steps` | `heading`, `steps` |
| `team` | `heading`, `members` |
| `testimonials` | `heading`, `testimonials` |
| `text-block` | `content` |
| `video` | `videoUrl` |

## Supported type ids

`hero features-grid testimonials cta faq stats steps pricing team gallery logo-cloud contact map video countdown before-after text-block blog products form banner-inline`

Site chrome (`navbar`, `banner`, `footer`) is also authorable as WVF — see the section below for its base fields and the extra rules in `wvf.md` §4b. Only `post` (blog article body) is system-managed and cannot be authored.

## Site chrome base fields (navbar / banner / footer)

Chrome is authorable as WVF, and its base fields are the site owner's branding — a variant that does not read them makes them **disappear from the owner's editor**, because a field no variant renders is a hidden field.

| Type | Base fields |
|---|---|
| `navbar` | `siteName` string?, `siteNameSize` number = 18 (not rendered by variants - the platform applies it through `data-site-name`), `logoUrl` string?, `logoUrlDark` string?, `showSiteNameWithLogo` boolean?, `ctaText` string?, `ctaUrl` string?, `links` {label, url}[]? |
| `banner` | `text` string |
| `footer` | `text` string, `links` {label, url}[]? |

Plus the context props the renderer injects (declare them to read them; they never appear in the editor): `pages` (already filtered by "show in navbar"), `currentSlug`, `linkPrefix`, `colorMode`; footer also gets `footerPages` (filtered by "show in footer", items carry `title`/`slug` and `label`/`url`) and `imageCredits`. A navbar must render `pages` and a footer must render `footerPages`, or the owner's per-page navigation settings do nothing — see `wvf.md` §4b.

**A navbar must render the logo.** Owners upload one in Site settings, and every platform navbar shows it. Lint `chrome-logo-missing` (warning) fires when `logoUrl` is not read.

```astro
interface Props {
  /** Site name, shown when there is no logo (or alongside it). */
  siteName?: string;
  /** Logo image URL, set by the site owner. */
  logoUrl?: string;
  /** Logo used in dark mode; falls back to logoUrl. */
  logoUrlDark?: string;
  /** Show the site name next to the logo. */
  showSiteNameWithLogo?: boolean;
  /** Injected: "light" | "dark" | "system". */
  colorMode?: string;
}
const { siteName = "", logoUrl = "", logoUrlDark = "", showSiteNameWithLogo = false, colorMode = "light" } = Astro.props;
const darkLogo = logoUrlDark || logoUrl;
const showName = !logoUrl || showSiteNameWithLogo;
---
<a href={url(linkPrefix + "/")} class="flex items-center gap-2" data-site-name>
  {logoUrl && colorMode === "dark" && <img src={img(darkLogo, 256)} alt={siteName} class="h-8 w-auto object-contain" />}
  {logoUrl && colorMode !== "dark" && (
    <>
      <img src={img(logoUrl, 256)} alt={siteName} class="h-8 w-auto object-contain dark:hidden" />
      {logoUrlDark && <img src={img(darkLogo, 256)} alt={siteName} class="hidden h-8 w-auto object-contain dark:block" />}
    </>
  )}
  {showName && <span data-edit-field="siteName">{siteName}</span>}
</a>
```

Two modes, two mechanisms: forced `dark` has no `data-theme` attribute to key off, so it is resolved from `colorMode` server-side; `system` renders both and lets `dark:` swap them. `data-site-name` on the brand element is what applies the owner's name-size setting.

## Base fields of the most common types

**hero** — `headline` (string, the H1), `subheadline?`, `ctaText` (default "Mulai Sekarang"), `ctaUrl` (default "#"), `badge?`, `images?: { url; alt? }[]`.

**features-grid** — `heading`, `subheading?`, `features: { title; description; icon?; image? }[]` (1–12), `viewMoreText?`, `viewMoreUrl?`, `viewMoreStyle: "outline"|"link"|"solid"`, `viewMoreAlign: "left"|"center"|"right"`.

**testimonials** — `heading`, `subheading?`, `testimonials: { name; role?; text; rating? (1–5) }[]` (1–12), plus the four `viewMore*` fields.

**cta** — `heading`, `description?`, `buttonText` (default "Hubungi Kami"), `buttonUrl` (default "#").

**faq** — `heading`, `subheading?`, `items: { question; answer; category? }[]` (1–20).

**stats** — `heading`, `stats: { value; label; prefix?; suffix? }[]`.

**steps** — `heading`, `subheading`, `steps: { title; description; icon?; image? }[]`.

**pricing** — `heading`, `subheading`, `plans: { name; price; annualPrice?; description?; features: string[]; ctaText?; ctaUrl?; highlighted? }[]`, `monthlyLabel`, `annualLabel`, `saveLabel`.

**team** — `heading`, `subheading`, `members: { name; role; image?; bio?; socialMediaUrls?: string[] }[]`, plus the four `viewMore*` fields.

**gallery** — `heading`, `subheading`, `images: { url; alt?; caption? }[]`, plus the four `viewMore*` fields.

**logo-cloud** — `heading`, `subheading`, `logos: { name; image; url? }[]`.

**contact** — `heading`, `description`, `email`, `phone`, `address`, `whatsappUrl`.

**map** — `heading`, `description`, `address`, `mapEmbedUrl`, `phone`, `email`, `hours`.

**video** — `heading`, `description`, `videoUrl`, `aspectRatio: "16:9"|"4:3"|"1:1"`.

**countdown** — `heading`, `subheading`, `targetDate`, `ctaText`, `ctaUrl`, `expiredText`.

**before-after** — `heading`, `subheading`, `pairs: { beforeImage; afterImage; beforeLabel?; afterLabel?; caption? }[]`.

**text-block** — `heading`, `content` (markdown), `alignment: "left"|"center"`.

(Exact shapes, bounds and defaults: the generated reference above. When in doubt run the CLI — a mismatch is reported as `props-type-mismatch`.)

## How the compiler classifies your `Props`

1. Name matches a base field → **base field**. Keep the base type (string stays string, arrays keep the item shape). The editor form, AI generation and existing site content all work unchanged.
2. Name is new → **extension field**, shown under "Pengaturan Variant". Allowed types: `string`, `number`, `boolean`, `"a" | "b"`, arrays of those, arrays/objects of primitives. The editor label is derived from the key name — it never reads the doc comment. The doc comment is the **AI's instruction for filling this field**, so write it as one: say what the text is, how long, and give a concrete example (`@example` tag or "e.g. …" inline). A field with no doc comment, or one with no example, is flagged by `variant-check` (`ext-field-undocumented` / `ext-field-doc-thin`) — see `wvf.md` §1.2 for the exact syntax.
3. Base field you never read → **hidden** for this variant (fine; it means the design has no slot for it).

## Field-design rules that reviewers check

- Reuse `headline/subheadline/ctaText/ctaUrl` (hero), `heading/subheading` (everything else), `items`/`features`/`testimonials` etc. Do not invent `title` when the type already has `heading`.
- Every link needs **both** an editable label (`data-edit-field`) and an editable destination (`EditUrlPill` / `data-edit-url`).
- Every image needs an image field (`images[].url`, `image`, …) with `data-edit-image`; never a hardcoded URL.
- Arrays: design for 1 item and for the max (the smart-column pattern in `design.md`), because site owners will use both.
- Prefer a small enum extension (`layout?: "left" | "right"`, `density?: "compact" | "airy"`) over two near-identical variants.
