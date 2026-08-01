(function(){
  const Q=window.HIROPON_Q, SAVE='hiropon_ch4_v1';
  const cats={election:['選挙','投票箱','選挙・政党・政治参加'],diet:['国会','国','法律・予算・二院制'],cabinet:['内閣','政','行政・議院内閣制'],court:['裁判所','司','裁判・司法権の独立'],local:['地方自治','町','首長・議会・直接請求']};
  const story=[
    ['勉三','国民から届いた要望書を、全部同じ場所へ送っちゃった……！'],
    ['ヒロポン','大変じゃ！ 選挙・国会・内閣・裁判所・地方自治を結ぶ「民意のルート」が止まっておる。'],
    ['勉三','僕が政治の仕組みを学び直して、必ず国民の声を届けます！'],
    ['ヒロポン','まず5つの民意のかけらを集め、数字コードと手続きの流れを復旧するのじゃ！']
  ];
  let state=fresh(), session=null, storyAt=0;
  let audioCtx=null, fanfare=null, routeJingle=null, bossMusic=null, soundOn=localStorage.getItem('hiropon_sound')!=='off';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  function fresh(){return{cleared:[],unlocked:1,firstCorrect:0,total:0,errors:{},wrongIds:[],started:Date.now(),finished:false,best:null,storyAt:0,storyDone:false,activeSession:null};}
  function save(){state.storyAt=storyAt;state.activeSession=session;localStorage.setItem(SAVE,JSON.stringify(state));renderHeader();}
  function load(){try{const v=JSON.parse(localStorage.getItem(SAVE));if(v){state={...fresh(),...v};if(!('storyDone' in v)&&(state.cleared.length||state.total))state.storyDone=true;storyAt=state.storyAt||0;session=state.activeSession||null;}}catch(e){state=fresh();session=null;storyAt=0;}}
  function screen(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');}
  function renderHeader(){const n=['election','diet','cabinet','court','local'].filter(x=>state.cleared.includes(x)).length;$('#shardCount').textContent=n+' / 5';$('#continueBtn').disabled=!localStorage.getItem(SAVE);const sb=$('#soundBtn');if(sb){sb.textContent=soundOn?'♪':'×';sb.setAttribute('aria-label',soundOn?'音を切る':'音を出す');sb.setAttribute('aria-pressed',String(soundOn));}}
  function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
  function audio(){if(!soundOn)return null;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}catch(e){return null;}}
  function tone(freq,at=.0,dur=.12,type='square',gain=.07){const c=audio();if(!c)return;const now=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,now+at);g.gain.setValueAtTime(.0001,now+at);g.gain.exponentialRampToValueAtTime(gain,now+at+.012);g.gain.exponentialRampToValueAtTime(.0001,now+at+dur);o.connect(g).connect(c.destination);o.start(now+at);o.stop(now+at+dur+.02);}
  function sfx(name){if(!soundOn)return;const notes={start:[[0,523,.18,'square'],[.11,659,.18,'square'],[.22,784,.2,'square'],[.36,1047,.28,'triangle']],tap:[[0,660,.055,'square']],correct:[[0,660,.1,'triangle'],[.07,880,.18,'triangle']],wrong:[[0,190,.12,'sawtooth'],[.09,145,.2,'sawtooth']],shard:[[0,523,.12,'triangle'],[.08,784,.16,'triangle'],[.18,1047,.35,'triangle']],unlock:[[0,392,.12,'square'],[.1,523,.13,'square'],[.2,659,.22,'triangle']],boss:[[0,110,.35,'sawtooth'],[.22,82,.55,'sawtooth']],clear:[[0,523,.16,'square'],[.1,659,.16,'square'],[.2,784,.16,'square'],[.32,1047,.22,'triangle'],[.5,1319,.5,'triangle']]};(notes[name]||notes.tap).forEach(n=>tone(n[1],n[0],n[2],n[3],name==='boss'?.045:.075));}
  function playOpeningFanfare(){
    if(!soundOn)return;
    if(!fanfare){fanfare=new Audio('assets/fanfare13.mp3');fanfare.preload='none';fanfare.volume=.72;}
    fanfare.currentTime=0;
    const playback=fanfare.play();
    if(playback&&typeof playback.catch==='function')playback.catch(()=>sfx('start'));
  }
  function playRouteJingle(){
    if(!soundOn)return;
    if(!routeJingle){routeJingle=new Audio('assets/route-awakening.mp3');routeJingle.preload='none';routeJingle.volume=1;}
    routeJingle.currentTime=0;
    const playback=routeJingle.play();
    if(playback&&typeof playback.catch==='function')playback.catch(()=>sfx('unlock'));
  }
  function playBossMusic(){
    if(!soundOn)return;
    if(!bossMusic){bossMusic=new Audio('assets/boss-tension.mp3');bossMusic.preload='none';bossMusic.loop=true;bossMusic.volume=.42;}
    if(bossMusic.paused){const playback=bossMusic.play();if(playback&&typeof playback.catch==='function')playback.catch(()=>{});}
  }
  function stopBossMusic(){if(bossMusic&&!bossMusic.paused){bossMusic.pause();bossMusic.currentTime=0;}}
  function stopAllAudio(){
    [fanfare,routeJingle,bossMusic].forEach(a=>{if(a){a.pause();a.currentTime=0;}});
  }
  function pulse(cls){const game=$('#game');game.classList.remove(cls);void game.offsetWidth;game.classList.add(cls);setTimeout(()=>game.classList.remove(cls),700);}
  function startNew(){playOpeningFanfare();pulse('adventure-start');state=fresh();session=null;storyAt=0;save();showStory();}
  function showStory(){screen('storyScreen');const [who,text]=story[storyAt];$('.speaker').textContent=who==='勉三'?'北中 勉三':'ヒロポン';$('#storyText').textContent=text;save();}
  function renderMap(){stopBossMusic();screen('mapScreen');$('#locationLabel').textContent='政治の都・民意回廊';const allBasic=['election','diet','cabinet','court','local'].every(x=>state.cleared.includes(x));let cards=[];
    Object.entries(cats).forEach(([id,v])=>cards.push(`<button class="stage-card ${state.cleared.includes(id)?'cleared':''}" data-stage="${id}"><span class="stage-icon">${v[1]}</span><h3>${v[0]}の門</h3><p>${v[2]}<br>基本問題 2問</p>${state.cleared.includes(id)?'<b class="clear-mark">◆</b>':''}</button>`));
    cards.push(stageCard('numbers','数字コード','数','人数・年数・日数・割合｜6問',allBasic));
    cards.push(stageCard('sequences','手続き回廊','順','流れを並べ替える｜3題',state.cleared.includes('numbers')));
    cards.push(stageCard('boss','ボス：民意なき政治','王','数字＋機関＋判断｜4問',state.cleared.includes('sequences')));
    $('#stageGrid').innerHTML=cards.join('');
    $('#stageBoardWrap').classList.toggle('advanced',allBasic);
    $('#stageBoardWrap').dataset.route=!state.cleared.includes('numbers')?'numbers':!state.cleared.includes('sequences')?'sequences':'boss';
    $('#stageGrid').classList.toggle('board-mode',!allBasic);
    $('#stageGrid').style.gridTemplateColumns=allBasic?'repeat(3,1fr)':'none';
    $('#mapHint').textContent=state.finished?'クリア済み。苦手復習または再挑戦ができます。':allBasic?'5つのかけらがそろった！ 数字コードを解読しよう。':'5つの分野を攻略し、民意のかけらを集めよう。';
    $('#reviewBtn').classList.toggle('hidden',!state.finished&&!state.wrongIds.length);
    $$('.stage-card[data-stage]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('locked'))beginStage(b.dataset.stage)});
  }
  function stageCard(id,title,icon,desc,open){const done=state.cleared.includes(id);return `<button class="stage-card ${done?'cleared':''} ${open||done?'':'locked'}" data-stage="${id}"><span class="stage-icon">${icon}</span><h3>${title}</h3><p>${desc}</p>${done?'<b class="clear-mark">◆</b>':''}</button>`;}
  function beginStage(id){let qs,type='choice',title='';
    if(cats[id]){qs=shuffle(Q.basic[id]).slice(0,2);title=cats[id][0];}
    else if(id==='numbers'){qs=shuffle(Q.numbers).slice(0,6);title='数字コード';}
    else if(id==='sequences'){qs=shuffle(Q.sequences).slice(0,3);type='sort';title='手続き回廊';}
    else if(id==='boss'){qs=shuffle(Q.boss).slice(0,4);title='民意なき政治';}
    if(id==='boss'){sfx('boss');pulse('boss-entry');}else sfx('unlock');
    session={id,title,qs,index:0,type,attempts:0,answered:false,scored:!state.cleared.includes(id)};save();showQuestion();
  }
  function showQuestion(resume=false){screen('quizScreen');$('#quizScreen').dataset.stage=session.id;if(session.id==='boss')playBossMusic();const q=session.qs[session.index];if(!resume){session.attempts=0;session.answered=false;}$('#quizCategory').textContent=session.title;$('#quizNumber').textContent=`${session.index+1} / ${session.qs.length}`;$('#quizProgress').style.width=`${(session.index/session.qs.length)*100}%`;$('#questionType').textContent=session.type==='sort'?'手続き並べ替え':session.id==='boss'?'総合ミッション':session.id==='numbers'?'数字コード解読':'基本知識';$('#questionText').textContent=q.q;$('#feedback').className='feedback hidden';$('#nextQuestionBtn').classList.add('hidden');$('#choiceList').classList.toggle('hidden',session.type==='sort');$('#sortArea').classList.toggle('hidden',session.type!=='sort');
    if(session.type==='sort')renderSort(q);else renderChoices(q);
  }
  function renderChoices(q){$('#choiceList').innerHTML=shuffle(q.c).map(c=>`<button class="choice">${c}</button>`).join('');$$('.choice').forEach(b=>b.onclick=()=>answerChoice(b,q));}
  function answerChoice(btn,q){if(session.answered)return;session.attempts++;const ok=btn.textContent===q.a;if(ok){sfx('correct');pulse('answer-flash');session.answered=true;btn.classList.add('correct');finishAnswer(q,true);}else{sfx('wrong');btn.classList.add('wrong');btn.disabled=true;if(session.attempts===1){showFeedback('bad','ヒント：'+q.h);recordWrong(q);}else{session.answered=true;$$('.choice').forEach(b=>{b.disabled=true;if(b.textContent===q.a)b.classList.add('correct')});finishAnswer(q,false);}}}
  function recordWrong(q){const id=q.q;state.errors[q.tag||session.title]=(state.errors[q.tag||session.title]||0)+1;if(!state.wrongIds.includes(id))state.wrongIds.push(id);save();}
  function finishAnswer(q,firstTry){if(session.scored!==false){state.total++;if(firstTry&&session.attempts===1)state.firstCorrect++;}if(!firstTry&&session.attempts>1&&!state.wrongIds.includes(q.q))recordWrong(q);save();showFeedback(firstTry?'good':'bad',(firstTry?'正解！ ':'正答を確認：')+q.e);$('#nextQuestionBtn').classList.remove('hidden');}
  function showFeedback(kind,text){$('#feedback').className='feedback '+kind;$('#feedback').textContent=text;}
  function renderSort(q){let selected=[];const bank=shuffle(q.items);const area=$('#sortArea');area.innerHTML='<div class="sort-bank"><span class="sort-label">カード（タップして順番に置く）</span></div><div class="sort-answer"><span class="sort-label">あなたの順番（タップで戻す）</span></div><button class="btn primary compact sort-check" disabled>決定</button>';const bankEl=area.querySelector('.sort-bank'), ans=area.querySelector('.sort-answer'),check=area.querySelector('.sort-check');
    bank.forEach((txt,i)=>{const b=document.createElement('button');b.className='sort-card';b.textContent=txt;b.dataset.key=txt;b.onclick=()=>{if(b.parentElement===bankEl){ans.appendChild(b);selected.push(txt)}else{bankEl.appendChild(b);selected=selected.filter(x=>x!==txt)}check.disabled=selected.length!==q.items.length};bankEl.appendChild(b)});
    check.onclick=()=>{session.attempts++;const ok=selected.every((x,i)=>x===q.items[i]);if(ok){sfx('correct');pulse('answer-flash');session.answered=true;if(session.scored!==false){state.total++;if(session.attempts===1)state.firstCorrect++;}save();showFeedback('good','正解！ '+q.e);check.disabled=true;area.querySelectorAll('.sort-card').forEach(x=>x.disabled=true);$('#nextQuestionBtn').classList.remove('hidden');}else if(session.attempts===1){sfx('wrong');recordWrong(q);showFeedback('bad','順番が違います。最初と最後の手続きを確認して、もう一度！');while(ans.querySelector('.sort-card'))bankEl.appendChild(ans.querySelector('.sort-card'));selected=[];check.disabled=true;}else{sfx('wrong');session.answered=true;if(session.scored!==false)state.total++;save();bankEl.innerHTML='<span class="sort-label">正しい順番</span>';q.items.forEach(x=>{const c=document.createElement('span');c.className='sort-card';c.textContent=x;bankEl.appendChild(c)});ans.classList.add('hidden');check.classList.add('hidden');showFeedback('bad','正しい流れを確認：'+q.e);$('#nextQuestionBtn').classList.remove('hidden');}};
  }
  function nextQuestion(){session.index++;session.attempts=0;session.answered=false;save();if(session.index<session.qs.length)showQuestion();else completeStage();}
  function completeStage(){const completedId=session.id;if(completedId==='review'){session=null;save();reviewCompleteModal();return;}if(!state.cleared.includes(completedId))state.cleared.push(completedId);session=null;save();if(completedId==='boss'){state.finished=true;state.best=Math.max(state.best||0,state.total?state.firstCorrect/state.total:0);save();showResult();}else{rewardModal(completedId);}}
  function rewardModal(completedId){const basic=cats[completedId],allBasic=['election','diet','cabinet','court','local'].every(x=>state.cleared.includes(x));if(basic&&allBasic)playRouteJingle();else sfx(basic?'shard':'unlock');pulse(basic?'shard-burst':'route-restored');$('#modalBody').innerHTML=`<p class="eyebrow">MISSION COMPLETE</p><h2>${basic?'「'+basic[0]+'」の民意のかけらを獲得！':completedId==='numbers'?'数字コードを解読！':'手続きの流れを復旧！'}</h2><p>正解が、止まっていた民意のルートを動かしました。</p><button class="btn primary compact" data-action="map">マップへ</button>`;$('#modal').classList.remove('hidden');$('#modalBody [data-action="map"]').onclick=()=>{$('#modal').classList.add('hidden');renderMap()};}
  function reviewCompleteModal(){$('#modalBody').innerHTML='<p class="eyebrow">REVIEW COMPLETE</p><h2>苦手復習、完了！</h2><p>間違えた問題をもう一度確認しました。</p><button class="btn primary compact" data-action="result">結果へ戻る</button>';$('#modal').classList.remove('hidden');$('#modalBody [data-action="result"]').onclick=()=>{$('#modal').classList.add('hidden');showResult()};}
  function showResult(){stopBossMusic();screen('resultScreen');sfx('clear');pulse('chapter-clear');const rate=state.total?state.firstCorrect/state.total:0;const rank=rate>=.9?'S':rate>=.8?'A':rate>=.65?'B':'C';$('#rankSeal').textContent=rank;$('#accuracyResult').textContent=Math.round(rate*100)+'%';$('#scoreResult').textContent=`${state.firstCorrect} / ${state.total}`;const sec=Math.round((Date.now()-state.started)/1000);$('#timeResult').textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;const weak=Object.entries(state.errors).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);$('#weakResult').textContent=weak.length?'復習ポイント：'+weak.join('・'):'全分野を初回で突破しました！';}
  function review(){const all=[...Object.values(Q.basic).flat(),...Q.numbers,...Q.boss];let qs=all.filter(q=>state.wrongIds.includes(q.q));if(!qs.length){const weak=Object.entries(state.errors).sort((a,b)=>b[1]-a[1])[0]?.[0];qs=all.filter(q=>(q.tag||'')===weak).slice(0,5)}if(!qs.length)qs=shuffle(Q.boss).slice(0,4);session={id:'review',title:'苦手復習',qs:shuffle(qs).slice(0,6),index:0,type:'choice',attempts:0,answered:false,scored:false};save();showQuestion();}
  function continueGame(){load();if(state.finished){showResult();return;}if(session){if(session.answered){session.index++;session.attempts=0;session.answered=false;if(session.index>=session.qs.length){completeStage();return;}save();showQuestion();return;}showQuestion(true);return;}if(!state.storyDone){showStory();return;}renderMap();}
  function help(){const body=`<h2>遊び方</h2><ol><li>5分野で各2問に挑戦し、民意のかけらを5個集めます。</li><li>数字コード6問で、人数・年数・日数・割合を復旧します。</li><li>手続き3題を正しい順番に並べます。</li><li>ボス戦4問で、国民の声を政治へ届けます。</li></ol><p>不正解でもヒントを見て再挑戦できます。進行はこの端末に自動保存されます。</p>`;$('#modalBody').innerHTML=body;$('#modal').classList.remove('hidden');}
  document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a)return;const act=a.dataset.action;if(act==='sound'){soundOn=!soundOn;localStorage.setItem('hiropon_sound',soundOn?'on':'off');if(!soundOn)stopAllAudio();renderHeader();if(soundOn){sfx('correct');if(session?.id==='boss')playBossMusic();}return;}if(act==='new')startNew();if(act==='continue'){sfx('tap');continueGame();}if(act==='story-next'){sfx('tap');storyAt++;if(storyAt<story.length)showStory();else{state.storyDone=true;save();renderMap();}}if(act==='next-question'){sfx('tap');nextQuestion();}if(act==='help'){sfx('tap');help();}if(act==='close-modal')$('#modal').classList.add('hidden');if(act==='review')review();if(act==='restart')startNew()});
  load();renderHeader();
})();
