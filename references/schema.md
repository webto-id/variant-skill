# Section types and their base content schema

A WVF variant targets exactly one **section type**. The type decides which content fields the editor shows by default (the *base schema*) and what the AI already knows how to fill. Your `interface Props` should reuse base field names wherever the design has an equivalent, and add optional extension fields only for what is genuinely new (a badge, a stat label, a layout switch).

The authoritative, always-current list is generated from the platform schema:
<https://docs.webto.id/marketplace/referensi-schema/> (or `npx @webto-id/variant-check --help` for the supported type ids). The CLI ships the same base schemas, so `hidden base fields` in its output tells you which base fields your variant ignores.

## Supported type ids

`hero features-grid testimonials cta faq stats steps pricing team gallery logo-cloud contact map video countdown before-after text-block blog products form banner-inline`

Not supported as WVF (site chrome / system): `navbar banner footer post`.

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
2. Name is new → **extension field**, shown under "Pengaturan Variant". Allowed types: `string`, `number`, `boolean`, `"a" | "b"`, arrays of those, arrays/objects of primitives. Put a `/** Label */` doc comment on it — that's the editor label.
3. Base field you never read → **hidden** for this variant (fine; it means the design has no slot for it).

## Field-design rules that reviewers check

- Reuse `headline/subheadline/ctaText/ctaUrl` (hero), `heading/subheading` (everything else), `items`/`features`/`testimonials` etc. Do not invent `title` when the type already has `heading`.
- Every link needs **both** an editable label (`data-edit-field`) and an editable destination (`EditUrlPill` / `data-edit-url`).
- Every image needs an image field (`images[].url`, `image`, …) with `data-edit-image`; never a hardcoded URL.
- Arrays: design for 1 item and for the max (the smart-column pattern in `design.md`), because site owners will use both.
- Prefer a small enum extension (`layout?: "left" | "right"`, `density?: "compact" | "airy"`) over two near-identical variants.
