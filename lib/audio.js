(function (root) {
  'use strict';
  let context, master, spaceBus, vehicleBus, waterBus, engine, engineGain, roadNoiseGain, waterNoiseGain;
  let scene = 'space', unlocked = false, motion = { speed: 0, surface: 'road', boat: false };
  let enabled = true;
  try { enabled = localStorage.getItem('ai-learning-world-sound') !== 'off'; } catch {}

  function ramp(parameter, value, seconds = .35) {
    if (!parameter || !context) return;
    parameter.cancelScheduledValues?.(context.currentTime);
    parameter.setValueAtTime?.(parameter.value, context.currentTime);
    parameter.linearRampToValueAtTime?.(value, context.currentTime + seconds);
    if (!parameter.linearRampToValueAtTime) parameter.value = value;
  }

  function noiseSource(seconds = 2) {
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  function oscillator(type, frequency, gain, destination) {
    const source = context.createOscillator(), level = context.createGain();
    source.type = type;
    source.frequency.value = frequency;
    level.gain.value = gain;
    source.connect(level).connect(destination);
    source.start();
    return { source, level };
  }

  function buildGraph() {
    const AudioContext = root.AudioContext || root.webkitAudioContext;
    if (!AudioContext || context) return Boolean(context);
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    spaceBus = context.createGain(); vehicleBus = context.createGain(); waterBus = context.createGain();
    spaceBus.gain.value = 0; vehicleBus.gain.value = 0; waterBus.gain.value = 0;
    spaceBus.connect(master); vehicleBus.connect(master); waterBus.connect(master);

    const spaceFilter = context.createBiquadFilter();
    spaceFilter.type = 'lowpass'; spaceFilter.frequency.value = 420; spaceFilter.Q.value = 1.8;
    spaceFilter.connect(spaceBus);
    oscillator('sine', 43, .16, spaceFilter);
    oscillator('sine', 64.5, .075, spaceFilter);
    const shimmer = oscillator('triangle', 129, .018, spaceFilter);
    const lfo = context.createOscillator(), lfoGain = context.createGain();
    lfo.frequency.value = .075; lfoGain.gain.value = 5;
    lfo.connect(lfoGain).connect(shimmer.source.frequency); lfo.start();

    const engineFilter = context.createBiquadFilter();
    engineFilter.type = 'lowpass'; engineFilter.frequency.value = 380; engineFilter.Q.value = 2.1;
    engineGain = context.createGain(); engineGain.gain.value = 0;
    engine = context.createOscillator(); engine.type = 'sawtooth'; engine.frequency.value = 48;
    engine.connect(engineFilter).connect(engineGain).connect(vehicleBus); engine.start();

    const roadNoise = noiseSource(), roadFilter = context.createBiquadFilter();
    roadFilter.type = 'bandpass'; roadFilter.frequency.value = 210; roadFilter.Q.value = .75;
    roadNoiseGain = context.createGain(); roadNoiseGain.gain.value = 0;
    roadNoise.connect(roadFilter).connect(roadNoiseGain).connect(vehicleBus); roadNoise.start();

    const waterNoise = noiseSource(), waterFilter = context.createBiquadFilter();
    waterFilter.type = 'lowpass'; waterFilter.frequency.value = 760; waterFilter.Q.value = .65;
    waterNoiseGain = context.createGain(); waterNoiseGain.gain.value = 0;
    waterNoise.connect(waterFilter).connect(waterNoiseGain).connect(waterBus); waterNoise.start();
    applyScene(); applyMotion();
    return true;
  }

  function applyScene() {
    if (!context) return;
    ramp(spaceBus.gain, scene === 'space' ? .72 : 0, .9);
    ramp(vehicleBus.gain, scene === 'road' || scene === 'water' ? 1 : 0, .55);
    ramp(waterBus.gain, scene === 'water' ? 1 : 0, .55);
    ramp(master.gain, enabled ? .22 : 0, .3);
  }

  function applyMotion() {
    if (!context) return;
    const speed = Math.max(0, Number(motion.speed) || 0), moving = Math.min(1, speed / 12);
    engine.frequency.value = (motion.boat ? 42 : 48) + speed * (motion.boat ? 3.4 : 5.8);
    ramp(engineGain.gain, moving ? .035 + moving * .12 : .018, .12);
    const roughness = motion.surface === 'road' ? .55 : motion.surface === 'bay' ? .35 : motion.surface === 'shoulder' ? .8 : 1;
    ramp(roadNoiseGain.gain, motion.boat ? 0 : moving * roughness * .13, .12);
    ramp(waterNoiseGain.gain, motion.boat ? .025 + moving * .18 : 0, .12);
  }

  async function unlock() {
    if (!buildGraph()) return false;
    await context.resume?.();
    unlocked = context.state !== 'suspended';
    applyScene();
    return unlocked;
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    try { localStorage.setItem('ai-learning-world-sound', enabled ? 'on' : 'off'); } catch {}
    if (enabled) unlock();
    if (context) ramp(master.gain, enabled ? .22 : 0, .25);
    return enabled;
  }

  function setScene(value) { scene = value; applyScene(); }
  function setMotion(value = {}) { motion = { ...motion, ...value }; applyMotion(); }
  function getState() { return { enabled, unlocked, scene, motion: { ...motion } }; }
  function destroy() { if (context) context.close?.(); context = null; unlocked = false; }

  root.GameAudio = { unlock, setEnabled, setScene, setMotion, getState, destroy };
  if (typeof module !== 'undefined') module.exports = root.GameAudio;
})(typeof window === 'undefined' ? globalThis : window);
