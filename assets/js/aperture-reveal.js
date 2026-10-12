/*!
 * ApertureReveal — cursor-driven mask that erodes a sealed cover layer
 * to expose a live layer underneath. Adapted from the CodeSpark RobotReveal
 * for the trajectory diagram (hero) and the venture cards.
 *
 * Markup contract:
 *   <div data-aperture-reveal>
 *     <div class="aperture__base"> …live content… </div>
 *     <div class="aperture__hover"> …sealed/matte cover… </div>
 *   </div>
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    var api = factory();
    root.ApertureReveal = api.ApertureReveal;
    root.initApertureReveals = api.initApertureReveals;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var REDUCED = typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ApertureReveal(el, options) {
    options = options || {};

    this.el = el;
    this.hoverLayer = el.querySelector('.aperture__hover');
    if (!this.hoverLayer) return;

    this.radius = options.radius != null ? options.radius : 'auto';
    this.radiusRatio = options.radiusRatio != null ? options.radiusRatio : 0.32;
    this.maxRadius = options.maxRadius != null ? options.maxRadius : 300;
    this.core = options.core != null ? options.core : 0.55;
    this.ease = REDUCED ? 1 : (options.ease != null ? options.ease : 0.12);

    this.target = { x: 0, y: 0, r: 0 };
    this.current = { x: 0, y: 0, r: 0 };
    this.rect = null;
    this.raf = null;
    this.running = false;
    this.lastTime = 0;
    this.destroyed = false;

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

  ApertureReveal.prototype.measure = function () {
    this.rect = this.el.getBoundingClientRect();
    if (this.radius === 'auto') {
      var base = Math.min(this.rect.width, this.rect.height) || 0;
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
    this.rect = this.el.getBoundingClientRect();
    this.target.x = e.clientX - this.rect.left;
    this.target.y = e.clientY - this.rect.top;
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
    var core = Math.round(this.core * 100);
    var value = r <= 0.1
      ? 'radial-gradient(circle 0px at 50% 50%, #000 0%, transparent 100%)'
      : 'radial-gradient(circle ' + r.toFixed(1) + 'px at ' +
        this.current.x.toFixed(1) + 'px ' + this.current.y.toFixed(1) + 'px, ' +
        'transparent 0%, transparent ' + core + '%, #000 100%)';
    // Note: we invert the mask relative to RobotReveal. The hover layer is a
    // SEALED cover, so a transparent-core mask means the cursor erodes a hole
    // in the cover and reveals the base. Elsewhere the hover was the image.
    this.hoverLayer.style.webkitMaskImage = value;
    this.hoverLayer.style.maskImage = value;
    this.hoverLayer.style.webkitMaskSize = '100% 100%';
    this.hoverLayer.style.maskSize = '100% 100%';
    this.hoverLayer.style.webkitMaskRepeat = 'no-repeat';
    this.hoverLayer.style.maskRepeat = 'no-repeat';
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

  function initApertureReveals(selector, options) {
    selector = selector || '[data-aperture-reveal]';
    options = options || {};
    var nodes = document.querySelectorAll(selector);
    return Array.prototype.map.call(nodes, function (el) {
      return new ApertureReveal(el, options);
    });
  }

  return { ApertureReveal: ApertureReveal, initApertureReveals: initApertureReveals };
});
