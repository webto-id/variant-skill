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
