# Tailwind and theme tokens in a WVF variant

The site owner controls **colors, fonts and corner radius** through their theme. A variant that hardcodes any of these looks wrong on every site but the author's — and the compiler flags it (`hardcoded-color`, `hardcoded-font`, `hardcoded-radius`: warnings while drafting, errors on submit).

## Use these tokens

| Purpose | Tailwind class | CSS variable (for `<style>`) |
|---|---|---|
| Page background / text | `bg-background` `text-foreground` | `var(--color-background)` `var(--color-foreground)` |
| Cards / panels | `bg-card` `text-card-foreground` | `var(--color-card)` |
| Primary accent (buttons, highlights) | `bg-primary` `text-primary` `text-primary-foreground` `border-primary` `ring-primary` | `var(--color-primary)` `var(--color-primary-foreground)` |
| Secondary accent | `bg-secondary` `text-secondary-foreground` | `var(--color-secondary)` |
| Muted surfaces / captions | `bg-muted` `text-muted-foreground` | `var(--color-muted)` `var(--color-muted-foreground)` |
| Accent (warm highlight) | `bg-accent` `text-accent-foreground` | `var(--color-accent)` |
| Borders / inputs / focus ring | `border-border` `border-input` `ring-ring` | `var(--color-border)` |
| Gradients | `from-primary to-secondary`, `from-primary/80` | `var(--gradient-from)` `var(--gradient-to)` |
| Radius | `rounded-sm` `rounded-md` `rounded-lg` `rounded-xl` | `var(--radius)` (`--radius-sm/md/lg/xl` derived) |
| Fonts | — (inherit) | `font-family: var(--font-heading)` on display text; body inherits `var(--font-body)` |
| Width | `<Container>` macro | `max-width: var(--site-max-width, 72rem)` |

Opacity modifiers work on tokens: `bg-primary/10`, `text-foreground/70`, `border-border/50`, `from-primary/80`. Use them instead of a lighter hardcoded shade.

## What still works from stock Tailwind

Everything structural: spacing (`p-6 gap-8 space-y-4`), flex/grid, sizing, typography scale and weight (`text-4xl font-bold tracking-tight`), position, overflow, shadows (`shadow-sm shadow-xl`), transitions/animations, responsive prefixes (`sm: md: lg:`), states (`hover: focus: group-hover:`), arbitrary values (`[mask-image:…]`). The default palette (`bg-slate-900`, `text-amber-500`) also compiles — but using it for anything the theme should control is a lint warning; reserve it for truly semantic colors (a green "success" tick, a red "sold out").

## Heading sizes belong to the site

`h1`-`h4` get their `font-size` from the site's theme (the owner's Style tab), through a rule the site keeps **outside** every cascade layer. Variant CSS lives in `@layer wvf`, and an unlayered declaration beats a layered one regardless of specificity - so `text-3xl` on an `<h2>` compiles, ships, and does nothing (the compiler warns: `heading-size-inert`). This is the same deal the platform's own variants have; it is what keeps a buyer's site on one heading scale. The preview shell mirrors it exactly, so what you see is what a site shows.

When an element's size is part of the design and must not be rescaled (a member name that must stay small, a stat number that must not blow out of its card): use `!text-base` (any `!text-*`). The `!` prefix is **honored everywhere** - the platform never rewrites it, neither the theme's heading scale nor a site owner's per-section body-size override touches it. It stays rem-based, so it only follows the site-wide base body size; an inline `style="font-size: ..."` pins a size absolutely.

When a heading merely shouldn't use the heading scale but *should* scale with body text, use a non-heading tag (`<p>`, `<span>`) with a plain `text-*` - plain `text-*` follows the owner's body-size settings, and works everywhere except `h1`-`h4`.

## Negative utilities

`-mt-16`, `-translate-y-2`, `-inset-1`, `-z-10` compile like any other utility (compiler ≥ 0.1.2; 0.1.0 dropped them silently). Any class token the compiler cannot accept — for example `[&>*]:mt-2` — now raises a `tailwind-skipped` warning instead of vanishing; `--strict` fails on it. Rewrite such tokens (arbitrary values like `mt-[-4rem]` are fine) or move the rule into `<style>`.

## Rules the compiler enforces

- Class names must be **literal strings** in the file: in `class="…"`, in `class:list={["a b", cond && "c", { d: flag }]}`, in `const cols = "md:grid-cols-2"`. A class built from content (`"bg-" + color`) is never compiled.
- `dark:` variants key off `[data-theme="dark"]` on an ancestor (the site sets it on `<html>` when the owner's theme is dark). Prefer tokens over `dark:` — tokens already flip.
- `<style>` blocks are scoped to the variant root automatically; `:root`, `html`, `body` selectors are rewritten to the root. `@keyframes` are global — give them a unique name (`wv-fadeup-<variant>`).
- Forbidden in CSS: `@import`, `@font-face`, `url()` to any host except `data:image/svg+xml` (and unsplash/pexels with a warning), `expression()`, `behavior`, `position: fixed`.
- Compiled CSS (Tailwind + yours) must stay under 64 KB — the Tailwind output is per-variant, so avoid huge arbitrary-value lists.

## Converting a raw HTML/CSS design

1. Replace every hardcoded color with the closest token (brand → `primary`, secondary brand → `secondary`, warm highlight → `accent`, greys → `muted`/`border`/`muted-foreground`).
2. Replace `border-radius: 12px` with `rounded-lg` (or `var(--radius)`), `font-family: "Poppins"` with `style="font-family: var(--font-heading);"`.
3. Move layout-only CSS into Tailwind utilities; keep a `<style>` block only for what utilities can't express (keyframes, `mask-image`, `clip-path`, complex pseudo-elements).
4. Delete external stylesheets, fonts, icon fonts and scripts — inline SVG icons instead (the SVG tag allowlist is generous).
5. Check both themes: a white-on-light hero fails on dark sites. Use `text-foreground` on `bg-background`, `text-primary-foreground` on `bg-primary`, and overlays via `bg-black/50` (opacity), not `color-mix` without `transparent`.
