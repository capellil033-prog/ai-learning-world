'use strict';
window.AIWorld = { levels: [], map: { width: 1600, height: 1000 }, storageKey: 'ai-learning-world-v1' };
AIWorld.station = (id, name, subtitle, building, text, example, steps, caution, demo) => ({
  id, name, subtitle, building, text, example, steps, caution, demo,
  title: subtitle, fact: caution, cargo: name, count: '→', icon: 'map-pin',
  input: steps[0], output: steps.at(-1), role: subtitle
});
