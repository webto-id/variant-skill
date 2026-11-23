# GSAP recipes: the scroll effects Webflow and Framer sites are known for

Nine effects that buyers recognise from Webflow and Framer templates, each written as a complete variant in `examples/gsap/` (`.astro` + `.sample.json` + `.variant.json`). Every one passes `variant-check --strict` and was run in a browser at 1280 and 390 px before it was written down. Copy the closest one and change the design; keep the mechanics.

Read `wvf.md` §4a first: `data-uses`, `gsap.context(() => …, root)`, what the lint refuses. This page is the practical side.

## Pick the lighter tool first

| The design wants | Use |
|---|---|
| Fade or slide in on entry, stagger a list, count a number up, gentle parallax | `data-wv-effect` (`wvf.md` §5b): no script, no review |
| A progress line or a simple scrub, Chromium only is fine | scroll-driven CSS (`wvf.md` §3.1) |
| Everything below | GSAP, one moment per page (`design.md`) |

| Recipe | Webflow / Framer name | Section type | Example |
|---|---|---|---|
| Cards that stack | "stacking cards", "scroll to stack" | `features-grid`, `steps` | `stack-cards` |
| Text that fills with colour | "text color change on scroll", "text fill / highlight on scroll" | `text-block`, `cta` | `text-fill` |
| Sideways gallery | "horizontal scroll section" | `gallery` | `horizontal-gallery` |
| Photo that grows | "image zoom on scroll", "expanding image" | `hero` | `hero-zoom` |
| Photo wipe | "image reveal", "clip-path reveal" | `gallery`, any photo | `clip-reveal` |
| Sticky photo, scrolling steps | "sticky scroll", "scrollytelling", "feature tabs on scroll" | `steps`, `features-grid` | `sticky-steps` |
| Logo row that reacts to scroll | "velocity marquee", "infinite ticker" | `logo-cloud` | `velocity-marquee` |
| Section that turns dark | "background color change on scroll" | any | `invert-on-scroll` |
| Button that follows the pointer | "magnetic button" | `cta`, `hero` | `magnetic-cta` |

## 1. Stacking cards

Each card is `position: sticky` with a top offset that grows with its index, so the CSS alone already stacks them; GSAP only adds depth by shrinking and dimming a card while the next one covers it.

```css
.stack-card { position: sticky; top: calc(5rem + var(--i) * 1.25rem); transform-origin: 50% 0%; }
```
```js
cards.forEach((card, i) => {
  const next = cards[i + 1];
  if (!next) return;
  gsap.fromTo(card, { scale: 1, filter: "brightness(1)" }, {
    scale: 0.92, filter: "brightness(0.9)", ease: "none",
    scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
  });
});
```

- Pass the index as a custom property, `style={`--i: ${i}`}`, not as a class per card.
- **Do not fade the cards** (`opacity`). A card with opacity below 1 lets the card under it show through, and its text reads over the next card's. Dim with `filter: brightness()` instead, and give the cards an opaque background (`bg-card`).
- **Write the starting `filter` with `fromTo`.** A plain `gsap.to(card, { filter: "brightness(0.9)" })` starts from the computed `none`, which GSAP reads as `brightness(0)`: the card goes nearly black and climbs back.
- `position: sticky` stops working under any ancestor with `overflow: hidden` (or `auto`). Do not put `overflow-hidden` on the section of a sticky recipe; the platform's own wrappers have none.

## 2. Text that fills with colour on scroll

The Webflow version splits the paragraph into words. Here it stays **one text node**: an inline `<span>` with a gradient clipped to its letters, and GSAP moves the gradient's stop. An inline element's background runs across its lines as if they were one long line, so the fill travels line by line, the way the split version does.

```astro
<span data-fill data-edit-field="content" class="fill">{content}</span>
```
```css
.fill {
  --fill: 100%;
  background-image: linear-gradient(90deg, var(--color-foreground) var(--fill),
    color-mix(in oklab, var(--color-foreground) 28%, transparent) var(--fill));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
```
```js
gsap.fromTo(root.querySelector("[data-fill]"), { "--fill": "0%" }, {
  "--fill": "100%", ease: "none",
  scrollTrigger: { trigger: root.querySelector("[data-fill]"), start: "top 80%", end: "bottom 35%", scrub: true },
});
```

