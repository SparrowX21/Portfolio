/* ============================================================
   armaangugnani.com — motion system
   ------------------------------------------------------------
   Metaphor      : a signal propagating. A trajectory from BLR
                   through DXB to DFW, converging on AI research.
   Tempo         : 280–650ms. Sharp power4/expo curves.
   Motif         : the aperture. The sealed trajectory plate
                   erodes under the cursor to reveal the live map;
                   venture cards and footer wordmark repeat it.
   Guarantee     : if a CDN fails or a library throws, the page
                   still renders fully. No section is hidden by
                   anything only JS can bring back.
   ============================================================ */

(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COARSE  = matchMedia('(pointer: coarse)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasST   = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasSplit = typeof window.SplitType !== 'undefined';
  var hasAperture = typeof window.ApertureReveal !== 'undefined';

  if (hasST) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  // Shared scroll velocity — rail glow, canvas boost, lean skew, and the
  // trajectory pulse all read this.
  var vel = 0;
  var lenis = null;

  // Tempo dial: every duration/stagger/scrub multiplies through d().
  var TEMPO = 1.3;
  function d(s) { return s * TEMPO; }

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[site] ' + name + ' failed:', e); }
  }

  /* ---------- smooth scroll ---------- */
  safe('lenis', function () {
    if (REDUCED || typeof window.Lenis === 'undefined' || !hasGSAP) return;
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, syncTouch: false, touchInertiaMultiplier: 12 });
    lenis.on('scroll', function (e) {
      if (hasST) ScrollTrigger.update();
      vel = e.velocity || 0;
    });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  });

  if (!lenis) {
    var lastY = window.scrollY;
    addEventListener('scroll', function () {
      vel = (window.scrollY - lastY) * 0.35;
      lastY = window.scrollY;
    }, { passive: true });
  }

  /* in-page links: smooth scroll, then hand focus to the target so the next
     Tab (and the screen-reader cursor) continues from there, not the nav */
  safe('anchors', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (history.pushState) history.pushState(null, '', id);
        function land() {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
        if (lenis) lenis.scrollTo(target, { offset: -70, onComplete: land });
        else { target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); land(); }
      });
    });
  });

  /* ---------- helpers ---------- */

  // SplitType wraps every word/char in its own element, which some screen
  // readers announce letter by letter. Keep one readable copy for assistive
  // tech and split an aria-hidden visual copy instead.
  function accessibleSplit(el, types) {
    if (!hasSplit) return null;
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = el.textContent.replace(/\s+/g, ' ').trim();
    var vis = document.createElement('span');
    vis.className = 'split-vis';
    vis.setAttribute('aria-hidden', 'true');
    while (el.firstChild) vis.appendChild(el.firstChild);
    el.appendChild(sr);
    el.appendChild(vis);
    return new SplitType(vis, { types: types, tagName: 'span' });
  }

  // No line wrappers: SplitType freezes line breaks at the width it measured,
  // so a resize or rotation left headings broken mid-phrase. Each word is its
  // own clipping box instead; chars still rise from behind a mask, and words
  // re-flow freely at any width.
  function splitChars(el) {
    var s = accessibleSplit(el, 'words,chars');
    if (!s) return null;
    // Transformed chars are painted outside the parent's background-clip:text,
    // so a gradient heading goes blank once split. .is-split swaps to a solid fill.
    el.classList.add('is-split');
    s.words.forEach(function (w) {
      w.style.overflow = 'hidden';
      w.style.overflow = 'clip';          // ignored where unsupported
      w.style.verticalAlign = 'top';      // clipped inline-blocks lose their text baseline
      w.style.paddingBottom = '0.06em';
    });
    return s;
  }

  /* ---------- motion control ----------
     Endless loops (marquee, breathing plate, pulses, particle field) can be
     paused from the nav. Scroll-driven animation is left alone: it only moves
     when the visitor scrolls, and pausing it would strand pinned sections. */
  var motionPaused = false;
  var loops = [];
  var onMotionChange = [];
  // Each loop also pauses while its host section is off-screen.
  var io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.__inView = e.isIntersecting; });
        syncLoops();
      })
    : null;
  function inView(host) { return !host || host.__inView !== false; }
  function syncLoops() {
    loops.forEach(function (l) {
      if (!motionPaused && inView(l.host)) l.tween.resume(); else l.tween.pause();
    });
  }
  function loop(tween, host) {
    if (host && io && !host.__watched) { host.__watched = true; io.observe(host); }
    loops.push({ tween: tween, host: host || null });
    syncLoops();
    return tween;
  }

  /* ---------- cold boot ---------- */
  var BOOT_LINES = [
    '> mounting trajectory.pkg',
    '> linking archive [11 awards]',
    '> loading research manifest',
    '> handshake ok'
  ];

  // done() runs as the iris starts to open, after the webfonts land, so the
  // hero's entrance states are set while the boot screen still covers them.
  function coldBoot(done) {
    var boot = document.getElementById('boot');
    if (!boot || REDUCED || !hasGSAP) {
      if (boot) boot.remove();
      whenFontsReady(done);
      return;
    }

    var log = document.getElementById('bootLog');
    var count = document.getElementById('bootCount');
    var bar = document.getElementById('bootBar');
    var n = { v: 0 };

    // The self-test plays once per browser session. Reloads, back-navigation
    // and returns from lite.html go straight to the iris.
    var seen = false;
    try { seen = sessionStorage.getItem('ag-booted') === '1'; sessionStorage.setItem('ag-booted', '1'); } catch (e) {}

    var tl = gsap.timeline({ onComplete: function () { boot.remove(); } });

    if (!seen) {
      BOOT_LINES.forEach(function (line, i) {
        tl.call(function () {
          log.innerHTML += (i ? '<br>' : '') + line.replace(/\[(.+?)\]/, '<b>[$1]</b>');
        }, null, i * 0.2);
      });
      tl.to(n, {
        v: 100, duration: 0.95, ease: 'power2.inOut',
        onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(3, '0'); }
      }, 0)
        .to(bar, { scaleX: 1, duration: 0.95, ease: 'power2.inOut' }, 0);
    } else {
      gsap.set(boot.querySelector('.boot__inner'), { opacity: 0 });
    }

    tl.addPause(seen ? 0.01 : '+=0.1', function () {
        whenFontsReady(function () {
          try { done(); } finally { tl.resume(); }
        });
      })
      .to(boot, { clipPath: 'circle(0% at 50% 50%)', duration: 0.85, ease: 'power4.inOut' })
      .to(boot, { opacity: 0, duration: 0.2 }, '-=0.2');
  }

  /* ---------- flow layer (rail + lean) ---------- */
  function flowLayer() {
    if (!hasGSAP) return;
    var fill = document.getElementById('railFill');
    gsap.ticker.add(function () {
      if (fill) {
        var max = document.documentElement.scrollHeight - innerHeight;
        var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        fill.style.height = (p * 100) + 'vh';
        fill.style.setProperty('--glow', (8 + Math.min(Math.abs(vel) * 1.4, 22)) + 'px');
      }
      vel *= 0.92;
    });
  }

  /* ---------- spark field ---------- */
  function sparkField() {
    var cv = document.getElementById('field');
    if (!cv || REDUCED) { if (cv) cv.remove(); return; }
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    // A 1x backing store: hairline dots and links look the same as at 2x, with
    // a quarter of the pixels to clear and composite on every frame.
    var nodes = [];
    var W = 0, H = 0;
    var COUNT = document.documentElement.clientWidth < 760 ? 24 : 48;
    var LINK  = document.documentElement.clientWidth < 760 ? 130 : 170;
    var raf = null, last = 0;

    function size() {
      // clientWidth, not innerWidth: on phones innerWidth can exceed the layout
      // width, and a canvas sized to it widens the page into sideways scroll.
      W = document.documentElement.clientWidth;
      H = innerHeight;
      cv.width = W;
      cv.height = H;
      cv.style.width = '100%';
      cv.style.height = '100%';
    }

    function seed() {
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        var roll = Math.random();
        var hot = roll < 0.18;
        var cold = !hot && roll < 0.3;
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.13,
          vy: (Math.random() - 0.5) * 0.13,
          r: hot || cold ? 1.6 : 1,
          c: hot  ? 'rgba(224,74,44,0.75)'
            : cold ? 'rgba(127,233,255,0.55)'
            :        'rgba(155,161,169,0.4)'
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var boost = motionPaused ? 0 : 1 + Math.min(Math.abs(vel) * 0.11, 5);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx * boost; n.y += n.vy * boost;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, 6.2832);
        ctx.fillStyle = n.c;
        ctx.fill();
      }
      ctx.lineWidth = 1;
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          var o = (1 - Math.sqrt(d2) / LINK) * 0.14;
          ctx.strokeStyle = 'rgba(155,161,169,' + o.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }
    }

    // A slow drift needs ~30fps; scrolling gets every frame so the field can
    // stretch with the shared velocity. Paused or hidden: the loop parks.
    function frame(now) {
      raf = null;
      if (motionPaused || document.hidden) return;
      if (Math.abs(vel) < 0.05 && now - last < 32) { raf = requestAnimationFrame(frame); return; }
      last = now;
      draw();
      raf = requestAnimationFrame(frame);
    }
    function wake() {
      if (!raf && !motionPaused && !document.hidden) raf = requestAnimationFrame(frame);
    }

    size(); seed(); draw(); wake();

    // Mobile toolbars fire resize as they slide in and out. Debounce, and rescale
    // the existing nodes instead of re-rolling them, so the field never jumps.
    var rt = null;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var oldW = W || 1, oldH = H || 1;
        size();
        nodes.forEach(function (n) { n.x *= W / oldW; n.y *= H / oldH; });
        draw();
      }, 150);
    }, { passive: true });
    document.addEventListener('visibilitychange', wake);
    // Pausing draws one still frame (boost is 0) so the field doesn't vanish.
    onMotionChange.push(function () { draw(); wake(); });
  }

  /* ---------- aperture cursor ---------- */
  function apertureCursor() {
    var dot = document.getElementById('cursor');
    if (!dot) return;
    if (REDUCED || COARSE || !hasGSAP) { dot.remove(); return; }

    // Shown only once a mouse is actually in use, so keyboard-only visitors
    // never get a ring parked over the middle of the page.
    var t = { x: innerWidth / 2, y: innerHeight / 2 };
    var p = { x: t.x, y: t.y };
    var seen = false;

    addEventListener('mousemove', function (e) {
      t.x = e.clientX; t.y = e.clientY;
      if (!seen) { seen = true; p.x = t.x; p.y = t.y; }
      dot.classList.add('is-live');
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { dot.classList.remove('is-live'); });
    gsap.set(dot, { xPercent: -50, yPercent: -50 });
    var setX = gsap.quickSetter(dot, 'x', 'px');
    var setY = gsap.quickSetter(dot, 'y', 'px');
    gsap.ticker.add(function () {
      var dx = t.x - p.x, dy = t.y - p.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
      p.x += dx * 0.13;
      p.y += dy * 0.13;
      setX(p.x); setY(p.y);
    });

    document.querySelectorAll('a, button, input, select, textarea').forEach(function (el) {
      el.addEventListener('mouseenter', function () { dot.classList.add('is-link'); });
      el.addEventListener('mouseleave', function () { dot.classList.remove('is-link'); });
    });
    document.querySelectorAll('[data-aperture-reveal]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { dot.classList.add('is-aperture'); });
      el.addEventListener('mouseleave', function () { dot.classList.remove('is-aperture'); });
    });
  }

  /* ---------- magnetic CTAs ---------- */
  function magnetics() {
    if (REDUCED || COARSE || !hasGSAP) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var qx = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
      var qy = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.28);
        qy((e.clientY - r.top - r.height / 2) * 0.4);
      });
      // precise return, no bounce
      el.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });
  }

  /* ---------- entrances & split chars ---------- */
  function entrances() {
    if (!hasGSAP || REDUCED) return;

    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      gsap.fromTo(el,
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: d(0.75), ease: 'power4.out',
          scrollTrigger: hasST ? { trigger: el, start: 'top 88%' } : undefined });
    });

    gsap.utils.toArray('[data-split-chars]').forEach(function (el) {
      var s = splitChars(el);
      if (!s || !s.chars.length) return;
      gsap.from(s.chars, {
        yPercent: 118, skewX: -7,
        duration: d(0.82), ease: 'power4.out',
        stagger: { each: d(0.014) },
        scrollTrigger: hasST ? { trigger: el, start: 'top 86%' } : undefined
      });
    });
  }

  /* ---------- word ignite ---------- */
  function wordIgnite() {
    var el = document.getElementById('manifesto');
    if (!el || !hasSplit || !hasST || REDUCED) return;
    var s = accessibleSplit(el, 'words');
    if (!s) return;
    s.words.forEach(function (w) { w.classList.add('w'); });
    gsap.to(s.words, {
      color: '#eef0f3', ease: 'none', stagger: d(0.4),
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 55%', scrub: d(0.6) }
    });
  }

  /* ---------- counters ---------- */
  function counters() {
    if (!hasGSAP) return;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var group = el.hasAttribute('data-group');
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var plus = el.hasAttribute('data-plus');
      var stat = el.closest('.stat');
      var line = stat && stat.querySelector('.stat__line');

      // The element animated here is aria-hidden; a sibling .sr-only span
      // always holds the real number, and the HTML ships with it too.
      function write(v) {
        var n = decimals ? Number(v.toFixed(decimals)) : Math.round(v);
        var body = decimals ? n.toFixed(decimals) : group ? n.toLocaleString('en-US') : String(n);
        el.innerHTML = body + (plus ? '<b class="stat__plus">+</b>' : '');
      }

      if (REDUCED || !hasST) {
        write(end); if (line) gsap.set(line, { scaleX: 1 }); return;
      }

      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
          write(0);
          gsap.to(o, { v: end, duration: d(1.5), ease: 'power2.out',
            onUpdate: function () { write(o.v); } });
          if (line) gsap.to(line, { scaleX: 1, duration: d(1.1), ease: 'power3.inOut' });
        }
      });
    });
  }

  /* ---------- marquee ---------- */
  function marquee() {
    var track = document.getElementById('marquee');
    if (!track || !hasGSAP || REDUCED) return;
    track.innerHTML += track.innerHTML;
    loop(gsap.to(track, { xPercent: -50, duration: d(26), ease: 'none', repeat: -1 }), track.closest('.marquee'));
  }

  /* ---------- hero aperture (scroll pins + cursor steers) ---------- */
  function heroAperture() {
    var heroEl = document.getElementById('heroReveal');
    if (!heroEl) return;

    var tag = document.getElementById('heroHint');
    function hint(text) { if (tag) tag.innerHTML = '<b>▸</b> ' + text; }

    // Seal the plate only where something can open it. Touch: dragging scrolls
    // the page. Reduced motion or no ScrollTrigger: there is no scroll pin.
    // In those cases the map is simply left open.
    if (!hasAperture || COARSE || REDUCED || !hasST) {
      hint('Bangalore → Dubai → Frisco');
      return;
    }

    var hero = new ApertureReveal(heroEl, {
      mode: 'erode', sealed: true,
      radiusRatio: 0.36, maxRadius: 320, ease: 0.1, core: 0.56
    });
    if (!hero.hoverLayer) return;
    // Below 901px there is no pin, so only the cursor opens the plate.
    gsap.matchMedia().add('(max-width: 900px), (max-height: 599px)', function () { hint('Move over the plate to open it'); });

    // Scroll controls how far the plate opens; the cursor controls where.
    var hovering = false;
    var scrollR = 0;
    function settleToScroll() {
      hero.target.x = heroEl.offsetWidth * 0.68;
      hero.target.y = heroEl.offsetHeight * 0.5;
      hero.target.r = scrollR;
      hero.start();
    }
    heroEl.addEventListener('pointerenter', function () { hovering = true; });
    // Registered after ApertureReveal's own leave handler, so this wins.
    heroEl.addEventListener('pointerleave', function () {
      hovering = false;
      if (scrollR > 0) settleToScroll();
    });

    gsap.matchMedia().add('(min-width: 901px) and (min-height: 600px)', function () {
      hint('Scroll to open · move to look');
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.hero', start: 'top top', end: '+=170%',
          pin: true, scrub: d(1), anticipatePin: 1,
          onUpdate: function (self) {
            scrollR = self.progress * Math.min(heroEl.offsetWidth * 0.75, 460);
            if (!hovering) settleToScroll();
          }
        }
      });

      // The entrance owns the words' opacity/scale and the plate's y; scroll
      // writes xPercent, yPercent, the <h1>'s opacity and filter on the small
      // blocks, so the two never write the same property.
      tl.fromTo('.hero__figure', { scale: 1, yPercent: 0 }, { scale: 1.08, yPercent: -3, ease: 'none' }, 0)
        .fromTo('.hero__word--back', { xPercent: 0 }, { xPercent: -8, ease: 'none' }, 0)
        .fromTo('.hero__word--front', { xPercent: 0 }, { xPercent: 8, ease: 'none' }, 0)
        .fromTo('.hero__wordmark', { opacity: 1 }, { opacity: 0.55, ease: 'none' }, 0)
        .fromTo('.hero__foot, .hero__eyebrow', { y: 0, filter: 'opacity(1)' }, { y: 16, filter: 'opacity(0.15)', ease: 'none' }, 0)
        .fromTo('.hero__hint', { filter: 'opacity(1)' }, { filter: 'opacity(0)', ease: 'none' }, 0);

      return function () {
        scrollR = 0;
        tl.scrollTrigger && tl.scrollTrigger.kill();
        tl.kill();
      };
    });
  }

  /* ---------- venture cards: a spotlight that follows the cursor ---------- */
  function moduleApertures() {
    if (!hasAperture || COARSE) return;
    document.querySelectorAll('.module[data-aperture-reveal]').forEach(function (el) {
      new ApertureReveal(el, { mode: 'reveal', radiusRatio: 0.5, maxRadius: 220, ease: 0.11, core: 0.3 });
    });
  }

  /* ---------- trajectory pulse ---------- */
  function trajectoryPulse() {
    var path = document.getElementById('pulsePath');
    if (!path || REDUCED) { if (path) path.style.opacity = 0; return; }
    var len = path.getTotalLength();
    path.style.strokeDasharray = (len * 0.08) + ' ' + len;
    path.style.opacity = 0.9;

    var off = 0;
    var hero = document.getElementById('hero');
    if (hero && io && !hero.__watched) { hero.__watched = true; io.observe(hero); }
    gsap.ticker.add(function () {
      if (motionPaused || !inView(hero)) return;
      off += 2 + Math.abs(vel) * 0.6;
      if (off > len) off -= len;
      path.style.strokeDashoffset = (len - off).toFixed(1);
    });
  }

  /* ---------- rolodex (3 chapters, horizontal pin) ---------- */
  function rolodex() {
    var wrap = document.getElementById('roloWrap');
    var track = document.getElementById('roloTrack');
    if (!wrap || !track) return;

    var chapters = track.querySelectorAll('.chapter');
    var pathfinderItems = document.querySelectorAll('.pathfinder li');
    var LAST = chapters.length - 1;

    function lightChapter(idx) {
      chapters.forEach(function (c, i) { c.classList.toggle('is-live', i === idx); });
    }
    // Outside the rolodex the pathfinder reads "you are here": Frisco.
    function lightPath(idx) {
      pathfinderItems.forEach(function (p, i) { p.classList.toggle('is-live', i === idx); });
    }
    function indexFor(p) { return Math.min(LAST, Math.floor(p * chapters.length)); }

    if (REDUCED || !hasST) {
      wrap.classList.add('is-stacked');
      track.style.flexWrap = 'wrap';
      track.style.height = 'auto';
      chapters.forEach(function (c) { c.classList.add('is-live'); });
      return;
    }

    // The three cards are 1936px wide at most. Past ~1735px there is too
    // little horizontal travel to be worth a pin, so the row just sits still.
    var mm = gsap.matchMedia();
    mm.add('(min-width: 801px) and (max-width: 1735px) and (min-height: 600px)', function () {
      function travel() { return Math.max(0, track.scrollWidth - document.documentElement.clientWidth); }
      var st = null;
      var tween = gsap.to(track, {
        x: function () { return -travel(); },
        ease: 'none',
        // Read off the rendered x, not the trigger: with scrub the track is
        // still gliding after the last scroll event.
        onUpdate: function () {
          var t = travel();
          var x = gsap.getProperty(track, 'x') || 0;
          var idx = indexFor(t > 0 ? Math.min(Math.max(-x / t, 0), 1) : 0);
          lightChapter(idx);
          lightPath(st && st.isActive ? idx : LAST);
        },
        scrollTrigger: {
          trigger: wrap, start: 'top top',
          end: function () { return '+=' + (travel() * 1.4 + innerHeight * 0.1); },
          pin: true, scrub: d(1), anticipatePin: 1, invalidateOnRefresh: true,
          onToggle: function (self) { if (!self.isActive) lightPath(LAST); },
          onRefresh: function (self) { lightChapter(indexFor(self.progress)); }
        }
      });
      st = tween.scrollTrigger;
      lightChapter(0);
      return function () {
        chapters.forEach(function (c) { c.classList.remove('is-live'); });
        lightPath(LAST);
        tween.scrollTrigger && tween.scrollTrigger.kill();
        tween.kill();
      };
    });

    mm.add('(min-width: 1736px)', function () {
      wrap.classList.add('is-static');
      lightChapter(LAST);
      return function () { wrap.classList.remove('is-static'); };
    });

    mm.add('(max-width: 800px), (max-width: 1735px) and (max-height: 599px)', function () {
      wrap.classList.add('is-stacked');
      track.style.flexDirection = 'column';
      track.style.height = 'auto';
      chapters.forEach(function (c) { c.classList.add('is-live'); });
      return function () {
        wrap.classList.remove('is-stacked');
        track.style.flexDirection = '';
        track.style.height = '';
      };
    });
  }

  /* ---------- section transitions + seams ---------- */
  function sectionTransitions() {
    if (!hasGSAP || !hasST || REDUCED) return;

    function q(sel) { return document.querySelector(sel); }
    function make(tag, cls, parent) { var el = document.createElement(tag); el.className = cls; parent.appendChild(el); return el; }

    ['.marquee', '.manifesto', '.stats', '.trajectory', '.research', '.systems',
     '.experience', '.honors', '.ventures', '.service', '.certs', '.contact', '.footer']
      .forEach(function (sel, i) {
        var host = q(sel); if (!host) return;
        var seam = make('i', 'seam', host);
        gsap.set(seam, { transformOrigin: i % 2 ? 'right center' : 'left center' });
        gsap.to(seam, {
          scaleX: 1, ease: 'power2.inOut',
          scrollTrigger: { trigger: host, start: 'top 100%', end: 'top 45%', scrub: d(0.5) }
        });
      });

    // Shutter: hero -> marquee
    var band = q('.marquee');
    if (band) {
      gsap.fromTo(band, { clipPath: 'inset(50% 0% 50% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.out',
          scrollTrigger: { trigger: band, start: 'top 100%', end: 'top 56%', scrub: d(0.6) } });
    }

    // Panel split for stats
    var statGrid = q('.stats__grid');
    if (statGrid) {
      gsap.fromTo(statGrid, { clipPath: 'inset(0% 50% 0% 50%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: d(1.1), ease: 'power4.inOut',
          scrollTrigger: { trigger: statGrid, start: 'top 86%' } });
      gsap.from('.stats .stat', {
        xPercent: function (i) { return i < 3 ? -16 : 16; },
        opacity: 0, duration: d(0.9), ease: 'power4.out',
        stagger: { each: d(0.06), from: 'center' },
        scrollTrigger: { trigger: statGrid, start: 'top 86%' }
      });
    }

    // Fan deck for honors
    if (q('.deck')) {
      gsap.from('.card', {
        yPercent: 16, scale: 0.94, opacity: 0,
        rotation: function (i) { return (i % 2 ? 3 : -3); },
        transformOrigin: '50% 100%',
        duration: d(1), ease: 'power4.out',
        stagger: { each: d(0.045) },
        scrollTrigger: { trigger: '.deck', start: 'top 84%' }
      });
    }

    // Circuit close: research -> systems. The pipeline lights stage by stage
    // as it scrolls through, the way a signal propagates along a wire.
    var pipe = q('.pipe');
    if (pipe) {
      var stages = gsap.utils.toArray('.pipe__step');
      var lightStages = function (p) {
        var lit = p > 0 ? Math.ceil(p * stages.length) : 0;
        stages.forEach(function (s, i) { s.classList.toggle('is-lit', i < lit); });
      };
      pipe.classList.add('pipe--armed');
      ScrollTrigger.create({
        trigger: pipe, start: 'top 82%', end: 'bottom 50%',
        onUpdate: function (self) { lightStages(self.progress); },
        onRefresh: function (self) { lightStages(self.progress); }
      });
    }

    // Rack slide for experience. Units must match on both ends of a clip-path
    // tween, or GSAP writes unitless values the browser rejects.
    var roles = gsap.utils.toArray('.role');
    if (roles.length) {
      roles.forEach(function (card, i) {
        var fromLeft = i % 2 === 0;
        gsap.fromTo(card,
          { xPercent: fromLeft ? -18 : 18, opacity: 0,
            clipPath: fromLeft ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' },
          { xPercent: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)',
            duration: d(1.1), ease: 'power3.out',
            delay: (i % 2) * d(0.08),
            scrollTrigger: { trigger: card, start: 'top 90%' } });
      });
    }

    // Modules: aperture cards appear with stagger
    gsap.from('.module', {
      scale: 0.92, opacity: 0, duration: d(0.95), ease: 'power3.out',
      stagger: d(0.08),
      scrollTrigger: { trigger: '.modules', start: 'top 85%' }
    });

    // Contact title column shear
    var cf = q('.contact__form');
    if (cf) {
      gsap.from(cf, {
        xPercent: 10, opacity: 0, duration: d(1), ease: 'power4.out',
        scrollTrigger: { trigger: '.contact', start: 'top 76%' }
      });
    }

    // Footer drawer
    var word = q('.footer__word');
    if (word && word.parentNode) {
      var drawer = document.createElement('div');
      drawer.className = 'drawer';
      word.parentNode.insertBefore(drawer, word);
      drawer.appendChild(word);
      gsap.fromTo(word, { yPercent: 105 },
        { yPercent: 0, ease: 'power3.out',
          scrollTrigger: { trigger: '.footer', start: 'top 100%', end: 'top 40%', scrub: d(0.7) } });
    }
  }

  /* ---------- ambient ---------- */
  function ambient() {
    if (!hasGSAP || REDUCED) return;

    // Idle respiration. It moves the plate's layers, not the plate, because
    // the entrance and the scroll pin both transform the plate itself.
    var hero = document.getElementById('hero');
    if (!COARSE) {
      loop(gsap.to('#heroReveal > .aperture__base, #heroReveal > .aperture__hover', {
        y: -7, duration: d(2.6), ease: 'sine.inOut', repeat: -1, yoyo: true
      }), hero);
    }
    // halo pulse under the live node
    loop(gsap.to('.trajectory__halo', { opacity: 0.5, duration: d(2.2), ease: 'sine.inOut', repeat: -1, yoyo: true }), hero);
    // node pulsing on the live DFW node
    loop(gsap.to('.trajectory__node--live circle:nth-child(2)', {
      r: 28, opacity: 0.3, duration: d(1.6), ease: 'sine.inOut', repeat: -1, yoyo: true
    }), hero);
  }

  /* ---------- pause-motion toggle (WCAG 2.2.2) ---------- */
  function motionToggle() {
    var btn = document.getElementById('motionToggle');
    if (!btn) return;
    if (REDUCED || !hasGSAP) return;          // nothing loops in these modes
    var label = btn.querySelector('span');

    function apply(paused, save) {
      motionPaused = paused;
      syncLoops();
      onMotionChange.forEach(function (fn) { fn(); });
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      if (label) label.textContent = paused ? 'Play motion' : 'Pause motion';
      if (save) { try { localStorage.setItem('ag-motion', paused ? 'paused' : 'on'); } catch (e) {} }
    }

    var saved = null;
    try { saved = localStorage.getItem('ag-motion'); } catch (e) {}
    btn.hidden = false;
    apply(saved === 'paused', false);
    btn.addEventListener('click', function () { apply(!motionPaused, true); });
  }

  /* ---------- nav + form ---------- */
  function chrome() {
    var nav = document.getElementById('nav');
    if (nav) {
      addEventListener('scroll', function () {
        nav.classList.toggle('is-stuck', window.scrollY > 40);
      }, { passive: true });
    }

    var menu = document.getElementById('menuToggle');
    var links = document.getElementById('navLinks');
    if (nav && menu && links) {
      var setOpen = function (open) {
        nav.classList.toggle('is-open', open);
        menu.setAttribute('aria-expanded', open ? 'true' : 'false');
        var label = menu.querySelector('span');
        if (label) label.textContent = open ? 'Close' : 'Menu';
      };
      menu.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
      links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); menu.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false);
      });
      matchMedia('(min-width: 1001px)').addEventListener('change', function (m) { if (m.matches) setOpen(false); });
    }

    var form = document.getElementById('requestForm');
    var status = document.getElementById('formStatus');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var body = [
        'Name: ' + (f.get('name') || ''),
        'Email: ' + (f.get('email') || ''),
        'Topic: ' + (f.get('topic') || ''),
        '',
        (f.get('notes') || '')
      ].join('\n');

      // A mailto: link can't report whether a mail app actually opened, so
      // the status gives the direct address instead of claiming success.
      if (status) status.textContent = 'Opening your mail app… If nothing opens, email armaan.gugnani.work@gmail.com.';
      window.location.href = 'mailto:armaan.gugnani.work@gmail.com' +
        '?subject=' + encodeURIComponent('[armaangugnani.com] ' + (f.get('topic') || 'Note')) +
        '&body=' + encodeURIComponent(body);
    });
  }

  /* ---------- lite escape hatch ---------- */
  function stored() { try { return localStorage.getItem('ag-view'); } catch (e) { return 'unknown'; } }
  function remember(v) { try { localStorage.setItem('ag-view', v); } catch (e) {} }

  // One offer bar per session at most. Only a click is remembered: a slow
  // moment is never turned into a permanent redirect behind the visitor's back.
  var offered = false;
  function offerLite(message) {
    if (offered || stored()) return;
    try {
      if (sessionStorage.getItem('ag-lite-offered')) return;
      sessionStorage.setItem('ag-lite-offered', '1');
    } catch (e) {}
    offered = true;

    var bar = document.createElement('div');
    bar.className = 'lite-offer';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span>' + message + '</span>' +
      '<a class="lite-offer__go" href="lite.html">Use light version</a>' +
      '<button class="lite-offer__no" type="button">No thanks</button>';
    document.body.insertBefore(bar, document.body.firstChild);

    function close(v) { remember(v); bar.remove(); }
    bar.querySelector('.lite-offer__go').addEventListener('click', function () { close('lite'); });
    bar.querySelector('.lite-offer__no').addEventListener('click', function () { close('full'); });
  }

  // Hardware hints are only a proxy, so they earn an offer, never a decision.
  // WebKit reports hardwareConcurrency as 4 on every iPhone, so core count is
  // left out; measured frame rate (autoLite) covers genuinely slow devices.
  function liteOffer() {
    if (REDUCED) return;
    var mem = navigator.deviceMemory;
    var save = navigator.connection && navigator.connection.saveData;
    var weak = (typeof mem === 'number' && mem <= 2) || save === true;
    if (weak) offerLite('Lots of animation on this page. There is a lighter version.');
  }

  // Measured frame rate. Frames during a scroll are skipped: the hero pin is
  // the heaviest moment by design, and power-saving modes cap rAF at 30fps.
  // ?full=1 and a saved choice are handled by the inline head script.
  function autoLite() {
    if (REDUCED || stored()) return;
    if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|pagespeed/i.test(navigator.userAgent)) return;
    var SETTLE = 2200, WINDOW = 4000, BAD_MS = 40, MIN = 20;

    setTimeout(function () {
      if (document.visibilityState !== 'visible') return;
      var samples = [], last = performance.now(), until = last + WINDOW, abort = false;
      function hide() { if (document.visibilityState !== 'visible') abort = true; }
      document.addEventListener('visibilitychange', hide);

      function tick(now) {
        if (abort) { document.removeEventListener('visibilitychange', hide); return; }
        if (Math.abs(vel) < 0.5) samples.push(now - last);
        last = now;
        if (now < until) { requestAnimationFrame(tick); return; }
        document.removeEventListener('visibilitychange', hide);
        if (samples.length < MIN) return;      // mostly scrolling: no verdict
        samples.sort(function (a, b) { return a - b; });
        var med = samples[Math.floor(samples.length / 2)];
        if (med > BAD_MS) offerLite('Animations look slow on this device. The light version has the same content.');
      }
      requestAnimationFrame(tick);
    }, SETTLE);
  }

  /* ---------- boot ---------- */
  function start() {
    // Pins first. ScrollTrigger refreshes triggers in creation order, so any
    // trigger created before a pin ignores that pin's spacer and fires early.
    safe('heroAperture', heroAperture);
    safe('rolodex', rolodex);
    safe('entrances', entrances);
    safe('wordIgnite', wordIgnite);
    safe('counters', counters);
    safe('marquee', marquee);
    safe('moduleApertures', moduleApertures);
    safe('trajectoryPulse', trajectoryPulse);
    safe('sectionTransitions', sectionTransitions);
    safe('sparkField', sparkField);
    safe('cursor', apertureCursor);
    safe('magnetics', magnetics);
    safe('flowLayer', flowLayer);
    safe('ambient', ambient);
    safe('motionToggle', motionToggle);
    safe('chrome', chrome);
    safe('liteOffer', liteOffer);
    safe('autoLite', autoLite);

    // Hero entrance. Owns the words' opacity and scale, y on the plate, and
    // yPercent on the eyebrow/foot; the scroll pin uses different properties.
    if (hasGSAP && !REDUCED) {
      var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo('.hero__figure',
          { clipPath: 'inset(0% 0% 100% 0%)', y: 30 },
          { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: d(1.15), ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
        .from('.hero__word', { scale: 1.12, opacity: 0,
            duration: d(1.1), stagger: d(0.06) }, 0.18)
        .from('.hero__eyebrow', { opacity: 0, yPercent: 60, duration: d(0.6) }, 0.3)
        .from('.hero__foot',    { opacity: 0, yPercent: 6, duration: d(0.8) }, 0.42)
        .from('.hero__hint',    { opacity: 0, duration: d(0.5) }, 0.95);
    }

    if (hasST) {
      if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  function whenFontsReady(fn) {
    var fired = false;
    function go() { if (!fired) { fired = true; fn(); } }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(go, go); setTimeout(go, 2500);
    } else { go(); }
  }

  function boot() { coldBoot(start); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
