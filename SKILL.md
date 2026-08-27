---
name: html-to-webto-variant
description: Convert raw HTML/CSS/JS (a landing-page section, a Tailwind snippet, a screenshot description, or a design brief) into a Webto Variant Format (.astro subset) section variant that passes `npx @webto-id/variant-check --strict` and can be uploaded and sold on the webto.id marketplace. Use whenever someone asks to "make a webto variant", "convert this section to WVF", "buat variant untuk webto", or wants a section design that works inside webto's editor.
---

# HTML → Webto variant (WVF)

You are producing **one `.astro` file** in the Webto Variant Format: a restricted Astro subset that webto.id compiles at upload into a safe, theme-aware, inline-editable section. The compiler is strict and the rules are exact — read the references before writing, and always finish by running the CLI.

## References (read on demand)

- `references/wvf.md` — the exact compiler rules: allowed imports/tags/attributes, expression subset, CSS and JavaScript reject lists, macro components, lint codes. **Read this first, fully.**
- `references/schema.md` — section types and their base content fields; how `interface Props` is classified into base / extension / hidden fields.
- `references/tailwind.md` — theme tokens (`bg-primary`, `text-muted-foreground`, `rounded-lg`, `var(--font-heading)`), what compiles, what is flagged.
- `references/design.md` — what makes a variant good: structural distinctiveness, content-shape robustness (1 item … max items, missing optionals), mobile, both themes, the zero-dead-text discipline.
- `examples/hero-split.astro` — a complete, passing variant to mimic.

## Workflow

1. **Pick the section type.** Map the input to one id from `schema.md` (`hero`, `features-grid`, `testimonials`, `cta`, `faq`, `stats`, `steps`, `pricing`, `team`, `gallery`, …). Never `navbar`/`banner`/`footer`. If the input spans several sections, produce several files — one type each.
2. **Translate content → fields.** Every visible string becomes a base field (reuse the base names) or an optional extension field with a `/** Label */` comment. Images → image fields. Links → label field + `EditUrlPill`. Put sensible Indonesian sample copy in the destructuring defaults.
3. **Translate styling → tokens.** Colors → `primary/secondary/accent/muted/foreground/background/border` tokens; radius → `rounded-*`; fonts → `var(--font-heading)`; drop external CSS/fonts/icon libraries (inline SVG instead). Keep a `<style>` block only for keyframes/masks/pseudo-elements.
4. **Translate behavior → one `<script is:inline>`** (optional, ≤ 8 KB): query inside `root`, `addEventListener`, `classList`, `IntersectionObserver`, `setTimeout(fn, ms)`. No `fetch`, storage, `innerHTML` with variables, `on*` attributes. Make init idempotent (`if (root.dataset.wvInit) return; root.dataset.wvInit = "1";`).
5. **Write the file** following the skeleton below. Zero dead text: literal words only inside `t("…")`, `data-edit-field` elements, or `aria-hidden="true"` decoration.
6. **Check.** Run `npx @webto-id/variant-check <file>.astro --type <type> --strict --content sample.json --out preview.html`. Fix every `✖` and `▲` (strict turns quality warnings into errors — that is the marketplace's submit gate). Open `preview.html`; try `--theme dark`.
7. **Stress the content shape** by editing `sample.json`: 1 item and the max, no images, no optional fields, long headline. Fix layouts that break.
8. **Deliver**: the `.astro` file, a `sample.json`, and a 1–2 sentence factual description + suggested name for the marketplace listing (see `design.md` §9).

## Skeleton

```astro
---
import { t, img, url, Container, Button, EditUrlPill } from "webto/variant";

interface Props {
  heading?: string;
  subheading?: string;
  features?: Array<{ title: string; description: string; icon?: string }>;
  /** Tampilkan nomor urut */
  numbered?: boolean;
}

const {
  heading = "Kenapa memilih kami",
  subheading = "Tiga alasan pelanggan kembali lagi.",
  features = [],
  numbered = true,
} = Astro.props;
const n = features.length;
const cols = n >= 3 ? "md:grid-cols-3" : n === 2 ? "md:grid-cols-2" : "max-w-md mx-auto";
---
<section class="py-20 sm:py-28 bg-background text-foreground">
  <Container>
    <div class="max-w-2xl mb-12">
      <h2 class="text-3xl sm:text-4xl font-bold tracking-tight" style="font-family: var(--font-heading);">
        <span data-edit-field="heading">{heading}</span>
      </h2>
      {subheading && <p data-edit-field="subheading" class="mt-4 text-lg text-muted-foreground">{subheading}</p>}
    </div>
    <div class:list={["grid gap-6", cols]}>
      {features.map((f, i) => (
        <div class="rounded-lg border border-border bg-card p-6">
          {numbered && <span aria-hidden="true" class="text-sm font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>}
          {f.icon && <span data-edit-icon={`features.${i}.icon`} class="block text-2xl mt-2">{f.icon}</span>}
          <h3 data-edit-field={`features.${i}.title`} class="mt-3 text-lg font-semibold">{f.title}</h3>
          <p data-edit-field={`features.${i}.description`} class="mt-2 text-muted-foreground">{f.description}</p>
        </div>
      ))}
    </div>
  </Container>
</section>
```

## Hard rules (the ones that fail submission)

- `interface Props` required; every field optional; only `string | number | boolean | "a"|"b" | Array<…> | {…}`.
- Only `import … from "webto/variant"`; no other imports, no `Astro.*` except `Astro.props`.
- Frontmatter = `const` expressions only (no statements, loops, `await`, casts).
- Tags/attributes from the allowlist; no `on*`, `set:html`, `iframe`, `form`, `input`, external `src`.
- Every visible word editable or `t()`; every `<img>` has `alt`; no hardcoded colors/fonts/radius.
- One `<script is:inline>` ≤ 8 KB obeying the reject list; scripts trigger admin review.
- Run `variant-check --strict` and get `0 error(s)` before handing over.