- **Why not split into words:** a field split across elements loses the owner's power-word markers (`wvf.md` §2.5), and a script that rewrites the text breaks inline editing. The gradient keeps the field one editable text node with its markers.
- `--fill: 100%` in the CSS is the no-JS state: fully readable in the editor, in thumbnails and with reduced motion.
- Keep the span `display: inline` (the default) and leave out `box-decoration-break: clone`; either one makes every line fill at once.
- The faint tone is the foreground colour mixed with `transparent`, so it follows both themes. Below about 25% it stops being readable before the fill reaches it.
- For a word-by-word version on a short label field that will never carry markers, map the words in the template inside the element marked with `data-edit-field`, and stagger them: `<p data-edit-field="label">{label.split(" ").map((w) => <span data-word class="inline-block mr-[0.3em]">{w}</span>)}</p>`, then `gsap.from(root.querySelectorAll("[data-word]"), { yPercent: 100, opacity: 0, stagger: 0.06 })`. Space the words with a margin: an `&nbsp;` is literal text (`dead-text`), and a plain space collapses after an `inline-block`.

## 3. Horizontal scroll gallery

The section pins and its row slides left by exactly the overflow. On phones a pinned sideways section fights the thumb, so the row becomes a native swipe with snap points and GSAP does nothing.

```js
const track = root.querySelector("[data-track]");
const mm = gsap.matchMedia();
mm.add("(min-width: 768px)", () => {
  const distance = () => Math.max(0, track.scrollWidth - root.clientWidth);
  gsap.to(track, {
    x: () => -distance(), ease: "none",
    scrollTrigger: { trigger: root.querySelector("[data-pin]"), start: "top top",
      end: () => "+=" + distance(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
});
```

- Functions for `x` and `end` plus `invalidateOnRefresh: true`: the distance is measured again when the window resizes or the images load.
- The row carries `overflow-x-auto snap-x snap-mandatory md:overflow-visible md:w-max`, and `scroll-px-4` so the first photo keeps its gutter when it snaps.
- Pin an inner wrapper (`[data-pin]`), not the section, and keep `data-wv-effect="parallax-soft"` off every ancestor: a pinned element inside a transformed ancestor drifts.

## 4. Photo that grows as the page scrolls

The frame starts at 82% and grows to full width while the photo inside eases from 125% to 100%, so the picture seems to come closer.

```js
const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 85%", end: "top 15%", scrub: true } });
tl.fromTo(frame, { scale: 0.82 }, { scale: 1, ease: "none" })
  .fromTo(root.querySelector("[data-photo]"), { scale: 1.25 }, { scale: 1, ease: "none" }, 0);
```

- Scale, not width: a width tween reflows the page on every frame.
- The frame needs `overflow-hidden` and `transform-origin: 50% 0%` so it grows downward from the headline.
- This is the hero image: no `loading="lazy"`, and `fetchpriority="high"`.

## 5. Clip-path photo reveal

```js
root.querySelectorAll("[data-reveal]").forEach((fig) => {
  const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 85%", once: true } });
  tl.fromTo(fig, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut" })
    .fromTo(fig.querySelector("img"), { scale: 1.3 }, { scale: 1, duration: 1.4, ease: "power3.out" }, 0);
});
```

- `clipPath` is one of the URL-capable keys: the lint allows it only as a fixed string without `url()`, as here. Write both ends in the same shape (`inset(a b c d)` four values) so GSAP can interpolate them.
- `once: true`: a reveal that runs again on every scroll up reads as a glitch.
- A plain fade or slide is `data-wv-effect="reveal-up"`; use this only when the wipe is the point.

## 6. Sticky photo with scrolling steps

The photo column is sticky and holds one image per step, stacked; each step's ScrollTrigger switches a class, and CSS crossfades.

```js
const show = (n) => {
  steps.forEach((el, i) => el.classList.toggle("is-on", i === n));
  shots.forEach((el, i) => el.classList.toggle("is-on", i === n));
};
steps.forEach((step, i) => {
  ScrollTrigger.create({ trigger: step, start: "top center", end: "bottom center",
    onToggle: (st) => { if (st.isActive) show(i); } });
});
```

