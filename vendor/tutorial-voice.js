/* Ordinary local Chinese reading for tutorials. Not any character's original voice. */
(function (global) {
  'use strict';
  const LABEL = '普通中文朗读 · 非角色原声';
  const pending = [];
  let active = null, muted = false, serial = 0;
  const synth = global.speechSynthesis;
  const available = () => Boolean(synth && global.SpeechSynthesisUtterance && typeof synth.getVoices === 'function' && typeof synth.speak === 'function');
  const later = callback => Promise.resolve().then(callback);
  const clock = () => global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
  const safeCall = (callback, result) => { if (typeof callback === 'function') { try { callback(result); } catch (error) { if (global.console) console.warn('[GardenVoices callback]', error); } } };
  const voices = () => { try { return available() ? synth.getVoices() : []; } catch (_) { return []; } };
  const localChinese = () => voices().filter(voice => voice.localService === true && /^zh(?:[-_]|$)/i.test(voice.lang || ''));
  const pickVoice = () => {
    const list = localChinese();
    return list.find(voice => /^zh[-_]CN$/i.test(voice.lang)) || list.find(voice => voice.default) || list[0] || null;
  };
  function finish(job, status, extra) {
    if (!job || job.done) return;
    job.done = true;
    clearTimeout(job.startTimer); clearTimeout(job.endTimer);
    if (job.utterance) job.utterance.onstart = job.utterance.onend = job.utterance.onerror = null;
    if (active === job) active = null;
    const result = Object.assign({status, spoken: status === 'spoken', label: LABEL, officialVoice: false, localOnly: true, id: job.id}, extra || {});
    safeCall(job.options.onEnd, result);
    job.resolve(result);
    later(drain);
  }
  function stopEngine() { try { if (synth && typeof synth.cancel === 'function') synth.cancel(); } catch (_) {} }
  function timeout(job, reason) {
    if (job.done) return;
    if (job.utterance) job.utterance.onstart = job.utterance.onend = job.utterance.onerror = null;
    stopEngine(); finish(job, 'unavailable', {reason});
  }
  function drain() {
    if (active || !pending.length) return;
    const job = pending.shift();
    if (job.done) { later(drain); return; }
    if (muted || job.options.muted) { finish(job, 'muted'); return; }
    if (!available()) { finish(job, 'unavailable', {reason: 'speech-api-unavailable'}); return; }
    const voice = pickVoice();
    if (!voice) { finish(job, 'unavailable', {reason: 'no-local-chinese-voice'}); return; }
    active = job;
    try {
      const utterance = job.utterance = new global.SpeechSynthesisUtterance(job.text);
      utterance.voice = voice;
      utterance.lang = voice.lang || 'zh-CN';
      utterance.rate = 1.02;
      utterance.pitch = 1.05;
      utterance.volume = .9;
      const speechTimeout = Math.min(20000, Math.max(5000, job.text.length * 330 + 1500));
      utterance.onstart = () => {
        if (job.done) return;
        job.startedAt = clock();
        clearTimeout(job.startTimer);
        job.endTimer = setTimeout(() => timeout(job, 'speech-end-timeout'), speechTimeout);
      };
      utterance.onend = event => finish(job, 'spoken', {voiceName: voice.name, lang: voice.lang, localService: true,
        elapsedSeconds: Math.round(Math.max(0, clock() - (job.startedAt ?? job.requestedAt)))/1000,
        engineElapsedTimeRaw: Number(event && event.elapsedTime) || 0});
      utterance.onerror = event => {
        const error = event && event.error || 'speech-error';
        const status = /^(interrupted|canceled)$/.test(error) ? 'cancelled' : /^(not-allowed|voice-unavailable|synthesis-unavailable|language-unavailable)$/.test(error) ? 'unavailable' : 'error';
        finish(job, status, {reason: error});
      };
      job.startTimer = setTimeout(() => timeout(job, 'speech-start-timeout'), 1800);
      if (synth.paused && typeof synth.resume === 'function') synth.resume();
      job.requestedAt = clock();
      synth.speak(utterance);
    } catch (error) { finish(job, 'unavailable', {reason: 'speech-exception', message: String(error && error.message || error)}); }
  }
  function play(text, options = {}) {
    return new Promise(resolve => {
      const job = {id: ++serial, text: String(text == null ? '' : text).trim(), options, resolve, done: false};
      if (muted || options.muted) { finish(job, 'muted'); return; }
      if (!job.text || job.text.length > 280) { finish(job, 'unavailable', {reason: !job.text ? 'empty-text' : 'text-too-long'}); return; }
      if (!available()) { finish(job, 'unavailable', {reason: 'speech-api-unavailable'}); return; }
      const activation = global.navigator && global.navigator.userActivation;
      if (activation && !activation.isActive && !activation.hasBeenActive) { finish(job, 'unavailable', {reason: 'user-gesture-required'}); return; }
      if (!pickVoice()) { finish(job, 'unavailable', {reason: 'no-local-chinese-voice'}); return; }
      if (pending.length >= 8) { finish(job, 'unavailable', {reason: 'queue-full'}); return; }
      pending.push(job);
      // The first speak call stays inside the actual click handler; later jobs remain serial.
      drain();
    });
  }
  function cancel(reason = 'cancelled') {
    const jobs = pending.splice(0);
    const current = active;
    if (current) {
      // Detach before cancel: engines may synchronously report an interrupted event.
      if (current.utterance) current.utterance.onstart = current.utterance.onend = current.utterance.onerror = null;
      stopEngine();
      finish(current, reason === 'muted' ? 'muted' : 'cancelled', {reason});
    }
    for (const job of jobs) finish(job, reason === 'muted' ? 'muted' : 'cancelled', {reason});
    return {cancelled: jobs.length + (current ? 1 : 0)};
  }
  function setMuted(value) { muted = Boolean(value); if (muted) cancel('muted'); return muted; }
  function getState() {
    return {supported: available(), localChineseVoices: localChinese().map(voice => ({name: voice.name, lang: voice.lang, localService: true})), active: Boolean(active), queued: pending.length, muted, label: LABEL, officialVoice: false};
  }
  // Warm up the asynchronous device voice list; never request a remote voice or play automatically.
  voices();
  if (global.addEventListener) global.addEventListener('pagehide', () => cancel('page-hidden'));
  if (global.document) document.addEventListener('visibilitychange', () => { if (document.hidden) cancel('page-hidden'); });
  global.GardenVoices = Object.freeze({play, cancel, setMuted, getState, label: LABEL, version: '3.0-local-tts'});
})(typeof window !== 'undefined' ? window : globalThis);
