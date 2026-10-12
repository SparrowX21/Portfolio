/*!
 * ApertureReveal — a cursor-driven circular mask on a layer.
 *
 * Markup contract:
 *   <el data-aperture-reveal>
 *     <… class="aperture__base"> …always-visible content… </…>
 *     <… class="aperture__hover"> …masked layer… </…>
 *   </el>
 *
 * Modes:
 *   'erode'  — the hover layer is a cover; the aperture cuts a hole in it.
 *              With sealed: true the cover is fully shown at rest.
 *   'reveal' — the hover layer is a spotlight; it shows only inside the
 *              aperture and is hidden at rest.
 *
 * Without JS the stylesheet's default mask hides the hover layer entirely,
 * so the base content is always readable.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    var api = factory();
    root.ApertureReveal = api.ApertureReveal;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var REDUCED = typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  var HIDDEN = 'radial-gradient(circle 0px at 50% 50%, #000 0%, transparent 100%)';
  var SOLID = 'linear-gradient(#000, #000)';

  function ApertureReveal(el, options) {
    options = options || {};

    this.el = el;
    this.hoverLayer = el.querySelector('.aperture__hover');
    if (!this.hoverLayer) return;

    this.mode = options.mode === 'reveal' ? 'reveal' : 'erode';
    this.sealed = this.mode === 'erode' && !!options.sealed;
    this.radius = options.radius != null ? options.radius : 'auto';
    this.radiusRatio = options.radiusRatio != null ? options.radiusRatio : 0.32;
    this.maxRadius = options.maxRadius != null ? options.maxRadius : 300;
    this.core = options.core != null ? options.core : 0.55;
    this.ease = REDUCED ? 1 : (options.ease != null ? options.ease : 0.12);

    this.target = { x: 0, y: 0, r: 0 };
    this.current = { x: 0, y: 0, r: 0 };
    this.raf = null;
    this.running = false;
    this.lastTime = 0;
    this.destroyed = false;

    var s = this.hoverLayer.style;
    s.webkitMaskSize = s.maskSize = '100% 100%';
    s.webkitMaskRepeat = s.maskRepeat = 'no-repeat';

    this.onMove = this.onMove.bind(this);
    this.onLeave = this.onLeave.bind(this);
    this.onResize = this.onResize.bind(this);
    this.loop = this.loop.bind(this);

    el.addEventListener('pointermove', this.onMove, { passive: true });
    el.addEventListener('pointerdown', this.onMove, { passive: true });
    el.addEventListener('pointerleave', this.onLeave);
    el.addEventListener('pointercancel', this.onLeave);
    addEventListener('resize', this.onResize, { passive: true });

    this.measure();
    this.render();
  }

  // Layout size, not the on-screen rect: the element may be scaled by a
  // transform, and the mask is drawn in its untransformed coordinate space.
  ApertureReveal.prototype.measure = function () {
    if (this.radius === 'auto') {
      var base = Math.min(this.el.offsetWidth, this.el.offsetHeight) || 0;
      this.resolvedRadius = Math.min(base * this.radiusRatio, this.maxRadius);
    } else {
      this.resolvedRadius = this.radius;
    }
    if (this.target.r > 0) this.target.r = this.resolvedRadius;
  };

  ApertureReveal.prototype.onResize = function () {
    this.measure();
    if (!this.running) this.render();
  };

  ApertureReveal.prototype.onMove = function (e) {
    var rect = this.el.getBoundingClientRect();
    var sx = rect.width ? this.el.offsetWidth / rect.width : 1;
    var sy = rect.height ? this.el.offsetHeight / rect.height : 1;
    this.target.x = (e.clientX - rect.left) * sx;
    this.target.y = (e.clientY - rect.top) * sy;
    this.target.r = this.resolvedRadius;
    if (this.current.r === 0) {
      this.current.x = this.target.x;
      this.current.y = this.target.y;
    }
    this.start();
  };

  ApertureReveal.prototype.onLeave = function () {
    this.target.r = 0;
    this.start();
  };

  ApertureReveal.prototype.start = function () {
    if (this.running || this.destroyed) return;
    this.running = true;
    this.lastTime = 0;
    this.raf = requestAnimationFrame(this.loop);
  };

  ApertureReveal.prototype.render = function () {
    var r = Math.max(this.current.r, 0);
    var value;
    if (r <= 0.1) {
      value = this.sealed ? SOLID : HIDDEN;
    } else {
      var core = Math.round(this.core * 100);
      var at = 'circle ' + r.toFixed(1) + 'px at ' +
        this.current.x.toFixed(1) + 'px ' + this.current.y.toFixed(1) + 'px, ';
      value = this.mode === 'erode'
        ? 'radial-gradient(' + at + 'transparent 0%, transparent ' + core + '%, #000 100%)'
        : 'radial-gradient(' + at + '#000 0%, #000 ' + core + '%, transparent 100%)';
    }
    this.hoverLayer.style.webkitMaskImage = value;
    this.hoverLayer.style.maskImage = value;
  };

  ApertureReveal.prototype.loop = function (time) {
    if (this.destroyed) return;
    var dt = this.lastTime ? Math.min((time - this.lastTime) / 16.667, 4) : 1;
    this.lastTime = time;
    var k = 1 - Math.pow(1 - this.ease, dt);

    this.current.x += (this.target.x - this.current.x) * k;
    this.current.y += (this.target.y - this.current.y) * k;
    this.current.r += (this.target.r - this.current.r) * k;

    this.render();

    var settled = Math.abs(this.target.r - this.current.r) < 0.15 &&
      (this.target.r === 0 ||
        (Math.abs(this.target.x - this.current.x) < 0.15 &&
         Math.abs(this.target.y - this.current.y) < 0.15));

    if (settled) {
      this.current.r = this.target.r;
      if (this.target.r === 0) { this.current.x = this.target.x; this.current.y = this.target.y; }
      this.render();
      this.running = false;
      this.raf = null;
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  return { ApertureReveal: ApertureReveal };
});