- Render the first step and its photo with `is-on` already, so the section reads right without JS.
- On phones the sticky column is hidden (`hidden md:block`) and each step shows its own photo (`md:hidden`), with the same `data-edit-image` path; the editor updates both.
- Name the ScrollTrigger argument `st` or `trigger`, never `self`: `self` is a forbidden identifier in every variant script (`script-forbidden`).
- Leave space between steps (`space-y-[30vh]`) so each one holds the photo long enough to see it.

## 7. Logo marquee that reacts to scroll speed

```js
const loop = gsap.to(root.querySelector("[data-rail]"), { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
ScrollTrigger.create({
  trigger: root, start: "top bottom", end: "bottom top",
  onUpdate: (st) => {
    const boost = Math.min(4, 1 + Math.abs(st.getVelocity()) / 400);
    loop.timeScale(boost * st.direction);
    gsap.to(loop, { timeScale: st.direction, duration: 0.8, ease: "power2.out", overwrite: true });
  },
});
```

- The rail holds the list twice and moves by `-50%`, so the loop has no seam. The second copy is `aria-hidden="true"`, and its images still carry `data-edit-image` with the same paths: the lint asks for it on every content image, hidden or not.
- `repeat: -1` is reported to review as a loop. That is expected for a marquee; keep it to one light row.
- A marquee that does not react to scroll needs no GSAP: a CSS `@keyframes` translate on the rail is enough.

## 8. Section that turns dark on scroll

Webflow sites often repaint the whole page. A variant may change only its own section (`wvf.md` §4, review rule): reaching outside `root` to recolour the body or other sections sends the variant to an admin. So the section swaps itself to the inverse of the theme while it is in the middle of the screen.

```js
ScrollTrigger.create({ trigger: root, start: "top 55%", end: "bottom 45%",
  toggleClass: { targets: root.querySelector("[data-tone]"), className: "is-dark" } });
```
```css
.tone { background: var(--color-background); color: var(--color-foreground); transition: background-color 0.7s ease, color 0.7s ease; }
.tone.is-dark { background: var(--color-foreground); color: var(--color-background); }
.tone.is-dark .tone-muted { color: color-mix(in oklab, var(--color-background) 70%, transparent); }
```

- Swap theme tokens and let a CSS `transition` animate. GSAP cannot tween between two `var(--…)` values, and hex colours are a lint warning.
- Every text colour inside needs its dark counterpart (muted text, borders), or it disappears on the inverted background.

## 9. Magnetic button

```js
if (!window.matchMedia("(pointer: fine)").matches) return;
const bx = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
const by = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
btn.addEventListener("pointermove", (e) => {
  const r = btn.getBoundingClientRect();
  bx((e.clientX - (r.x + r.width / 2)) * 0.35);
  by((e.clientY - (r.y + r.height / 2)) * 0.35);
});
btn.addEventListener("pointerleave", () => { bx(0); by(0); });
```

- Read the rectangle as `r.x` / `r.y`. `r.top` is refused (`.top` is a forbidden member in variant scripts, because of `window.top`).
- `(pointer: fine)` only: on a touch screen there is no pointer to follow.
- Move the label a little less than the button (0.15 against 0.35); that difference is what makes it feel elastic.
- `quickTo` takes a literal property name (`gsap-quick-prop`).

## What the lint taught while writing these

| Wrote | Refused as | Write instead |
|---|---|---|
| `onUpdate: (self) => …` | `script-forbidden`: `self` | `(st) => …` |
| `rect.top`, `rect.left` | `script-forbidden`: `.top` | `rect.y`, `rect.x` |
| a hidden duplicate `<img>` without `data-edit-image` | `edit-image-missing` | the same `data-edit-image` path on the copy |
| `{w}&nbsp;` between split words | `dead-text` | `mr-[0.3em]` on each word |
| `text-3xl` on an `<h2>` | `heading-size-inert` (warning) | leave heading sizes to the theme, or `!text-3xl` |

And what the browser showed: `opacity` on stacked cards lets the text below show through, and a `filter` tween that starts from `none` begins at `brightness(0)`.

## Reduced motion, the editor, thumbnails

You write nothing for them. The platform reverts everything GSAP built during init (`wvf.md` §4a), so each recipe falls back to its markup: cards stacked by CSS sticky, the text fully filled, the gallery as a row, the photo at full size, the photos visible, the first step shown, the logos still, the section in its light state, the button in place. Check that fallback once by building the preview with JS off. It is what the owner sees while editing.
