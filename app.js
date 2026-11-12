'use strict';
const $ = id => document.getElementById(id);
const icons = () => window.lucide?.createIcons();
const levels = AIWorld.levels;
let progress;
try { progress = WorldProgress.load(levels, localStorage, AIWorld.storageKey); }
catch { progress = WorldProgress.normalize(levels); }
let selectedLevel = progress.currentLevel;
let activeLevel, expedition, learningEvents, stationIndex = 0;
function saveProgress() {
  try { localStorage.setItem(AIWorld.storageKey, JSON.stringify(progress)); }
  catch { $('storage-note').hidden = false; $('storage-note').textContent = 'Speichern ist blockiert. Dein Fortschritt bleibt für diese Sitzung erhalten.'; }
}
function notify(text) { $('notice').textContent = text; $('notice').hidden = false; clearTimeout(notify.timer); notify.timer = setTimeout(() => $('notice').hidden = true, 4500); }
function selectLevel(id) { selectedLevel = id; renderWorld(); }
function renderWorld() {
  $('level-count').textContent = `${levels.length} LEVELS`;
  $('world-progress').textContent = `${progress.completedLevels.length} / ${levels.length} Levels abgeschlossen · Aktuell: ${levels.find(l => l.id === progress.currentLevel)?.title || levels[0].title}`;
  $('level-list').innerHTML = levels.map(l => {
    const locked = !progress.unlockedLevels.includes(l.id), done = progress.completedLevels.includes(l.id);
    return `<button class="level-card${selectedLevel === l.id ? ' selected' : ''}${locked ? ' locked' : ''}" data-level="${l.id}" aria-pressed="${selectedLevel === l.id}"><span class="station-number">${done ? '✓' : String(l.number).padStart(2,'0')}</span><span class="station-copy"><strong>${l.title}</strong><small>${locked ? 'Gesperrt' : done ? 'Abgeschlossen' : 'Verfügbar'} · ${l.topic}</small></span><i data-lucide="${locked ? 'lock-keyhole' : done ? 'circle-check' : 'arrow-up-right'}"></i></button>`;
  }).join('');
  const level = levels.find(l => l.id === selectedLevel) || levels[0], locked = !progress.unlockedLevels.includes(level.id);
  $('level-preview').innerHTML = `<div class="preview-copy"><span class="eyebrow">LEVEL ${String(level.number).padStart(2,'0')} / ${locked ? 'GESPERRT' : 'DEIN NÄCHSTER HALT'}</span><h2>${level.title}</h2><p>${level.intro}</p><div class="preview-meta"><span><i data-lucide="${level.icon}"></i>${level.topic}</span><span><i data-lucide="truck"></i>${level.vehicleName}</span></div></div><button class="primary" id="enter-level" ${locked ? 'disabled' : ''}><i data-lucide="${locked ? 'lock-keyhole' : 'arrow-right'}"></i>${locked ? `Zuerst ${levels.find(l => l.id === level.unlockedAfter).title} abschliessen` : 'Level erkunden'}</button>`;
  $('enter-level').addEventListener('click', () => enterLevel(level.id));
  WorldAtlas.render(levels, progress, selectedLevel, selectLevel);
  icons();
}
function enterLevel(id) {
  if (!progress.unlockedLevels.includes(id)) return;
  const level = levels.find(l => l.id === id);
  if (!level?.ready) { notify('Dieses Gebiet wird im nächsten Entwicklungsschritt geöffnet.'); return; }
  expedition?.destroy(); learningEvents?.abort();
  learningEvents = new AbortController(); activeLevel = level; stationIndex = 0;
  progress.currentLevel = id; saveProgress(); WorldAtlas.destroy();
  $('world-view').hidden = true; $('level-view').hidden = false;
  $('help-button').hidden = false;
  $('level-view').innerHTML = levelShell;
  $('level-heading').textContent = level.title;
  $('level-meta').innerHTML = `<span><i data-lucide="${level.icon}"></i> ${level.topic}</span><span>${level.vehicleName}</span>`;
  $('mode-description').textContent = level.intro;
  document.querySelector('#level-view .intro .eyebrow').textContent = `LEVEL ${String(level.number).padStart(2,'0')} / KI VERSTEHEN`;
  document.querySelector('#level-view .world-top .eyebrow').textContent = level.title.toUpperCase()+' / LERNROUTE';
  document.querySelector('#level-view .minimap-button>span').textContent = level.title.toUpperCase()+' · ROUTE';
  document.querySelector('#level-view .world').setAttribute('aria-label',`Interaktive 3D-Landschaft: ${level.title}`);
  const on=(id,event,fn)=>$(id).addEventListener(event,fn,{signal:learningEvents.signal});
  on('station-list','click',e=>{const button=e.target.closest('[data-index]');if(button){stationIndex=Number(button.dataset.index);expedition.select(stationIndex);openStation(stationIndex);}});
  on('summary-button','click',openCheckpoint);
  on('help-button','click',()=>{expedition?.pause();$('help-dialog').showModal();});
  on('close-help','click',()=>$('help-dialog').close());
  $('station-dialog').addEventListener('close',()=>expedition?.pause(),{signal:learningEvents.signal});
  $('checkpoint-dialog').addEventListener('close',()=>expedition?.pause(),{signal:learningEvents.signal});
  expedition=createExpedition({level,visited:progress.visitedStations[id],onTarget:index=>{stationIndex=index;renderStationList();},onStation:(index,arrived)=>openStation(index,arrived)});
  $('route-count').textContent=`${level.stations.length} STATIONEN`;
  $('intro-dialog').innerHTML=`<span class="eyebrow">LEVEL ${level.number} / ${level.vehicleName.toUpperCase()}</span><h2 id="intro-heading">Willkommen in ${level.title}.</h2><p>${level.intro}</p><h3>Das lernst du</h3><ul class="checklist">${level.objectives.map(t=>`<li>${t}</li>`).join('')}</ul><p>Erkunde die Stationen per Klick oder mit dem Fahrzeug. Probiere die Demo aus und bestehe den Wissenscheck, um das nächste Gebiet freizuschalten.</p><button class="primary" id="start-learning">Reise beginnen <i data-lucide="arrow-right"></i></button>`;
  $('start-learning').addEventListener('click',()=>$('intro-dialog').close());
  $('intro-dialog').showModal();
  window.scrollTo(0,0);icons();
}
function renderStationList(){
  if(!activeLevel)return;
  $('station-list').innerHTML=activeLevel.stations.map((s,i)=>{const visited=progress.visitedStations[activeLevel.id].includes(s.id);return `<button class="station-button${i===stationIndex?' active':''}${visited?' visited':''}" data-index="${i}" ${i===stationIndex?'aria-current="step"':''}><span class="station-number">${visited?'✓':String(i+1).padStart(2,'0')}</span><span class="station-copy"><span class="station-name">${s.name}</span><span class="station-subtitle">${s.subtitle}</span></span><i class="station-arrow" data-lucide="arrow-up-right"></i></button>`;}).join('');
  icons();
}
function openStation(index,arrived=false){
  const level=activeLevel,s=level.stations[index];stationIndex=index;expedition?.pause();
  if(arrived)markStation(s.id);
  const visited=progress.visitedStations[level.id].includes(s.id),dialog=$('station-dialog');
  dialog.innerHTML=`<div class="dialog-header"><span class="eyebrow">${arrived?'STATION ERREICHT':visited?'BEREITS ERKUNDET':'STATION ERKUNDEN'} / ${index+1} VON ${level.stations.length}</span><button class="icon-button" id="close-station" aria-label="Station schliessen">×</button></div><div class="station-dialog-heading"><span class="station-emblem"><i data-lucide="${s.icon}"></i></span><div><span class="eyebrow">${s.subtitle}</span><h2 id="station-heading">${s.name}</h2></div><span class="large-number">${String(index+1).padStart(2,'0')}</span></div><p class="station-dialog-intro">${s.text}</p><section class="process-section"><h3>Was passiert hier?</h3><ol class="process-steps">${s.steps.map((t,i)=>`<li><span>${i+1}</span><p>${t}</p></li>`).join('')}</ol></section><section class="example-section"><h3>Ein konkretes Beispiel</h3><pre>${s.example}</pre></section><div id="station-demo"></div><aside class="station-caution"><i data-lucide="info"></i><p>${s.caution}</p></aside><div class="station-dialog-footer"><span id="read-status">${progress.visitedStations[level.id].length} / ${level.stations.length} Stationen erkundet</span><button class="secondary" id="understood">${visited?'Verstanden ✓':'Station verstanden'}</button><button class="primary" id="station-next">${index<level.stations.length-1?'Nächste Station':'Zusammenfassung'} <i data-lucide="arrow-right"></i></button></div>`;
  $('close-station').addEventListener('click',()=>dialog.close());
  $('understood').addEventListener('click',()=>{markStation(s.id);$('understood').textContent='Verstanden ✓';$('read-status').textContent=`${progress.visitedStations[level.id].length} / ${level.stations.length} Stationen erkundet`;});
  $('station-next').addEventListener('click',()=>{dialog.close();if(index<level.stations.length-1){expedition.select(index+1);openStation(index+1);}else openCheckpoint();});
  if(s.demo)LearningDemos.render($('station-demo'),s.demo,id=>{const done=progress.completedDemos[level.id];if(!done.includes(id)){done.push(id);saveProgress();}});
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;renderStationList();icons();
}
function markStation(id){
  const visited=progress.visitedStations[activeLevel.id];if(!visited.includes(id))visited.push(id);
  expedition?.mark(id);saveProgress();renderStationList();
}
function openCheckpoint(){
  expedition?.pause();const level=activeLevel,dialog=$('checkpoint-dialog');
  dialog.innerHTML=`<div class="dialog-header"><span class="eyebrow">${level.title.toUpperCase()} / REISECHECK</span><button class="icon-button" id="close-checkpoint" aria-label="Wissenscheck schliessen">×</button></div><h2 id="checkpoint-heading">Das nimmst du mit.</h2><ul class="checklist">${level.summary.map(t=>`<li>${t}</li>`).join('')}</ul><h3>Teste dein Verständnis</h3><form id="quiz-form">${level.checkpoints.map((q,i)=>`<fieldset class="quiz-question"><legend>${i+1}. ${q.question}</legend>${q.options.map((o,j)=>`<label><input type="radio" name="${q.id}" value="${j}" ${progress.passedCheckpoints[level.id].includes(q.id)&&q.answer===j?'checked':''}> <span>${o}</span></label>`).join('')}<p class="quiz-feedback" id="feedback-${q.id}"></p></fieldset>`).join('')}<button class="secondary" type="submit">Antworten prüfen</button></form><p class="completion-state" id="completion-state" role="status"></p><button class="primary" id="complete-level" disabled>Level abschliessen <i data-lucide="check"></i></button>`;
  $('close-checkpoint').addEventListener('click',()=>dialog.close());
  $('quiz-form').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.target);for(const q of level.checkpoints){const value=form.get(q.id),correct=value!==null&&Number(value)===q.answer;const el=$('feedback-'+q.id);el.textContent=(correct?'Richtig. ':value===null?'Bitte wähle eine Antwort. ':'Noch nicht richtig. ')+(value!==null?q.explanation:'');el.classList.toggle('success',correct);const passed=progress.passedCheckpoints[level.id];if(correct&&!passed.includes(q.id))passed.push(q.id);else if(!correct)progress.passedCheckpoints[level.id]=passed.filter(id=>id!==q.id);}saveProgress();updateCompletion();});
  $('complete-level').addEventListener('click',()=>{if(!WorldProgress.canComplete(level,progress))return;if(!progress.completedLevels.includes(level.id))progress.completedLevels.push(level.id);const next=levels.find(l=>l.unlockedAfter===level.id);progress=WorldProgress.normalize(levels,{...progress,currentLevel:next?.id||level.id});saveProgress();dialog.close();showWorld();selectLevel(next?.id||level.id);notify(next?`${level.title} abgeschlossen. ${next.title} ist jetzt freigeschaltet.`:'Alle sieben Levels abgeschlossen. Deine Lernreise ist vollständig.');});
  updateCompletion();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;icons();
}
function updateCompletion(){
  const l=activeLevel,visited=progress.visitedStations[l.id].length,passed=progress.passedCheckpoints[l.id].length,demos=l.stations.filter(s=>s.demo).length,done=progress.completedDemos[l.id].length;
  $('completion-state').textContent=`${visited}/${l.stations.length} Stationen · ${done}/${demos} Demos · ${passed}/${l.checkpoints.length} richtige Antworten`;
  $('complete-level').disabled=!WorldProgress.canComplete(l,progress);
}
function showWorld(){
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());expedition?.destroy();expedition=null;learningEvents?.abort();activeLevel=null;
  $('world-view').hidden=false;$('level-view').hidden=true;$('level-view').innerHTML='';selectedLevel=progress.currentLevel;renderWorld();window.scrollTo(0,0);
  $('help-button').hidden=true;
}
$('level-list').addEventListener('click', e => { const button = e.target.closest('[data-level]'); if (button) selectLevel(button.dataset.level); });
$('world-button').addEventListener('click', showWorld);
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();showWorld();});
renderWorld();
