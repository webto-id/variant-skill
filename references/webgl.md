# WebGL with OGL (`data-uses="ogl"`)

The platform hosts **OGL 1.0.11** (a small WebGL library, https://github.com/oframe/ogl) and loads it **only for a variant that declares it**. Use it when the effect IS the design: an image that ripples or distorts around the pointer, a shader gradient or noise field behind a hero, particles, a liquid or displacement transition. Needs `variant-check` ≥ 0.1.61.

Everything in `wvf.md` §4 (the script rules) still applies; this page adds what is specific to OGL. Complete example: `examples/hero-webgl-ripple.astro` (+ `.sample.json`, `.variant.json`).

## Before you reach for it

- **A poster first.** The design must be complete as plain HTML: a real `<img>` (with `data-edit-image`) that the canvas draws over. In the editor, in thumbnails, for visitors who prefer reduced motion, on devices without WebGL, and when the page already holds 4 WebGL canvases, OGL does not run and the poster is all anyone sees.
- **One canvas per section, at most.** A page that stacks several WebGL sections makes phones hot and slow. Two on a page is already a lot.
- **Not for what CSS does.** A fade, a parallax, a gradient that moves on hover: `data-wv-effect` (`wvf.md` §5b), CSS, or GSAP (§4a).

## The contract

```astro
<section class="relative isolate overflow-hidden">
  <img data-gl-poster src={photo} crossorigin="anonymous" alt="" data-edit-image="images.0.url" class="absolute inset-0 -z-20 h-full w-full object-cover" />
  <div data-gl class="absolute inset-0 -z-10" aria-hidden="true"></div>
  …content…
</section>

<script is:inline data-uses="ogl">
  if (!OGL) return;                       // required: OGL is null where WebGL must not run
  const { Renderer, Program, Mesh, Triangle, Texture } = OGL;
  const renderer = new Renderer({ dpr: window.devicePixelRatio, alpha: true });
  const gl = renderer.gl;
  root.querySelector("[data-gl]").appendChild(gl.canvas);
  …
  function frame(t) { requestAnimationFrame(frame); …; renderer.render({ scene: mesh }); }
  requestAnimationFrame(frame);
</script>
```

- **`OGL` is a parameter, not a global.** The callback receives the library as `OGL` (destructure it freely). It is **`null`** in the editor iframe, during thumbnail capture, for `prefers-reduced-motion: reduce`, without WebGL, when the file failed to load and once the page holds 4 WebGL canvases. A script that names `OGL` but never tests it (`if (!OGL) return;`, `if (OGL) …`, `OGL === null`) fails the lint with `ogl-no-fallback`. Everything after the early return is skipped, so put non-WebGL behavior (a CTA handler, a toggle) above it or in a function you call first.
- **Create the `Renderer` before you touch the page.** It throws when WebGL cannot start or the page is over its canvas budget; nothing is appended yet, so the poster stays. Append `gl.canvas` into an element inside `root` (`[data-gl]`), never to `document.body`.
- **Textures come from your own markup.** `new Texture(gl, { image: posterImg })` after the `<img>` has loaded (`img.complete && img.naturalWidth`, else `addEventListener("load", …, { once: true })`). OGL's loaders are not in the platform build (`TextureLoader`, `KTXTexture`, `GLTFLoader`, `DracoManager`, `BasisManager`, `Texture3D`), and `new Image()` / `.src =` are refused by the lint anyway: a variant cannot fetch a texture, a model or a font by URL. Photos the owner uploads are served from the site's own origin and work as they are. A photo on another host (Unsplash, the defaults in your sample) needs **`crossorigin="anonymous"`** on its `<img>` — the only `crossorigin` value the compiler accepts, on `<img>`/`<video>` — or WebGL refuses to read it.
- **Size from `root`.** `renderer.setSize(root.clientWidth, root.clientHeight)` on start and in a `ResizeObserver` on `root`. Style the canvas to fill its box (`gl.canvas.style.width = "100%"`, `height` likewise).
- **The canvas is decoration.** Keep it `aria-hidden` (on its wrapper) and behind the text; the headline, copy and buttons stay real HTML with `data-edit-field`, readable and clickable over it.

## What the platform does for you

- **Pixel ratio capped at 1.5.** Pass `dpr: window.devicePixelRatio` as usual; every `Renderer` clamps it (also when you set `renderer.dpr` later). A 3× phone would otherwise render 9× the pixels of a 1× screen.
- **At most 4 WebGL canvases per page.** The 5th `Renderer` throws; a variant that starts after the budget is spent gets `OGL = null`.
- **Paused off screen.** While the section is more than 200 px outside the viewport, its `requestAnimationFrame` callbacks (and `gsap.ticker` callbacks, if you also declared GSAP) are parked and resume when it comes back. Hidden tabs already stop. Drive the scene from `requestAnimationFrame`, not `setInterval`, so this works.
- **The CPU watchdog** (`wvf.md` §4) times your frame callbacks like any script. It cannot see the GPU: keep shaders modest — no unbounded loops, no 100-iteration raymarchers on a full-screen quad.

## Writing it

- `Triangle` (one full-screen triangle) is the usual geometry for an image or shader-gradient effect; `Plane` for a mesh you deform; `Polyline`, `Flowmap`, `Post`, `GPGPU` are available too. `Orbit` is not (it listens on the whole document).
- Shaders are plain template strings (GLSL).
- `object-cover` in a shader: scale the UVs by box aspect / photo aspect (see the example's `uCover`).
- **Rect coordinates:** `.top` and `.parent` are refused as members (they are also window escape hatches), so `rect.top` fails. Use `r.x` / `r.y` / `r.width` / `r.height` from `getBoundingClientRect()`.
- **With GSAP in the same script** (`data-uses="gsap ogl"`): the GSAP rules read every `.set(…)`/`.to(…)` call as a tween, so OGL's `vec.set(x, y)` fails `gsap-vars` there. Write the components (`v.x = a; v.y = b;`) or `v.copy(other)` instead. With `data-uses="ogl"` alone, `.set(x, y)` is fine.
- Init idempotently like any variant (`wvf.md` §4): `if (root.dataset.wvInit) return; root.dataset.wvInit = "1";` before creating the renderer.

## Lint codes

| code | when |
|---|---|
| `ogl-undeclared` | `OGL` named without `data-uses="ogl"` |
| `ogl-no-fallback` | `OGL` used but never tested for `null` |
| `script-forbidden` | `window.OGL` / any `.OGL`, `new Image()`, `.src =`, `.top`, `.prototype`… (`wvf.md` §4) |
| `uses-unknown` | a `data-uses` value other than `gsap`, `scroll-trigger`, `ogl` |
| `attr` | `crossorigin` other than `"anonymous"`, or on a tag other than `<img>`/`<video>` |

A WebGL variant has a script, so it goes through the automatic security check like any other. OGL is released under the Unlicense (public domain).
