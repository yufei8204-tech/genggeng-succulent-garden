/* 梗梗多肉培育馆 H5 audio adapter. No external dependency; no official character voices. */
(function (global) {
  'use strict';
  const scriptURL = global.document && document.currentScript ? document.currentScript.src : '';
  const FILES = Object.freeze({
    bgm: 'bgm_greenhouse_pixel_v1.wav',
    button: 'sfx_button_pop_v1.wav', confirm: 'sfx_button_confirm_v1.wav',
    water: 'sfx_water_v1.wav', sprout: 'sfx_sprout_v1.wav', page: 'sfx_page_turn_v1.wav',
    star: 'sfx_starlight_h5.wav', sun: 'sfx_sunshine_h5.wav',
    cat: 'sfx_cat_companion_h5.wav', revealDemo: 'sfx_reveal_demo_h5.wav',
    seedQuality: 'sfx_seed_quality_h5.wav', seedZodiac: 'sfx_seed_zodiac_h5.wav',
    seedCow: 'sfx_seed_cow_h5.wav', seedDragon: 'sfx_seed_dragon_h5.wav',
    seedLegend: 'sfx_seed_legend_h5.wav', growth: 'sfx_shop_growth_h5.wav',
    ending: 'sfx_story_ending_h5.wav'
  });
  const EVENTS = Object.freeze({
    'ui.button.press': 'button', 'ui.button.confirm': 'confirm',
    'plant.water': 'water', 'plant.sprout': 'sprout', 'plant.sun': 'sun',
    'plant.sunshine': 'sun', 'companion.cat': 'cat', 'cat.companion': 'cat',
    'collection.page.turn': 'page', 'collection.open': 'page',
    'shop.growth': 'growth', 'story.ending': 'ending', 'reveal.star': 'star',
    'seed.exchange.quality': 'seedQuality', 'seed.exchange.zodiac': 'seedZodiac',
    'seed.exchange.cow': 'seedCow', 'seed.exchange.dragon': 'seedDragon',
    'seed.exchange.legend': 'seedLegend'
  });
  const clamp = (value, fallback) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : fallback;
  const invoke = (callback, value) => { if (typeof callback === 'function') { try { callback(value); } catch (error) { console.warn('[SucculentAudio callback]', error); } } };

  class SucculentAudio {
    constructor(options = {}) {
      this.audioBase = options.baseUrl || options.audioBase || (scriptURL ? new URL('audio/', scriptURL).href : './audio/');
      if (!this.audioBase.endsWith('/')) this.audioBase += '/';
      this.files = Object.assign({}, FILES, options.files || {});
      this.levels = Object.assign({ master: .8, bgm: .58, sfx: .8, voice: .9 }, options.levels || {});
      this.muted = Boolean(options.muted);
      this.context = null;
      this.cache = new Map();
      this.pending = new Map();
      this.active = new Map();
      this.lastPlayed = new Map();
      this.sequence = Promise.resolve();
      this.cancelVersion = 0;
      this.duckCount = 0;
      this.bgmSource = null;
      this.bgmOffset = 0;
      this.bgmStarted = 0;
      this.bgmWanted = false;
      this.bgmStarting = null;
      this.mediaBgm = null;
      this.destroyed = false;
      this._visibility = () => {
        if (document.hidden) this.pauseBgm(false);
        else if (this.bgmWanted && !this.destroyed) this.startBgm();
      };
      if (global.document && options.pauseOnHidden !== false) document.addEventListener('visibilitychange', this._visibility);
    }

    async unlock() {
      if (this.destroyed) return false;
      const Type = global.AudioContext || global.webkitAudioContext;
      if (!Type) return false;
      try {
        if (!this.context) {
          this.context = new Type();
          this.masterGain = this.context.createGain();
          this.bgmGain = this.context.createGain();
          this.sfxGain = this.context.createGain();
          this.voiceGain = this.context.createGain();
          this.bgmGain.connect(this.masterGain);
          this.sfxGain.connect(this.masterGain);
          this.voiceGain.connect(this.masterGain);
          this.masterGain.connect(this.context.destination);
          this._mix(true);
        }
        if (this.context.state === 'suspended') await this.context.resume();
        return this.context.state === 'running';
      } catch (error) { this._warn('unlock', error); return false; }
    }

    _warn(id, error) {
      if (global.console) console.warn('[SucculentAudio ' + id + ']', error && error.message ? error.message : error);
    }

    _url(id) {
      const file = this.files[id] || id;
      if (/^(https?:|blob:|data:|file:)/i.test(file)) return file;
      if (!this.files[id] && global.document && document.baseURI) return new URL(file, document.baseURI).href;
      return this.audioBase + file.replace(/^\/+/, '');
    }

    _localFile() { return Boolean(global.location && global.location.protocol === 'file:'); }

    _mix(immediate = false) {
      const values = { master: this.muted ? 0 : clamp(this.levels.master, .8), bgm: clamp(this.levels.bgm, .58) * (this.duckCount ? .35 : 1), sfx: clamp(this.levels.sfx, .8), voice: clamp(this.levels.voice, .9) };
      if (this.context) {
        for (const key of Object.keys(values)) {
          const param = this[key + 'Gain'].gain;
          param.cancelScheduledValues(this.context.currentTime);
          if (immediate) param.setValueAtTime(values[key], this.context.currentTime);
          else param.setTargetAtTime(values[key], this.context.currentTime, key === 'bgm' ? .13 : .025);
        }
      }
      if (this.mediaBgm) this.mediaBgm.volume = values.master * values.bgm;
      for (const clip of this.active.values()) {
        if (clip.media) clip.media.volume = values.master * (clip.bus === 'voice' ? values.voice : values.sfx) * clip.volume;
      }
    }

    setMuted(value) { this.muted = Boolean(value); this._mix(); return this.muted; }
    toggleMuted() { return this.setMuted(!this.muted); }
    setVolume(bus, value) {
      if (!Object.prototype.hasOwnProperty.call(this.levels, bus)) throw new Error('Unknown audio bus: ' + bus);
      this.levels[bus] = clamp(value, this.levels[bus]); this._mix();
    }
    getState() {
      return { muted: this.muted, contextState: this.context ? this.context.state : 'locked', bgmPlaying: Boolean(this.bgmSource || (this.mediaBgm && !this.mediaBgm.paused)), activeClips: this.active.size, levels: Object.assign({}, this.levels), officialCharacterVoicesIncluded: false };
    }

    async _load(id) {
      if (this.cache.has(id)) return this.cache.get(id);
      if (this.pending.has(id)) return this.pending.get(id);
      if (!this.context) throw new Error('Call unlock() from a user gesture first');
      const request = (async () => {
        const response = await fetch(this._url(id));
        if (!response.ok) throw new Error('Audio HTTP ' + response.status + ': ' + id);
        const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
        this.cache.set(id, buffer);
        return buffer;
      })();
      this.pending.set(id, request);
      try { return await request; } finally { this.pending.delete(id); }
    }

    async preload(ids = Object.keys(this.files)) {
      // file:// may not fetch/decode local files. HTMLAudio loads them directly on play.
      if (this._localFile()) return ids.map(id => ({ id, loaded: false, playbackMode: 'local-html-audio' }));
      if (!await this.unlock()) return [];
      return Promise.all(ids.map(async id => {
        try { const buffer = await this._load(id); return { id, loaded: true, duration: buffer.duration }; }
        catch (error) { this._warn(id, error); return { id, loaded: false }; }
      }));
    }

    async startBgm() {
      this.bgmWanted = true;
      if (this.destroyed || (global.document && document.hidden) || this.bgmSource) return false;
      if (this.bgmStarting) return this.bgmStarting;
      this.bgmStarting = (async () => {
        try {
          if (this._localFile()) return await this._startMediaBgm();
          if (!await this.unlock()) return this._startMediaBgm();
          const buffer = await this._load('bgm');
          if (!this.bgmWanted || this.destroyed || this.bgmSource || (global.document && document.hidden)) return false;
          const source = this.context.createBufferSource();
          source.buffer = buffer; source.loop = true; source.loopStart = 0; source.loopEnd = buffer.duration;
          source.connect(this.bgmGain);
          this.bgmSource = source;
          this.bgmOffset = this.bgmOffset % buffer.duration;
          this.bgmStarted = this.context.currentTime;
          this.bgmGain.gain.setValueAtTime(0, this.context.currentTime);
          this.bgmGain.gain.setTargetAtTime(clamp(this.levels.bgm, .58) * (this.duckCount ? .35 : 1), this.context.currentTime, .1);
          source.start(0, this.bgmOffset);
          return true;
        } catch (error) { this._warn('bgm', error); return this._startMediaBgm(); }
        finally { this.bgmStarting = null; }
      })();
      return this.bgmStarting;
    }

    async _startMediaBgm() {
      if (this.destroyed || !this.bgmWanted || !global.Audio || (global.document && document.hidden)) return false;
      if (!this.mediaBgm) { this.mediaBgm = new Audio(this._url('bgm')); this.mediaBgm.loop = true; this.mediaBgm.preload = 'auto'; }
      this._mix();
      try { await this.mediaBgm.play(); return true; }
      catch (error) { this._warn('bgm-media', error); return false; }
    }

    pauseBgm(clearWanted = true) {
      if (clearWanted) this.bgmWanted = false;
      if (this.bgmSource && this.context) {
        const source = this.bgmSource;
        this.bgmOffset += Math.max(0, this.context.currentTime - this.bgmStarted);
        this.bgmSource = null;
        source.stop(); source.disconnect();
      }
      if (this.mediaBgm) this.mediaBgm.pause();
    }

    async _clip(id, options = {}) {
      if (this.destroyed) return { finished: Promise.resolve(false), stop() {} };
      const version = this.cancelVersion;
      const cancelled = () => this.destroyed || version !== this.cancelVersion;
      const stopped = () => ({ finished: Promise.resolve(false), stop() {} });
      const key = options.key || id;
      const bus = options.bus === 'voice' ? 'voice' : 'sfx';
      const volume = clamp(options.volume, 1);
      if (this._localFile()) return this._mediaClip(id, { key, bus, volume });
      try {
        if (!await this.unlock()) throw new Error('WebAudio is unavailable');
        if (cancelled()) return stopped();
        const buffer = await this._load(id);
        if (cancelled()) return stopped();
        const prior = this.active.get(key);
        if (prior) prior.stop();
        if (bus === 'sfx') {
          const sfx = [...this.active.values()].filter(item => item.bus === 'sfx');
          if (sfx.length >= 4) sfx[0].stop();
        }
        const source = this.context.createBufferSource(), gain = this.context.createGain();
        source.buffer = buffer; gain.gain.value = volume;
        source.connect(gain); gain.connect(bus === 'voice' ? this.voiceGain : this.sfxGain);
        let resolve;
        const finished = new Promise(done => { resolve = done; });
        const clip = { key, bus, volume, finished, stop: () => {
          try { gain.gain.setTargetAtTime(0, this.context.currentTime, .006); source.stop(this.context.currentTime + .025); } catch (_) { complete(false); }
        } };
        const complete = result => { if (this.active.get(key) === clip) this.active.delete(key); source.disconnect(); gain.disconnect(); resolve(result); };
        source.onended = () => complete(true);
        this.active.set(key, clip); source.start();
        return clip;
      } catch (error) {
        if (cancelled()) return stopped();
        this._warn(id, error);
        return this._mediaClip(id, { key, bus, volume });
      }
    }

    _mediaClip(id, options) {
      if (!global.Audio || this.destroyed) return { finished: Promise.resolve(false), stop() {} };
      const prior = this.active.get(options.key); if (prior) prior.stop();
      if (options.bus === 'sfx') {
        const sfx = [...this.active.values()].filter(item => item.bus === 'sfx');
        if (sfx.length >= 4) sfx[0].stop();
      }
      const media = new Audio(this._url(id));
      let resolve, completeCalled = false;
      const finished = new Promise(done => { resolve = done; });
      const complete = played => {
        if (completeCalled) return; completeCalled = true;
        if (this.active.get(options.key) === clip) this.active.delete(options.key);
        media.onended = null; media.onerror = null; resolve(played);
      };
      const clip = Object.assign({ media, finished, stop: () => { media.pause(); complete(false); } }, options);
      this.active.set(options.key, clip); this._mix();
      media.onended = () => complete(true); media.onerror = () => complete(false);
      try { Promise.resolve(media.play()).catch(() => complete(false)); } catch (_) { complete(false); }
      return clip;
    }

    async play(event, detail = {}) {
      if (event === 'harvest.normal' || event === 'plant.mature' || event === 'ordinary') return { played: false, reason: 'ordinary-harvest-silent' };
      if (event === 'reveal' || event === 'harvest.special') return this.playReveal(detail);
      if (event === 'seed.exchange') {
        const variants = { quality: 'seedQuality', premium: 'seedQuality', zodiac: 'seedZodiac', cow: 'seedCow', dragon: 'seedDragon', legend: 'seedLegend', legendary: 'seedLegend' };
        event = variants[detail.kind] || 'seedQuality';
      }
      const shortAliases = { chime: 'star', sunshine: 'sun', finale: 'ending', exchange: 'seedQuality', plant: 'button', harvest: 'revealDemo' };
      if (event === 'harvest') return { played: false, reason: 'use-playReveal-for-special-harvest' };
      event = shortAliases[event] || event;
      const id = EVENTS[event] || event;
      if (!this.files[id]) return { played: false, reason: 'unknown-event' };
      const now = Date.now(), throttle = id === 'water' ? 160 : 65;
      if (now - (this.lastPlayed.get(id) || 0) < throttle) return { played: false, reason: 'throttled' };
      this.lastPlayed.set(id, now);
      const clip = await this._clip(id, { key: id, volume: detail.volume });
      return { played: await clip.finished, id };
    }

    playReveal(options = {}) {
      if (options.ordinary || options.series === 'ordinary' || options.special === false) return Promise.resolve({ played: false, reason: 'ordinary-harvest-silent' });
      const version = this.cancelVersion;
      const run = async () => {
        if (this.destroyed || version !== this.cancelVersion) return { played: false, cancelled: true };
        this.duckCount++; this._mix();
        let voicePlayed = false;
        try {
          // Caller supplies a real file when available. Missing voices use an original instrumental cue.
          const primaryId = options.voiceUrl || ((options.series || options.family) === 'cat' ? 'cat' : 'revealDemo');
          const primary = await this._clip(primaryId, { key: 'reveal-primary', bus: options.voiceUrl ? 'voice' : 'sfx' });
          const primaryPlayed = await primary.finished;
          voicePlayed = Boolean(options.voiceUrl && primaryPlayed);
          if (this.destroyed || version !== this.cancelVersion) return { played: false, cancelled: true };
          invoke(options.onPrimaryEnd, { voicePlayed, originalDemoCue: !options.voiceUrl });
          invoke(options.onVoiceEnd, { voicePlayed, originalDemoCue: !options.voiceUrl });
          const star = await this._clip('star', { key: 'reveal-star' });
          const played = await star.finished;
          const result = { played, voicePlayed, originalDemoCue: !options.voiceUrl, officialVoiceClaimed: false };
          invoke(options.onComplete, result);
          return result;
        } catch (error) {
          this._warn('reveal', error);
          const result = { played: false, voicePlayed, reason: 'audio-unavailable' };
          invoke(options.onVoiceEnd, result); invoke(options.onComplete, result);
          return result;
        } finally { this.duckCount = Math.max(0, this.duckCount - 1); this._mix(); }
      };
      const result = this.sequence.then(run, run);
      this.sequence = result.catch(() => {});
      return result;
    }

    stopEffects() {
      this.cancelVersion++;
      for (const clip of [...this.active.values()]) clip.stop();
      this.duckCount = 0; this._mix();
    }
    stopAll() { this.pauseBgm(); this.stopEffects(); this.bgmOffset = 0; if (this.mediaBgm) { try { this.mediaBgm.currentTime = 0; } catch (_) {} } }
    destroy() {
      if (this.destroyed) return;
      this.stopAll(); this.destroyed = true;
      if (global.document) document.removeEventListener('visibilitychange', this._visibility);
      if (this.context) this.context.close();
      this.cache.clear(); this.pending.clear();
    }
  }
  SucculentAudio.files = FILES;
  SucculentAudio.events = EVENTS;
  global.SucculentAudio = SucculentAudio;
  global.GardenAudio = Object.freeze({ create: options => new SucculentAudio(options), files: FILES, events: EVENTS, version: 'h5-demo-1' });
})(typeof window !== 'undefined' ? window : globalThis);
