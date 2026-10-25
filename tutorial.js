(function (global) {
  'use strict';
  const CHAPTERS = Object.freeze(['初见小猫搭档','第一片新叶','奶龙的元气回应','精灵梗剧场','七本精灵卡册','卡牌长出新惊喜','软喵限定初相遇','给小店换新装','街坊来信与开业']);
  const step = (id, chapter, title, text, target, event, match, view, pot) => Object.freeze({id,chapter,title,text,target,event,match:match||{},view:view||'garden',pot});
  const STEPS = Object.freeze([
    step('meet-cat',0,'先认识我们的陪伴小猫','点一下小猫。它会发现异变、帮忙培育，也会在每一个安静的时刻陪着你。','#companion','companion'),
    step('first-pot',1,'把第一份期待放进花盆','选中01号笑脸花盆。每个花盆都有自己的成长进度，之后还能同时照顾好多小伙伴。','[data-pot="0"]','pot',{index:0},'garden',0),
    step('normal-seed',1,'种下一颗普通种子','普通种子是小店最温柔的起点，始终免费。先用它认识播种、照料与收获。','[data-seed="normal"]','plant',{seed:'normal'},'seeds',0),
    step('first-water',1,'给它一点清凉的水','浇水后，小芽会伸出脑袋。留意花盆里的变化和成长条的小小回应。','#water-button','care',{type:'water'}),
    step('first-sun',1,'再借一束温柔的太阳','阳光让叶片慢慢饱满。每次照料都会增加成长值，自由培育时还会提高异变概率。','#sun-button','care',{type:'sun'}),
    step('first-company',1,'请小猫一起守着它','小猫陪伴不只是好看：每轮可以陪伴两次，成长值和相遇稀有精灵的机会都会提升。','#cat-button','care',{type:'cat'}),
    step('first-finish',1,'把等待交给一点小魔法','新手旅程会等你亲手照料完。点“立即完成”，一起看看这份陪伴长成了什么。','#finish-button','finish'),
    step('first-harvest',1,'第一片新叶，来啦','花盆已经成熟了。轻轻点一下收获，第一次会固定遇见普通多肉伙伴。','#harvest-button','harvest'),
    step('first-card',1,'收好我们的第一张卡牌','每次收获都会得到对应卡牌，重复卡也有用。把桃桃软软收好，第二个花盆就会解锁。','#collect-button','collect',{id:'soft'},'reveal',0),
    step('dragon-pot',2,'给新朋友留一个位置','第二个花盆与彩虹种子都准备好了。选02号花盆，这次会有一个很有精神的小家伙来做客。','[data-pot="1"]','pot',{index:1},'garden',1),
    step('rainbow-seed',2,'彩虹种子里藏着谁呢','彩虹种子更容易出现特殊精灵。新手首次相遇由小猫安排好，不用担心错过奶龙。','[data-seed="rainbow"]','plant',{seed:'rainbow'},'seeds',1),
    step('dragon-company',2,'用陪伴敲敲它的小门','这次请小猫先来守一会儿。会发光的花盆，总让它好奇地凑近一点。','#cat-button','care',{type:'cat'}),
    step('dragon-finish',2,'小猫说，它准备好啦','点一下立即完成。普通成熟与特殊异变，会有不同的画面和声音回应。','#finish-button','finish'),
    step('dragon-mutation',2,'看，奶龙真的来了','收获这一盆，看看“奶龙干饭”的表情。专属台词、情绪音和光效会一起登场。','#harvest-button','harvest'),
    step('dragon-card',2,'把元气满满的奶龙留下','先听完它的小声音，再收进卡册。以后随时可以在图鉴里看原画、读台词和回放声音。','#collect-button','collect',{id:'dragon_eat'},'reveal',1),
    step('open-playmap',3,'小店里，还有好多故事','打开玩法地图。梗剧场、任务簿、顾客委托、种子图谱，都在这里等你。','#play-map-button','map'),
    step('enter-theatre',3,'先去精灵梗剧场热闹一下','每位精灵都有自己的小心情。点开剧场，让奶龙带我们认识第一段小剧目。','[data-action="open-theatre"]','theatre',{},'map'),
    step('dragon-meme',3,'干饭！我来了！','点播放，看奶龙怎样给小店加点热闹。这里还有委屈奶龙、躺躺奶龙、小熊回眸等六段小剧目。','[data-action="meme-play"][data-meme="dragon-eat"]','meme',{id:'dragon-eat'},'theatre'),
    step('open-atlas',4,'翻开七本精灵卡册','普通多肉、热梗、生肖、奶牛、奶龙表情、小猫、小羊，各有自己的位置。先打开图鉴。','[data-tab="atlas"]','tab',{tab:'atlas'}),
    step('filter-expression',4,'给奶龙的表情找一本家','点“奶龙表情”。目前已有十三位可遇见精灵，每位都对应独立的美术素材。','[data-filter="expression"]','filter',{id:'expression'},'atlas'),
    step('inspect-dragon',4,'这一张，记录着我们的相遇','点开奶龙干饭卡。稀有度、台词、卡牌数量与小店长的评价，都收在这里。','[data-spirit="dragon_eat"]','detail',{id:'dragon_eat'},'atlas'),
    step('replay-dragon',4,'再听一次这份元气','点一下回放。图鉴回放只重温声音，不会重复发卡，也不会消耗你的小伙伴。','[data-action="replay"]','replay',{id:'dragon_eat'},'detail'),
    step('open-cards',5,'重复卡牌，也能种出新惊喜','打开收藏卡牌。接下来亲手体验“攒卡—兑换—种下稀有种子”的另一条成长线。','[data-tab="cards"]','tab',{tab:'cards'}),
    step('welcome-pack',5,'收下小店的见面礼','打开新手礼盒，领取四张桃桃软软卡。加上自己培育的第一张，刚好可以完成第一次兑换。','#claim-welcome-pack','welcome-pack',{},'cards'),
    step('first-exchange',5,'让五张卡，变成一颗发光种子','消耗五张同款普通卡，获得优质异变种子。卡牌会被真实扣除，图鉴里的回忆会保留。','#exchange-normal','exchange',{kind:'normal'},'cards'),
    step('cat-pot',6,'给软喵小惊喜腾出位置','回到02号花盆。新手第一颗优质种子会固定遇见限定小猫，陪伴的小猫也很期待。','[data-pot="1"]','pot',{index:1},'garden',1),
    step('quality-seed',6,'种下刚换来的青碧微光','选择优质异变种子。只有优质、限定等稀有种子才可能长出限定小猫，普通种子不会。','[data-seed="quality"]','plant',{seed:'quality'},'seeds',1),
    step('cat-company',6,'猫猫之间的小小约定','再请小猫陪伴一次。陪伴角色和可收集的小猫精灵，是两种不同的小伙伴。','#cat-button','care',{type:'cat'}),
    step('cat-finish',6,'等一场软乎乎的相遇','点立即完成。留意这次多出来的樱花和绒毛，它们是软喵限定的独特庆祝。','#finish-button','finish'),
    step('cat-mutation',6,'星糖小猫，回应你啦','点收获，和这只住在多肉里的限定小猫见个面吧。','#harvest-button','harvest'),
    step('cat-card',6,'收藏这份独一无二的陪伴','收下限定卡。小店已经完成三次教学培育，第三个花盆与店铺装扮也会一起开放。','#collect-button','collect',{id:'cat'},'reveal',1),
    step('open-decor',7,'让小店变成喜欢的模样','打开店铺装扮。主题氛围、笑脸陶盆、窗边小花和小招牌，都能自己搭配。','[data-tab="decor"]','tab',{tab:'decor'}),
    step('sunset-theme',7,'给温室添一点暖橘色','选“暖橘落日”。主题会立刻作用到温室的柔光，关上面板就能看到新的心情。','[data-action="theme-sunset"]','theme',{id:'sunset'},'decor'),
    step('peach-pot',7,'再选一只蜜桃色陶盆','把空花盆换成蜜桃配色。小小的布置，也是在认真守护这个家。','[data-action="pot-peach"]','pot-theme',{id:'peach'},'decor'),
    step('orders-map',8,'听见街坊的敲门声了吗','再次打开玩法地图。这一次，收集的小卡牌会变成送给别人心意的小礼物。','#play-map-button','map'),
    step('enter-orders',8,'读一读街坊的温暖委托','打开委托来信。这里有早餐店姐姐、隔壁阿姨和爱猫小朋友的三封小心愿。','[data-action="open-orders"]','orders',{},'map'),
    step('deliver-breakfast',8,'把奶龙的元气送给早餐店','交付一张奶龙干饭卡。任务会消耗这张卡，图鉴和剧场里的回忆仍然在。','[data-order="breakfast"]','order-delivered',{id:'breakfast'},'orders'),
    step('claim-order',8,'收下第一位街坊的感谢','领取金币、星星与好感。这是小店重新热闹起来的第一份回应。','#claim-order-reward','order-reward',{id:'breakfast'},'orders'),
    step('opening-kit',8,'把九章小故事收进任务簿','这里记录了每个完成的小任务。领取开业珍藏礼盒，解锁小熊、生肖奶龙、哞哞与小羊纪念卡。','#guide-task-reward','opening-kit',{},'journal'),
    step('open-shop',8,'最后，亲手点亮重新营业的招牌','你学会了照料、异变、集卡、兑换、装扮和委托。小猫和精灵们都准备好啦——欢迎回到我们的温暖小店。','#open-shop-button','open-shop',{},'invitation')
  ]);
  function create(api) {
    const doc=api.game.ownerDocument;
    const layer=doc.createElement('div');layer.id='tutorial-layer';layer.className='tutorial-layer hide';
    layer.innerHTML='<div id="tutorial-highlight" aria-hidden="true"><span>点这里 ✦</span></div><section id="tutorial-card" class="tutorial-card"><div class="tutorial-top"><span id="tutorial-chapter"></span><b id="tutorial-counter"></b><button id="tutorial-skip" aria-label="退出引导进入自由体验">自由逛逛</button></div><div class="tutorial-main"><img src="assets/companion-cat.png" alt="小猫向导"><div><h3 id="tutorial-title"></h3><p id="tutorial-copy"></p></div></div><div class="tutorial-bottom"><span id="tutorial-feedback">按发光的小提示，和小猫一起试试吧。</span><div class="tutorial-progress"><i></i></div></div><div id="tutorial-skip-confirm" class="hide"><p>自由逛逛后，可以从设置重新开启新手物语。当前卡牌与装扮会保留。</p><button id="tutorial-cancel-skip">继续跟着小猫</button><button id="tutorial-confirm-skip">先自由逛逛</button></div></section>';
    api.game.appendChild(layer);
    const highlight=layer.querySelector('#tutorial-highlight'),card=layer.querySelector('#tutorial-card');
    let begun=false, entering=false;
    function current(){return STEPS[api.getState().tutorial.index]||null;}
    function isActive(){const s=api.getState();return begun&&s.started&&s.tutorial.active&&!s.tutorial.completed&&!!current();}
    function getState(){const s=api.getState().tutorial,c=current();return {active:isActive(),index:s.index,stepId:c?.id||null,target:c?.target||null,title:c?.title||null,chapter:c?.chapter??8,completed:s.completed,skipped:s.skipped,claimed:s.claimed.slice()};}
    function feedback(text){layer.querySelector('#tutorial-feedback').textContent=text;}
    function update(){
      if(!isActive()){layer.classList.add('hide');return;}
      const c=current(),state=api.getState();layer.classList.remove('hide');
      layer.querySelector('#tutorial-chapter').textContent='第'+(c.chapter+1)+'章 · '+CHAPTERS[c.chapter];
      layer.querySelector('#tutorial-counter').textContent=(state.tutorial.index+1)+' / '+STEPS.length;
      layer.querySelector('#tutorial-title').textContent=c.title;layer.querySelector('#tutorial-copy').textContent=c.text;
      layer.querySelector('.tutorial-progress i').style.width=(state.tutorial.index/STEPS.length*100)+'%';
      const quest=api.game.querySelector('#quest-text');if(quest)quest.textContent=c.title;
      const count=api.game.querySelector('#quest-count');if(count)count.textContent=(state.tutorial.index+1)+' / '+STEPS.length;
      const fill=api.game.querySelector('#quest-fill');if(fill)fill.style.width=(state.tutorial.index/STEPS.length*100)+'%';
      const el=api.game.querySelector(c.target),gr=api.game.getBoundingClientRect();
      if(!el||!el.getClientRects().length){highlight.style.display='none';return;}
      let r=el.getBoundingClientRect();
      const rail=el.closest('.album-filters');
      if(rail){const rr=rail.getBoundingClientRect();if(r.right>rr.right-6)rail.scrollLeft+=r.right-rr.right+6;else if(r.left<rr.left+6)rail.scrollLeft-=rr.left+6-r.left;r=el.getBoundingClientRect();}
      const scrollParent=el.closest('#modal-box');
      if(scrollParent){const sr=scrollParent.getBoundingClientRect();if(r.top<sr.top+8||r.bottom>sr.bottom-8){el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});r=el.getBoundingClientRect();}}
      const x=Math.max(3,r.left-gr.left-5),y=Math.max(3,r.top-gr.top-5),w=Math.min(gr.width-x-3,r.width+10),h=Math.min(gr.height-y-3,r.height+10);
      highlight.style.display='block';Object.assign(highlight.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
      highlight.classList.toggle('waiting',!!el.disabled);
      const label=highlight.querySelector('span');label.textContent=el.disabled?'稍等它的小声音…':'点这里 ✦';label.style.top=y<40?'auto':'-23px';label.style.bottom=y<40?'-23px':'auto';
      const ch=card.offsetHeight||150, bottomTop=gr.height-ch-12;
      const resourceRect=api.game.querySelector('.resources')?.getBoundingClientRect();
      const topSlot=Math.min(112,Math.max(90,(resourceRect?resourceRect.bottom-gr.top:92)+9));
      const topOverlap=Math.max(0,Math.min(topSlot+ch,y+h)-Math.max(topSlot,y));
      const bottomOverlap=Math.max(0,Math.min(bottomTop+ch,y+h)-Math.max(bottomTop,y));
      card.style.top=(topOverlap<bottomOverlap?topSlot:bottomTop)+'px';card.style.bottom='auto';
      card.classList.toggle('on-top',topOverlap<bottomOverlap);
    }
    function enter(){
      if(!isActive()||entering)return;
      entering=true;
      try{const c=current();feedback('按发光的小提示，亲手完成这个小任务。');api.prepare(c);update();requestAnimationFrame(update);}finally{entering=false;}
    }
    function notify(event,detail={}){
      if(!isActive())return false;
      const c=current();if(c.event!==event||Object.entries(c.match).some(([k,v])=>detail[k]!==v))return false;
      const s=api.getState().tutorial;
      if(!s.claimed.includes(c.id))s.claimed.push(c.id);
      if(!s.history.includes(c.id)){api.onReward(c);s.history.push(c.id);}
      s.index++;
      if(s.index>=STEPS.length){s.active=false;s.completed=true;s.skipped=false;api.save();update();api.onComplete();return true;}
      const next=current();if(next.chapter!==c.chapter){s.chapter=next.chapter;api.sound('chapter');}else api.sound('task');
      api.save();enter();feedback('✓ 上一步已完成 · 金币 +3 · 星星 +1' + (next.chapter!==c.chapter?' · 新章节已开启':''));return true;
    }
    function begin(){begun=true;if(isActive())enter();else update();}
    function reset(){begun=false;layer.classList.add('hide');highlight.style.display='none';layer.querySelector('#tutorial-skip-confirm').classList.add('hide');}
    function allow(button){
      if(!isActive())return true;
      if(button.closest('#tutorial-layer')||button.id==='sound-button')return true;
      const target=api.game.querySelector(current().target);return !!target&&(button===target||target.contains(button)||button.contains(target));
    }
    layer.addEventListener('click',event=>{
      const id=event.target.closest('button')?.id;
      if(id==='tutorial-skip'){layer.querySelector('#tutorial-skip-confirm').classList.remove('hide');update();}
      if(id==='tutorial-cancel-skip'){layer.querySelector('#tutorial-skip-confirm').classList.add('hide');update();}
      if(id==='tutorial-confirm-skip'){const s=api.getState().tutorial;s.active=false;s.skipped=true;api.save();layer.classList.add('hide');api.onSkip();}
    });
    global.addEventListener('resize',update);doc.addEventListener('scroll',update,true);
    return Object.freeze({begin,reset,notify,update,allow,feedback,isActive,getState});
  }
  global.GardenTutorial=Object.freeze({CHAPTERS,STEPS,create});
})(window);
