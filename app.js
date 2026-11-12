'use strict';
const $ = id => document.getElementById(id);
const icons = () => window.lucide?.createIcons();
const levels = AIWorld.levels;
let progress;
try { progress = WorldProgress.load(levels, localStorage, AIWorld.storageKey); }
catch { progress = WorldProgress.normalize(levels); }
let selectedLevel = progress.currentLevel;
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
  icons();
}
function enterLevel(id) {
  if (!progress.unlockedLevels.includes(id)) return;
  notify('Die gemeinsame Levelansicht wird in der nächsten Entwicklungsphase eingebunden.');
}
$('level-list').addEventListener('click', e => { const button = e.target.closest('[data-level]'); if (button) selectLevel(button.dataset.level); });
$('world-button').addEventListener('click', () => { $('world-view').hidden = false; $('level-view').hidden = true; renderWorld(); });
renderWorld();
