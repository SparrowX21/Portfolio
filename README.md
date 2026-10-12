# armaangugnani.com

Personal site for Armaan Gugnani — AI research, systems, and a trajectory across three countries.

## Stack

- Hand-written static HTML + CSS + vanilla JS.
- GSAP + ScrollTrigger · Lenis smooth scroll · SplitType for text splitting.
- One custom library: `assets/js/aperture-reveal.js` — cursor-driven mask that erodes a sealed cover layer to expose the live layer underneath.
- No frameworks, no bundler, no build step. Open `index.html` directly.
- `lite.html` is a fallback with no JS, auto-switched to on measured low frame rate (see `autoLite` in `assets/js/site.js`).

## Layout

```
index.html              hero + 10 sections + footer
lite.html               accessible fallback (no animations)
assets/
  css/site.css          palette, typography, every component
  js/site.js            motion system (27 named mechanics)
  js/aperture-reveal.js UMD aperture library
```

## Hostinger deploy (one-time setup)

Hostinger pulls from this GitHub repo on every push.

1. Hostinger → **hPanel** → **Websites** → `armaangugnani.com` → **Advanced** → **Git**.
2. Repository URL: `https://github.com/SparrowX21/Portfolio.git`
3. Branch: `main`
4. Install path: `public_html`
5. **Create**.
6. Copy the **webhook URL** Hostinger gives you.
7. GitHub → **this repo** → **Settings** → **Webhooks** → **Add webhook** → paste the URL → Content-type `application/json` → events: *Just the push event* → Save.

Every push to `main` now auto-deploys.

For the very first deploy without a webhook, click **Deploy** inside the Hostinger Git panel.

## Local dev

Open `index.html` in a browser. That's it. For the smooth-scroll library and font Fetch, serve over `http://` not `file://`:

```bash
python -m http.server 8000
```

## Customising

- Palette lives in `:root` at the top of `assets/css/site.css`.
- Tempo lives in `TEMPO` at the top of `assets/js/site.js`. One number dials the pace of every animation.
- Boot lines, counter targets, and marquee items are inline in their respective files.
