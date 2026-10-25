/* 梗梗多肉培育馆 · Canvas 2D particle effects · v1.0.0 · no dependencies */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GengGengParticles = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var TAU = Math.PI * 2;
  var COLORS = { gold: '#F4C55E', yellow: '#FFE28C', pink: '#F6ACBD', rose: '#EE91A9', green: '#A9CB87', mint: '#B6D9AF', blue: '#A4D3E5', cream: '#FFF4DD', white: '#FFFDF7', peach: '#F3B393' };
  var PRESETS = Object.freeze({
    special: { name: '特殊异变', duration: 4.4, count: 112, priority: 1, shapes: ['star', 'heart', 'smile', 'glint', 'dot'] },
    cat: { name: '小猫专属', duration: 5, count: 112, priority: 1, shapes: ['sakura', 'petal', 'fluff', 'glint', 'heart'] },
    sheep: { name: '小羊珍贵异变', duration: 5, count: 98, priority: 1, shapes: ['cloud', 'fluff', 'heart', 'glint', 'star'] },
    'exchange-quality': { name: '优质异变兑换', duration: 5.4, count: 156, priority: 2, shapes: ['leaf', 'heart', 'glint', 'leaf', 'star'] },
    'exchange-dragon': { name: '奶龙限定兑换', duration: 5.4, count: 152, priority: 2, shapes: ['star', 'cloud', 'smile', 'star', 'glint'] },
    'exchange-cow': { name: '哞哞限定兑换', duration: 5.4, count: 148, priority: 2, shapes: ['bubble', 'cloud', 'bubble', 'leaf', 'glint'] },
    'exchange-expression': { name: '奶龙表情兑换', duration: 5.4, count: 164, priority: 2, shapes: ['bead', 'candy', 'smile', 'glint', 'heart'] },
    'exchange-legend': { name: '传说限定兑换', duration: 6, count: 188, priority: 2, shapes: ['star', 'glint', 'smile', 'dot', 'star'] },
    collection: { name: '图鉴完成小庆祝', duration: 2.4, count: 42, priority: 0, shapes: ['star', 'glint', 'heart'] },
    ambient: { name: '温室轻盈环境', duration: 12, count: 22, priority: 0, shapes: ['butterfly', 'dot', 'cloud'] },
    ordinary: { name: '普通成熟 无出货特效', duration: 0, count: 0, priority: 0, shapes: [] }
  });
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function rng(seed) {
    var state = (Number(seed) || 238947) >>> 0;
    return function () { state += 0x6D2B79F5; var n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  function roundedPolygon(c, points) {
    c.beginPath();
    for (var i = 0; i < points.length; i++) {
      var prev = points[(i + points.length - 1) % points.length], p = points[i], next = points[(i + 1) % points.length];
      var ax = p[0] + (prev[0] - p[0]) * 0.17, ay = p[1] + (prev[1] - p[1]) * 0.17;
      var bx = p[0] + (next[0] - p[0]) * 0.17, by = p[1] + (next[1] - p[1]) * 0.17;
      if (i === 0) c.moveTo(ax, ay); else c.lineTo(ax, ay);
      c.quadraticCurveTo(p[0], p[1], bx, by);
    }
    c.closePath();
  }
  function starPath(c, points) {
    var p = [];
    for (var i = 0; i < points * 2; i++) { var a = i * Math.PI / points - Math.PI / 2, r = i % 2 ? 18 : 40; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    roundedPolygon(c, p);
  }
  function heartPath(c) {
    c.beginPath(); c.moveTo(0, 32); c.bezierCurveTo(-9, 22, -41, 4, -35, -18); c.bezierCurveTo(-30, -38, -7, -35, 0, -19); c.bezierCurveTo(11, -37, 34, -35, 37, -15); c.bezierCurveTo(40, 5, 13, 23, 0, 32); c.closePath();
  }
  function plushFill(c, color) {
    var g = c.createLinearGradient(-20, -32, 24, 40); g.addColorStop(0, '#FFFDF3'); g.addColorStop(0.23, color); g.addColorStop(1, color);
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(255,255,255,.72)'; c.lineWidth = 1.5; c.stroke();
  }
  function gloss(c, x, y, rx, ry) { c.save(); c.translate(x, y); c.rotate(-0.55); c.fillStyle = 'rgba(255,255,255,.62)'; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill(); c.restore(); }
  function smile(c) { c.fillStyle = '#926A42'; [-10, 10].forEach(function (x) { c.beginPath(); c.ellipse(x, -1, 2.8, 3.5, 0, 0, TAU); c.fill(); }); c.strokeStyle = '#926A42'; c.lineCap = 'round'; c.lineWidth = 2.6; c.beginPath(); c.arc(0, 4, 7, 0.15, Math.PI - 0.15); c.stroke(); }
  function makeSprite(doc, type, color) {
    var canvas = doc.createElement('canvas'); canvas.width = canvas.height = 128;
    var c = canvas.getContext('2d'); c.translate(64, 64); c.scale(1.28, 1.28); c.lineJoin = 'round'; c.lineCap = 'round';
    if (type === 'star' || type === 'glint') { starPath(c, type === 'star' ? 5 : 4); plushFill(c, color); gloss(c, -12, -17, 5, 10); }
    else if (type === 'heart') { heartPath(c); plushFill(c, color); gloss(c, -18, -17, 6, 9); }
    else if (type === 'smile' || type === 'bead' || type === 'candy' || type === 'dot') {
      c.beginPath(); c.arc(0, 0, type === 'dot' ? 28 : 34, 0, TAU); plushFill(c, color); gloss(c, -12, -14, 7, 11);
      if (type === 'smile') smile(c);
      if (type === 'candy') { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 21, -0.4, 1.4); c.stroke(); }
    } else if (type === 'sakura') {
      for (var j = 0; j < 5; j++) { c.save(); c.rotate(j * TAU / 5); c.beginPath(); c.moveTo(0, 4); c.bezierCurveTo(-27, -6, -22, -36, -8, -34); c.quadraticCurveTo(-2, -35, 0, -29); c.quadraticCurveTo(9, -41, 18, -29); c.bezierCurveTo(28, -14, 16, -3, 0, 4); plushFill(c, color); c.restore(); }
      c.fillStyle = '#F0C777'; for (var k = 0; k < 5; k++) { var a = k * TAU / 5; c.beginPath(); c.arc(Math.cos(a) * 7, Math.sin(a) * 7, 2.5, 0, TAU); c.fill(); }
    } else if (type === 'petal' || type === 'leaf') {
      c.beginPath(); c.moveTo(-25, 30); c.bezierCurveTo(-41, -1, -10, -35, 27, -32); c.bezierCurveTo(39, -4, 16, 32, -25, 30); plushFill(c, color); gloss(c, -3, -10, 5, 14);
      if (type === 'leaf') { c.strokeStyle = 'rgba(93,149,84,.4)'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(-20, 25); c.quadraticCurveTo(1, 8, 23, -26); c.stroke(); }
    } else if (type === 'cloud') {
      c.beginPath(); c.moveTo(-35, 17); c.bezierCurveTo(-52, 2, -35, -22, -19, -14); c.bezierCurveTo(-12, -43, 17, -40, 22, -17); c.bezierCurveTo(45, -23, 53, 9, 35, 20); c.quadraticCurveTo(0, 36, -35, 17); plushFill(c, color);
      c.strokeStyle = 'rgba(220,204,181,.42)'; c.lineWidth = 2; [-19, 8, 25].forEach(function (x, i) { c.beginPath(); c.arc(x, i === 1 ? 0 : 9, 7, 0, Math.PI * 1.65); c.stroke(); });
    } else if (type === 'fluff') {
      var fg = c.createRadialGradient(0, 0, 2, 0, 0, 37); fg.addColorStop(0, 'rgba(255,253,241,.95)'); fg.addColorStop(0.6, 'rgba(255,250,231,.4)'); fg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = fg; c.fillRect(-40, -40, 80, 80);
      c.strokeStyle = 'rgba(238,215,185,.7)'; c.lineWidth = 1.2; for (var f = 0; f < 13; f++) { c.beginPath(); c.moveTo(-9, 24); c.quadraticCurveTo(-28 + f * 5, 9 - f, -28 + f * 4, -25 + Math.abs(f - 6) * 3); c.stroke(); }
    } else if (type === 'bubble') {
      var bg = c.createRadialGradient(-9, -12, 0, 0, 0, 35); bg.addColorStop(0, 'rgba(255,255,255,.05)'); bg.addColorStop(0.8, 'rgba(171,218,224,.13)'); bg.addColorStop(1, color); c.beginPath(); c.arc(0, 0, 35, 0, TAU); c.fillStyle = bg; c.fill(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.stroke(); gloss(c, -13, -18, 6, 10);
      c.strokeStyle = '#F2BED0'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 31, 0.1, 1.5); c.stroke(); c.strokeStyle = '#C0D9A6'; c.beginPath(); c.arc(0, 0, 31, 2.1, 3); c.stroke();
    } else if (type === 'ribbon') {
      c.strokeStyle = color; c.lineWidth = 12; c.beginPath(); c.moveTo(-35, -13); c.bezierCurveTo(-9, -42, 6, 35, 35, 9); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3; c.stroke();
    } else if (type === 'balloon') {
      c.beginPath(); c.ellipse(0, -10, 25, 30, 0, 0, TAU); plushFill(c, color); gloss(c, -9, -24, 4, 8); c.strokeStyle = '#D0AE86'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-12, 31, 11, 32, 2, 45); c.stroke();
    } else if (type === 'butterfly') {
      [-1, 1].forEach(function (sign) { c.save(); c.scale(sign, 1); c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(48, 17, 42, -35, 12, -20); c.bezierCurveTo(10, -6, 8, -3, 0, 6); plushFill(c, color); c.beginPath(); c.ellipse(16, 14, 14, 11, -0.4, 0, TAU); plushFill(c, color); c.restore(); }); c.strokeStyle = '#B69463'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 22); c.stroke();
    }
    return canvas;
  }

  function Engine(container, options) {
    if (!container || !container.ownerDocument || typeof container.appendChild !== 'function') throw new TypeError('Engine needs a DOM container or canvas.');
    options = options || {}; this.options = options; this.container = container; this.doc = container.ownerDocument; this.win = this.doc.defaultView;
    this._owned = String(container.tagName).toLowerCase() !== 'canvas'; this.canvas = this._owned ? this.doc.createElement('canvas') : container;
    this.context = this.canvas.getContext('2d'); if (!this.context) throw new Error('Canvas 2D is unavailable.');
    this._oldPosition = null;
    if (this._owned) { if (this.win.getComputedStyle(container).position === 'static') { this._oldPosition = container.style.position; container.style.position = 'relative'; } container.appendChild(this.canvas); }
    this.canvas.dataset.genggengParticles = 'true'; this.canvas.setAttribute('aria-hidden', 'true');
    Object.assign(this.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: String(options.zIndex === undefined ? 20 : options.zIndex) });
    this._effects = []; this._animations = new Set(); this._sprites = new Map(); this._raf = null; this._last = 0; this._serial = 0; this._destroyed = false; this._manualPaused = false;
    this._quality = options.quality === 'low' ? 'low' : 'high'; this._motionQuery = this.win.matchMedia ? this.win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._reducedMotion = options.reducedMotion === undefined ? !!(this._motionQuery && this._motionQuery.matches) : !!options.reducedMotion;
    this._safeAreas = []; this.setSafeAreas(options.safeAreas || []); this.resize();
    this._boundTick = this._tick.bind(this); this._boundResize = this.resize.bind(this); this._visibility = this._onVisibility.bind(this);
    this.doc.addEventListener('visibilitychange', this._visibility);
    if (this.win.ResizeObserver) { this._observer = new this.win.ResizeObserver(this._boundResize); this._observer.observe(container); }
    else this.win.addEventListener('resize', this._boundResize);
  }
  Object.defineProperty(Engine.prototype, 'stats', { get: function () {
    var n = 0; this._effects.forEach(function (e) { e.particles.forEach(function (p) { var t = e.age - p.delay; if (t >= 0 && t < p.life) n++; }); });
    return { activeEffects: this._effects.length, particleCount: n, quality: this._quality, reducedMotion: this._reducedMotion, rafActive: this._raf !== null, width: this.width, height: this.height, spriteCacheSize: this._sprites.size };
  } });
  Engine.prototype._assert = function () { if (this._destroyed) throw new Error('Particle engine has been destroyed.'); };
  Engine.prototype.resize = function () {
    if (this._destroyed) return; var box = this.container.getBoundingClientRect();
    this.width = Math.max(1, box.width || this.container.clientWidth || 1); this.height = Math.max(1, box.height || this.container.clientHeight || 1);
    this.dpr = Math.min(this.win.devicePixelRatio || 1, this._quality === 'low' ? 1.25 : 2);
    this.canvas.width = Math.round(this.width * this.dpr); this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); if (this._effects.length) this._draw();
  };
  Engine.prototype.setSafeAreas = function (areas) {
    this._assert(); if (!Array.isArray(areas)) throw new TypeError('safeAreas must be an array.');
    this._safeAreas = areas.map(function (r) { if (!r || !['x', 'y', 'width', 'height'].every(function (k) { return Number.isFinite(r[k]); }) || r.width < 0 || r.height < 0) throw new TypeError('Invalid safe area.'); return { x: r.x, y: r.y, width: r.width, height: r.height, normalized: !!r.normalized }; });
    if (this.context && this.width) this._draw(); return this;
  };
  Engine.prototype.setQuality = function (value) { this._assert(); if (value !== 'low' && value !== 'high') throw new TypeError('quality must be high or low.'); this._quality = value; this._limitParticles(); this.resize(); return this; };
  Engine.prototype.setReducedMotion = function (value) { this._assert(); this._reducedMotion = !!value; this._limitParticles(); return this; };
  Engine.prototype._budget = function () { return this._reducedMotion ? 48 : this._quality === 'low' ? 120 : 360; };
  Engine.prototype._limitParticles = function () {
    var left = this._budget();
    this._effects.sort(function (a, b) { return b.priority - a.priority; }).forEach(function (e) {
      var keep = Math.min(e.particles.length, left);
      if (keep < e.particles.length) {
        /* Uniform thinning retains late balloons/ribbons instead of chopping off the finale. */
        var source = e.particles; e.particles = [];
        for (var i = 0; i < keep; i++) e.particles.push(source[Math.floor((i + 0.5) * source.length / keep)]);
      }
      left -= keep;
    });
  };
  Engine.prototype._sprite = function (shape, color) { var key = shape + color; if (!this._sprites.has(key)) this._sprites.set(key, makeSprite(this.doc, shape, color)); return this._sprites.get(key); };
  Engine.prototype.play = function (preset, options) {
    this._assert(); if (!Object.prototype.hasOwnProperty.call(PRESETS, preset)) throw new RangeError('Unknown particle preset: ' + preset);
    options = options || {}; var cfg = PRESETS[preset]; var self = this;
    if (preset === 'ordinary') { this.clear('replaced'); return { id: ++this._serial, finished: Promise.resolve({ reason: 'completed', preset: preset }), cancel: function () {} }; }
    var duration = options.duration === undefined ? cfg.duration : options.duration;
    if (!Number.isFinite(duration) || duration < 0.2 || duration > 120) throw new RangeError('duration must be between 0.2 and 120 seconds.');
    var origin = options.origin || { x: 0.5, y: 0.56 };
    if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y)) throw new TypeError('origin needs normalized x/y values.');
    if (options.replace !== false) this.clear('replaced');
    var settle, finished = new Promise(function (resolve) { settle = resolve; });
    var e = { id: ++this._serial, preset: preset, cfg: cfg, priority: cfg.priority, duration: duration, age: 0, origin: { x: clamp(origin.x, 0, 1), y: clamp(origin.y, 0, 1) }, particles: [], settle: settle, loop: !!options.loop, seed: options.seed === undefined ? Math.floor(Math.random() * 1e9) : options.seed, cancelled: false, silhouette: options.silhouette || null };
    this._build(e); this._effects.push(e); this._limitParticles(); this._last = 0; this._schedule();
    return { id: e.id, finished: finished, cancel: function () { self._remove(e, 'cancelled'); } };
  };
  Engine.prototype._build = function (e) {
    var random = rng(e.seed), cfg = e.cfg, count = Math.min(this._budget(), Math.round(cfg.count * (this._quality === 'low' ? 0.6 : 1) * (this._reducedMotion ? 0.35 : 1)));
    var palette = e.preset === 'cat' ? ['pink', 'cream', 'rose', 'white'] : e.preset === 'sheep' ? ['cream', 'pink', 'white', 'rose'] : e.preset === 'exchange-quality' ? ['green', 'mint', 'yellow', 'cream'] : e.preset === 'exchange-legend' ? ['gold', 'yellow', 'cream', 'peach'] : e.preset === 'exchange-dragon' ? ['yellow', 'cream', 'gold', 'peach'] : ['gold', 'pink', 'blue', 'mint', 'peach'];
    for (var i = 0; i < count; i++) {
      var shape = cfg.shapes[i % cfg.shapes.length], a = random() * TAU, delay = random() * e.duration * 0.36;
      var p = { shape: shape, color: COLORS[palette[i % palette.length]], angle: a, radius: 0.2 + random() * 0.7, size: 8 + random() * 19, rotation: (random() - 0.5) * 0.8, spin: (random() - 0.5) * 1.7, phase: random() * TAU, delay: delay, life: Math.min(e.duration - delay, e.duration * (0.3 + random() * 0.45)), speed: 0.4 + random() * 0.8, x: random(), y: random(), mode: 'burst' };
      if (shape === 'dot' || shape === 'glint') p.size *= 0.5;
      if (shape === 'fluff') p.size *= 1.2;
      if (e.preset === 'cat') { p.mode = 'fall'; p.size *= shape === 'sakura' ? 1.25 : 1; }
      else if (e.preset === 'sheep') { p.mode = 'rise'; if (shape === 'cloud') p.size *= 1.7; }
      else if (e.preset === 'exchange-cow') { p.mode = 'rise'; if (shape === 'bubble') p.size *= 1.8; }
      else if (e.preset === 'exchange-expression') p.mode = 'orbit';
      else if (e.preset === 'exchange-legend') { p.mode = i % 3 ? 'orbit' : 'converge'; p.size *= 0.85; }
      else if (e.preset === 'exchange-dragon') { p.mode = shape === 'cloud' ? 'rise' : 'burst'; if (shape === 'cloud') p.size *= 1.55; }
      else if (e.preset === 'ambient') { p.mode = 'ambient'; p.delay *= 0.3; p.life = e.duration - p.delay; p.size = shape === 'cloud' ? 38 + random() * 30 : shape === 'butterfly' ? 20 + random() * 8 : 4; }
      if (cfg.priority === 2 && i > count * 0.73) { p.shape = i % 4 === 0 ? 'balloon' : 'ribbon'; p.mode = 'confetti'; p.delay = e.duration * (0.5 + random() * 0.15); p.life = e.duration - p.delay; p.size = p.shape === 'balloon' ? 25 + random() * 12 : 12 + random() * 9; }
      e.particles.push(p);
    }
    /* Shape and color pairs are finite, so this cache is bounded across replays. */
    e.particles.forEach(function (p) { this._sprite(p.shape, p.color); }, this);
  };
  Engine.prototype._remove = function (effect, reason) {
    var index = this._effects.indexOf(effect); if (index < 0) return;
    this._effects.splice(index, 1); effect.cancelled = true; effect.particles.length = 0; effect.settle({ reason: reason, preset: effect.preset, id: effect.id });
    if (!this._effects.length) { if (this._raf !== null) this.win.cancelAnimationFrame(this._raf); this._raf = null; this._last = 0; }
    this._draw();
  };
  Engine.prototype.clear = function (reason) {
    if (this._destroyed) return; var list = this._effects.slice(); for (var i = 0; i < list.length; i++) this._remove(list[i], reason || 'cancelled');
    this._animations.forEach(function (animation) { animation.cancel(); }); this._animations.clear(); this.context.clearRect(0, 0, this.width, this.height); return this;
  };
  Engine.prototype._schedule = function () { if (!this._destroyed && !this._manualPaused && !this.doc.hidden && this._effects.length && this._raf === null) this._raf = this.win.requestAnimationFrame(this._boundTick); };
  Engine.prototype._tick = function (now) {
    this._raf = null; if (this._destroyed || this._manualPaused || this.doc.hidden) { this._last = 0; return; }
    var delta = this._last ? Math.max(0, (now - this._last) / 1000) : 0; this._last = now;
    var list = this._effects.slice();
    for (var i = 0; i < list.length; i++) { var e = list[i]; e.age += delta; if (e.age >= e.duration) { if (e.loop) e.age %= e.duration; else this._remove(e, 'completed'); } }
    this._draw(); this._schedule();
  };
  Engine.prototype._onVisibility = function () { if (this.doc.hidden) { if (this._raf !== null) this.win.cancelAnimationFrame(this._raf); this._raf = null; this._last = 0; } else this._schedule(); };
  Engine.prototype.pause = function () { this._assert(); this._manualPaused = true; if (this._raf !== null) this.win.cancelAnimationFrame(this._raf); this._raf = null; this._last = 0; return this; };
  Engine.prototype.resume = function () { this._assert(); this._manualPaused = false; this._last = 0; this._schedule(); return this; };
  Engine.prototype._draw = function () {
    if (!this.context || !this.width) return;
    var c = this.context; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.width, this.height);
    this._effects.slice().sort(function (a, b) { return a.priority - b.priority; }).forEach(function (e) { this._drawStructure(e); for (var i = 0; i < e.particles.length; i++) this._drawParticle(e, e.particles[i]); this._drawSilhouette(e); }, this);
    /* Physically clear protected rectangles: the underlying UI remains visible and clickable. */
    this._safeAreas.forEach(function (r) { var sx = r.normalized ? this.width : 1, sy = r.normalized ? this.height : 1; c.clearRect(r.x * sx, r.y * sy, r.width * sx, r.height * sy); }, this);
    c.globalAlpha = 1;
  };
  Engine.prototype._drawParticle = function (e, p) {
    var t = e.age - p.delay; if (t < 0 || t >= p.life) return;
    var u = t / p.life, fade = Math.min(1, u * 8) * Math.min(1, (1 - u) * 5), w = this.width, h = this.height, s = Math.min(w, h), ox = e.origin.x * w, oy = e.origin.y * h, spread = this._reducedMotion ? 0.28 : 1;
    var x, y, rot = p.rotation + t * p.spin * spread, scale = 0.75 + 0.25 * Math.sin(Math.PI * u);
    if (p.mode === 'fall') { x = w * (0.07 + p.x * 0.86) + Math.sin(t * 1.5 + p.phase) * 24 * spread; y = h * (0.1 + p.y * 0.13) + u * h * 0.64 * spread; rot += Math.sin(t * 2 + p.phase) * 0.4; }
    else if (p.mode === 'rise') { x = ox + Math.cos(p.angle) * s * (0.17 + p.radius * 0.35) + Math.sin(t * 1.6 + p.phase) * 14 * spread; y = oy + s * 0.2 - u * h * 0.54 * spread; }
    else if (p.mode === 'orbit') { var angle = p.angle + t * 0.65 * spread, radius = s * (0.22 + p.radius * 0.3) * (0.7 + ease(u) * 0.3); if (e.preset === 'exchange-legend') radius *= 1 - ease((u - 0.25) / 0.75) * 0.85; x = ox + Math.cos(angle) * radius; y = oy + Math.sin(angle) * radius * 0.58 - u * 25 * spread; }
    else if (p.mode === 'converge') { var inwardRadius = s * (0.24 + p.radius * 0.38) * (1 - ease(u)); x = ox + Math.cos(p.angle + t * 0.25) * inwardRadius; y = oy + Math.sin(p.angle + t * 0.25) * inwardRadius * 0.6; }
    else if (p.mode === 'confetti') { x = w * (p.x < 0.5 ? 0.04 + p.x * 0.42 : 0.76 + (p.x - 0.5) * 0.42) + Math.sin(t * 2 + p.phase) * 15 * spread; y = h * (0.06 + u * 0.83 * spread); rot = Math.sin(t * 2 + p.phase) * 0.4; }
    else if (p.mode === 'ambient') { x = ((p.x + u * (p.shape === 'butterfly' ? 0.75 : 0.1) * spread) % 1) * w; y = h * (0.08 + p.y * 0.65) + Math.sin(t + p.phase) * (p.shape === 'butterfly' ? 14 : 4) * spread; rot = Math.sin(t * 2 + p.phase) * 0.2; if (p.shape === 'butterfly') scale *= 0.6 + Math.abs(Math.sin(t * 5)) * 0.4; }
    else { var r = s * (0.12 + p.radius * 0.45) * ease(u * 1.7) * spread; x = ox + Math.cos(p.angle) * r; y = oy + Math.sin(p.angle) * r * 0.64 - u * s * 0.12 * spread; }
    var size = p.size * clamp(s / 450, 0.65, 1.7) * scale;
    var c = this.context; c.save(); c.globalAlpha = fade * (p.shape === 'dot' ? 0.7 : 0.96); c.translate(x, y); c.rotate(rot); c.drawImage(this._sprite(p.shape, p.color), -size, -size, size * 2, size * 2); c.restore();
  };
  Engine.prototype._drawStructure = function (e) {
    if (e.preset === 'ambient') return;
    var c = this.context, s = Math.min(this.width, this.height), x = e.origin.x * this.width, y = e.origin.y * this.height, t = e.age, u = t / e.duration;
    var fade = Math.min(1, t * 3) * Math.min(1, (1 - u) * 4); c.save(); c.translate(x, y); c.globalAlpha = fade;
    var color = e.preset === 'exchange-quality' ? COLORS.green : e.preset === 'exchange-cow' ? COLORS.mint : e.preset === 'cat' ? COLORS.pink : COLORS.gold;
    var radius = s * (0.23 + ease(Math.min(1, t / 1.3)) * 0.15);
    /* Deliberately no full-screen additive light wash: light-role overlays can be supplied separately. */
    if (e.preset === 'sheep') { var g = c.createRadialGradient(0, 0, s * 0.15, 0, 0, s * 0.44); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, 'rgba(255,249,236,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-s * 0.5, -s * 0.5, s, s); }
    else if (e.preset === 'exchange-quality') {
      c.save(); c.scale(radius / 45, radius / 58); heartPath(c); c.globalAlpha *= 0.55; c.strokeStyle = COLORS.green; c.lineWidth = 0.65; c.setLineDash([260 * ease(t / 1.15), 500]); c.stroke(); c.restore();
      for (var j = 0; j < 12; j++) { var a = j / 12 * TAU; c.save(); c.translate(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.62); c.rotate(a); c.drawImage(this._sprite('leaf', j % 2 ? COLORS.green : COLORS.mint), -13, -13, 26, 26); c.restore(); }
    } else if (e.preset === 'exchange-dragon' && t < e.duration * 0.62) {
      var p = ease(t / (e.duration * 0.62)), sx = -s * 0.5 + p * s * 0.85, sy = -s * 0.3 + p * s * 0.24;
      c.strokeStyle = 'rgba(245,206,118,.35)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx - 90, sy - 32); c.quadraticCurveTo(sx - 45, sy - 10, sx, sy); c.stroke(); c.drawImage(this._sprite('star', COLORS.yellow), sx - 25, sy - 25, 50, 50);
    } else {
      var rings = e.preset === 'exchange-legend' ? 3 : e.preset === 'exchange-cow' ? 3 : e.preset === 'collection' ? 1 : 2;
      for (var k = 0; k < rings; k++) { c.save(); if (e.preset === 'exchange-legend') c.rotate((k - 1) * 0.14); c.globalAlpha *= 0.5 / (k + 1); c.strokeStyle = color; c.lineWidth = k ? 1.2 : 2; c.beginPath(); c.ellipse(0, 0, radius * (1 + k * 0.11), radius * (0.44 + k * 0.045), 0, 0, TAU); c.stroke(); c.restore(); }
    }
    c.restore();
  };
  Engine.prototype._drawSilhouette = function (e) {
    /* Optional approved reference art, never invented cow/dragon substitutes. */
    if (!e.silhouette || (e.preset !== 'exchange-cow' && e.preset !== 'exchange-expression')) return;
    var image = e.silhouette; if (!image.complete || !image.naturalWidth) return;
    var c = this.context, size = Math.min(this.width, this.height) * 0.13, t = e.age; c.save(); c.globalAlpha = Math.min(1, t * 2) * Math.min(1, (e.duration - t) * 2) * 0.65;
    c.translate(this.width * 0.22, this.height * 0.54 + Math.sin(t * 4) * (this._reducedMotion ? 2 : 9)); c.rotate(Math.sin(t * 3) * (this._reducedMotion ? 0.02 : 0.1)); c.drawImage(image, -size / 2, -size / 2, size, size); c.restore();
  };
  Engine.prototype.animateElement = function (element, kind) {
    this._assert(); if (!element || typeof element.animate !== 'function') throw new TypeError('An animatable element is required.');
    var frames, duration;
    if (kind === 'button') { frames = [{ transform: 'scale(1)' }, { transform: 'scale(.93)', offset: 0.28 }, { transform: 'scale(1.035)', offset: 0.72 }, { transform: 'scale(1)' }]; duration = 280; }
    else if (kind === 'popup') { frames = [{ transform: 'translateY(14px) scale(.9)', opacity: 0 }, { transform: 'translateY(-3px) scale(1.025)', opacity: 1, offset: 0.72 }, { transform: 'translateY(0) scale(1)', opacity: 1 }]; duration = 480; }
    else if (kind === 'pot-shake') { frames = [{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)', offset: 0.2 }, { transform: 'rotate(3deg)', offset: 0.4 }, { transform: 'rotate(-2deg)', offset: 0.6 }, { transform: 'rotate(1deg)', offset: 0.8 }, { transform: 'rotate(0)' }]; duration = 620; }
    else throw new RangeError('Unknown element animation: ' + kind);
    var animation = element.animate(frames, { duration: this._reducedMotion ? 1 : duration, easing: 'ease-out' }); var self = this; this._animations.add(animation);
    var finished = animation.finished.then(function () { self._animations.delete(animation); return { reason: 'completed' }; }, function () { self._animations.delete(animation); return { reason: 'cancelled' }; });
    return { finished: finished, cancel: function () { animation.cancel(); } };
  };
  Engine.prototype.destroy = function () {
    if (this._destroyed) return; this.clear('destroyed'); this._destroyed = true;
    this.doc.removeEventListener('visibilitychange', this._visibility); if (this._observer) this._observer.disconnect(); else this.win.removeEventListener('resize', this._boundResize);
    this._sprites.clear(); if (this._owned) this.canvas.remove(); if (this._oldPosition !== null && this.container.style.position === 'relative') this.container.style.position = this._oldPosition;
  };
  return Object.freeze({ Engine: Engine, presets: PRESETS, version: '1.0.0' });
});
