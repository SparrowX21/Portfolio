# armaangugnani.com

Personal site for Armaan Gugnani — AI research, systems, and a trajectory across three countries.

## Stack

- Hand-written static HTML + CSS + vanilla JS.
- GSAP 3.12.5 + ScrollTrigger · Lenis 1.1.13 · SplitType 0.3.4, self-hosted in `assets/vendor/`.
- Fonts (Big Shoulders Display, Instrument Sans, JetBrains Mono) self-hosted in `assets/fonts/` via `assets/css/fonts.css`. No third-party requests at runtime.
- One custom library: `assets/js/aperture-reveal.js` — cursor-driven mask that erodes a sealed cover layer to expose the live layer underneath.
- No frameworks, no bundler, no build step. Open `index.html` directly.
- `lite.html` is a fallback with no JS. Slow devices are *offered* it (hardware hints or measured frame rate, see `autoLite` in `assets/js/site.js`); only an explicit click is remembered.

## Deploying changes

GitHub Pages caches files for 10 minutes and ignores query strings, so first-party CSS/JS are referenced as `?v=N` in `index.html`. **Bump that number whenever `site.css`, `fonts.css`, `site.js` or `aperture-reveal.js` changes**, otherwise returning visitors can get new HTML with old JS.

## Layout

```
index.html              hero + 11 sections + footer
lite.html               accessible fallback (no animations)
assets/
  css/site.css          palette, typography, every component
  js/site.js            motion system (27 named mechanics)
  js/aperture-reveal.js UMD aperture library
```

## Hosting

GitHub Pages serves `main` at https://armaangugnani.com (custom domain via `CNAME`; DNS at Hostinger points the apex ALIAS and `www` CNAME to `sparrowx21.github.io`). Every push to `main` deploys in about a minute.

## Local dev

Open `index.html` in a browser. That's it. For the smooth-scroll library and font Fetch, serve over `http://` not `file://`:

```bash
python -m http.server 8000
```

## Customising

- Palette lives in `:root` at the top of `assets/css/site.css`.
- Tempo lives in `TEMPO` at the top of `assets/js/site.js`. One number dials the pace of every animation.
- Boot lines, counter targets, and marquee items are inline in their respective files.
