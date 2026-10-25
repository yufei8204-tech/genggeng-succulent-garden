/* GengGeng lighting adapter. Local files, no network, no gameplay or sound ownership. */
(function (global) {
  'use strict';
  var currentScript = document.currentScript;
  var defaultBase = currentScript && currentScript.src ? new URL('../', currentScript.src).href : './';
  var SERIES = {
    legend: 'legend_gold', zodiac: 'zodiac_warm_gold', cow: 'cow_milk_green',
    nailong: 'nailong_expression_peach', cat: 'cat_pink_milk', sheep: 'sheep_soft_white'
  };
  var CARDS = {
    ordinary: 'ordinary_green', legend: 'legend_gold', zodiac: 'zodiac_gold', cow: 'cow_milk',
    nailong: 'nailong_cream', cat: 'cat_pink', sheep: 'sheep_pink_white'
  };
  var SEEDS = {
    quality: 'quality_teal', zodiac: 'nailong_gold', cow: 'cow_grass_milk',
    nailong: 'expression_peach', legend: 'legend_iridescent'
  };
  var ALIASES = {
    normal: 'ordinary', common: 'ordinary', '普通多肉': 'ordinary',
    meme: 'legend', hot: 'legend', '抖音热梗传说多肉': 'legend',
    dragon: 'zodiac', '奶龙十二生肖多肉': 'zodiac',
    '抽象奶牛表情包多肉': 'cow', expression: 'nailong',
    nailongExpression: 'nailong', '抽象奶龙表情包多肉': 'nailong',
    '萌趣小猫表情包多肉': 'cat', '萌趣小羊珍贵多肉': 'sheep',
    teal: 'quality', nailongSeed: 'zodiac', expressionSeed: 'nailong',
    '优质异变种子': 'quality', '奶龙限定种子': 'zodiac', '哞哞限定种子': 'cow',
    '奶龙表情限定种子': 'nailong', '传说限定种子': 'legend'
  };
  function key(value) { return ALIASES[value] || value; }
  function clamp(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
  }
  function element(value) {
    return typeof value === 'string' ? document.querySelector(value) : value;
  }
  function GengGengLighting(root, options) {
    options = options || {};
    this.root = element(root);
    if (!this.root || !this.root.appendChild) throw new TypeError('Lighting root element is required.');
    this.base = new URL(options.assetBase || defaultBase, document.baseURI).href;
    this.nodes = new Set();
    this.transients = new Map();
    this.flows = new Set();
    this.hosts = new Map();
    this.scene = null;
    this.raf = 0;
    this.disposed = false;
    this.reducedMotion = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this._tick = this._tick.bind(this);
  }
  GengGengLighting.prototype._url = function (path) { return new URL(path, this.base).href; };
  GengGengLighting.prototype._prepareHost = function (host) {
    host = element(host) || this.root;
    if (!this.hosts.has(host)) {
      var before = { position: host.style.position, isolation: host.style.isolation };
      this.hosts.set(host, before);
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.style.isolation = 'isolate';
    }
    return host;
  };
  GengGengLighting.prototype._layer = function (host, type, opacity, zIndex) {
    if (this.disposed) throw new Error('Lighting instance has been destroyed.');
    host = this._prepareHost(host);
    var node = document.createElement('div');
    node.className = 'gg-lighting-layer gg-lighting-' + type;
    node.setAttribute('aria-hidden', 'true');
    node.style.opacity = clamp(opacity, 0.3);
    node.style.zIndex = zIndex === undefined ? '-1' : String(zIndex);
    host.prepend(node);
    this.nodes.add(node);
    return node;
  };
  GengGengLighting.prototype._image = function (layer, path, className) {
    var image = document.createElement('img');
    image.className = className || 'gg-lighting-texture';
    image.src = this._url(path);
    image.alt = '';
    image.draggable = false;
    image.decoding = 'async';
    layer.appendChild(image);
    return image;
  };
  GengGengLighting.prototype._remove = function (node) {
    this.flows.forEach(function (flow) { if (flow.node === node || node.contains(flow.node)) this.flows.delete(flow); }, this);
    this.nodes.delete(node);
    node.remove();
    if (!this.flows.size && this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
  };
  GengGengLighting.prototype.mountScene = function (options) {
    options = options || {};
    if (this.scene) this._remove(this.scene);
    var layer = this._layer(options.target, 'scene', 1, options.zIndex);
    this._image(layer, 'textures/scene/ambient_cream.png').style.opacity = clamp(options.ambient, 0.3);
    this._image(layer, 'textures/scene/sunlight_upper_left.png').style.opacity = clamp(options.sunlight, 0.38);
    this._image(layer, 'textures/scene/sky_fill.png').style.opacity = clamp(options.sky, 0.14);
    this.warmthImage = this._image(layer, 'textures/scene/shop_warmth.png');
    this.sceneShade = document.createElement('div');
    this.sceneShade.className = 'gg-lighting-scene-shade';
    layer.appendChild(this.sceneShade);
    this.scene = layer;
    this.setProgress(options.progress || 0);
    return layer;
  };
  GengGengLighting.prototype.setProgress = function (progress) {
    this.progress = Math.max(0, Math.min(2, Math.round(Number(progress) || 0)));
    var normalized = this.progress / 2;
    if (this.warmthImage) this.warmthImage.style.opacity = (0.08 + 0.2 * normalized).toFixed(3);
    if (this.sceneShade) this.sceneShade.style.opacity = (0.045 * (1 - normalized)).toFixed(4);
  };
  GengGengLighting.prototype._transient = function (id, host, path, type, opacity, options) {
    if (this.transients.has(id)) return this.transients.get(id);
    var self = this;
    var node = this._layer(host, type, opacity, options.zIndex);
    this._image(node, path);
    var handle = {
      id: id, node: node,
      clear: function () { if (self.transients.get(id) !== handle) return; self.transients.delete(id); self._remove(node); },
      setStage: function (stage) { node.dataset.stage = String(stage || ''); }
    };
    this.transients.set(id, handle);
    return handle;
  };
  GengGengLighting.prototype.showSpecial = function (series, options) {
    options = options || {};
    series = key(series);
    if (series === 'ordinary' || !SERIES[series]) return null;
    var id = options.eventId || 'special';
    return this._transient(id, options.target, 'textures/series/' + SERIES[series] + '.png', 'special',
      clamp(options.opacity, series === 'sheep' ? 0.4 : 0.34), options);
  };
  GengGengLighting.prototype.showSeedExchange = function (seed, options) {
    options = options || {};
    seed = key(seed);
    if (!SEEDS[seed]) return null;
    var handle = this._transient(options.eventId || 'exchange', options.target,
      'textures/seeds/' + SEEDS[seed] + '.png', 'exchange', clamp(options.opacity, 0.48), options);
    if (seed === 'legend' && options.flow !== false && !handle.node.querySelector('.gg-lighting-sprite')) {
      this._addFlow(handle.node, 'legend_seed_flow', clamp(options.flowOpacity, 0.4));
    }
    return handle;
  };
  GengGengLighting.prototype.decorateCard = function (host, series, options) {
    options = options || {};
    series = key(series);
    if (!CARDS[series]) return null;
    var self = this;
    var node = this._layer(host, 'card', clamp(options.opacity, series === 'ordinary' ? 0.26 : 0.42), options.zIndex);
    this._image(node, 'textures/cards/' + CARDS[series] + '.png');
    if (series === 'legend' && options.flow !== false) this._addFlow(node, 'legend_card_flow', 0.5);
    return { node: node, clear: function () { self._remove(node); } };
  };
  GengGengLighting.prototype.addContactShadow = function (host, options) {
    options = options || {};
    var self = this;
    var node = this._layer(host, 'contact', clamp(options.opacity, 0.45), options.zIndex);
    this._image(node, 'textures/shadows/' + (options.character ? 'character_contact' : 'pot_contact') + '.png');
    return { node: node, clear: function () { self._remove(node); } };
  };
  GengGengLighting.prototype._addFlow = function (parent, name, opacity) {
    var node = document.createElement('div');
    node.className = 'gg-lighting-sprite';
    node.style.backgroundImage = 'url("' + this._url('animations/' + name + '.png') + '")';
    node.style.opacity = opacity;
    parent.appendChild(node);
    this.flows.add({ node: node, start: performance.now(), frameMs: name === 'legend_card_flow' ? 300 : 250, frame: -1 });
    if (!this.raf) this.raf = requestAnimationFrame(this._tick);
  };
  GengGengLighting.prototype._tick = function (time) {
    this.raf = 0;
    if (this.disposed) return;
    this.flows.forEach(function (flow) {
      if (!flow.node.isConnected) { this.flows.delete(flow); return; }
      var frame = this.reducedMotion ? 0 : Math.floor((time - flow.start) / flow.frameMs) % 16;
      if (frame !== flow.frame && !document.hidden) {
        flow.node.style.backgroundPosition = (frame * 100 / 15) + '% 0';
        flow.frame = frame;
      }
    }, this);
    if (this.flows.size && !this.reducedMotion) this.raf = requestAnimationFrame(this._tick);
  };
  GengGengLighting.prototype.clear = function (eventId) {
    if (eventId !== undefined) { var item = this.transients.get(eventId); if (item) item.clear(); return; }
    Array.from(this.transients.values()).forEach(function (item) { item.clear(); });
  };
  GengGengLighting.prototype.inspect = function () {
    return { layers: this.nodes.size, transientEvents: this.transients.size, animatedFlows: this.flows.size, progress: this.progress || 0, disposed: this.disposed };
  };
  GengGengLighting.prototype.destroy = function () {
    if (this.disposed) return;
    this.clear();
    Array.from(this.nodes).forEach(this._remove, this);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.hosts.forEach(function (before, host) { host.style.position = before.position; host.style.isolation = before.isolation; });
    this.hosts.clear();
    this.flows.clear();
    this.scene = null;
    this.warmthImage = null;
    this.sceneShade = null;
    this.disposed = true;
  };
  GengGengLighting.SERIES = Object.freeze(Object.keys(SERIES));
  GengGengLighting.SEEDS = Object.freeze(Object.keys(SEEDS));
  GengGengLighting.create = function (root, options) { return new GengGengLighting(root, options); };
  global.GengGengLighting = GengGengLighting;
})(window);
