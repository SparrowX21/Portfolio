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

  /* anchor links routed through lenis */
  safe('anchors', function () {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -70 });
        else target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
      });
    });
  });

  /* ---------- helpers ---------- */
  function splitChars(el) {
    if (!hasSplit) return null;
    var s = new SplitType(el, { types: 'lines,words,chars' });
    // Transformed chars are painted outside the parent's background-clip:text,
    // so a gradient heading goes blank once split. .is-split swaps to a solid fill.
    el.classList.add('is-split');
    s.lines.forEach(function (line) {
      line.style.overflow = 'hidden';
      line.style.display = 'block';
      line.style.paddingBottom = '0.06em';
      line.classList.add('split-line');
    });
    return s;
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

    var tl = gsap.timeline({ onComplete: function () { boot.remove(); } });

    BOOT_LINES.forEach(function (line, i) {
      tl.call(function () {
        log.innerHTML += (i ? '<br>' : '') + line.replace(/\[(.+?)\]/, '<b>[$1]</b>');
      }, null, i * 0.26);
    });

    tl.to(n, {
      v: 100, duration: 1.3, ease: 'power2.inOut',
      onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(3, '0'); }
    }, 0)
      .to(bar, { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .addPause('+=0.1', function () {
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

    var dpr = Math.min(devicePixelRatio || 1, 2);
    var nodes = [];
    // clientWidth, not innerWidth: on phones innerWidth can exceed the layout
    // width, and a canvas sized to it widens the page into sideways scroll.
    var W = 0, H = 0;
    var COUNT = document.documentElement.clientWidth < 760 ? 24 : 48;
    var LINK  = document.documentElement.clientWidth < 760 ? 130 : 170;
    var raf = null;

    function size() {
      W = document.documentElement.clientWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = '100%';
      cv.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      var boost = 1 + Math.min(Math.abs(vel) * 0.11, 5);
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
      raf = requestAnimationFrame(draw);
    }

    size(); seed(); draw();
    addEventListener('resize', function () { size(); seed(); }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
      else if (!raf) draw();
    });
  }

  /* ---------- aperture cursor ---------- */
  function apertureCursor() {
    var dot = document.getElementById('cursor');
    if (!dot) return;
    if (REDUCED || COARSE || !hasGSAP) { dot.remove(); return; }

    dot.classList.add('is-live');
    var t = { x: innerWidth / 2, y: innerHeight / 2 };
    var p = { x: t.x, y: t.y };

    addEventListener('mousemove', function (e) { t.x = e.clientX; t.y = e.clientY; }, { passive: true });
    gsap.ticker.add(function () {
      p.x += (t.x - p.x) * 0.13;
      p.y += (t.y - p.y) * 0.13;
      gsap.set(dot, { x: p.x, y: p.y });
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
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.28,
          y: (e.clientY - r.top - r.height / 2) * 0.4,
          duration: 0.5, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'power4.out' });
      });
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
    var s = new SplitType(el, { types: 'words' });
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
      var plus = el.hasAttribute('data-plus');
      var line = el.parentNode.querySelector('.stat__line');

      function write(v) {
        var n = Math.round(v);
        var body = group ? n.toLocaleString('en-US') : String(n);
        el.innerHTML = body + (plus ? '<b class="stat__plus">+</b>' : '');
      }

      if (REDUCED || !hasST) {
        write(end); if (line) gsap.set(line, { scaleX: 1 }); return;
      }

      write(0);
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: function () {
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
    gsap.to(track, { xPercent: -50, duration: d(26), ease: 'none', repeat: -1 });
  }

  /* ---------- hero aperture (scroll pins + cursor steers) ---------- */
  function heroAperture() {
    var heroEl = document.getElementById('heroReveal');
    if (!heroEl) return;

    // Touch: dragging scrolls the page and the scroll pin is desktop-only, so
    // there is no gesture that could open a sealed plate. Leave the map open.
    if (!hasAperture || COARSE) {
      var tag = document.getElementById('heroHint');
      if (tag) tag.innerHTML = '<b>▸</b> Bangalore → Dubai → Frisco';
      return;
    }

    var hero = new ApertureReveal(heroEl, {
      mode: 'erode', sealed: true,
      radiusRatio: 0.36, maxRadius: 320, ease: 0.1, core: 0.56
    });
    if (!hero.hoverLayer || REDUCED || !hasST) return;

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

    gsap.matchMedia().add('(min-width: 901px)', function () {
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

      // The entrance owns opacity and y on these elements; scroll uses filter,
      // xPercent and yPercent so the two never write the same property.
      tl.fromTo('.hero__figure', { scale: 1, yPercent: 0 }, { scale: 1.08, yPercent: -3, ease: 'none' }, 0)
        .fromTo('.hero__word--back', { xPercent: 0, filter: 'brightness(1)' }, { xPercent: -8, filter: 'brightness(0.55)', ease: 'none' }, 0)
        .fromTo('.hero__word--front', { xPercent: 0, filter: 'brightness(1)' }, { xPercent: 8, filter: 'brightness(0.55)', ease: 'none' }, 0)
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
    gsap.ticker.add(function () {
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
    mm.add('(min-width: 801px) and (max-width: 1735px)', function () {
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

    mm.add('(max-width: 800px)', function () {
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
    if (!COARSE) {
      gsap.to('#heroReveal > .aperture__base, #heroReveal > .aperture__hover', {
        y: -7, duration: d(2.6), ease: 'sine.inOut', repeat: -1, yoyo: true
      });
    }
    // halo pulse under the live node
    gsap.to('.trajectory__halo', { opacity: 0.5, duration: d(2.2), ease: 'sine.inOut', repeat: -1, yoyo: true });
    // node pulsing on the live DFW node
    gsap.to('.trajectory__node--live circle:nth-child(2)', {
      r: 28, opacity: 0.3, duration: d(1.6), ease: 'sine.inOut', repeat: -1, yoyo: true
    });
  }

  /* ---------- nav + form ---------- */
  function chrome() {
    var nav = document.getElementById('nav');
    if (nav) {
      addEventListener('scroll', function () {
        nav.classList.toggle('is-stuck', window.scrollY > 40);
      }, { passive: true });
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

  function liteOffer() {
    if (stored()) return;
    var cores = navigator.hardwareConcurrency;
    var mem = navigator.deviceMemory;
    var save = navigator.connection && navigator.connection.saveData;
    var weak = (typeof cores === 'number' && cores <= 4) ||
               (typeof mem === 'number' && mem <= 4) || save === true;
    if (!weak) return;

    var bar = document.createElement('div');
    bar.className = 'lite-offer';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span>Lots of animation on this page. There is a lighter version.</span>' +
      '<a class="lite-offer__go" href="lite.html">Use lite</a>' +
      '<button class="lite-offer__no" type="button">No thanks</button>';
    document.body.appendChild(bar);

    function close(v) { remember(v); bar.remove(); }
    bar.querySelector('.lite-offer__go').addEventListener('click', function () { close('lite'); });
    bar.querySelector('.lite-offer__no').addEventListener('click', function () { close('full'); });
  }

  // ?full=1 and a saved 'lite' choice are handled by the inline head script,
  // before first paint; by the time this runs, stored() reflects both.
  function autoLite() {
    if (REDUCED || stored()) return;
    var SETTLE = 2200, WINDOW = 4000, BAD_MS = 40, MIN = 3;

    setTimeout(function () {
      if (document.visibilityState !== 'visible') return;
      var samples = [], last = performance.now(), until = last + WINDOW, abort = false;
      function hide() { if (document.visibilityState !== 'visible') abort = true; }
      document.addEventListener('visibilitychange', hide);

      function tick(now) {
        if (abort) { document.removeEventListener('visibilitychange', hide); return; }
        samples.push(now - last); last = now;
        if (now < until) { requestAnimationFrame(tick); return; }
        document.removeEventListener('visibilitychange', hide);
        if (samples.length < MIN) {
          if (!samples.length) return;
          remember('lite'); location.replace('lite.html?auto=1'); return;
        }
        samples.sort(function (a, b) { return a - b; });
        var med = samples[Math.floor(samples.length / 2)];
        if (med <= BAD_MS) return;
        remember('lite'); location.replace('lite.html?auto=1');
      }
      requestAnimationFrame(tick);
    }, SETTLE);
  }

  /* ---------- boot ---------- */
  function start() {
    safe('entrances', entrances);
    safe('wordIgnite', wordIgnite);
    safe('counters', counters);
    safe('marquee', marquee);
    safe('heroAperture', heroAperture);
    safe('moduleApertures', moduleApertures);
    safe('trajectoryPulse', trajectoryPulse);
    safe('rolodex', rolodex);
    safe('sectionTransitions', sectionTransitions);
    safe('sparkField', sparkField);
    safe('cursor', apertureCursor);
    safe('magnetics', magnetics);
    safe('flowLayer', flowLayer);
    safe('ambient', ambient);
    safe('chrome', chrome);
    safe('liteOffer', liteOffer);
    safe('autoLite', autoLite);

    // Hero entrance. Owns opacity, scale, letter-spacing, y on the figure and
    // yPercent on the eyebrow/foot; the scroll pin uses different properties.
    if (hasGSAP && !REDUCED) {
      var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo('.hero__figure',
          { clipPath: 'inset(0% 0% 100% 0%)', y: 30 },
          { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: d(1.15), ease: 'power4.inOut', clearProps: 'clipPath' }, 0)
        .from('.hero__word', { scale: 1.12, opacity: 0, letterSpacing: '0.05em',
            duration: d(1.1), stagger: d(0.06) }, 0.18)
        .from('.hero__eyebrow', { opacity: 0, yPercent: 60, duration: d(0.6) }, 0.3)
        .from('.hero__foot',    { opacity: 0, yPercent: 6, duration: d(0.8) }, 0.42)
        .from('.hero__hint',    { opacity: 0, duration: d(0.5) }, 0.95);
    }

    if (hasST) {
      if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      addEventListener('load', function () { ScrollTrigger.refresh(); });
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
