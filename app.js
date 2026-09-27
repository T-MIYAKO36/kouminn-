(function(){
  const Q=window.HIROPON_Q, SAVE='hiropon_ch4_v2';
  const coreIds=['election','diet','cabinet','court','local'];
  const cats={
    election:['選挙','声を代表者へ託す','投票ルート'],
    diet:['国会','法律をつくる','法案ルート'],
    cabinet:['内閣','政策を実行する','政策司令'],
    court:['裁判所','憲法と権利を守る','違憲ジャッジ'],
    local:['地方自治','地域の声を決まりへ','住民ルート']
  };
  const coreNames={election:'選挙',diet:'国会',cabinet:'内閣',court:'裁判所',local:'地方自治'};
  const story=[
    ['勉三','初めての国会だ！ ……あれ？ 国民から届いた要望書を、全部「内閣」へ送っちゃった！'],
    ['ヒロポン','ガガーン！ 選挙・国会・内閣・裁判所・地方自治を結ぶ「民意のルート」が停止したぞい。'],
    ['勉三','僕が5つの民意コアを再起動して、国民の声を正しい場所へ届けます！'],
    ['ヒロポン','知識だけでなく、実際にルートを選ぶのじゃ。最後は5つのコアを連携させるぞ！']
  ];
  const missions={
    election:{mode:'mission',q:'市民が政策を比べ、自分たちの代表を選びたい。最初につなぐルートは？',a:'選挙へ送る',c:['選挙へ送る','裁判所へ送る','内閣だけで決める'],e:'国民は選挙で代表者を選び、民意を政治へ届けます。',h:'代表者を選ぶ仕組みを使います。',tag:'選挙'},
    diet:{mode:'mission',q:'全国で使う新しいルールを法律にしたい。要望書をどこへ送る？',a:'国会へ送る',c:['国会へ送る','最高裁判所へ送る','市役所だけへ送る'],e:'国会は国の唯一の立法機関として法律を制定します。',h:'法律をつくる立法機関です。',tag:'国会'},
    cabinet:{mode:'mission',q:'成立した災害対策法を、全国で実際に動かしたい。司令を出すのは？',a:'内閣へ送る',c:['内閣へ送る','国会だけへ戻す','裁判所へ送る'],e:'内閣は法律と予算に基づいて政策を実施します。',h:'決まった政策を実行する行政機関です。',tag:'内閣'},
    court:{mode:'mission',q:'成立した法律が憲法に反している疑いがある。判定を頼む先は？',a:'裁判所へ送る',c:['裁判所へ送る','政党へ送る','内閣だけへ送る'],e:'裁判所は具体的な裁判を通して違憲審査を行います。',h:'憲法の番人と呼ばれる機関です。',tag:'裁判所'},
    local:{mode:'mission',q:'市の公園利用について、地域独自の決まりをつくりたい。最も近いルートは？',a:'地方自治へ送る',c:['地方自治へ送る','国会だけへ送る','最高裁判所へ送る'],e:'住民の身近な課題は、条例や直接請求など地方自治の仕組みにつなげます。',h:'地域独自の条例をつくる場です。',tag:'地方自治'}
  };
  const keypadLocks=[
    {mode:'keypad',q:'LOCK 1｜衆議院と参議院の任期を、順に続けて入力せよ。',code:'46',e:'衆議院4年・参議院6年で「46」。衆議院には解散があります。',h:'短い方が衆議院、長い方が参議院。',tag:'数字コード'},
    {mode:'keypad',q:'LOCK 2｜衆議院の解散後、総選挙は何日以内？',code:'40',e:'解散の日から40日以内に総選挙を行います。',h:'選挙後の特別会は30日以内。こちらはそれより10日長い数字です。',tag:'数字コード'},
    {mode:'keypad',q:'LOCK 3｜内閣不信任決議後、解散しない場合は何日以内に総辞職？',code:'10',e:'10日以内に衆議院を解散しない限り、内閣は総辞職します。',h:'40・30より短い期限です。',tag:'数字コード'}
  ];

  let state=fresh(), session=null, storyAt=0, bossWarningTimer=null;
  let audioCtx=null, fanfare=null, routeJingle=null, bossMusic=null, soundOn=localStorage.getItem('hiropon_sound')!=='off';
  const favoriteAudio={};
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

  function fresh(){return{cleared:[],firstCorrect:0,total:0,errors:{},wrongIds:[],started:Date.now(),duration:null,finished:false,best:null,storyAt:0,storyDone:false,activeSession:null};}
  function save(){state.storyAt=storyAt;state.activeSession=session;localStorage.setItem(SAVE,JSON.stringify(state));renderHeader();}
  function load(){try{const v=JSON.parse(localStorage.getItem(SAVE));if(v){state={...fresh(),...v};storyAt=state.storyAt||0;session=state.activeSession||null;}}catch(e){state=fresh();session=null;storyAt=0;}}
  function screen(id){clearTimeout(bossWarningTimer);$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');}
  function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

  function renderHeader(){
    const n=coreIds.filter(x=>state.cleared.includes(x)).length;
    $('#shardCount').textContent=n+' / 5';
    $('#shardMini').innerHTML=coreIds.map(id=>`<span class="mini-shard core-${id} ${state.cleared.includes(id)?'found':''}" title="${coreNames[id]}コア"></span>`).join('');
    $('#continueBtn').disabled=!localStorage.getItem(SAVE);
    const sb=$('#soundBtn');if(sb){sb.textContent=soundOn?'♪':'×';sb.setAttribute('aria-label',soundOn?'音を切る':'音を出す');sb.setAttribute('aria-pressed',String(soundOn));}
  }

  function audio(){if(!soundOn)return null;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx;}catch(e){return null;}}
  function tone(freq,at=.0,dur=.12,type='square',gain=.07){const c=audio();if(!c)return;const now=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,now+at);g.gain.setValueAtTime(.0001,now+at);g.gain.exponentialRampToValueAtTime(gain,now+at+.012);g.gain.exponentialRampToValueAtTime(.0001,now+at+dur);o.connect(g).connect(c.destination);o.start(now+at);o.stop(now+at+dur+.02);}
  function playFavorite(name,src,volume=.62){if(!soundOn)return false;try{const a=favoriteAudio[name]||(favoriteAudio[name]=new Audio(src));a.preload='none';a.volume=volume;a.currentTime=0;const p=a.play();if(p&&p.catch)p.catch(()=>{});return true;}catch(e){return false;}}
  function sfx(name){
    if(!soundOn)return;
    if(name==='correct'){playFavorite('correct','assets/se-correct-favorite.mp3',.78);return;}
    if(name==='reward'){playFavorite('reward','assets/se-reward-8bit-favorite.mp3',.72);return;}
    if(name==='fanfare'){playFavorite('fanfare','assets/se-whistle-fanfare-favorite.mp3',.72);return;}
    if(name==='gagaan'){playFavorite('gagaan','assets/se-fail-gagaan-favorite.mp3',.62);return;}
    if(name==='countdown'){playFavorite('countdown','assets/se-countdown-favorite.mp3',.52);return;}
    const notes={tap:[[0,660,.055,'square']],wrong:[[0,190,.12,'sawtooth'],[.09,145,.2,'sawtooth']],unlock:[[0,392,.12,'square'],[.1,523,.13,'square'],[.2,659,.22,'triangle']],boss:[[0,110,.35,'sawtooth'],[.22,82,.55,'sawtooth']],clear:[[0,523,.16,'square'],[.1,659,.16,'square'],[.2,784,.16,'square'],[.32,1047,.22,'triangle'],[.5,1319,.5,'triangle']]};
    (notes[name]||notes.tap).forEach(n=>tone(n[1],n[0],n[2],n[3],name==='boss'?.045:.075));
  }
  function playOpeningFanfare(){if(!soundOn)return;if(!fanfare){fanfare=new Audio('assets/fanfare13.mp3');fanfare.preload='none';fanfare.volume=.62;}fanfare.currentTime=0;const p=fanfare.play();if(p&&p.catch)p.catch(()=>sfx('unlock'));}
  function playRouteJingle(){if(!soundOn)return;if(!routeJingle){routeJingle=new Audio('assets/route-awakening.mp3');routeJingle.preload='none';routeJingle.volume=.85;}routeJingle.currentTime=0;const p=routeJingle.play();if(p&&p.catch)p.catch(()=>sfx('unlock'));}
  function playBossMusic(){if(!soundOn)return;if(!bossMusic){bossMusic=new Audio('assets/boss-tension.mp3');bossMusic.preload='none';bossMusic.loop=true;bossMusic.volume=.35;}if(bossMusic.paused){const p=bossMusic.play();if(p&&p.catch)p.catch(()=>{});}}
  function stopBossMusic(){if(bossMusic&&!bossMusic.paused){bossMusic.pause();bossMusic.currentTime=0;}}
  function stopAllAudio(){[fanfare,routeJingle,bossMusic,...Object.values(favoriteAudio)].forEach(a=>{if(a){a.pause();a.currentTime=0;}});}
  function pulse(cls){const game=$('#game');game.classList.remove(cls);void game.offsetWidth;game.classList.add(cls);setTimeout(()=>game.classList.remove(cls),750);}

  function startNew(){playOpeningFanfare();pulse('adventure-start');state=fresh();session=null;storyAt=0;save();showStory();}
  function showStory(){screen('storyScreen');const [who,text]=story[storyAt];$('.speaker').textContent=who==='勉三'?'北中 勉三':'ヒロポン';$('#storyText').textContent=text;$('.scene-card').dataset.speaker=who;save();}

  function renderMap(){
    stopBossMusic();screen('mapScreen');$('#locationLabel').textContent='政治の都・民意回廊';
    const allBasic=coreIds.every(x=>state.cleared.includes(x));let cards=[];
    Object.entries(cats).forEach(([id,v])=>cards.push(`<button class="stage-card ${state.cleared.includes(id)?'cleared':''}" data-stage="${id}"><span class="stage-core core-${id}"><img src="assets/shard-${id}.svg" alt=""></span><h3>${v[0]}の門</h3><p>${v[1]}<br><b>${v[2]}</b></p>${state.cleared.includes(id)?'<b class="clear-mark">コア起動済み</b>':''}</button>`));
    cards.push(stageCard('numbers','数字コード','assets/gate-number-v2.webp','テンキーで3ロック解除',allBasic));
    cards.push(stageCard('sequences','手続き回廊','assets/gate-procedure-v2.webp','カード並べ替え｜2題',state.cleared.includes('numbers')));
    cards.push(stageCard('boss','民意の王門','assets/gate-peoples-will-v2.webp','5コア連携｜3件',state.cleared.includes('sequences')));
    $('#stageGrid').innerHTML=cards.join('');
    $('#stageBoardWrap').classList.toggle('advanced',allBasic);
    $('#stageBoardWrap').dataset.route=!state.cleared.includes('numbers')?'numbers':!state.cleared.includes('sequences')?'sequences':'boss';
    $('#stageGrid').classList.toggle('board-mode',!allBasic);
    if(!allBasic){const next=coreIds.find(id=>!state.cleared.includes(id))||'local';$('#stageGrid').insertAdjacentHTML('beforeend',`<img class="board-duo-token token-at-${next}" src="assets/duo-token-official-v2.webp" alt="勉三とヒロポンのコマ">`);}
    $('#stageGrid').style.gridTemplateColumns=allBasic?'repeat(3,1fr)':'none';
    $('#mapHint').textContent=state.finished?'完全復旧済み。苦手復習または再挑戦ができます。':allBasic?'5つの民意コアが起動！ テンキー扉へ進もう。':'各門の知識と専用ミッションで、5つの民意コアを起動しよう。';
    $('#reviewBtn').classList.toggle('hidden',!state.finished&&!state.wrongIds.length);
    $('#footerShards').innerHTML=coreIds.map(id=>`<span class="footer-core core-${id} ${state.cleared.includes(id)?'found':''}"><img src="assets/shard-${id}.svg" alt="${coreNames[id]}コア"></span>`).join('');
    $$('.stage-card[data-stage]').forEach(b=>b.onclick=()=>{if(!b.classList.contains('locked'))beginStage(b.dataset.stage)});
  }
  function stageCard(id,title,image,desc,open){const done=state.cleared.includes(id);return `<button class="stage-card gate-card ${done?'cleared':''} ${open||done?'':'locked'}" data-stage="${id}"><img class="gate-art" src="${image}" alt=""><span class="gate-lock" aria-hidden="true"></span><h3>${title}</h3><p>${desc}</p>${done?'<b class="clear-mark">攻略済み</b>':''}</button>`;}

  function beginStage(id){
    let qs=[],title='';
    if(cats[id]){qs=[shuffle(Q.basic[id])[0],missions[id]];title=cats[id][0];}
    else if(id==='numbers'){qs=keypadLocks;title='数字コード';}
    else if(id==='sequences'){qs=shuffle(Q.sequences).slice(0,2);title='手続き回廊';}
    else if(id==='boss'){qs=shuffle(Q.boss).slice(0,3);title='民意なき政治';}
    if(id==='boss'){sfx('boss');pulse('boss-entry');}else sfx('unlock');
    session={id,title,qs,index:0,attempts:0,answered:false,scored:!state.cleared.includes(id),keypadValue:''};save();showQuestion();
  }

  function showQuestion(resume=false){
    screen('quizScreen');$('#quizScreen').dataset.stage=session.id;
    if(session.id==='boss')playBossMusic();
    const q=session.qs[session.index];if(!resume){session.attempts=0;session.answered=false;session.keypadValue='';}
    $('#quizCategory').textContent=session.title;$('#quizNumber').textContent=`${session.index+1} / ${session.qs.length}`;$('#quizProgress').style.width=`${(session.index/session.qs.length)*100}%`;
    $('#questionType').textContent=q.mode==='keypad'?'テンキー解除':q.mode==='mission'?'専用ミッション':session.id==='boss'?'民意ルート決戦':session.id==='sequences'?'手続き並べ替え':'基本知識';
    $('#questionText').textContent=q.q;$('#feedback').className='feedback hidden';$('#nextQuestionBtn').classList.add('hidden');
    $('#choiceList').classList.add('hidden');$('#sortArea').classList.add('hidden');$('#interactionArea').classList.add('hidden');$('#coreTray').classList.add('hidden');
    if(q.mode==='keypad')renderKeypad(q);else if(session.id==='sequences')renderSort(q);else renderChoices(q,q.mode==='mission'||session.id==='boss');
    if(session.id==='boss'){renderCoreTray();armBossWarning();}
  }
  function renderCoreTray(){const tray=$('#coreTray');tray.innerHTML='<span>起動中</span>'+coreIds.map(id=>`<span class="battle-core core-${id}"><img src="assets/shard-${id}.svg" alt="${coreNames[id]}"></span>`).join('');tray.classList.remove('hidden');}
  function armBossWarning(){clearTimeout(bossWarningTimer);$('#quizScreen').classList.remove('urgent');bossWarningTimer=setTimeout(()=>{if(session&&session.id==='boss'&&!session.answered){sfx('countdown');$('#quizScreen').classList.add('urgent');showFeedback('warn','民意ルートが不安定！ 落ち着いて、どの機関が働くか考えよう。');}},9000);}

  function renderChoices(q,isMission=false){
    const list=$('#choiceList');list.className='choices '+(isMission?'mission-choices':'');list.classList.remove('hidden');
    list.innerHTML=shuffle(q.c).map((c,i)=>`<button class="choice" data-route="${i+1}">${isMission?'<span class="route-light"></span>':''}<b>${c}</b></button>`).join('');
    $$('.choice').forEach(b=>b.onclick=()=>answerChoice(b,q));
  }
  function answerChoice(btn,q){
    if(session.answered)return;session.attempts++;const ok=btn.querySelector('b')?btn.querySelector('b').textContent===q.a:btn.textContent===q.a;
    if(ok){clearTimeout(bossWarningTimer);$('#quizScreen').classList.remove('urgent');sfx('correct');pulse('answer-flash');session.answered=true;btn.classList.add('correct');finishAnswer(q,true);}
    else{session.attempts===1?sfx('wrong'):sfx('gagaan');btn.classList.add('wrong');btn.disabled=true;if(session.attempts===1){showFeedback('bad','ヒント：'+q.h);recordWrong(q);}else{session.answered=true;$$('.choice').forEach(b=>{b.disabled=true;const t=b.querySelector('b')?b.querySelector('b').textContent:b.textContent;if(t===q.a)b.classList.add('correct')});finishAnswer(q,false);}}
  }

  function renderKeypad(q){
    const area=$('#interactionArea');area.classList.remove('hidden');
    area.innerHTML=`<div class="keypad-console"><div class="lock-status">POLITICAL ROUTE LOCK <b>${session.index+1}/3</b></div><div class="keypad-display" aria-live="polite">${(session.keypadValue||'').padEnd(q.code.length,'_')}</div><div class="keypad-grid">${[1,2,3,4,5,6,7,8,9,'C',0,'決定'].map(k=>`<button data-key="${k}">${k}</button>`).join('')}</div><p>数字をタップしてコードを入力</p></div>`;
    area.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{if(session.answered)return;const key=b.dataset.key;if(key==='C')session.keypadValue='';else if(key==='決定')checkKeypad(q);else if(session.keypadValue.length<q.code.length)session.keypadValue+=key;area.querySelector('.keypad-display').textContent=(session.keypadValue||'').padEnd(q.code.length,'_');save();});
  }
  function checkKeypad(q){
    if(session.keypadValue.length!==q.code.length){showFeedback('bad',`${q.code.length}桁のコードを入力しよう。`);return;}
    session.attempts++;const ok=session.keypadValue===q.code;
    if(ok){sfx('correct');pulse('lock-open');session.answered=true;finishAnswer(q,true);$('#interactionArea').querySelectorAll('button').forEach(b=>b.disabled=true);}
    else{session.attempts===1?sfx('gagaan'):sfx('wrong');if(session.attempts===1){recordWrong(q);showFeedback('bad','コードエラー！ ヒント：'+q.h);session.keypadValue='';renderKeypad(q);}else{session.answered=true;session.keypadValue=q.code;renderKeypad(q);$('#interactionArea').querySelectorAll('button').forEach(b=>b.disabled=true);finishAnswer(q,false);}}
  }

  function renderSort(q){
    let selected=[];const bank=shuffle(q.items),area=$('#sortArea');area.classList.remove('hidden');
    area.innerHTML='<div class="sort-bank"><span class="sort-label">カード（タップして順番に置く）</span></div><div class="sort-answer"><span class="sort-label">民意ルート（タップで戻す）</span></div><button class="btn primary compact sort-check" disabled>ルート接続</button>';
    const bankEl=area.querySelector('.sort-bank'),ans=area.querySelector('.sort-answer'),check=area.querySelector('.sort-check');
    bank.forEach(txt=>{const b=document.createElement('button');b.className='sort-card';b.textContent=txt;b.onclick=()=>{if(b.parentElement===bankEl){ans.appendChild(b);selected.push(txt)}else{bankEl.appendChild(b);selected=selected.filter(x=>x!==txt)}check.disabled=selected.length!==q.items.length};bankEl.appendChild(b)});
    check.onclick=()=>{session.attempts++;const ok=selected.every((x,i)=>x===q.items[i]);if(ok){sfx('correct');pulse('answer-flash');session.answered=true;scoreAnswer(true);showFeedback('good','ルート接続成功！ '+q.e);check.disabled=true;area.querySelectorAll('.sort-card').forEach(x=>x.disabled=true);$('#nextQuestionBtn').classList.remove('hidden');}else if(session.attempts===1){sfx('wrong');recordWrong(q);showFeedback('bad','接続エラー。最初と最後の手続きを確認しよう。');while(ans.querySelector('.sort-card'))bankEl.appendChild(ans.querySelector('.sort-card'));selected=[];check.disabled=true;}else{sfx('gagaan');session.answered=true;scoreAnswer(false);bankEl.innerHTML='<span class="sort-label">正しい民意ルート</span>';q.items.forEach(x=>{const c=document.createElement('span');c.className='sort-card';c.textContent=x;bankEl.appendChild(c)});ans.classList.add('hidden');check.classList.add('hidden');showFeedback('bad','正しい流れを確認：'+q.e);$('#nextQuestionBtn').classList.remove('hidden');}};
  }

  function recordWrong(q){const id=q.q;state.errors[q.tag||session.title]=(state.errors[q.tag||session.title]||0)+1;if(!state.wrongIds.includes(id))state.wrongIds.push(id);save();}
  function scoreAnswer(firstTry){if(session.scored!==false){state.total++;if(firstTry&&session.attempts===1)state.firstCorrect++;}save();}
  function finishAnswer(q,firstTry){scoreAnswer(firstTry);if(!firstTry&&!state.wrongIds.includes(q.q))recordWrong(q);showFeedback(firstTry?'good':'bad',(firstTry?'成功！ ':'正答を確認：')+q.e);$('#nextQuestionBtn').classList.remove('hidden');}
  function showFeedback(kind,text){$('#feedback').className='feedback '+kind;$('#feedback').textContent=text;}
  function nextQuestion(){session.index++;session.attempts=0;session.answered=false;session.keypadValue='';save();if(session.index<session.qs.length)showQuestion();else completeStage();}

  function completeStage(){
    const completedId=session.id;if(completedId==='review'){session=null;save();reviewCompleteModal();return;}
    if(!state.cleared.includes(completedId))state.cleared.push(completedId);session=null;save();
    if(completedId==='boss'){state.finished=true;state.duration=Math.max(0,Math.round((Date.now()-state.started)/1000));state.best=Math.max(state.best||0,state.total?state.firstCorrect/state.total:0);save();showResult();}else rewardModal(completedId);
  }
  function rewardModal(completedId){
    const basic=cats[completedId],allBasic=coreIds.every(x=>state.cleared.includes(x));
    if(basic){sfx('reward');if(allBasic)setTimeout(()=>{sfx('fanfare');playRouteJingle();},650);}else sfx('reward');
    pulse(basic?'core-awaken':'route-restored');
    const reward=basic?`<div class="reward-item core-reward core-${completedId}"><span class="core-rings"></span><img src="assets/shard-${completedId}.svg" alt="${basic[0]}の民意コア"><b>${basic[0]}コア</b></div>`:completedId==='numbers'?'<div class="reward-item gate-reward"><img src="assets/gate-number-v2.webp" alt="数字の扉"><b>テンキー扉 解錠</b></div>':'<div class="reward-item gate-reward"><img src="assets/gate-procedure-v2.webp" alt="手続きの扉"><b>手続きルート 復旧</b></div>';
    $('#modalBody').innerHTML=`<p class="eyebrow">MISSION COMPLETE</p>${reward}<h2>${basic?'「'+basic[0]+'」の民意コア起動！':completedId==='numbers'?'3つの数字ロックを解除！':'政治の手続きを接続！'}</h2><p>${basic?basic[1]+'力が、民意ルートへ戻りました。':'正しい操作が、民意の王門への道を開きました。'}</p><button class="btn primary compact" data-action="map">マップへ</button>`;
    $('#modal').classList.remove('hidden');$('#modalBody [data-action="map"]').onclick=()=>{$('#modal').classList.add('hidden');renderMap()};
  }
  function reviewCompleteModal(){$('#modalBody').innerHTML='<p class="eyebrow">REVIEW COMPLETE</p><h2>苦手復習、完了！</h2><p>間違えた問題をもう一度確認しました。</p><button class="btn primary compact" data-action="result">結果へ戻る</button>';$('#modal').classList.remove('hidden');$('#modalBody [data-action="result"]').onclick=()=>{$('#modal').classList.add('hidden');showResult()};}
  function showResult(){stopBossMusic();screen('resultScreen');pulse('chapter-clear');const rate=state.total?state.firstCorrect/state.total:0,rank=rate>=.9?'S':rate>=.8?'A':rate>=.65?'B':'C';$('#rankSeal').textContent=rank;$('#accuracyResult').textContent=Math.round(rate*100)+'%';$('#scoreResult').textContent=`${state.firstCorrect} / ${state.total}`;const sec=state.duration??Math.max(0,Math.round((Date.now()-state.started)/1000));$('#timeResult').textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;const weak=Object.entries(state.errors).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);$('#weakResult').textContent=weak.length?'復習ポイント：'+weak.join('・'):'5つの民意ルートを初回で接続しました！';}
  function review(){const all=[...Object.values(Q.basic).flat(),...Q.boss];let qs=all.filter(q=>state.wrongIds.includes(q.q));if(!qs.length){const weak=Object.entries(state.errors).sort((a,b)=>b[1]-a[1])[0]?.[0];qs=all.filter(q=>(q.tag||'')===weak).slice(0,5)}if(!qs.length)qs=shuffle(Q.boss).slice(0,4);session={id:'review',title:'苦手復習',qs:shuffle(qs).slice(0,5),index:0,attempts:0,answered:false,scored:false,keypadValue:''};save();showQuestion();}
  function continueGame(){load();if(state.finished){showResult();return;}if(session){if(session.answered){session.index++;session.attempts=0;session.answered=false;session.keypadValue='';if(session.index>=session.qs.length){completeStage();return;}save();showQuestion();return;}showQuestion(true);return;}if(!state.storyDone){showStory();return;}renderMap();}
  function help(){const body='<h2>遊び方</h2><ol><li>5つの門で、知識問題と専用ミッションに挑戦します。</li><li>獲得した5つの民意コアで、テンキー扉を解除します。</li><li>政治の手続きを2本つなぎ直します。</li><li>ボス戦で、国民の声を正しい政治ルートへ届けます。</li></ol><p>不正解でもヒントを見て再挑戦できます。約12～18分、進行は自動保存です。</p>';$('#modalBody').innerHTML=body;$('#modal').classList.remove('hidden');}

  document.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a)return;const act=a.dataset.action;
    if(act==='sound'){soundOn=!soundOn;localStorage.setItem('hiropon_sound',soundOn?'on':'off');if(!soundOn)stopAllAudio();renderHeader();if(soundOn){sfx('correct');if(session?.id==='boss')playBossMusic();}return;}
    if(act==='new')startNew();if(act==='continue'){sfx('tap');continueGame();}
    if(act==='story-next'){sfx('tap');storyAt++;if(storyAt<story.length)showStory();else{state.storyDone=true;save();renderMap();}}
    if(act==='next-question'){sfx('tap');nextQuestion();}if(act==='help'){sfx('tap');help();}if(act==='close-modal')$('#modal').classList.add('hidden');if(act==='review')review();if(act==='restart')startNew();
  });
  load();renderHeader();
})();
