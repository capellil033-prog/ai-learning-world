(function (root) {
  'use strict';
  function normalize(levels, raw = {}) {
    const completedLevels = [];
    for (const level of levels) {
      if (level.unlockedAfter && !completedLevels.includes(level.unlockedAfter)) break;
      if (Array.isArray(raw.completedLevels) && raw.completedLevels.includes(level.id)) completedLevels.push(level.id);
      else break;
    }
    const unlockedLevels = levels.filter(l => !l.unlockedAfter || completedLevels.includes(l.unlockedAfter)).map(l => l.id);
    const currentLevel = unlockedLevels.includes(raw.currentLevel) ? raw.currentLevel : unlockedLevels.find(id => !completedLevels.includes(id)) || levels[0]?.id;
    const visitedStations = {}, passedCheckpoints = {}, completedDemos = {};
    for (const level of levels) {
      visitedStations[level.id] = (Array.isArray(raw.visitedStations?.[level.id]) ? raw.visitedStations[level.id] : []).filter((id, i, a) => level.stations.some(s => s.id === id) && a.indexOf(id) === i);
      passedCheckpoints[level.id] = (Array.isArray(raw.passedCheckpoints?.[level.id]) ? raw.passedCheckpoints[level.id] : []).filter((id, i, a) => level.checkpoints.some(q => q.id === id) && a.indexOf(id) === i);
      completedDemos[level.id] = (Array.isArray(raw.completedDemos?.[level.id]) ? raw.completedDemos[level.id] : []).filter((id, i, a) => level.stations.some(s => s.demo?.id === id) && a.indexOf(id) === i);
    }
    return { completedLevels, currentLevel, unlockedLevels, visitedStations, passedCheckpoints, completedDemos };
  }
  function load(levels, storage, key) {
    try { return normalize(levels, JSON.parse(storage.getItem(key) || '{}') || {}); }
    catch { return normalize(levels); }
  }
  function canComplete(level, progress) {
    return level.ready && progress.unlockedLevels.includes(level.id) && level.stations.every(s => progress.visitedStations[level.id]?.includes(s.id)) && level.checkpoints.length > 0 && level.checkpoints.every(q => progress.passedCheckpoints[level.id]?.includes(q.id)) && level.stations.filter(s => s.demo).every(s => progress.completedDemos[level.id]?.includes(s.demo.id));
  }
  const api = { normalize, load, canComplete };
  root.WorldProgress = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
