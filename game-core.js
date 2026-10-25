(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GardenCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SPECIES = Object.freeze([
    { id: 'soft', name: '桃桃软软', series: 'ordinary', rarity: '普通', no: '01', art: 'plant-10.png', color: '#92b58b', quote: '慢慢长大，也是一件了不起的事。', girl: '第一片新叶，真的回应了我们的陪伴。', condition: '任意种子均可遇见；第一次培育固定获得' },
    { id: 'bear', name: '回眸小熊', series: 'legend', rarity: '传说', no: '02', art: 'plant-15.png', color: '#d9a44b', quote: '语言无法表达时，一个回眸就够了', girl: '它一回头，整间小店都变得软乎乎了。', condition: '普通或彩虹种子有概率异变' },
    { id: 'dragon', name: '奶龙晒太阳', series: 'zodiac', rarity: '稀有', no: '03', art: 'plant-18.png', color: '#e7b74b', quote: '嘿嘿，今天也是元气满满的一天！', girl: '一起晒太阳的小家伙，最喜欢我们的窗边。', condition: '普通或彩虹种子有概率异变' },
    { id: 'cow', name: '哞哞加油', series: 'cow', rarity: '稀有', no: '04', art: 'plant-07.png', color: '#83ad94', quote: '加油！冲！', girl: '原来小小的一声加油，也能让人充满力气。', condition: '普通或彩虹种子有概率异变' },
    { id: 'cat', name: '星糖小猫', series: 'cat', rarity: '限定', no: '05', art: 'plant-02.png', color: '#de99b4', quote: '喵～今天也要一起加油！', girl: '它把我们给小猫的陪伴，也悄悄收藏了。', condition: '仅小猫限定种子可获得；陪伴可提高概率' },
    { id: 'sheep', name: '云朵小羊', series: 'sheep', rarity: '珍贵', no: '06', art: 'plant-16.png', color: '#a1bfe2', quote: '我有办法了！', girl: '跟着它的勇气，好像什么难题都能慢慢解开。', condition: '普通或彩虹种子有概率异变' },
    { id: 'jade', name: '青提玉露', series: 'ordinary', rarity: '普通', no: '07', art: 'plant-03.png', color: '#99b87c', quote: '攒一点阳光，叶子就会甜甜的。', girl: '像一小串青提，连心情都变得清爽了。', condition: '普通种子培育可获得' },
    { id: 'lotus', name: '奶绿小莲', series: 'ordinary', rarity: '普通', no: '08', art: 'plant-09.png', color: '#96bd8c', quote: '不着急，我正慢慢变好。', girl: '安静生长，也有自己的小小力量。', condition: '普通种子培育可获得' },
    { id: 'cow_sleep', name: '哞哞摆烂', series: 'cow', rarity: '稀有', no: '09', art: 'plant-05.png', color: '#97bba1', quote: '不想动。摆烂了。', girl: '它说休息好了，明天才能更有力气。', condition: '普通、彩虹或哞哞限定种子可遇见' },
    { id: 'dragon_sad', name: '奶龙委屈', series: 'expression', rarity: '稀有', no: '10', art: 'plant-01.png', color: '#dfba68', quote: '呜呜呜……给我一个抱抱。', girl: '不开心的时候，也会有人愿意陪着你。', condition: '普通、彩虹或奶龙表情种子可遇见' },
    { id: 'dragon_eat', name: '奶龙干饭', series: 'expression', rarity: '稀有', no: '11', art: 'plant-06.png', color: '#e5b457', quote: '干饭！我来了！', girl: '店里最积极的小伙伴，吃饭和加油都冲在前面。', condition: '新手彩虹种子首次相遇；自由培育也可异变' },
    { id: 'dragon_chill', name: '奶龙躺躺', series: 'expression', rarity: '稀有', no: '12', art: 'plant-12.png', color: '#d9ba6d', quote: '不想动，先晒会儿太阳。', girl: '它把舒服的窗台，留了一半给小猫。', condition: '普通、彩虹或奶龙表情种子可遇见' },
    { id: 'fruit_cat', name: '蜜桃果果猫', series: 'cat', rarity: '限定', no: '13', art: 'plant-08.png', color: '#e8a0a9', quote: '喵～给今天加一点甜！', girl: '它的水果小帽子，闻起来像一个好心情。', condition: '只从优质或限定等稀有种子中出现' }
  ].map(Object.freeze));
  const SEEDS = Object.freeze({
    normal: Object.freeze({ id: 'normal', name: '普通多肉种子', duration: 10000, art: 'plant-13.png', unlock: 0, label: '轻松入门', chance: .18, desc: '免费种植。用陪伴，等一个小小的惊喜。' }),
    rainbow: Object.freeze({ id: 'rainbow', name: '彩虹种子', duration: 15000, art: 'plant-14.png', unlock: 1, label: '更易异变', chance: .55, desc: '多一些照料，更容易遇见特殊精灵。' }),
    cat: Object.freeze({ id: 'cat', name: '小猫限定种子', duration: 20000, art: 'plant-04.png', unlock: 5, label: '软喵限定', chance: .72, catEligible: true, desc: '稀有种子里的软喵秘密，陪伴会增加相遇概率。' }),
    quality: Object.freeze({ id: 'quality', name: '优质异变种子', duration: 12000, art: 'plant-04.png', unlock: 1, label: '青碧微光', chance: .8, catEligible: true, desc: '同款普通卡5张可兑换。新手首次种下，会有小猫回应。' }),
    zodiac: Object.freeze({ id: 'zodiac', name: '奶龙限定种子', duration: 14000, art: 'plant-13.png', unlock: 3, label: '奶黄金闪', chance: .8, catEligible: true, desc: '奶龙生肖卡3张兑换，藏着奶黄云朵一样的期待。' }),
    cow: Object.freeze({ id: 'cow', name: '哞哞限定种子', duration: 14000, art: 'plant-04.png', unlock: 3, label: '奶白云朵', chance: .8, catEligible: true, desc: '哞哞表情卡3张兑换，随时准备给你加个油。' }),
    expression: Object.freeze({ id: 'expression', name: '奶龙表情种子', duration: 16000, art: 'plant-14.png', unlock: 3, label: '蜜桃奶橘', chance: .85, catEligible: true, desc: '奶龙表情卡3张兑换，每天都有新的小情绪。' }),
    legend: Object.freeze({ id: 'legend', name: '传说限定种子', duration: 18000, art: 'plant-14.png', unlock: 3, label: '鎏金幻彩', chance: .9, catEligible: true, desc: '同款传说卡2张兑换，把一场大惊喜带回温室。' })
  });
  const fresh = () => ({ version: 3, started: false, totalHarvests: 0, cards: Object.fromEntries(SPECIES.map(x => [x.id, 0])), discovered: [], seedStock: Object.fromEntries(Object.keys(SEEDS).filter(x => x !== 'normal').map(x => [x, 0])), pots: [null, null, null], endingSeen: false, pity: 0, coins: 0, stars: 0, decor: { bunting: true, flowers: false, sign: true, theme: 'spring', pot: 'cream' }, selectedPot: 0, serial: 0, shop: { reopened: false, orders: [], pendingOrder: null, reputation: 0 }, tutorial: { index: 0, active: true, completed: false, skipped: false, claimed: [], history: [], theatrePlayed: [], chapter: 0, exchangeDone: false } });
  const species = id => SPECIES.find(s => s.id === id);
  const stage = s => s.shop?.reopened || (!s.tutorial?.active && s.totalHarvests >= 3) ? 2 : s.totalHarvests >= 1 ? 1 : 0;
  const unlockedPots = s => s.totalHarvests >= 3 ? 3 : s.totalHarvests >= 1 ? 2 : 1;
  function restore(raw) {
    if (!raw || raw.version !== 3) return fresh();
    const s = fresh();
    for (const field of ['started', 'endingSeen']) s[field] = !!raw[field];
    for (const field of ['totalHarvests', 'pity', 'coins', 'stars', 'serial']) s[field] = Math.max(0, Math.min(999999, Math.floor(Number(raw[field]) || 0)));
    for (const item of SPECIES) s.cards[item.id] = Math.max(0, Math.floor(Number(raw.cards?.[item.id]) || 0));
    s.discovered = SPECIES.filter(x => raw.discovered?.includes(x.id) || s.cards[x.id] > 0).map(x => x.id);
    for (const id of Object.keys(s.seedStock)) s.seedStock[id] = Math.max(0, Math.floor(Number(raw.seedStock?.[id]) || 0));
    s.selectedPot = Math.max(0, Math.min(2, Number(raw.selectedPot) || 0));
    if (raw.decor) Object.assign(s.decor, { bunting: raw.decor.bunting !== false, flowers: !!raw.decor.flowers, sign: raw.decor.sign !== false });
    if (raw.decor && ['spring', 'sunset', 'starlight'].includes(raw.decor.theme)) s.decor.theme = raw.decor.theme;
    if (raw.decor && ['cream', 'peach', 'mint'].includes(raw.decor.pot)) s.decor.pot = raw.decor.pot;
    if (raw.shop) s.shop = { reopened: !!raw.shop.reopened, orders: Array.isArray(raw.shop.orders) ? raw.shop.orders.filter(x => ['breakfast', 'neighbor', 'catletter'].includes(x)) : [], pendingOrder: ['breakfast', 'neighbor', 'catletter'].includes(raw.shop.pendingOrder) ? raw.shop.pendingOrder : null, reputation: Math.max(0, Number(raw.shop.reputation) || 0) };
    if (raw.tutorial) s.tutorial = { index: Math.max(0, Math.min(40, Math.floor(Number(raw.tutorial.index) || 0))), active: raw.tutorial.active !== false, completed: !!raw.tutorial.completed, skipped: !!raw.tutorial.skipped, claimed: [...new Set((raw.tutorial.claimed || []).filter(x => typeof x === 'string'))], history: (raw.tutorial.history || []).filter(x => typeof x === 'string'), theatrePlayed: [...new Set((raw.tutorial.theatrePlayed || []).filter(x => typeof x === 'string'))], chapter: Number(raw.tutorial.chapter) || 0, exchangeDone: !!raw.tutorial.exchangeDone };
    if (Array.isArray(raw.pots)) s.pots = s.pots.map((_, i) => {
      const p = raw.pots[i];
      if (!p || !SEEDS[p.seedId] || !Number.isFinite(p.plantedAt) || !Number.isFinite(p.readyAt) || !p.cropId) return null;
      return { cropId: String(p.cropId), seedId: p.seedId, plantedAt: p.plantedAt, readyAt: p.readyAt, growth: Math.max(0, Math.min(6, Number(p.growth) || 0)), water: !!p.water, sun: !!p.sun, catHelpCount: Math.max(0, Math.min(2, Number(p.catHelpCount) || 0)), sprouted: !!p.sprouted, resultId: species(p.resultId) ? p.resultId : null, forcedId: species(p.forcedId) ? p.forcedId : null, tutorialHold: !!p.tutorialHold };
    });
    return s;
  }
  function plant(s, index, seedId, now = Date.now()) {
    if (!Number.isInteger(index) || index < 0 || index >= unlockedPots(s)) throw new Error('这个花盆还在等小店长大。');
    const seed = SEEDS[seedId];
    if (!seed || s.totalHarvests < seed.unlock) throw new Error('还没有解锁这颗种子。');
    if (s.pots[index]) throw new Error('先收获这盆精灵吧。');
    if (seedId !== 'normal' && s.seedStock[seedId] < 1) throw new Error('种子用完啦，去收藏卡牌里兑换补给吧。');
    if (seedId !== 'normal') s.seedStock[seedId]--;
    s.serial++;
    const forcedId = s.tutorial.active ? seedId === 'rainbow' ? 'dragon_eat' : seedId === 'quality' ? 'cat' : s.totalHarvests === 0 ? 'soft' : null : null;
    s.pots[index] = { cropId: 'crop-' + s.serial + '-' + now, seedId, plantedAt: now, readyAt: now + seed.duration, growth: 0, water: false, sun: false, catHelpCount: 0, sprouted: false, resultId: null, forcedId, tutorialHold: s.tutorial.active };
    s.selectedPot = index;
    return s.pots[index];
  }
  function potStage(p, now = Date.now()) {
    if (!p) return 'empty';
    if (p.tutorialHold) return p.growth >= 2 ? 'glow' : p.growth >= 1 ? 'sprout' : 'seed';
    if (now >= p.readyAt) return 'ready';
    const progress = Math.max(0, (now - p.plantedAt) / Math.max(1, p.readyAt - p.plantedAt));
    return progress >= .72 ? 'glow' : progress >= .30 ? 'sprout' : 'seed';
  }
  function interact(s, index, type, now = Date.now()) {
    const p = s.pots[index];
    if (!p || p.resultId || (!p.tutorialHold && now >= p.readyAt)) return false;
    if (type === 'cat') { if (p.catHelpCount >= 2) return false; p.catHelpCount++; }
    else if (type === 'water' || type === 'sun') { if (p[type]) return false; p[type] = true; }
    else return false;
    p.growth++;
    p.readyAt = Math.max(now + 700, p.readyAt - 600);
    return true;
  }
  function finish(s, index, now = Date.now()) {
    const p = s.pots[index];
    if (!p) return false;
    p.tutorialHold = false;
    p.readyAt = Math.min(p.readyAt, now);
    return true;
  }
  function reveal(s, index, random = Math.random, now = Date.now()) {
    const p = s.pots[index];
    if (!p || p.tutorialHold || now < p.readyAt) throw new Error('再陪它长一小会儿吧。');
    if (p.resultId) return species(p.resultId);
    let id = 'soft';
    if (s.totalHarvests > 0) {
      const probability = Math.min(.96, SEEDS[p.seedId].chance + p.growth * .025 + p.catHelpCount * .04 + s.pity * .12);
      const special = s.pity >= 2 || random() < probability;
      if (special) {
        if (SEEDS[p.seedId].catEligible && (p.seedId === 'cat' || random() < .55)) { const cats = ['cat', 'fruit_cat']; id = cats[Math.min(1, Math.floor(random() * 2))]; }
        else {
          const pool = SPECIES.filter(x => x.series !== 'ordinary' && x.series !== 'cat').map(x => x.id);
          const unseen = pool.filter(x => !s.discovered.includes(x));
          const choice = unseen.length ? unseen : pool;
          id = choice[Math.min(choice.length - 1, Math.floor(random() * choice.length))];
        }
      }
      else { const ordinary = ['soft', 'jade', 'lotus']; id = ordinary[Math.min(2, Math.floor(random() * 3))]; }
    }
    if (p.forcedId && (species(p.forcedId).series !== 'cat' || SEEDS[p.seedId].catEligible)) id = p.forcedId;
    p.resultId = id;
    return species(id);
  }
  function collect(s, index, cropId) {
    const p = s.pots[index];
    if (!p || p.cropId !== cropId || !p.resultId) return null;
    const item = species(p.resultId), before = s.totalHarvests;
    const isNew = !s.discovered.includes(item.id);
    s.cards[item.id] = (s.cards[item.id] || 0) + 1;
    if (isNew) s.discovered.push(item.id);
    s.totalHarvests++; s.coins += item.series === 'ordinary' ? 15 : 30; s.stars += 10 + p.growth;
    s.pity = item.series === 'ordinary' ? s.pity + 1 : 0;
    s.pots[index] = null;
    const rewards = [];
    if (before < 1 && s.totalHarvests >= 1) { s.seedStock.rainbow += 3; rewards.push('第二个花盆与3颗彩虹种子'); }
    if (before < 3 && s.totalHarvests >= 3) { s.decor.flowers = true; rewards.push('第三个花盆、花朵装饰与重新营业'); }
    if (before < 5 && s.totalHarvests >= 5) { s.seedStock.cat += 2; rewards.push('小猫限定种子×2'); }
    return { item, isNew, rewards, ending: s.totalHarvests >= 3 && !s.endingSeen && !s.tutorial.active };
  }
  function exchange(s, kind) {
    if (kind === 'normal') {
      if ((s.cards.soft || 0) < 5) throw new Error('需要同款桃桃软软卡牌5张。');
      s.cards.soft -= 5; s.seedStock.quality++; return 'quality';
    }
    if (kind === 'rainbow') {
      if (s.totalHarvests < 1 || s.stars < 20) throw new Error('需要20点培育星星。');
      s.stars -= 20; s.seedStock.rainbow++; return 'rainbow';
    }
    const recipes = { zodiac: ['dragon', 3], cow: ['cow', 3], expression: ['dragon_eat', 3], legend: ['bear', 2] };
    if (recipes[kind]) { const [id, count] = recipes[kind]; if ((s.cards[id] || 0) < count) throw new Error('还需要一些同款卡牌，再陪精灵长大一次吧。'); s.cards[id] -= count; s.seedStock[kind]++; return kind; }
    throw new Error('这项兑换尚未开放。');
  }
  return Object.freeze({ SPECIES, SEEDS, fresh, restore, species, stage, unlockedPots, plant, potStage, interact, finish, reveal, collect, exchange });
});
