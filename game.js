(function () {
  'use strict';
  const Core = window.GardenCore, $ = selector => document.querySelector(selector);
  const STORE = 'genggeng-garden-guide-v3', SETTINGS = 'genggeng-garden-guide-settings-v3';
  let storageOK = true, loaded = null, settings = { muted: false, lowEffects: false };
  try { loaded = JSON.parse(localStorage.getItem(STORE)); settings = Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS)) || {}); } catch (_) { storageOK = false; }
  let state = Core.restore(loaded), modalType = '', pending = null, modalToken = 0, toastTimer, catTimer, ambientHandle;
  let activeLighting = null, audio = null, particles = null, sceneParticles = null, lighting = null;
  let guide = null, atlasFilter = 'all', theatrePlaying = false;
  let voiceSession = 0, voiceBusy = false;
  let disposed = false;
  const game = $('#game'), overlay = $('#overlay'), box = $('#modal-box');
  const art = file => 'assets/plants/' + file;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); storageOK = true; } catch (_) { storageOK = false; }
    $('#save-status').textContent = storageOK ? '已自动保存' : '本次游玩有效';
  }
  function saveSettings() { try { localStorage.setItem(SETTINGS, JSON.stringify(settings)); } catch (_) {} }
  function sound(event, options) { if (audio) return Promise.resolve(audio.play(event, options)).catch(() => null); return Promise.resolve(null); }
  const isNailong = item => item.series === 'expression' || item.series === 'zodiac';
  const voiceNote = item => isNailong(item) ? '两段奶龙彩蛋 · 星光收尾' : item.series === 'cat' ? '软喵彩蛋小声音 · 星光收尾' : '普通中文朗读 · 非角色原声 · 原创情绪音效';
  function cancelVoicePlayback() {
    voiceSession++;
    if (voiceBusy) {
      window.GardenVoices?.cancel();
      audio?.stopEffects();
      audio?.setVolume('bgm', .58);
    }
    voiceBusy = false; theatrePlaying = false;
  }
  function beginVoicePlayback(dragon) {
    cancelVoicePlayback(); voiceBusy = true;
    audio?.setVolume('bgm', dragon ? .12 : .22);
    return voiceSession;
  }
  const voiceIsCurrent = session => session === voiceSession && !disposed;
  function finishVoicePlayback(session) {
    if (!voiceIsCurrent(session)) return;
    voiceBusy = false; audio?.setVolume('bgm', .58);
  }
  async function playCatCompanion() {
    if (voiceBusy) return;
    const session = beginVoicePlayback(true);
    try { await sound('cat'); } finally { finishVoicePlayback(session); }
  }
  function toast(text, timeout = 3000) {
    if (guide?.isActive()) { guide.feedback(text); return; }
    $('#toast').textContent = text; $('#toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), timeout);
  }
  function say(text, speaker = '小店长') { $('#dialogue-text').textContent = text; $('.speaker').textContent = speaker; }
  function lightCards() { if (lighting) document.querySelectorAll('.spirit-card[data-series]').forEach(el => lighting.decorateCard(el, el.dataset.series)); }
  function clearModalEffects() {
    if (activeLighting) { activeLighting.clear(); activeLighting = null; }
    if (particles) particles.clear();
  }
  function protectParticleText() {
    if(!particles)return;
    const gr=game.getBoundingClientRect();
    const nodes=overlay.classList.contains('hide')?[...game.querySelectorAll('.topbar,.resources,.quest-panel,.care-panel,.bottom-nav')]:[...box.querySelectorAll('h2,h3,.quote,.girl-note,.sound-note,.card-serial,.helper-note,.modal-eyebrow,button')];
    particles.setSafeAreas(nodes.filter(n=>n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return{x:(r.left-gr.left-4)/gr.width,y:(r.top-gr.top-3)/gr.height,width:(r.width+8)/gr.width,height:(r.height+6)/gr.height,normalized:true};}));
  }
  function modal(html, type, dismissible = true) {
    cancelVoicePlayback(); modalToken++; clearModalEffects(); modalType = type;
    box.innerHTML = (dismissible ? '<button class="modal-close" data-action="close" aria-label="关闭弹窗">×</button>' : '') + html;
    box.scrollTop = 0; overlay.classList.remove('hide');
    game.querySelectorAll('.bottom-nav button').forEach(x => x.classList.toggle('active', x.dataset.tab === type));
    requestAnimationFrame(lightCards);
    const focusable = box.querySelector('button:not(:disabled)');
    if (focusable) focusable.focus({ preventScroll: true });
    return modalToken;
  }
  function closeModal() {
    if (modalType === 'reveal' && pending) return;
    cancelVoicePlayback(); modalToken++; overlay.classList.add('hide'); box.innerHTML = ''; clearModalEffects(); modalType = '';
    document.querySelectorAll('.bottom-nav button').forEach(x => x.classList.toggle('active', x.dataset.tab === 'garden'));
  }
  function setSoundButton() {
    window.GardenVoices?.setMuted(settings.muted);
    $('#sound-button').textContent = settings.muted ? '♪' : '♫';
    $('#sound-button').setAttribute('aria-label', settings.muted ? '开启声音' : '关闭声音');
    $('#sound-button').title = settings.muted ? '点击开启声音' : '点击关闭声音';
    $('#sound-button').style.opacity = settings.muted ? '.5' : '1';
  }
  try {
    audio = window.GardenAudio?.create({ baseUrl: 'audio/', muted: settings.muted, files: { task: 'guide_task_claim_v3.wav', chapter: 'guide_chapter_unlock_v3.wav', dragonHappy: 'guide_dragon_happy_v3.wav', dragonSad: 'guide_dragon_sad_v3.wav', nailongVoice: 'nailong_team_voice_v1.wav', nailongVoiceAlt: 'nailong_team_voice_v2.wav', cat: 'cat_team_voice_v1.wav', memeBeat: 'guide_meme_beat_v3.wav', hint: 'guide_task_hint_v3.wav' } });
    const quality = settings.lowEffects || innerWidth < 400 ? 'low' : 'high';
    if (window.GengGengParticles) {
      particles = new GengGengParticles.Engine($('#effect-stage'), { quality, zIndex: 1, safeAreas: [] });
      sceneParticles = new GengGengParticles.Engine($('#scene-light-host'), { quality: 'low', zIndex: 2, safeAreas: [{ x: 0, y: .68, width: 1, height: .32, normalized: true }] });
    }
    if (window.GengGengLighting) {
      lighting = new GengGengLighting('#scene-light-host', { assetBase: './assets/lighting/' });
      lighting.mountScene({ progress: Core.stage(state), ambient: .20, sunlight: .25, sky: .08, zIndex: 0 });
    }
  } catch (error) { console.warn('Optional visual module:', error.message); }
  setSoundButton();
  function ambient() { if (sceneParticles && !ambientHandle) ambientHandle = sceneParticles.play('ambient', { loop: true, duration: 16, origin: { x: .6, y: .4 } }); }
  function render() {
    const now = Date.now(), stage = Core.stage(state), total = state.totalHarvests;
    game.dataset.stage = stage;
    game.dataset.theme = state.decor.theme;
    game.dataset.potTheme = state.decor.pot;
    $('#coins').textContent = state.coins; $('#stars').textContent = state.stars;
    $('#card-count').textContent = Object.values(state.cards).reduce((a, b) => a + b, 0);
    const goal = total < 3 ? 3 : total < 5 ? 5 : Core.SPECIES.length;
    const current = total < 5 ? Math.min(total, goal) : state.discovered.length;
    $('#quest-count').textContent = current + ' / ' + goal;
    $('#quest-fill').style.width = Math.min(100, current / goal * 100) + '%';
    $('#quest-text').textContent = total < 1 ? '先培育一颗种子，让小店重新热闹起来。' : state.discovered.length < Core.SPECIES.length ? '七本精灵卡册，等你慢慢填满。还差' + (Core.SPECIES.length - state.discovered.length) + '位小伙伴。' : '十三位小伙伴都到齐了，继续照顾我们的温暖小家。';
    $('#shop-stage').textContent = ['等待第一片新叶', '小店渐渐有了生机', '梗梗多肉 · 重新营业'][stage];
    $('#shop-sign').style.opacity = state.decor.sign ? '1' : '0';
    let flowers = $('.flower-decor');
    if (state.decor.flowers && !flowers) { flowers = document.createElement('div'); flowers.className = 'flower-decor'; flowers.innerHTML = '<span>✿</span><span>✾</span><span>✿</span>'; game.appendChild(flowers); }
    if (flowers) flowers.hidden = !state.decor.flowers;
    for (let i = 0; i < 3; i++) {
      const button = document.querySelector('[data-pot="' + i + '"]'), p = state.pots[i], locked = i >= Core.unlockedPots(state);
      const ps = Core.potStage(p, now), seed = p && Core.SEEDS[p.seedId];
      button.classList.toggle('locked', locked); button.classList.toggle('selected', state.selectedPot === i);
      button.classList.toggle('growing', !!p && ps !== 'ready'); button.classList.toggle('ready', ps === 'ready');
      button.querySelector('.pot-topline').textContent = locked ? '等待解锁' : !p ? '等一颗种子' : ps === 'seed' ? '种子睡着啦' : ps === 'sprout' ? '小芽在长大' : ps === 'glow' ? '快要成熟啦' : '可以收获啦';
      const imageFile = !p ? 'plant-17.png' : ps === 'seed' ? seed.art : ps === 'sprout' ? 'plant-11.png' : 'plant-09.png';
      const img = button.querySelector('.pot-art img');
      if (img.dataset.file !== imageFile) { img.src = art(imageFile); img.dataset.file = imageFile; }
      img.alt = locked ? '尚未解锁的花盆' : !p ? '笑脸花盆' : ps === 'seed' ? seed.name : '正在成长的多肉';
      button.querySelector('.pot-state').textContent = locked ? '收获' + (i === 1 ? 1 : 3) + '张卡牌解锁' : !p ? '点击播种' : ps === 'ready' ? '点击收获 ✦' : p.tutorialHold ? '跟着引导，陪它长大' : Math.max(1, Math.ceil((p.readyAt - now) / 1000)) + ' 秒后成熟';
      button.querySelector('.pot-progress i').style.width = !p ? '0' : p.tutorialHold ? (10 + p.growth * 22) + '%' : Math.max(0, Math.min(100, (now - p.plantedAt) / Math.max(1, p.readyAt - p.plantedAt) * 100)) + '%';
      if (p && !p.sprouted && ps !== 'seed') { p.sprouted = true; sound('sprout'); save(); }
    }
    const p = state.pots[state.selectedPot], ready = p && !p.tutorialHold && now >= p.readyAt;
    $('#active-pot-label').textContent = '0' + (state.selectedPot + 1) + '号花盆 · ' + (!p ? '等你播种' : ready ? '收获这份小惊喜' : Core.SEEDS[p.seedId].name);
    $('#growth-count').textContent = '陪伴成长 ' + (p?.growth || 0) + ' / 4';
    document.querySelectorAll('#growth-track i').forEach((x, i) => x.classList.toggle('filled', (p?.growth || 0) > i));
    for (const type of ['water', 'sun', 'cat']) {
      const button = $('#' + type + '-button'), done = p && (type === 'cat' ? p.catHelpCount >= 2 : p[type]);
      button.disabled = !p || ready || !!done; button.classList.toggle('done', !!done);
      button.querySelector('small').textContent = done ? '已陪伴' : type === 'cat' && p?.catHelpCount ? '再陪一次 +1' : '成长 +1';
    }
    $('#plant-button').classList.toggle('hide', !!ready); $('#plant-button').disabled = !!p;
    $('#plant-button').innerHTML = !p ? '选择种子 · 开始培育 <span>↗</span>' : p.tutorialHold ? '跟着小猫的提示，慢慢照料吧' : '陪它慢慢长大 · ' + Math.max(1, Math.ceil((p.readyAt - now) / 1000)) + ' 秒';
    $('#finish-button').classList.toggle('hide', !p || ready); $('#harvest-button').classList.toggle('hide', !ready);
    if (lighting && render.lastStage !== stage) { lighting.setProgress(stage); render.lastStage = stage; }
    if(particles?.stats.activeEffects)protectParticleText();
    guide?.update();
  }
  function seedModal(index) {
    if (index >= Core.unlockedPots(state)) { toast('再收获' + ((index === 1 ? 1 : 3) - state.totalHarvests) + '张卡牌，就能解锁这个花盆。'); return; }
    state.selectedPot = index; render();
    modal('<p class="modal-eyebrow">A LITTLE SEED, A NEW STORY</p><h2>种下今天的小期待</h2><p class="modal-lead">0' + (index + 1) + '号花盆已经准备好了。选一颗种子吧。</p><div class="seed-list">' + Object.values(Core.SEEDS).filter(seed => ['normal','rainbow','quality','cat'].includes(seed.id) || state.seedStock[seed.id] > 0).map(seed => {
      const locked = state.totalHarvests < seed.unlock, stock = seed.id === 'normal' ? '免费 · 无限' : '库存 ' + state.seedStock[seed.id];
      const empty = seed.id !== 'normal' && state.seedStock[seed.id] < 1;
      return '<button class="seed-option" data-seed="' + seed.id + '"' + (locked || empty ? ' disabled' : '') + '><img src="' + art(seed.art) + '" alt="' + seed.name + '"><div class="seed-info"><b>' + seed.name + '</b><p>' + seed.desc + '</p><small>' + (locked ? '累计收获' + seed.unlock + '张卡牌后解锁' : stock + ' · ' + seed.label) + '</small></div><span class="seed-tag">' + seed.duration / 1000 + '秒</span></button>';
    }).join('') + '</div><p class="helper-note">浇水、阳光、小猫陪伴都会增加成长值。<br>普通种子不会长出限定小猫。优质及限定种子里，藏着软喵小惊喜。</p>', 'seeds');
  }
  function chooseSeed(id) {
    try {
      Core.plant(state, state.selectedPot, id); save(); closeModal(); render(); sound('confirm');
      say('种子已经睡进土里了。浇一点水，再请小猫来陪陪它。');
      $('#companion').style.right = [65, 38, 12][state.selectedPot] + '%';
      guide?.notify('plant', { seed: id });
    } catch (error) { toast(error.message); }
  }
  function care(type) {
    const success = Core.interact(state, state.selectedPot, type);
    if (!success) { if (type === 'cat') companion(); return; }
    if (type === 'cat') playCatCompanion(); else sound(type);
    save(); render(); careVisual(type);
    if (type === 'water') say('水滴落进泥土里，它已经听见你的照顾啦。');
    if (type === 'sun') say('晒一点温柔的太阳，叶片也想伸个小懒腰。');
    if (type === 'cat') { say('喵！我会守在这里，陪它长大。', '小猫'); companion(false); }
    guide?.notify('care', { type });
  }
  function careVisual(type) {
    const pot = document.querySelector('[data-pot="' + state.selectedPot + '"]');
    const fx = document.createElement('div'); fx.className = 'care-splash care-' + type;
    fx.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < (type === 'water' ? 7 : 4); i++) {
      const bit = document.createElement('i');
      bit.textContent = type === 'cat' ? '♡' : type === 'sun' ? '✦' : '';
      bit.style.setProperty('--drift', (i - 3) * 7 + 'px');
      bit.style.animationDelay = i * .045 + 's'; fx.appendChild(bit);
    }
    pot.querySelector('.pot-art').appendChild(fx);
    setTimeout(() => fx.remove(), 1300);
  }
  function companion(withSound = true) {
    const cat = $('#companion'); cat.classList.remove('cuddle'); void cat.offsetWidth; cat.classList.add('cuddle', 'talking');
    const lines = ['今天也要一起加油喵！', '它好像快要发芽了！', '你慢慢来，我一直都在。', '给你一颗软乎乎的心。'];
    cat.querySelector('span').textContent = lines[Math.floor(Math.random() * lines.length)];
    clearTimeout(catTimer); catTimer = setTimeout(() => cat.classList.remove('talking', 'cuddle'), 3000);
    if (withSound) playCatCompanion();
  }
  function finalize(index, cropId) {
    const reward = Core.collect(state, index, cropId);
    if (!reward) return;
    pending = null; save(); closeModal(); render();
    if (reward.isNew) $('#atlas-badge').classList.add('new');
    if (reward.rewards.length) { sound('growth'); toast('解锁：' + reward.rewards.join('、'), 4000); }
    else toast('已收录 ' + reward.item.name + ' · 卡牌 +1 · 培育星星 +10');
    say(reward.item.girl);
    guide?.notify('collect', { id: reward.item.id });
    if (reward.ending && !state.tutorial.active) setTimeout(showEnding, 450);
    else if (state.discovered.length === Core.SPECIES.length && particles) particles.play('collection', { duration: 3, origin: { x: .5, y: .4 } });
  }
  async function harvest() {
    const index = state.selectedPot, p = state.pots[index];
    if (!p || modalType === 'reveal') return;
    let item;
    try { item = Core.reveal(state, index); save(); } catch (error) { toast(error.message); return; }
    if (item.series === 'ordinary' && state.totalHarvests > 0) { finalize(index, p.cropId); return; }
    pending = { index, cropId: p.cropId };
    const first = state.totalHarvests === 0, special = item.series !== 'ordinary';
    const token = modal('<div class="reveal"><p class="modal-eyebrow">' + (first ? 'OUR FIRST LITTLE LEAF' : 'A LITTLE MIRACLE') + '</p><h2>' + (first ? '第一片新叶' : item.series === 'sheep' ? '珍贵异变！' : '异变成功！') + '</h2><span class="rarity-badge">' + item.rarity + ' · ' + (state.discovered.includes(item.id) ? '再次相遇' : '初次相遇') + '</span><div id="reveal-art" class="reveal-orbit"><img src="' + art(item.art) + '" alt="' + item.name + '"></div><h2>' + item.name + '</h2><div class="card-serial">COLLECTION · No. ' + item.no + ' / 13</div><p class="quote">“' + item.quote + '”</p><p class="girl-note">' + item.girl + '</p><p class="sound-note" id="reveal-sound-note">' + (special ? voiceNote(item) : '每一片新叶，都值得被好好收藏。') + '</p><button id="collect-button" class="primary-button"' + (special ? ' disabled' : '') + '>' + (special ? '听一听这份小惊喜…' : '收进我的收藏卡册') + '</button></div>', 'reveal', false);
    guide?.notify('harvest', { id: item.id });
    if (special) {
      if (lighting) activeLighting = lighting.showSpecial(item.series, { target: '#reveal-art', eventId: p.cropId });
      protectParticleText();
      if (particles) particles.play(item.series === 'cat' ? 'cat' : item.series === 'sheep' ? 'sheep' : 'special', { duration: 4, origin: { x: .5, y: .43 } });
      try { await speakSpirit(item); } catch (_) { if ($('#reveal-sound-note')) $('#reveal-sound-note').textContent = '台词已留下，仍可正常收藏这份惊喜。'; }
      if (token !== modalToken) return;
      const button = $('#collect-button');
      if (button) { button.disabled = false; button.textContent = '收进我的收藏卡册'; button.focus({ preventScroll: true }); }
    }
  }
  function card(item, bag) {
    const known = state.discovered.includes(item.id), count = state.cards[item.id] || 0;
    return '<button class="spirit-card' + (known ? '' : ' is-locked') + '" data-spirit="' + item.id + '"' + (known ? ' data-series="' + item.series + '"' : '') + '><span class="card-rarity">No.' + item.no + ' · ' + (known ? item.rarity : '等待相遇') + '</span>' + (known ? '<img class="card-image" src="' + art(item.art) + '" alt="' + item.name + '">' : '<div class="unknown">?</div>') + '<b>' + (known ? item.name : '还没有遇见它') + '</b><small>' + (known ? bag ? '持有 ' + count + ' 张卡牌' : '已点亮 · 点击看看' : item.id === 'cat' ? '限定种子里的小秘密' : '陪伴一颗种子，等它回应') + '</small></button>';
  }
  function showAtlas() {
    $('#atlas-badge').classList.remove('new'); sound('page');
    const groups = [['all','全部'],['ordinary','普通多肉'],['legend','热梗传说'],['zodiac','奶龙生肖'],['cow','哞哞表情'],['expression','奶龙表情'],['cat','软喵限定'],['sheep','珍贵小羊']];
    const items = Core.SPECIES.filter(x => atlasFilter === 'all' || x.series === atlasFilter);
    modal('<p class="modal-eyebrow">SEVEN ALBUMS · THIRTEEN LITTLE FRIENDS</p><div class="book-title"><h2>七本精灵卡册</h2><span class="book-count">' + state.discovered.length + ' / 13</span></div><p class="modal-lead">每只小伙伴都有自己的表情、心情和故事。选一本，慢慢翻开。</p><div class="album-filters">' + groups.map(([id,name]) => '<button data-filter="' + id + '" class="' + (atlasFilter === id ? 'active' : '') + '">' + name + '<small>' + (id === 'all' ? 13 : Core.SPECIES.filter(x=>x.series===id).length) + '</small></button>').join('') + '</div><div class="spirit-grid">' + items.map(x => card(x, false)).join('') + '</div><p class="helper-note">卡牌即使兑换出去了，图鉴里的相遇也会永远留下。</p>', 'atlas');
  }
  function showCards() {
    sound('page');
    const claimed = state.tutorial.claimed.includes('welcome-pack');
    const recipes = [['normal','soft',5,'优质异变种子'],['zodiac','dragon',3,'奶龙限定种子'],['cow','cow',3,'哞哞限定种子'],['expression','dragon_eat',3,'奶龙表情种子'],['legend','bear',2,'传说限定种子']];
    modal('<p class="modal-eyebrow">KEEP THE MEMORY · GROW A NEW SURPRISE</p><h2>收藏与种子兑换</h2><p class="modal-lead">每一次收获都有卡牌。攒下同款，换一颗更特别的种子。</p><div class="welcome-pack"><span>🎁</span><div><b>小店的第一份见面礼</b><small>桃桃软软卡牌 ×4 · 让你体验第一次兑换</small></div><button id="claim-welcome-pack" data-action="claim-welcome-pack"' + (claimed || state.totalHarvests < 1 ? ' disabled' : '') + '>' + (claimed ? '已领取' : '打开礼盒') + '</button></div><div class="exchange-box"><h3>把陪伴，换成下一场期待</h3>' + recipes.map(([kind,id,n,name]) => '<button ' + (kind === 'normal' ? 'id="exchange-normal" ' : '') + 'data-action="recipe" data-recipe="' + kind + '"' + ((state.cards[id] || 0) < n ? ' disabled' : '') + '><b>' + Core.species(id).name + ' ' + (state.cards[id] || 0) + '/' + n + '</b><span>→ ' + name + '</span></button>').join('') + '<button data-action="exchange-rainbow"' + (state.stars < 20 ? ' disabled' : '') + '>20 培育星星 → 彩虹种子 ×1</button></div><h3 class="section-mini-title">我的卡牌 · 共' + Object.values(state.cards).reduce((a,b)=>a+b,0) + '张</h3><div class="spirit-grid">' + Core.SPECIES.filter(x=>state.discovered.includes(x.id)).map(x => card(x, true)).join('') + '</div><p class="helper-note">兑换会真实扣除卡牌，图鉴记录永久保留。<br>普通种子不出限定小猫，优质及限定种子可遇见。</p>', 'cards');
  }
  function detail(id) {
    const item = Core.species(id);
    if (!state.discovered.includes(id)) { toast(item.condition); return; }
    const returnTab = modalType === 'cards' ? 'cards' : 'atlas';
    modal('<p class="modal-eyebrow">COLLECTION · No. ' + item.no + '</p><h2>' + item.name + '</h2><div id="reveal-art" class="detail-art"><img src="' + art(item.art) + '" alt="' + item.name + '"></div><div class="reveal"><span class="rarity-badge">' + item.rarity + ' · 持有 ' + (state.cards[id] || 0) + ' 张</span><p class="quote">“' + item.quote + '”</p><p class="girl-note">小店长：' + item.girl + '</p><button class="primary-button" data-action="replay" data-id="' + id + '">再听听它的小声音 <span>♫</span></button><p class="helper-note">原创演示音效 · 角色台词以文字呈现</p>' + (isNailong(item) ? '<button class="primary-button" data-action="replay" data-id="' + id + '" data-voice="extra">听听新来的奶龙彩蛋 ♫</button>' : '') + '<button class="detail-back" data-action="return-' + returnTab + '">返回' + (returnTab === 'cards' ? '收藏卡牌' : '精灵图鉴') + '</button></div>', 'detail');
    if (lighting && item.series !== 'ordinary') activeLighting = lighting.showSpecial(item.series, { target: '#reveal-art', eventId: 'detail-' + id + '-' + modalToken });
    const note=box.querySelector('.helper-note');if(note)note.textContent=voiceNote(item);
    guide?.notify('detail', { id });
  }
  function showEnding() {
    if (modalType === 'reveal' || state.totalHarvests < 3 || state.endingSeen) return;
    clearTimeout(toastTimer); $('#toast').classList.remove('visible');
    state.endingSeen = true; save();
    modal('<div class="ending"><p class="modal-eyebrow">A NEW CHAPTER BEGINS</p><div class="ending-emblem">✿</div><h2>梗梗多肉培育馆，<br>重新营业啦！</h2><p>灯光亮了，花朵开了。<br>冷清的街角，又传来了轻轻的脚步声。<br>小女孩守住了小店，小猫也守住了她。<br><strong>原来，温柔陪伴真的会有回响。</strong></p><div class="metrics"><span><b>' + state.totalHarvests + '</b>次用心培育</span><span><b>' + state.discovered.length + '</b>位精灵朋友</span><span><b>3</b>个温暖花盆</span></div><button class="primary-button" data-action="continue">继续照顾我们的小店 <span>♡</span></button><p class="helper-note">再收获2张卡牌，就能解锁小猫限定种子。<br>也可以去图鉴看看这一路遇见的伙伴。</p></div>', 'ending', false);
    const endingNote=box.querySelector('.helper-note');
    if(endingNote)endingNote.innerHTML='新手物语已完成，开业纪念卡已收入卡册。<br>接下来可以自由探索13位精灵、8色种子、6段梗剧场与更多街坊委托。';
    const endingEyebrow=box.querySelector('.modal-eyebrow');if(endingEyebrow)endingEyebrow.textContent=state.tutorial.completed?'NINE CHAPTERS · A WARM NEW BEGINNING':'A NEW CHAPTER BEGINS';
    sound('ending');
    if (particles) particles.play('exchange-legend', { duration: 6, origin: { x: .5, y: .31 } });
    companion(false);
  }
  function showDecor() {
    const unlocked = state.totalHarvests >= 3;
    modal('<p class="modal-eyebrow">MAKE THIS PLACE OUR HOME</p><h2>给小店换一身心情</h2><p class="modal-lead">种下三份陪伴，解锁小店装扮。选择后，关上面板就能看到新模样。</p><h3 class="section-mini-title">温室氛围</h3><div class="theme-grid">' + [['spring','春日奶油','#d4e4ae'],['sunset','暖橘落日','#efc399'],['starlight','星糖晚霞','#d3c8e5']].map(([id,name,color])=>'<button data-action="theme-' + id + '" class="theme-tile ' + (state.decor.theme === id ? 'selected' : '') + '"' + (!unlocked ? ' disabled' : '') + '><i style="background:' + color + '"></i><b>' + name + '</b><small>' + (state.decor.theme === id ? '已布置' : '新手赠送 · 点击布置') + '</small></button>').join('') + '</div><h3 class="section-mini-title">笑脸陶盆配色</h3><div class="pot-colors">' + [['cream','奶油陶盆'],['peach','蜜桃陶盆'],['mint','薄荷陶盆']].map(([id,name])=>'<button data-action="pot-' + id + '" class="' + (state.decor.pot === id ? 'selected' : '') + '"' + (!unlocked ? ' disabled' : '') + '>' + name + '</button>').join('') + '</div><div class="decor-option"><span>✿</span><div>窗边小花<small>三次培育的纪念</small></div><button data-action="toggle-flowers"' + (!unlocked ? ' disabled' : '') + '>' + (state.decor.flowers ? '已布置' : '布置') + '</button></div><div class="decor-option"><span>⌂</span><div>温暖小招牌<small>家人留下的小纪念</small></div><button data-action="toggle-sign">' + (state.decor.sign ? '已布置' : '布置') + '</button></div>', 'decor');
  }
  function showSettings() {
    modal('<p class="modal-eyebrow">A LITTLE PAUSE</p><h2>小店设置</h2><div class="settings-list"><div class="settings-row"><span>音乐与音效</span><button data-action="toggle-sound">' + (settings.muted ? '已静音 · 开启' : '播放中 · 静音') + '</button></div><div class="settings-row"><span>轻量粒子模式</span><button data-action="toggle-effects">' + (settings.lowEffects ? '已开启' : '未开启') + '</button></div></div><p class="modal-lead">新手进度、卡牌与装扮自动保存在本机。上一版试营业Demo的进度互不影响。</p><button class="danger-button" data-action="replay-tutorial">重新体验40步新手物语</button><p class="helper-note">13位精灵 · 七本图鉴 · 9章开店任务。<br>奶龙已换上彩蛋小声音，其他伙伴也有自己的情绪回应。<br>所有声音保存在本地，离线也能一起玩。</p>', 'settings');
  }
  function confirmRestart() {
    modal('<p class="modal-eyebrow">START A NEW LITTLE STORY</p><h2>重新开始吗？</h2><p class="modal-lead">这会清空当前进度，从第一颗种子重新开始。原进度会在本机留一份备份。</p><div class="confirm-buttons"><button data-action="cancel-restart">保留我的小店</button><button data-action="confirm-restart">确定重新开始</button></div>', 'restart', false);
  }
  function restart() {
    try { localStorage.setItem(STORE + '-backup', JSON.stringify(state)); } catch (_) {}
    audio?.stopAll(); state = Core.fresh(); pending = null; closeModal(); save(); render();
    window.GardenVoices?.cancel(); guide?.reset();
    $('#story').classList.remove('hide'); $('#story-heading').textContent = '让街角的小店，重新亮起来。';
    $('#start-game').innerHTML = '和小猫开启新手物语 <span>↗</span>';
  }
  async function start() {
    state.started = true; save(); $('#story').classList.add('hide');
    guide?.begin();
    try { if (audio) { await audio.unlock(); await audio.startBgm(); } } catch (_) {}
    render(); ambient(); say(state.totalHarvests ? '欢迎回来，我们的小店一直在等你。' : '先点01号花盆吧。和小猫一起，种下今天的小期待。');
    if (state.totalHarvests >= 3 && !state.endingSeen && !state.tutorial.active) showEnding();
  }
  async function exchange(kind) {
    try {
      const seed = Core.exchange(state, kind);if(kind==='normal'&&state.tutorial.active)state.tutorial.exchangeDone=true;save();render();
      const definition=Core.SEEDS[seed],key={rainbow:'quality',quality:'quality',zodiac:'zodiac',cow:'cow',expression:'nailong',legend:'legend',cat:'legend'}[seed];
      const token=modal('<div class="reveal seed-prize"><p class="modal-eyebrow">CARDS BECOME A NEW LITTLE MIRACLE</p><h2>集卡达成！</h2><span class="rarity-badge">卡牌已兑换 · 稀有种子 +1</span><div id="reveal-art" class="reveal-orbit"><img src="' + art(definition.art) + '" alt="' + definition.name + '"></div><h2>' + definition.name + '</h2><p class="quote">' + definition.label + '，装着下一场相遇。</p><p class="girl-note">新种子已经收入背包。<br>刚才兑换的卡牌会被消耗，图鉴记忆会保留。</p><button class="primary-button" data-action="exchange-return" disabled>稀有种子正在苏醒… ✦</button></div>','exchange',false);
      if(lighting)activeLighting=lighting.showSeedExchange(key,{target:'#reveal-art',eventId:'exchange-'+state.serial+'-'+modalToken});
      protectParticleText();
      if(particles)particles.play(seed==='legend'||seed==='cat'?'exchange-legend':seed==='cow'?'exchange-cow':seed==='expression'?'exchange-expression':seed==='zodiac'?'exchange-dragon':'exchange-quality',{duration:4,origin:{x:.5,y:.42}});
      await Promise.all([sound('exchange',{kind:key}),new Promise(resolve=>setTimeout(resolve,1900))]);
      if(token!==modalToken)return;
      if(guide?.isActive())guide.notify('exchange',{kind,seed});
      else{const button=box.querySelector('[data-action="exchange-return"]');button.disabled=false;button.textContent='收下种子 · 回温室播种';}
    } catch (error) { toast(error.message); }
  }
  const MEMES = [
    { id: 'dragon-eat', spirit: 'dragon_eat', title: '奶龙干饭时刻', line: '干饭！我来了！', reply: '小猫：碗已经摆好啦，培育也要这么积极喵！', mood: 'dragonHappy', tag: '元气开张' },
    { id: 'dragon-sad', spirit: 'dragon_sad', title: '委屈奶龙求抱抱', line: '呜呜呜……给我一个抱抱。', reply: '小店长：难过也没关系，我们会陪着你。', mood: 'dragonSad', tag: '治愈陪伴' },
    { id: 'dragon-chill', spirit: 'dragon_chill', title: '奶龙先躺一会', line: '不想动，先晒会儿太阳。', reply: '小猫：这块窗台，我分你一半。', mood: 'dragonHappy', tag: '摆烂日常' },
    { id: 'bear-look', spirit: 'bear', title: '一个回眸就够了', line: '语言无法表达时，一个回眸就够了', reply: '小店长：有时候，陪在身边就已经很好。', mood: 'memeBeat', tag: '热梗传说' },
    { id: 'cow-go', spirit: 'cow', title: '哞哞给你打气', line: '加油！冲！', reply: '小猫：今天的小目标，一起完成！', mood: 'dragonHappy', tag: '加油搭子' },
    { id: 'sheep-plan', spirit: 'sheep', title: '小羊有办法啦', line: '我有办法了！', reply: '小店长：种子、花盆，还有大家，就是我们的办法。', mood: 'hint', tag: '童年小伙伴' }
  ];
  async function speakSpirit(item, alternate = false) {
    if (item.series === 'ordinary') return false;
    const dragon = isNailong(item);
    const supplied = dragon || item.series === 'cat';
    const session = beginVoicePlayback(supplied);
    try {
      if (supplied) {
        window.GardenVoices?.cancel();
        await sound(dragon ? alternate ? 'nailongVoiceAlt' : 'nailongVoice' : 'cat');
      } else {
        await sound('revealDemo');
        if (!voiceIsCurrent(session)) return false;
        const reading = window.GardenVoices?.play(item.quote, { muted: settings.muted });
        if (reading) await reading;
      }
      if (!voiceIsCurrent(session)) return false;
      await sound('star');
      return voiceIsCurrent(session);
    } finally { finishVoicePlayback(session); }
  }
  function showMap() {
    const links = [
      ['open-theatre','♫','精灵梗剧场','六个小剧目 · 听心情，看表情'],
      ['open-journal','☷','新手任务簿','九章开店故事与任务奖励'],
      ['open-orders','♡','街坊的委托','让收藏的小卡牌派上用场'],
      ['open-seeds','✦','八色种子图谱','卡牌的下一站，是新的惊喜'],
      ['open-albums','▦','七本精灵卡册','十三位小伙伴的独立故事'],
      ['open-decor','⌂','小店装扮','三种氛围，三种陶盆配色'],
      ['open-lessons','♧','培育小课堂','陪伴、概率与暖心保护'],
      ['open-achievements','☆','陪伴里程碑','记录小店一点一滴的变化']
    ];
    modal('<p class="modal-eyebrow">SO MANY LITTLE THINGS TO DISCOVER</p><h2>小店的玩法地图</h2><p class="modal-lead">这里的每一个入口，都有一段可以亲手体验的小故事。</p><div class="feature-grid">' + links.map(([action,icon,title,desc])=>'<button data-action="' + action + '"><span>' + icon + '</span><b>' + title + '</b><small>' + desc + '</small><i>↗</i></button>').join('') + '</div>', 'map');
  }
  function showTheatre(selected = 'dragon-eat') {
    const meme = MEMES.find(x=>x.id===selected) || MEMES[0], item = Core.species(meme.spirit);
    modal('<p class="modal-eyebrow">A SMALL STAGE, A BIG MOOD</p><h2>精灵梗剧场</h2><p class="modal-lead">奶龙来开饭，小熊来回眸，哞哞来加油。每天都有好多小情绪。</p><div class="theatre-stage" id="theatre-stage"><span class="theatre-tag">' + meme.tag + '</span><img src="' + art(item.art) + '" alt="' + item.name + '"><h3>' + meme.title + '</h3><p id="theatre-line">“' + meme.line + '”</p><small>' + meme.reply + '</small></div><button class="primary-button" data-action="meme-play" data-meme="' + meme.id + '">▶ 看一段 · 听一听</button>' + (isNailong(item) ? '<button class="primary-button" data-action="meme-play" data-meme="' + meme.id + '" data-voice="extra">♫ 听新加入的奶龙彩蛋</button>' : '') + '<p class="helper-note" id="voice-status">' + voiceNote(item) + '</p><div class="meme-chips">' + MEMES.map(x=>'<button data-action="meme-select" data-meme="' + x.id + '" class="' + (meme.id===x.id?'active':'') + '">' + x.title + '</button>').join('') + '</div>', 'theatre');
  }
  async function playMeme(id, button) {
    if (theatrePlaying) return;
    const meme = MEMES.find(x=>x.id===id); if (!meme) return;
    const dragon = isNailong(Core.species(meme.spirit));
    const session = beginVoicePlayback(dragon);
    const controls = [...box.querySelectorAll('[data-action="meme-play"]')];
    theatrePlaying = true; controls.forEach(control => { control.disabled = true; });
    const target = $('#theatre-stage'); target?.classList.add('playing');
    try {
      if (dragon) {
        window.GardenVoices?.cancel();
        const clip = await sound(button.dataset.voice === 'extra' ? 'nailongVoiceAlt' : 'nailongVoice');
        if (!voiceIsCurrent(session)) return;
        await sound('star');
        if (!voiceIsCurrent(session)) return;
        if ($('#voice-status')) $('#voice-status').textContent = settings.muted ? '已静音，也能一起看完这段小剧场。' : clip?.played ? '奶龙的小声音已播放，今天也要元气满满！' : '小剧场的台词已留下，稍后可以再听一次。';
      } else {
        sound('memeBeat');
        await sound(meme.mood);
        if (!voiceIsCurrent(session)) return;
        const voice = await window.GardenVoices?.play(meme.line, { muted: settings.muted });
        if (!voiceIsCurrent(session)) return;
        if ($('#voice-status')) $('#voice-status').textContent = voice?.status==='spoken' ? '普通中文朗读已播放 · 非角色原声' : '台词和原创情绪音已呈现 · 本机中文朗读不可用时仍可继续';
      }
      if (!state.tutorial.theatrePlayed.includes(id)) state.tutorial.theatrePlayed.push(id);
      save(); guide?.notify('meme', { id });
    } finally { if (voiceIsCurrent(session)) theatrePlaying = false; controls.forEach(control => { control.disabled = false; }); target?.classList.remove('playing'); finishVoicePlayback(session); }
  }
  function showSeeds() {
    modal('<p class="modal-eyebrow">EIGHT COLORS OF EXPECTATION</p><h2>八色种子图谱</h2><p class="modal-lead">普通种子是起点，收集卡牌还能解锁五种系列稀有种子。每种都有不同的光。</p><div class="seed-catalog">' + Object.values(Core.SEEDS).map(seed=>'<div class="seed-catalog-item seed-' + seed.id + '"><img src="' + art(seed.art) + '" alt="' + seed.name + '"><div><b>' + seed.name + '</b><small>' + seed.label + ' · ' + seed.duration/1000 + '秒</small><p>' + seed.desc + '</p><em>' + (seed.id==='normal' ? '免费无限' : '我的种子 ×' + state.seedStock[seed.id]) + '</em></div></div>').join('') + '</div>', 'seedbook');
  }
  const ORDERS = [
    { id:'breakfast', client:'楼下早餐店的姐姐', badge:'元气小委托', spirit:'dragon_eat', coins:80, stars:20, text:'新店开张想要一点热闹。能把那张一看到就想吃饭的奶龙卡，送给我们吗？' },
    { id:'neighbor', client:'隔壁的阿姨', badge:'治愈小委托', spirit:'soft', coins:35, stars:15, text:'今天有一点累，想收藏一张安安静静的小多肉。谢谢你和小猫。' },
    { id:'catletter', client:'爱猫的小朋友', badge:'软喵来信', spirit:'cat', coins:100, stars:30, text:'我也想有一位软乎乎的陪伴小伙伴。愿意分享一张星糖小猫卡给我吗？' }
  ];
  function showOrders() {
    modal('<p class="modal-eyebrow">THE TOWN IS COMING BACK</p><h2>街坊的温暖委托</h2><p class="modal-lead">精灵不只是收藏，也是把心意送给别人的方式。交付会消耗一张对应卡牌。</p><div class="orders-list">' + ORDERS.map(order=>{
      const item=Core.species(order.spirit), done=state.shop.orders.includes(order.id), waiting=state.shop.pendingOrder===order.id;
      return '<article class="order-card"><div class="order-heading"><span>♡</span><div><small>' + order.badge + '</small><h3>' + order.client + '</h3></div><b>' + (done?'已完成':waiting?'等待领奖':'新来信') + '</b></div><p>“' + order.text + '”</p><div class="order-required"><img src="' + art(item.art) + '" alt="' + item.name + '"><span>' + item.name + '卡 ×1<small>我的卡牌 ' + (state.cards[item.id]||0) + ' 张</small></span></div><div class="order-rewards">奖励：金币 +' + order.coins + ' · 星星 +' + order.stars + ' · 街坊好感 +1</div>' + (waiting ? '<button id="claim-order-reward" class="primary-button" data-action="claim-order-reward">领取这份感谢 ♡</button>' : '<button class="primary-button" data-order="' + order.id + '"' + (done || state.shop.pendingOrder || !(state.cards[item.id]>0) ? ' disabled':'') + '>' + (done?'心意已送达':'交付卡牌 · 完成委托') + '</button>') + '</article>';
    }).join('') + '</div>', 'orders');
  }
  function deliverOrder(id) {
    const order=ORDERS.find(x=>x.id===id);
    if (!order || state.shop.pendingOrder || state.shop.orders.includes(id) || !(state.cards[order.spirit]>0)) return;
    state.cards[order.spirit]--; state.shop.pendingOrder=id; save(); sound('confirm'); showOrders(); guide?.notify('order-delivered',{id});
  }
  function claimOrder() {
    const order=ORDERS.find(x=>x.id===state.shop.pendingOrder); if(!order || state.shop.orders.includes(order.id))return;
    state.shop.orders.push(order.id); state.shop.pendingOrder=null; state.shop.reputation++;
    state.coins+=order.coins;state.stars+=order.stars;save();render();sound('task');showOrders();guide?.notify('order-reward',{id:order.id});
  }
  function showJournal() {
    const chapters=window.GardenTutorial.CHAPTERS, steps=window.GardenTutorial.STEPS;
    const complete=state.tutorial.index>=38, claimed=state.tutorial.claimed.includes('opening-kit');
    modal('<p class="modal-eyebrow">OUR FIRST DAY, PAGE BY PAGE</p><h2>新手开店任务簿</h2><p class="modal-lead">九章小故事，记录你与小猫从第一颗种子到开门迎客的每一步。</p><div class="chapter-list">' + chapters.map((chapter,i)=>{
      const set=steps.filter(s=>s.chapter===i), done=set.filter(s=>state.tutorial.history.includes(s.id)).length;
      return '<div class="chapter-item ' + (done===set.length?'done':'') + '"><b>' + String(i+1).padStart(2,'0') + '</b><div><strong>' + chapter + '</strong><small>' + (done===set.length?'已完成 · 回忆已收好':done+' / '+set.length+' 个小任务') + '</small></div><span>' + (done===set.length?'✓':'○') + '</span></div>';
    }).join('') + '</div><div class="opening-gift"><h3>开业珍藏礼盒</h3><p>小熊、奶龙、哞哞、小羊伙伴卡各×1。感谢你让小店重新拥有了希望。</p><button id="guide-task-reward" class="primary-button" data-action="claim-opening"' + (!complete || claimed?' disabled':'') + '>' + (claimed?'礼盒已收下':'领取开业礼盒 ✦') + '</button></div>', 'journal');
  }
  function grantCards(ids, amount=1) { for(const id of ids){state.cards[id]=(state.cards[id]||0)+amount;if(!state.discovered.includes(id))state.discovered.push(id);} }
  function claimWelcome() {
    if(state.tutorial.claimed.includes('welcome-pack')||state.totalHarvests<1)return;
    grantCards(['soft'],4);state.tutorial.claimed.push('welcome-pack');save();sound('task');showCards();render();guide?.notify('welcome-pack',{});
  }
  function claimOpening() {
    if(state.tutorial.claimed.includes('opening-kit')||state.tutorial.index<38)return;
    grantCards(['bear','dragon','cow','sheep']);state.tutorial.claimed.push('opening-kit');state.coins+=100;save();sound('task');render();guide?.notify('opening-kit',{});
  }
  function showOpeningInvitation() {
    modal('<div class="opening-invitation"><p class="modal-eyebrow">A WARM INVITATION</p><div class="ending-emblem">⌂</div><h2>准备好开门迎客了吗？</h2><p class="modal-lead">精灵有了，小猫在身边，窗台换上了新的颜色。第一位街坊也收到了你的心意。<br>现在，把写着“重新营业”的招牌点亮吧。</p><ul><li>✓ 完成三次教学培育</li><li>✓ 学会集卡与稀有种子兑换</li><li>✓ 解锁限定小猫与七本精灵卡册</li><li>✓ 布置小店，完成街坊委托</li></ul><button id="open-shop-button" class="primary-button" data-action="open-shop">点亮招牌 · 正式开业 ✦</button></div>', 'invitation', false);
  }
  function showLessons() {
    modal('<p class="modal-eyebrow">GROW WITH PATIENCE AND COMPANY</p><h2>小猫的培育小课堂</h2><div class="lesson-list"><article><b>01 · 每一次照料都有用</b><p>浇水、阳光各能照料一次，小猫能陪伴两次。成长值会影响自由培育时的异变概率。</p></article><article><b>02 · 惊喜藏在不同种子里</b><p>普通和彩虹能遇见热梗、奶龙、奶牛和小羊；限定小猫只会从优质及限定等稀有种子出现。</p></article><article><b>03 · 没有异变也有收获</b><p>每盆都有卡牌、金币与星星。连续两次普通收获后，下次会有特殊精灵回应你。</p></article><article><b>04 · 卡牌会继续长出故事</b><p>重复卡能兑换稀有种子，也能完成街坊委托。卡牌被消耗后，图鉴里的回忆依然保留。</p></article></div>', 'lessons');
  }
  function showAchievements() {
    const items=[['第一片新叶',state.totalHarvests>=1,'完成第一次培育'],['奶龙来开饭',state.discovered.includes('dragon_eat'),'遇见奶龙干饭精灵'],['软喵回应',state.discovered.includes('cat'),'培育一只限定小猫'],['街坊的感谢',state.shop.orders.length>0,'完成一份温暖委托'],['小店重新营业',state.shop.reopened,'走完开店物语'],['十三份小美好',state.discovered.length===13,'点亮全部体验精灵']];
    modal('<p class="modal-eyebrow">SMALL STEPS, WARM MEMORIES</p><h2>陪伴里程碑</h2><p class="modal-lead">已完成' + items.filter(x=>x[1]).length + ' / ' + items.length + '项。你做的每件小事，小店都记得。</p><div class="achievement-list">' + items.map(([name,done,desc])=>'<article class="' + (done?'done':'') + '"><span>' + (done?'✦':'☆') + '</span><div><b>' + name + '</b><small>' + desc + '</small></div><i>' + (done?'已达成':'等待你的陪伴') + '</i></article>').join('') + '</div>', 'achievements');
  }
  game.addEventListener('click', function (event) {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    const tab = button.dataset.tab, action = button.dataset.action;
    if (!['water-button', 'sun-button', 'cat-button', 'companion', 'collect-button', 'harvest-button'].includes(button.id)) sound('button');
    if (button.dataset.pot !== undefined) {
      const index = Number(button.dataset.pot);
      if (index >= Core.unlockedPots(state)) { seedModal(index); return; }
      state.selectedPot = index; save(); render();
      if (!state.pots[index]) seedModal(index);
      else if (Core.potStage(state.pots[index]) === 'ready') harvest();
      else say('正在照顾0' + (index + 1) + '号花盆，试试下面的浇水、阳光和小猫陪伴吧。');
      guide?.notify('pot', { index });
      return;
    }
    if (button.dataset.seed) { chooseSeed(button.dataset.seed); return; }
    if (button.dataset.filter) { atlasFilter = button.dataset.filter; showAtlas(); guide?.notify('filter', { id: atlasFilter }); return; }
    if (button.dataset.order) { deliverOrder(button.dataset.order); return; }
    if (button.dataset.spirit) { detail(button.dataset.spirit); return; }
    if (tab) {
      if (pending) return;
      if (tab === 'garden') closeModal(); else if (tab === 'atlas') showAtlas(); else if (tab === 'cards') showCards(); else showDecor();
      guide?.notify('tab', { tab });
      return;
    }
    if (button.id === 'start-game') start();
    else if (button.id === 'plant-button') seedModal(state.selectedPot);
    else if (button.id === 'harvest-button') harvest();
    else if (button.id === 'finish-button') { Core.finish(state, state.selectedPot); save(); render(); say('等候完成啦！再点一下收获，看看这次的回应。'); guide?.notify('finish', {}); }
    else if (button.id === 'water-button') care('water');
    else if (button.id === 'sun-button') care('sun');
    else if (button.id === 'cat-button') care('cat');
    else if (button.id === 'companion') { if (!Core.interact(state, state.selectedPot, 'cat')) companion(); else { playCatCompanion(); save(); render(); companion(false); say('喵！和你一起等它长大。', '小猫'); } guide?.notify('companion',{}); }
    else if (button.id === 'collect-button') { if (pending) finalize(pending.index, pending.cropId); }
    else if (button.id === 'sound-button') { settings.muted = !settings.muted; audio?.setMuted(settings.muted); if (!settings.muted) { audio?.unlock(); audio?.startBgm(); } setSoundButton(); saveSettings(); toast(settings.muted ? '音乐与音效已关闭' : '音乐与音效已开启'); }
    else if (button.id === 'settings-button') showSettings();
    else if (button.id === 'play-map-button') { showMap(); guide?.notify('map', {}); }
    else if (action === 'close' || action === 'continue') closeModal();
    else if (action === 'return-atlas') showAtlas();
    else if (action === 'return-cards') showCards();
    else if (action === 'exchange-return') closeModal();
    else if (action === 'replay') { const item = Core.species(button.dataset.id); if (item.series === 'ordinary') toast('普通多肉安静地陪着你。'); else { button.disabled = true; speakSpirit(item, button.dataset.voice === 'extra').then(completed => { if (completed) guide?.notify('replay',{id:item.id}); }).finally(() => { button.disabled = false; }); } }
    else if (action === 'restart' || action === 'replay-tutorial') confirmRestart();
    else if (action === 'cancel-restart') showSettings();
    else if (action === 'confirm-restart') restart();
    else if (action === 'toggle-sound') { settings.muted = !settings.muted; audio?.setMuted(settings.muted); setSoundButton(); saveSettings(); showSettings(); }
    else if (action === 'toggle-effects') { settings.lowEffects = !settings.lowEffects; particles?.setQuality(settings.lowEffects ? 'low' : 'high'); saveSettings(); showSettings(); }
    else if (action === 'exchange-normal') exchange('normal');
    else if (action === 'recipe') exchange(button.dataset.recipe);
    else if (action === 'exchange-rainbow') exchange('rainbow');
    else if (action === 'toggle-flowers') { state.decor.flowers = !state.decor.flowers; save(); render(); showDecor(); }
    else if (action === 'toggle-sign') { state.decor.sign = !state.decor.sign; save(); render(); showDecor(); }
    else if (action === 'claim-welcome-pack') claimWelcome();
    else if (action === 'meme-play') playMeme(button.dataset.meme, button);
    else if (action === 'meme-select') showTheatre(button.dataset.meme);
    else if (action === 'open-theatre') { showTheatre(); guide?.notify('theatre',{}); }
    else if (action === 'open-orders') { showOrders(); guide?.notify('orders',{}); }
    else if (action === 'open-journal') showJournal();
    else if (action === 'open-seeds') showSeeds();
    else if (action === 'open-albums') { atlasFilter='all';showAtlas(); }
    else if (action === 'open-decor') showDecor();
    else if (action === 'open-lessons') showLessons();
    else if (action === 'open-achievements') showAchievements();
    else if (action === 'claim-order-reward') claimOrder();
    else if (action === 'claim-opening') claimOpening();
    else if (action === 'open-shop') { state.shop.reopened=true;save();guide?.notify('open-shop',{}); }
    else if (action?.startsWith('theme-')) { state.decor.theme=action.slice(6);save();render();showDecor();sound('confirm');guide?.notify('theme',{id:state.decor.theme}); }
    else if (action?.startsWith('pot-')) { state.decor.pot=action.slice(4);save();render();showDecor();sound('confirm');guide?.notify('pot-theme',{id:state.decor.pot}); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modalType !== 'reveal' && modalType !== 'ending' && modalType !== 'restart') closeModal(); });
  document.addEventListener('pointerdown', function unlockOnGesture() { if (state.started && audio) { audio.unlock().then(() => audio.startBgm()); } }, { once: true });
  guide = window.GardenTutorial.create({
    game, getState:()=>state, save,
    sound, say,
    onReward(step) { state.coins+=3;state.stars+=1; },
    prepare(step) {
      const view=step.view;
      if (view==='garden' && modalType) { pending=null;closeModal(); }
      if (view==='seeds' && modalType!=='seeds') seedModal(step.pot ?? state.selectedPot);
      if (view==='reveal' && modalType!=='reveal') { state.selectedPot=step.pot ?? state.selectedPot;harvest(); }
      if (view==='map' && modalType!=='map') showMap();
      if (view==='theatre' && modalType!=='theatre') showTheatre();
      if (view==='atlas' && modalType!=='atlas') showAtlas();
      if (view==='detail' && modalType!=='detail') detail('dragon_eat');
      if (view==='cards' && modalType!=='cards') showCards();
      if(step.id==='first-exchange'&&state.tutorial.exchangeDone){guide?.notify('exchange',{kind:'normal',seed:'quality'});queueMicrotask(()=>{pending=null;closeModal();render();});return;}
      if (view==='decor' && modalType!=='decor') showDecor();
      if (view==='orders' && modalType!=='orders') showOrders();
      if (view==='journal' && modalType!=='journal') showJournal();
      if (view==='invitation' && modalType!=='invitation') showOpeningInvitation();
      render();
    },
    onSkip() {
      window.GardenVoices?.cancel(); pending=null;closeModal();
      for(const p of state.pots) if(p?.tutorialHold){p.tutorialHold=false;p.readyAt=Date.now()+3000;}
      save();render();say('先自由逛逛吧。想重走开店物语，可以在设置里重新体验。');
    },
    onComplete() { state.shop.reopened=true;state.endingSeen=false;save();render();sound('chapter');showEnding(); }
  });
  game.addEventListener('click', function(event) {
    const button=event.target.closest('button');
    if(button && !guide.allow(button)){event.preventDefault();event.stopImmediatePropagation();guide.feedback('先试试发光的小提示吧，小猫会带你认识每一个玩法。');}
  }, true);
  if (state.started) { $('#story').classList.add('hide'); ambient();guide.begin();if (state.totalHarvests >= 3 && !state.endingSeen && !state.tutorial.active) setTimeout(showEnding, 600); }
  render();
  const tick = setInterval(() => { if (state.started && !document.hidden) render(); }, 200);
  const walk = setInterval(() => {
    if (!state.started || document.hidden) return;
    const growing = state.pots.findIndex(p => p && Core.potStage(p) !== 'ready');
    $('#companion').style.right = (growing >= 0 ? [65, 38, 12][growing] : 10 + Math.random() * 65) + '%';
  }, 9000);
  document.addEventListener('visibilitychange', () => { if(disposed)return;if (document.hidden) { particles?.pause(); sceneParticles?.pause(); } else { particles?.resume(); sceneParticles?.resume(); render(); } });
  window.addEventListener('pagehide', () => { disposed=true;save();clearInterval(tick);clearInterval(walk);window.GardenVoices?.cancel();audio?.destroy();particles?.destroy();sceneParticles?.destroy();lighting?.destroy(); }, { once: true });
  window.GardenDemo = Object.freeze({ SPECIES: Core.SPECIES, SEEDS: Core.SEEDS, TUTORIAL_STEPS: window.GardenTutorial.STEPS, getState: () => JSON.parse(JSON.stringify(state)), getTutorialState:()=>guide.getState(), getVoiceState:()=>window.GardenVoices?.getState(), getAudioState: () => audio?.getState() || null, getEffectState: () => particles ? { ...particles.stats } : null, version: '3.2-cat-dragon-audio' });
  window.demoReady = true;
})();
