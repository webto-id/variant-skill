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

## 3D from Blender (or any 3D tool)

A real 3D model cannot come along: there is no glTF loader, a variant cannot fetch a file, and a script is capped at 8 KB, far too small for a model's vertices. What does work is to **render** the 3D work and let the page play with the result. Two recipes, both checked on a live site:

| Recipe | You render | The page does | Example |
|---|---|---|---|
| Scroll-scrubbed video | a turntable or exploded-view animation, as an MP4 | GSAP ScrollTrigger moves `video.currentTime` with the scroll: the product turns as the visitor scrolls, and back | `examples/hero-scroll-video.*` |
| Depth parallax | one still render **and** its depth map (same size, same framing) | an OGL shader shifts each pixel by its depth with the pointer and a slow drift: the picture gains depth | `examples/hero-depth-parallax.*` |

**Both must degrade to an ordinary hero.** The owner fills the section later and will often have no MP4 or no depth map, or switches to your variant from another hero whose photo sits in `imageUrl`. So: read the photo from `images[0]`, falling back to `imageUrl`; without a video, show that photo (the example zooms it gently on scroll); without a depth map, assume the subject is centred (a soft radial depth). A variant that shows nothing without its special asset is broken.

### Scroll-scrubbed video

- **The MP4 must have every frame as a keyframe.** A normal export (from Blender, a phone or an editor) has one keyframe every few seconds; every scroll step then decodes up to a few hundred frames and the video stutters badly. Measured on a 1080p50 file with a keyframe every 3 s: median seek 155 ms; the same video re-encoded: 5 ms. Tell the owner to re-encode, or do it for them:

  ```
  ffmpeg -i input.mp4 -vf "scale=1280:-2,fps=30" -c:v libx264 -preset slow -crf 26 \
    -g 1 -keyint_min 1 -pix_fmt yuv420p -an -movflags +faststart output.mp4
  ```

  1280 px at 30 fps is enough for a full-screen scrub and usually comes out smaller than the original; 3–8 seconds is plenty.
- Markup: `<video data-scrub muted playsinline preload="auto" poster={photo} src={v.src}>` from `video(videoUrl)` (`wvf.md` §5), inside a `sticky top-0 h-screen` box in a section 2–3 screens tall (`h-[250vh]`). Only when there is a video; otherwise a normal-height section with the photo.
- Script (`data-uses="gsap scroll-trigger"`): one `ScrollTrigger` with `scrub: true` whose `onUpdate` computes the target time, and **one seek at a time**: set `currentTime` only when the previous seek has fired `seeked`, keeping the latest target. Piling up seeks is what makes slow phones jerk. The example has the ten lines.
- **Do not name a callback parameter `self`** (`onUpdate: (self) => …`, as in GSAP's own docs): `self` is a window alias and fails `script-forbidden`. Call it `st`.
- In the editor, thumbnails and for reduced motion GSAP is off, so the video stays on its poster: the poster must be a good picture on its own.
- Test on an iPhone before you promise it: iOS Safari may not load a muted video's frames until it has played once.

### Depth parallax

- From Blender: render the colour image, then the **Mist** or **Z** pass as a grayscale image (white = near, black = far) at the same resolution and camera. Normalise it so the subject is light and the background dark.
- Markup: the colour render as the poster `<img data-gl-poster crossorigin="anonymous" data-edit-image="images.0.url">`; the depth map, only when there is one, as a second `<img data-gl-depth crossorigin="anonymous" data-edit-image="images.1.url" class="hidden">`. Document `images` so the owner knows `[1]` is the depth map.
- Shader: `uv + (pointer + drift) * (depth - 0.35) * 0.045`, with `object-cover` UVs (`uCover`). Keep the shift small (≤ 0.05): more tears the edges. Add a slow `uTime` drift so phones, which have no pointer, still see it move.

## Lint codes

| code | when |
|---|---|
| `ogl-undeclared` | `OGL` named without `data-uses="ogl"` |
| `ogl-no-fallback` | `OGL` used but never tested for `null` |
| `script-forbidden` | `window.OGL` / any `.OGL`, `new Image()`, `.src =`, `.top`, `.prototype`… (`wvf.md` §4) |
| `uses-unknown` | a `data-uses` value other than `gsap`, `scroll-trigger`, `ogl` |
| `attr` | `crossorigin` other than `"anonymous"`, or on a tag other than `<img>`/`<video>` |

A WebGL variant has a script, so it goes through the automatic security check like any other. OGL is released under the Unlicense (public domain).
