(function (root) {
  'use strict';
  function normalize(levels, raw = {}) {
    const levelIds = levels.map(level => level.id);
    const uniqueKnown = value => (Array.isArray(value) ? value : []).filter((id, index, all) => levelIds.includes(id) && all.indexOf(id) === index);
    const completedLevels = uniqueKnown(raw.completedLevels);
    const visitedLevels = uniqueKnown(raw.visitedLevels);
    const unlockedLevels = levelIds;
    const currentLevel = levelIds.includes(raw.currentLevel) ? raw.currentLevel : visitedLevels.at(-1) || levels[0]?.id;
    const visitedStations = {}, passedCheckpoints = {}, completedDemos = {};
    for (const level of levels) {
      visitedStations[level.id] = (Array.isArray(raw.visitedStations?.[level.id]) ? raw.visitedStations[level.id] : []).filter((id, i, a) => level.stations.some(s => s.id === id) && a.indexOf(id) === i);
      passedCheckpoints[level.id] = (Array.isArray(raw.passedCheckpoints?.[level.id]) ? raw.passedCheckpoints[level.id] : []).filter((id, i, a) => level.checkpoints.some(q => q.id === id) && a.indexOf(id) === i);
      completedDemos[level.id] = (Array.isArray(raw.completedDemos?.[level.id]) ? raw.completedDemos[level.id] : []).filter((id, i, a) => level.stations.some(s => s.demo?.id === id) && a.indexOf(id) === i);
    }
    return { completedLevels, visitedLevels, currentLevel, unlockedLevels, visitedStations, passedCheckpoints, completedDemos };
  }
  function load(levels, storage, key) {
    try { return normalize(levels, JSON.parse(storage.getItem(key) || '{}') || {}); }
    catch { return normalize(levels); }
  }
  function canComplete(level, progress) {
    return Boolean(level?.ready && progress?.unlockedLevels?.includes(level.id));
  }
  function hasVisitedAllStations(level, progress) {
    const visited = progress?.visitedStations?.[level?.id];
    return Boolean(level?.stations?.length && Array.isArray(visited) && level.stations.every(station => visited.includes(station.id)));
  }
  const api = { normalize, load, canComplete, hasVisitedAllStations };
  root.WorldProgress = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
