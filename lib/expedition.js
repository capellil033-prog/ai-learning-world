// Adapted from Token Transit. Geometry, collision, road, parking and camera retained.
window.createExpedition = function(options) {
 'use strict';
 const level=options.level, waterLevel=['river','harbor'].includes(level.environment), boatLevel=['boat','harborboat'].includes(level.vehicle), byId=id=>document.getElementById(id), icons=()=>window.lucide?.createIcons();
 const stations=Object.fromEntries(level.stations.map(s=>[s.id,{...s,position:[0,0]}]));
 const routes={llm:level.stations.map(s=>s.id)};
 const events=new AbortController();let resizeObserver,tour=null;
 const on=(target,event,fn,opts={})=>target.addEventListener(event,fn,{...opts,signal:events.signal});
const state = { mode: 'llm', index: 0, distance: 0, running: false, speed: 1, completed: false, elapsed: 0, x: -92, z: 0, heading: Math.PI / 2, velocity: 0, grade: 0, surface: 'road', parkedAt: -1, parkingTime: 0, visited: new Set() };
const pressedKeys = new Set();
const touchInputs = new Map();
const driveInput = { forward: false, reverse: false, left: false, right: false, brake: false };
let scene, camera, renderer, worldGroup, truck, routeCurve, buildings = [], wheels = [], tokenCrates = [], animationFrame;
let physicsWorld, vehicleBody, sunlight, routeStart = -92, routeEnd = 92;
let cameraFollow = true, cameraTarget = { x: -92, y: 0, z: 0 };
let windRotors = [], cacheDrop = null, snowfall, vehicleTrail, boatWake, bowSpray;
let cameraAngle = .68, cameraZoom = 1, drag = null, lastTime = 0, uiTime = 0, arrivalTimer;
const sceneHost = byId('scene');

function renderRoute() { options.onTarget?.(state.index); }

function updateStation(announce = false) {
  const station = stations[routes[state.mode][state.index]];
  renderRoute();
  byId('detail-kicker').textContent = `${String(state.index + 1).padStart(2, '0')} / ${station.subtitle.toLocaleUpperCase('de')}`;
  byId('detail-title').textContent = station.title;
  byId('detail-text').textContent = station.text;
  byId('detail-fact').textContent = station.fact;
  byId('cargo-label').textContent = station.cargo;
  byId('cargo-count').textContent = station.count;
  byId('world-status').textContent = state.completed ? 'Alle Stationen besucht' : `Ziel: ${station.name}`;
  buildings.forEach(({ key, marker, halo }) => {
    const active = stations[key].position === station.position || (stations[key].position[0] === station.position[0] && stations[key].position[1] === station.position[1]);
    marker.material.color.setHex(active ? 0xd94d36 : 0xf1f6f7);
    halo.visible = active;
  });
  tokenCrates.forEach((crate, index) => {
    crate.visible = index < (state.index === 0 ? 2 : 6);
    crate.material.color.setHex(state.index === routes[state.mode].length - 1 ? 0xe7a18a : state.index > 2 ? 0x9fbd9e : 0xe9c76a);
  });
  if (announce) {
    byId('arrival-number').textContent = String(state.index + 1).padStart(2, '0');
    byId('arrival-name').textContent = station.name;
    byId('arrival').querySelector('small').textContent = 'STATION ERREICHT';
    byId('arrival').classList.add('visible');
    clearTimeout(arrivalTimer);
    arrivalTimer = setTimeout(() => byId('arrival').classList.remove('visible'), 3200);
    openStationDialog(true);
  }
}

function openStationDialog(arrived = false) { pauseDriving(); options.onStation?.(state.index, arrived); }

function updatePlayButton() {
  byId('play-button').innerHTML = `<i data-lucide="${state.running ? 'pause' : 'route'}"></i><span>${state.running ? 'Tempomat aus' : 'Tempomat'}</span>`;
  byId('play-button').setAttribute('aria-label', state.running ? 'Tempomat ausschalten' : 'Tempomat einschalten');
  byId('play-button').setAttribute('aria-pressed', String(state.running));
  icons();
}

function togglePlay() {
  if (!vehicleBody) return;
  state.running = !state.running;
  if (!state.running) state.velocity = 0;
  updatePlayButton();
}

function resetJourney() {
  clearDrivingInput();
  byId('station-dialog').close();
  Object.assign(state, { index: 0, distance: 0, running: false, completed: false, x: routeStart, z: roadZ(routeStart) + 1.65, heading: roadHeading(routeStart), velocity: 0, grade: 0, parkedAt: -1, parkingTime: 0, surface: 'road', visited: new Set((options.visited || []).map(id => routes.llm.indexOf(id)).filter(i => i >= 0)) });
  if (vehicleBody) {
    vehicleBody.position.set(state.x, 1, state.z);
    vehicleBody.velocity.setZero();
    vehicleBody.angularVelocity.setZero();
    vehicleBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), state.heading);
  }
  if (cacheDrop) {
    cacheDrop.active = false;
    cacheDrop.stored = false;
    cacheDrop.packet.visible = false;
    cacheDrop.ring.visible = false;
  }
  cameraTarget = { x: state.x, y: 0, z: state.z };
  byId('arrival').classList.remove('visible');
  clearTimeout(arrivalTimer);
  updateStation();
  updatePlayButton();
  updateProgress();
  positionTruck();
}

function updateProgress() {
  const percentage = Math.round(state.visited.size / routes[state.mode].length * 100);
  byId('progress-value').textContent = `${state.visited.size} / ${routes[state.mode].length}`;
  byId('progress-fill').style.width = `${percentage}%`;
  byId('progress-truck').style.left = `calc(${percentage}% - ${percentage / 100 * 22}px)`;
  if (byId('vehicle-speed')) byId('vehicle-speed').textContent = String(Math.round(Math.abs(state.velocity) * 3.6));
  if (byId('surface-label')) byId('surface-label').textContent = (waterLevel?{road:'Fahrwasser',bay:'Dock',shoulder:'Ufergrenze',grass:'Ufer'}:level.environment==='snow'?{road:'Passstrasse',bay:'Haltebucht',shoulder:'Schneerand',grass:'Tiefschnee'}:{road:'Strasse',bay:'Haltebucht',shoulder:'Randstreifen',grass:'Gelände'})[state.surface];
  if (byId('surface-label')) byId('surface-label').dataset.surface = state.surface;
  if (byId('drive-state')) {
    const slopeState = !boatLevel && state.grade > .14 ? ' · ANSTIEG' : !boatLevel && state.grade < -.14 ? ' · ABFAHRT' : '';
    byId('drive-state').textContent = state.running ? `TEMPOMAT${slopeState}` : state.velocity < -.15 ? `RÜCKWÄRTS${slopeState}` : Math.abs(state.velocity) < .15 ? 'PARKEN' : `MANUELL${slopeState}`;
  }
  if (byId('station-distance')) {
    const [targetX, targetZ] = stations[routes[state.mode][state.index]].position;
    byId('station-distance').textContent = `${Math.round(Math.hypot(state.x - targetX, state.z - targetZ))} m`;
  }
  if (byId('parking-status')) byId('parking-status').textContent = state.parkingTime >= .65 ? 'Station besucht' : state.parkedAt >= 0 ? 'Parken …' : '';
  drawMinimap();
}

function drawMinimap() {
  const canvas = byId('minimap');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const mapX = (x) => 12 + (x - routeStart) / (routeEnd - routeStart) * 144;
  const mapZ = (z) => 54 + z * .86;
  context.setTransform(2, 0, 0, 2, 0, 0);
  context.clearRect(0, 0, 168, 92);
  context.fillStyle = '#e4eff2';
  context.fillRect(0, 0, 168, 92);
  context.beginPath();
  for (let x = routeStart - 20; x <= routeEnd + 20; x += 2) context.lineTo(mapX(x), mapZ(roadZ(x)));
  context.strokeStyle = '#748d99';
  context.lineWidth = 5;
  context.stroke();
  routes[state.mode].forEach((key, index) => {
    const [x, z] = stations[key].position;
    context.fillStyle = state.visited.has(index) ? '#168276' : '#ffffff';
    context.strokeStyle = index === state.index ? '#e15b3c' : '#9aafb7';
    context.lineWidth = index === state.index ? 2 : 1;
    context.fillRect(mapX(x) - 3.5, mapZ(z) - 4, 7, 7);
    context.strokeRect(mapX(x) - 3.5, mapZ(z) - 4, 7, 7);
  });
  context.save();
  context.translate(Math.max(5, Math.min(163, mapX(state.x))), Math.max(5, Math.min(87, mapZ(state.z))));
  context.rotate(Math.PI / 2 - state.heading);
  context.beginPath();
  context.moveTo(6, 0);
  context.lineTo(-4, -4);
  context.lineTo(-2, 0);
  context.lineTo(-4, 4);
  context.closePath();
  context.fillStyle = '#df5238';
  context.strokeStyle = '#ffffff';
  context.lineWidth = 1.5;
  context.fill();
  context.stroke();
  context.restore();
}

function roadZ(x) {
  const bounded = Math.max(-230, Math.min(230, x));
  return Math.sin(bounded * .038) * 19 + Math.sin(bounded * .076) * 4;
}

function routeHeight(x) {
  if (waterLevel) return 0;
  const strength = { snow: 10.5, forest: 8.5, desert: 7.2, lab: 6.4, city: 5.8 }[level.environment] || 5.8;
  return Math.sin(x * .026) * strength + Math.sin(x * .061 + .8) * strength * .46 + Math.sin(x * .115 - .4) * strength * .13;
}

function roadHeading(x) {
  return Math.atan2(1, (roadZ(x + .1) - roadZ(x - .1)) / .2);
}

function roadSurface(x, z) {
  if (Math.abs(z - roadZ(x)) <= (waterLevel ? 4.8 : 3.2)) return 'road';
  for (const key of routes[state.mode]) {
    const [stopX, stopZ] = stations[key].position;
    if (Math.abs(x - stopX) <= 7 && z >= stopZ - 3.2 && z <= roadZ(x) - 2.8) return 'bay';
  }
  return Math.abs(z - roadZ(x)) < (waterLevel ? 6.2 : 4.45) ? 'shoulder' : 'grass';
}

function terrainGrade(x, z, heading) {
  if (boatLevel) return 0;
  const distance = 2.4, forwardX = Math.sin(heading), forwardZ = Math.cos(heading);
  const front = terrainHeight(x + forwardX * distance, z + forwardZ * distance);
  const rear = terrainHeight(x - forwardX * distance, z - forwardZ * distance);
  return (front - rear) / (distance * 2);
}

function addObstacle(x, z, width, depth, rotation = 0) {
  if (!physicsWorld) return;
  const body = new CANNON.Body({ mass: 0 });
  body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, 2, depth / 2)));
  body.position.set(x, 1, z);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
  physicsWorld.addBody(body);
}

function makeMaterial(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, ...extra });
}

function box(parent, width, height, depth, color, x = 0, y = 0, z = 0, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material || makeMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radius, height, color, x, y, z, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), makeMaterial(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function label(parent, text, x, y, z, accent = false, size = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 112;
  const context = canvas.getContext('2d');
  context.fillStyle = accent ? '#d94d36' : '#f4f9fa';
  context.beginPath();
  context.roundRect(3, 3, 762, 106, 14);
  context.fill();
  context.strokeStyle = accent ? '#d94d36' : '#bacfd7';
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = accent ? '#ffffff' : '#365b69';
  context.font = '600 37px Manrope, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 384, 57, 716);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(12.8 * size, 1.87 * size, 1);
  sprite.position.set(x, y, z);
  sprite.renderOrder = 5;
  parent.add(sprite);
  return sprite;
}

function createVehicleTrail() {
  if (!truck) return;
  const kind = boatLevel ? 'water' : level.environment === 'snow' ? 'snow' : level.environment === 'desert' ? 'sand' : 'dust';
  const count = boatLevel ? 88 : 48, positions = new Float32Array(count * 3), phases = [];
  for (let index = 0; index < count; index++) phases.push((index * 37 % count) / count);
  const color = { water: 0xd9fbff, snow: 0xffffff, sand: 0xe7c27e, dust: 0xb8a27d }[kind];
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: boatLevel ? .46 : kind === 'snow' ? .3 : .26, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true }));
  particles.frustumCulled = false;
  particles.userData.effect = 'vehicle-trail';
  particles.userData.kind = kind;
  truck.add(particles);
  vehicleTrail = { particles, positions, phases, kind };
}

function createBoatEffects() {
  if (!boatLevel || !truck) return;
  const ribbons = [];
  for (const side of [-1, 1]) {
    const segments = 24, positions = new Float32Array((segments + 1) * 6), indices = [];
    for (let step = 0; step <= segments; step++) {
      const offset = step * 2;
      if (step < segments) indices.push(offset, offset + 2, offset + 1, offset + 1, offset + 2, offset + 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    const ribbon = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xe9feff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    ribbon.frustumCulled = false;
    ribbon.userData.effect = 'boat-wake';
    ribbon.userData.side = side;
    truck.add(ribbon);
    ribbons.push({ ribbon, positions, segments, side });
  }
  const count = 84, positions = new Float32Array(count * 3), phases = [];
  for (let index = 0; index < count; index++) phases.push((index * 29 % count) / count);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xf2ffff, size: .58, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  particles.frustumCulled = false;
  particles.userData.effect = 'boat-bow-spray';
  truck.add(particles);
  boatWake = { ribbons };
  bowSpray = { particles, positions, phases };
}

function animateVehicleTrail() {
  if (!vehicleTrail) return;
  const speed = Math.abs(state.velocity), groundFactor = boatLevel ? 1 : (vehicleTrail.kind === 'snow' || vehicleTrail.kind === 'sand' ? .9 : state.surface === 'road' ? .2 : .75);
  vehicleTrail.particles.material.opacity = THREE.MathUtils.clamp((speed - .45) / 5.5, 0, boatLevel ? .95 : .58) * groundFactor;
  for (let index = 0; index < vehicleTrail.phases.length; index++) {
    const age = (state.elapsed * (boatLevel ? 1.05 : .55) + vehicleTrail.phases[index]) % 1, side = index % 2 ? 1 : -1;
    const spread = boatLevel ? .75 + age * 3.4 : .78 + age * 1.15;
    vehicleTrail.positions[index * 3] = side * spread + Math.sin(index * 4.7) * .12;
    vehicleTrail.positions[index * 3 + 1] = boatLevel ? .3 + Math.sin(age * Math.PI) * .65 : .18 + age * .45;
    vehicleTrail.positions[index * 3 + 2] = -1.8 - age * (boatLevel ? 11.5 : 5.5);
  }
  vehicleTrail.particles.geometry.attributes.position.needsUpdate = true;
}

function animateBoatEffects() {
  if (!boatWake || !bowSpray) return;
  const speed = Math.abs(state.velocity), power = THREE.MathUtils.clamp((speed - .35) / 5.2, 0, 1);
  boatWake.ribbons.forEach(({ ribbon, positions, segments, side }) => {
    ribbon.material.opacity = power * (.42 + Math.sin(state.elapsed * 5 + side) * .06);
    for (let step = 0; step <= segments; step++) {
      const age = step / segments, centerX = side * (.72 + age * 3.65) + Math.sin(state.elapsed * 4 - age * 8) * .08;
      const width = .06 + age * .16, z = -1.35 - age * 14.5, y = .23 + Math.sin(state.elapsed * 3 - age * 10) * .025;
      const offset = step * 6;
      positions[offset] = centerX - width; positions[offset + 1] = y; positions[offset + 2] = z;
      positions[offset + 3] = centerX + width; positions[offset + 4] = y; positions[offset + 5] = z;
    }
    ribbon.geometry.attributes.position.needsUpdate = true;
  });
  bowSpray.particles.material.opacity = power;
  for (let index = 0; index < bowSpray.phases.length; index++) {
    const age = (state.elapsed * 1.7 + bowSpray.phases[index]) % 1, side = index % 2 ? 1 : -1;
    bowSpray.positions[index * 3] = side * (.22 + age * 2.25) + Math.sin(index * 2.7) * .12;
    bowSpray.positions[index * 3 + 1] = .32 + Math.sin(age * Math.PI) * (1.1 + power * .75);
    bowSpray.positions[index * 3 + 2] = 2.15 - age * 2.5;
  }
  bowSpray.particles.geometry.attributes.position.needsUpdate = true;
}

function addTree(parent, x, z, scale = 1) {
  if(level.environment!=='snow'){
    const tree=level.environment==='desert'?AIModels.cactus():AIModels.tree();tree.position.set(x,terrainHeight(x,z),z);tree.scale.setScalar(scale);parent.add(tree);addObstacle(x,z,.45*scale,.45*scale);return;
  }
  const group = new THREE.Group();
  group.position.set(x, terrainHeight(x, z), z);
  group.scale.setScalar(scale);
  cylinder(group, .17, 1.8, 0x645d59, 0, .9, 0, 7);
  for (let tier = 0; tier < 3; tier++) {
    const radius = 1.5 - tier * .35;
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(radius, 2.5, 7), makeMaterial(0x285e57));
    foliage.position.y = 2 + tier * 1.1;
    foliage.castShadow = true;
    group.add(foliage);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(radius * .94, 1.95, 7), makeMaterial(0xeaf5f6));
    snow.position.y = 2.35 + tier * 1.1;
    snow.castShadow = true;
    group.add(snow);
  }
  parent.add(group);
  addObstacle(x, z, .45 * scale, .45 * scale);
}

function terrainHeight(x, z) {
  const baseHeight = routeHeight(x) - .08;
  if(level.environment!=='snow')return baseHeight;
  let edgeDistance = Math.abs(z - roadZ(x)) - 5.2;
  for (const key of routes[state.mode]) {
    const [stopX, stopZ] = stations[key].position;
    const platformDistance = Math.max(Math.abs(x - stopX) - 9.2, stopZ - 11.2 - z, z - Math.max(roadZ(x) + 1, roadZ(stopX) + 1));
    edgeDistance = Math.min(edgeDistance, platformDistance);
  }
  if (edgeDistance <= 0) return baseHeight;
  const drop = THREE.MathUtils.smoothstep(edgeDistance, 0, 24);
  const ridges = Math.sin(x * .24 + z * .12) * 3 + Math.sin(x * .09 - z * .18) * 5;
  return baseHeight - drop * (58 + ridges) - Math.max(0, edgeDistance - 24) * .14;
}

function addLandscape() {
  if(level.environment!=='snow'){addBiomeLandscape();return;}
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), makeMaterial(0xb9d3dd));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -100;
  ground.receiveShadow = true;
  worldGroup.add(ground);
  const terrain = new THREE.PlaneGeometry(560, 440, 220, 165);
  terrain.rotateX(-Math.PI / 2);
  const positions = terrain.attributes.position;
  const colors = [];
  const snowColor = new THREE.Color(0xe4f0f3);
  const rockColor = new THREE.Color(0x668392);
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index), z = positions.getZ(index);
    const height = terrainHeight(x, z);
    positions.setY(index, height);
    const color = snowColor.clone().lerp(rockColor, THREE.MathUtils.smoothstep(-height, 2, 32) * .87);
    color.multiplyScalar(.94 + Math.sin(x * .51 + z * .37) * .06);
    colors.push(color.r, color.g, color.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrain.computeVertexNormals();
  const terrainMesh = new THREE.Mesh(terrain, makeMaterial(0xffffff, { vertexColors: true, flatShading: true }));
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  const forestCount = 360;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.15, .24, 2, 6), makeMaterial(0x655b56), forestCount);
  const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(1.9, 6, 7), makeMaterial(0x285c54, { flatShading: true }), forestCount);
  const snowCaps = new THREE.InstancedMesh(new THREE.ConeGeometry(1.65, 5, 7), makeMaterial(0xe9f3f5), forestCount);
  const transform = new THREE.Object3D();
  for (let index = 0; index < forestCount; index++) {
    const x = (index * 71 % 470) - 235;
    const z = roadZ(x) + (index % 2 ? -1 : 1) * (30 + index * 17 % 105);
    const height = terrainHeight(x, z);
    const scale = .7 + (index % 7) * .19;
    transform.position.set(x, height + scale, z);
    transform.scale.set(scale, scale, scale);
    transform.rotation.set(0, index * 2.399963, 0);
    transform.updateMatrix();
    trunks.setMatrixAt(index, transform.matrix);
    transform.position.y = height + 3.8 * scale;
    transform.updateMatrix();
    crowns.setMatrixAt(index, transform.matrix);
    transform.position.y += .6 * scale;
    transform.updateMatrix();
    snowCaps.setMatrixAt(index, transform.matrix);
  }
  trunks.castShadow = true;
  crowns.castShadow = true;
  snowCaps.castShadow = true;
  crowns.userData.effect = 'forest-canopy';
  worldGroup.add(trunks, crowns, snowCaps);
  for (let index = 0; index < 22; index++) {
    const x = -410 + index * 39;
    const z = index % 2 ? -175 - index % 4 * 19 : 185 + index % 3 * 22;
    const height = 80 + index * 29 % 105;
    const peak = new THREE.Group();
    peak.position.set(x, -94, z);
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(53 + index % 4 * 12, height, 5), makeMaterial(index % 2 ? 0x78919c : 0x8ca4ae, { flatShading: true }));
    mountain.position.y = height / 2;
    mountain.rotation.y = index * .7;
    peak.add(mountain);
    const summit = new THREE.Mesh(new THREE.ConeGeometry((53 + index % 4 * 12) * .47, height * .47, 5), makeMaterial(0xf1f6f7, { flatShading: true }));
    summit.position.y = height * .765 + .15;
    summit.rotation.y = mountain.rotation.y;
    peak.add(summit);
    worldGroup.add(peak);
  }
  const flakes = [];
  for (let index = 0; index < 650; index++) flakes.push((index * 71 % 500) - 250, index * 31 % 92, (index * 43 % 160) - 80);
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(flakes, 3));
  snowfall = new THREE.Points(snowGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: .17, transparent: true, opacity: .7, depthWrite: false }));
  snowfall.frustumCulled = false;
  worldGroup.add(snowfall);
}

function addBuilding(key, number) {
  const station=stations[key], [x,z]=station.position;
  const group=AIModels.building(station,number,level.environment==='snow');
  group.position.set(x,routeHeight(x),z-6.4);worldGroup.add(group);
  const marker=AIModels.cylinder(group,.66,.16,0xf1f6f7,-4.4,.4,3.2);
  const halo=new THREE.Mesh(new THREE.RingGeometry(1.1,1.3,40),new THREE.MeshBasicMaterial({color:0xf08a59,transparent:true,opacity:.6,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;halo.position.set(x,routeHeight(x)+.12,z);worldGroup.add(halo);
  buildings.push({key,group,marker,halo});addObstacle(x,z-6.4,8.7,5.7);
  if(key==='cache')createCacheDepot(x-6,z-3.2);
}

function createCacheDepot(x, z) {
  box(worldGroup, 3.5, .15, 3.1, 0xe9c76c, x, .03, z);
  for (let slat = 0; slat < 4; slat++) {
    box(worldGroup, .49, .15, 2.3, 0xb18a56, x - .9 + slat * .6, .18, z);
  }
  const packet = new THREE.Group();
  box(packet, 1.65, 1.5, 1.5, 0xf2b848, 0, .75, 0);
  box(packet, .3, 1.53, 1.53, 0xffe6a0, 0, .75, 0);
  box(packet, 1.68, .25, 1.53, 0xffe6a0, 0, 1.15, 0);
  box(packet, .5, .42, .04, 0x397d83, .48, .65, .77);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.85, 40), new THREE.MeshBasicMaterial({ color: 0xffda73, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, .12, z);
  ring.visible = false;
  packet.visible = false;
  worldGroup.add(packet, ring);
  cacheDrop = { packet, ring, target: new THREE.Vector3(x, .26, z), from: new THREE.Vector3(), time: 0, active: false, stored: false, startRotation: 0 };
}

function syncCacheDrop() {
  if (!cacheDrop || cacheDrop.active || cacheDrop.stored || routes[state.mode][state.parkedAt] !== 'cache') return;
  const { packet, ring } = cacheDrop;
  positionTruck();
  truck.updateMatrixWorld(true);
  tokenCrates[0].getWorldPosition(cacheDrop.from);
  cacheDrop.from.y -= .35;
  cacheDrop.time = 0;
  cacheDrop.active = true;
  cacheDrop.stored = false;
  cacheDrop.startRotation = truck.rotation.y;
  packet.position.copy(cacheDrop.from);
  packet.rotation.y = cacheDrop.startRotation;
  packet.scale.setScalar(.48);
  packet.visible = true;
  ring.visible = true;
  ring.scale.setScalar(1);
  ring.material.opacity = .8;
  byId('detail-fact').textContent = 'Eine KV-Kopie wird abgelegt. Die Input-Tokens bleiben im Kontext; das Paket steht für Attention-Zwischenwerte.';
}

function animateCacheDrop(delta) {
  if (!cacheDrop || !cacheDrop.active) return;
  const { packet, ring, from, target } = cacheDrop;
  cacheDrop.time = Math.min(3.2, cacheDrop.time + delta);
  const progress = cacheDrop.time / 3.2;
  const lift = THREE.MathUtils.smoothstep(progress, 0, .25);
  const travel = THREE.MathUtils.smoothstep(progress, .25, .65);
  const lower = THREE.MathUtils.smoothstep(progress, .65, 1);
  const liftHeight = Math.max(from.y, target.y) + 3;
  packet.position.lerpVectors(from, target, travel);
  packet.position.y = progress < .65 ? THREE.MathUtils.lerp(from.y, liftHeight, lift) : THREE.MathUtils.lerp(liftHeight, target.y, lower);
  packet.rotation.y = THREE.MathUtils.lerp(cacheDrop.startRotation, Math.PI / 9, travel);
  packet.scale.setScalar(THREE.MathUtils.lerp(.48, 1, lift));
  ring.scale.setScalar(1 + Math.sin(progress * Math.PI) * .3);
  ring.material.opacity = .8 * (1 - lower);
  if (progress === 1) {
    packet.position.copy(target);
    ring.visible = false;
    cacheDrop.active = false;
    cacheDrop.stored = true;
    if (routes[state.mode][state.index] === 'cache') byId('cargo-label').textContent = 'KV-Kopie gespeichert';
  }
}

function buildRoad(points, width, color, height) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const vertices = [], indices = [];
  const segments = 600;
  for (let index = 0; index <= segments; index++) {
    const point = curve.getPointAt(index / segments);
    vertices.push(point.x, point.y + height, point.z + width / 2, point.x, point.y + height, point.z - width / 2);
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, makeMaterial(color, { side: THREE.DoubleSide }));
  mesh.receiveShadow = true;
  mesh.userData.effect = 'road-surface';
  mesh.userData.width = width;
  mesh.userData.heightRange = Math.max(...points.map(point => point.y)) - Math.min(...points.map(point => point.y));
  worldGroup.add(mesh);
  return curve;
}

function addRoadMarkings(curve, start = 0, end = 1) {
  const length = curve.getLength();
  for (let distance = start * length; distance < end * length; distance += 2.6) {
    const point = curve.getPointAt(distance / length);
    const tangent = curve.getTangentAt(distance / length);
    const stripe = box(worldGroup, .12, .015, 1.05, 0xebece0, point.x, point.y + .09, point.z);
    stripe.rotation.y = Math.atan2(tangent.x, tangent.z);
    stripe.castShadow = false;
  }
  for (const side of [-1, 1]) {
    const points = [];
    for (let sample = 0; sample <= 600; sample++) {
      const point = curve.getPointAt(sample / 600);
      points.push(new THREE.Vector3(point.x, point.y + .09, point.z + 3.15 * side));
    }
    worldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xf3edcf })));
  }
}

function addPassBarriers() {
  const capacity = 304;
  const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), makeMaterial(0x9aafb8), capacity);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, 1, .15), makeMaterial(0x718d9a), capacity);
  const reflectors = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .14, .2), makeMaterial(0xffffff), capacity);
  const drifts = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 5), makeMaterial(0xf1f7f8), capacity);
  const transform = new THREE.Object3D();
  let count = 0, driftCount = 0;
  for (let x = -228; x < 228; x += 3) {
    const barrierPhase = (x + 228) % 54;
    if (barrierPhase >= 21 && barrierPhase <= 33) continue;
    for (const side of [-1, 1]) {
      const startZ = roadZ(x) + side * 4.45;
      const endZ = roadZ(x + 3) + side * 4.45;
      const centerZ = (startZ + endZ) / 2;
      if (roadSurface(x + 1.5, centerZ) === 'bay') continue;
      const length = Math.hypot(3, endZ - startZ);
      const angle = -Math.atan2(endZ - startZ, 3);
      transform.position.set(x + 1.5, .91, centerZ);
      transform.rotation.set(0, angle, 0);
      transform.scale.set(length + .12, .28, .15);
      transform.updateMatrix();
      beams.setMatrixAt(count, transform.matrix);
      transform.rotation.set(0, 0, 0);
      transform.scale.setScalar(1);
      transform.position.set(x, .5, startZ);
      transform.updateMatrix();
      posts.setMatrixAt(count, transform.matrix);
      transform.position.y = 1.07;
      transform.updateMatrix();
      reflectors.setMatrixAt(count, transform.matrix);
      reflectors.setColorAt(count, new THREE.Color(side === 1 ? 0xd64b37 : 0xffd58b));
      count++;
      if (x % 9 === 0) {
        const driftZ = roadZ(x) + side * 5;
        transform.position.set(x, -.1, driftZ);
        transform.scale.set(1.7, .45, .65);
        transform.updateMatrix();
        drifts.setMatrixAt(driftCount++, transform.matrix);
      }
    }
  }
  beams.count = posts.count = reflectors.count = count;
  drifts.count = driftCount;
  worldGroup.add(beams, posts, reflectors, drifts);
}

function addParkingApron(x, z) {
  const vertices = [], indices = [];
  for (let sample = 0; sample <= 28; sample++) {
    const sampleX = x - 7 + sample * .5;
    const height = routeHeight(sampleX) + .055;
    vertices.push(sampleX, height, roadZ(sampleX), sampleX, height, z - 3.2);
    if (sample < 28) {
      const base = sample * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const apron = new THREE.Mesh(geometry, makeMaterial(0x697f89, { side: THREE.DoubleSide }));
  apron.receiveShadow = true;
  worldGroup.add(apron);
}

function addDock(x, z, number) {
  const height = routeHeight(x), shoreZ = roadZ(x) - 10.4;
  for (let slat = -5; slat <= 5; slat++) box(worldGroup, .72, .2, 5.8, slat % 2 ? 0xb78a58 : 0xc89b64, x + slat * .72, height + .34, shoreZ);
  for (const side of [-1, 1]) {
    cylinder(worldGroup, .18, 2.5, 0x4b625e, x + side * 4.2, height + .25, shoreZ + 2.2, 9);
    cylinder(worldGroup, .18, 2.5, 0x4b625e, x + side * 4.2, height + .25, shoreZ - 2.2, 9);
  }
  box(worldGroup, 9, .12, .22, 0xf4e1b7, x, height + .46, z - 1.8);
  label(worldGroup, `DOCK ${String(number).padStart(2,'0')}`, x, height + 2.6, shoreZ - 2.7, true, .34);
}

function addSuspensionBridge() {
  if (level.environment !== 'forest') return;
  const start = -28, end = 28;
  for (let x = start; x <= end; x += 1.55) {
    const plank = box(worldGroup, 7.4, .24, 1.38, x % 3 ? 0x9d7147 : 0xb18454, x, routeHeight(x) + .19, roadZ(x));
    plank.rotation.y = roadHeading(x);
  }
  for (const x of [start, end]) for (const side of [-1, 1]) {
    const z = roadZ(x) + side * 4.1;
    cylinder(worldGroup, .24, 7.5, 0x594b3f, x, routeHeight(x) + 3.7, z, 8);
  }
  for (const side of [-1, 1]) {
    const points = [];
    for (let step = 0; step <= 36; step++) {
      const t = step / 36, x = THREE.MathUtils.lerp(start, end, t), sag = Math.sin(t * Math.PI) * -3.3;
      points.push(new THREE.Vector3(x, routeHeight(x) + 6.8 + sag, roadZ(x) + side * 4.05));
    }
    worldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xd2b27e })));
  }
  const ravine = box(worldGroup, 64, 1.2, 42, 0x243f3b, 0, -4.2, roadZ(0)); ravine.receiveShadow = true;
}

function makeTruck() {
  const vehicle=AIModels.vehicle(level.vehicle);truck=vehicle.group;wheels=vehicle.wheels;tokenCrates=vehicle.crates;worldGroup.add(truck);
  createVehicleTrail();
  createBoatEffects();
}

function disposeWorld() {
  if (!worldGroup) return;
  scene.remove(worldGroup);
  worldGroup.traverse((object) => {
    object.geometry?.dispose();
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    materials.forEach((material) => { material.map?.dispose(); material.dispose(); });
  });
}

function buildWorld() {
  disposeWorld();
  physicsWorld = new CANNON.World();
  physicsWorld.gravity.set(0, 0, 0);
  physicsWorld.broadphase = new CANNON.SAPBroadphase(physicsWorld);
  physicsWorld.solver.iterations = 10;
  physicsWorld.defaultContactMaterial.friction = .15;
  physicsWorld.defaultContactMaterial.restitution = 0;
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  buildings = [];
  windRotors = [];
  cacheDrop = null;
  vehicleTrail = null;
  boatWake = null;
  bowSpray = null;
  routes[state.mode].forEach((key, index) => {
    const x = (index - (routes[state.mode].length - 1) / 2) * 30;
    stations[key].position = [x, roadZ(x) - (waterLevel ? 5.2 : 8)];
  });
  routeStart = stations[routes[state.mode][0]].position[0] - 15;
  routeEnd = stations[routes[state.mode].at(-1)].position[0] + 15;
  addLandscape();
  const roadPoints = [];
  for (let x = -230; x <= 230; x += 10) roadPoints.push(new THREE.Vector3(x, routeHeight(x), roadZ(x)));
  const water=waterLevel;
  buildRoad(roadPoints,water?18:9.5,water?0x9fbeaa:0xe7f1f5,.015);
  routeCurve=buildRoad(roadPoints,water?14:6.5,water?0x508f9f:0x465964,.04);
  if(!water)addRoadMarkings(routeCurve);
  addSuspensionBridge();
  if(water){
    const bridge=new THREE.Group();bridge.position.set(0,0,roadZ(0));bridge.rotation.y=roadHeading(0)-Math.PI/2;
    box(bridge,4,.6,23,0xc8ad86,0,5.2,0);
    for(const side of [-1,1]){box(bridge,1,5,1,0x607e7d,0,2.5,side*10);box(bridge,.15,1,23,0x6f8b89,side*1.8,6,0);}
    worldGroup.add(bridge);
    for(let x=-210;x<210;x+=12){const z=roadZ(x)+3;box(worldGroup,2,.02,.08,0x8fc5cf,x,.09,z);}
  }
  for (const side of [-1, 1]) {
    const extensionX = side * 5230;
    box(worldGroup,10000,.025,water?18:9.5,water?0x9fbeaa:0xe7f1f5,extensionX,.015,roadZ(side*230));
    box(worldGroup,10000,.025,water?14:6.5,water?0x508f9f:0x465964,extensionX,.04,roadZ(side*230));
  }
  routes[state.mode].forEach((key, index) => {
    const [x, z] = stations[key].position;
    const mainZ = roadZ(x);
    if(water)addDock(x,z,index+1);else{
      addParkingApron(x, z);
      box(worldGroup, 12.8, .025, .14, 0xfff0cc, x, routeHeight(x)+.08, z - 2.7);
      for (const side of [-1, 1]) box(worldGroup, .14, .025, 4.5, 0xfff0cc, x + side * 3.2, routeHeight(x)+.08, z - .4);
      label(worldGroup, `P  ${String(index + 1).padStart(2, '0')}`, x, routeHeight(x)+.4, z, true, .32);
    }
    addBuilding(key, index + 1);
    cylinder(worldGroup, .1, 2.4, 0x87908a, x - 6, 1.2, mainZ - 3.8, 8);
    label(worldGroup, `${String(index + 1).padStart(2, '0')}  ↗`, x - 6, 2.7, mainZ - 3.8, true, .3);
    const bench = new THREE.Group();
    bench.position.set(x + 6, 0, z - 5);
    box(bench, 2.3, .18, .8, 0xbb865d, 0, .7, 0);
    box(bench, 2.3, .8, .14, 0xd4a374, 0, 1.1, -.4);
    for (const side of [-1, 1]) box(bench, .12, .7, .65, 0x496b63, side * .9, .35, 0);
    worldGroup.add(bench);
    addObstacle(x + 6, z - 5, 2.3, 1);
    cylinder(worldGroup, .4, 1, index % 2 ? 0x609ab6 : 0x72965b, x + 7.8, .5, z - 5, 8);
    cylinder(worldGroup, .44, .12, 0x456257, x + 7.8, 1.06, z - 5, 8);
    const awningColor = index % 2 ? 0xc55943 : 0x3f777a;
    box(worldGroup, 3.6, .16, 1.3, awningColor, x, 3.15, z - 2.9);
    box(worldGroup, 3.8, .14, 1.4, 0xf4f8fa, x, 3.3, z - 2.9);
  });
  for (let x = -140; x <= 140; x += 15) {
    const z = roadZ(x) + 7;
    cylinder(worldGroup, .08, 3.5, 0x91a18b, x, 1.75, z, 6);
    box(worldGroup, .8, .17, .5, 0xf7f4df, x, 3.5, z);
    addTree(worldGroup, x + 5, z + 6, .9 + Math.abs(x % 3) * .1);
    for (const side of [-1, 1]) {
      const postZ = roadZ(x) + side * 4.5;
      if (roadSurface(x, postZ) === 'bay') continue;
      box(worldGroup, .16, .9, .16, 0xfaf5e3, x, .45, postZ);
      box(worldGroup, .18, .2, .18, 0x354e53, x, .65, postZ);
      box(worldGroup, .19, .1, .19, 0xedb34b, x, .72, postZ);
    }
  }
  if(level.environment==='snow'){
    addPassBarriers();
    const tunnel=new THREE.Group();tunnel.position.set(0,0,roadZ(0));tunnel.rotation.y=roadHeading(0)-Math.PI/2;
    box(tunnel,6,2,15,0x7f96a0,0,7,0);box(tunnel,6.4,.4,15.4,0xeaf3f5,0,8.2,0);
    for(const side of [-1,1])box(tunnel,6,6,2.4,0x8fa5ad,0,3,side*6.3);
    worldGroup.add(tunnel);
  }
  for (const x of [routeStart - 6, routeEnd + 6]) {
    const sign = new THREE.Group();
    sign.position.set(x, 0, roadZ(x) + 6.1);
    cylinder(sign, .13, 4.8, 0x718b98, 0, 2.4, 0, 8);
    label(sign, x < 0 ? level.title.toUpperCase() : 'GUTE REISE / KI VERSTEHEN', 0, 5.3, 0, true, .65);
    worldGroup.add(sign);
  }
  makeTruck();
  vehicleBody = new CANNON.Body({ mass: 180, fixedRotation: true, linearDamping: 0 });
  vehicleBody.addShape(new CANNON.Box(new CANNON.Vec3(.97, .8, 2.05)));
  vehicleBody.position.set(routeStart, 1, roadZ(routeStart) + 1.65);
  physicsWorld.addBody(vehicleBody);
  resetJourney();
  positionTruck();
}

function positionTruck() {
  if (!truck) return;
  const forwardX = Math.sin(state.heading), forwardZ = Math.cos(state.heading);
  const height = terrainHeight(state.x, state.z);
  const frontHeight = terrainHeight(state.x + forwardX * 1.7, state.z + forwardZ * 1.7);
  const rearHeight = terrainHeight(state.x - forwardX * 1.7, state.z - forwardZ * 1.7);
  const leftHeight = terrainHeight(state.x + forwardZ, state.z - forwardX);
  const rightHeight = terrainHeight(state.x - forwardZ, state.z + forwardX);
  const boatMotion = boatLevel ? THREE.MathUtils.clamp(Math.abs(state.velocity) / 8, 0, 1) : 0;
  const bob = boatMotion * Math.sin(state.elapsed * 5.2) * .14;
  truck.position.set(state.x, height + .2 + bob, state.z);
  truck.rotation.order = 'YXZ';
  const pitch = -Math.atan2(frontHeight - rearHeight, 3.4) + (boatLevel ? Math.sin(state.elapsed * 4.1) * .035 * boatMotion : 0);
  const roll = Math.atan2(leftHeight - rightHeight, 2) + (boatLevel ? Math.sin(state.elapsed * 3.3 + .7) * .075 * boatMotion : 0);
  truck.rotation.set(pitch, state.heading, roll);
}

function updateCamera(resize = true) {
  if (!camera || !renderer) return;
  const width = sceneHost.clientWidth, height = sceneHost.clientHeight;
  const aspect = width / height;
  const speedDrama = cameraFollow ? THREE.MathUtils.clamp(Math.abs(state.velocity) / 15, 0, 1) : 0;
  const halfHeight = (cameraFollow ? Math.max(23, 32 / aspect) : Math.max(62, (routeEnd + 22) / aspect)) / (cameraZoom * (1 + speedDrama * .08));
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  const target = cameraFollow ? cameraTarget : { x: 0, y: 0, z: -4 };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const roughness = state.surface === 'road' || boatLevel ? .08 : state.surface === 'shoulder' ? .22 : .38;
  const shake = reducedMotion ? 0 : speedDrama * roughness;
  const targetX = target.x + Math.sin(state.elapsed * 17) * shake;
  const targetY = target.y + Math.sin(state.elapsed * 23 + .5) * shake * .45;
  const targetZ = target.z + Math.cos(state.elapsed * 19) * shake;
  camera.position.set(targetX + Math.sin(cameraAngle) * 85, targetY + 85, targetZ + Math.cos(cameraAngle) * 85);
  camera.lookAt(targetX, targetY, targetZ);
  camera.updateProjectionMatrix();
  if (resize) renderer.setSize(width, height);
}

function advance(delta) {
  if(tour && !Object.values(driveInput).some(Boolean)){advanceTour(delta);return;}
  if(tour)tour=null;
  state.elapsed += delta;
  if (!vehicleBody) return;
  state.surface = roadSurface(state.x, state.z);
  state.grade = terrainGrade(state.x, state.z, state.heading);
  const surfaceLimit = { road: 13.5, bay: 6.5, shoulder: 7.2, grass: 4 }[state.surface];
  let steering = Number(driveInput.left) - Number(driveInput.right);
  let throttle = Number(driveInput.forward) - Number(driveInput.reverse);
  if (state.running && Object.values(driveInput).some(Boolean)) {
    state.running = false;
    updatePlayButton();
  }
  if (state.running) {
    const aimX = Math.min(routeEnd, state.x + 7);
    const aimZ = roadZ(aimX) + 1.65;
    const desiredHeading = Math.atan2(aimX - state.x, aimZ - state.z);
    const error = Math.atan2(Math.sin(desiredHeading - state.heading), Math.cos(desiredHeading - state.heading));
    steering = THREE.MathUtils.clamp(error * 2.1, -1, 1);
    throttle = 1;
    if (state.x >= routeEnd - 2) {
      throttle = 0;
      state.running = false;
      state.velocity = 0;
      updatePlayButton();
    }
  }
  const maxSpeed = surfaceLimit * state.speed;
  const uphillFactor = 1 - THREE.MathUtils.clamp(Math.max(0, state.grade) * .72, 0, .42);
  const targetSpeed = driveInput.brake ? 0 : throttle > 0 ? maxSpeed * uphillFactor : throttle < 0 ? -Math.min(5, maxSpeed * .5) : 0;
  const acceleration = driveInput.brake || state.velocity * throttle < 0 ? 24 : throttle ? state.grade > .14 ? 6.2 : 8.2 : 9;
  state.velocity += THREE.MathUtils.clamp(targetSpeed - state.velocity, -acceleration * delta, acceleration * delta);
  if (Math.abs(state.velocity) > .35) state.velocity -= THREE.MathUtils.clamp(state.grade * 3.8, -2.8, 2.8) * delta;
  state.velocity = THREE.MathUtils.clamp(state.velocity, -maxSpeed, maxSpeed);
  const traction = { road: 1, bay: .9, shoulder: .7, grass: .5 }[state.surface];
  state.heading += state.velocity / 2.8 * Math.tan(steering * .52 / (1 + Math.abs(state.velocity) * .035)) * traction * delta;
  vehicleBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), state.heading);
  vehicleBody.velocity.set(Math.sin(state.heading) * state.velocity, 0, Math.cos(state.heading) * state.velocity);
  vehicleBody.position.y = 1;
  physicsWorld.step(1 / 60, delta, 4);
  state.x = vehicleBody.position.x;
  state.z = vehicleBody.position.z;
  state.velocity = vehicleBody.velocity.x * Math.sin(state.heading) + vehicleBody.velocity.z * Math.cos(state.heading);
  // Only boats are restricted to the navigable channel. Wheeled vehicles may leave the road.
  if (boatLevel) {
    const center = roadZ(state.x), offset = state.z - center;
    if (Math.abs(offset) > 6.05) {
      state.z = center + Math.sign(offset) * 6.05;
      state.velocity *= .32;
      vehicleBody.position.z = state.z;
      vehicleBody.velocity.set(Math.sin(state.heading) * state.velocity, 0, Math.cos(state.heading) * state.velocity);
      state.surface = 'shoulder';
    }
  }
  // Let the Snowcat visibly descend the pass before safely returning it to the road.
  if (level.vehicle === 'snowcat' && terrainHeight(state.x, state.z) < -34) recoverVehicle('pass-fall');
  state.distance += Math.abs(state.velocity) * delta;
  wheels.forEach((wheel) => wheel.rotateY(state.velocity * delta / .37));
  window.GameAudio?.setMotion({speed:Math.abs(state.velocity),surface:state.surface,boat:boatLevel});
  checkParking(delta);
}

function recoverVehicle(reason = 'terrain') {
  pauseDriving();
  state.z = roadZ(state.x) + 1.65;
  state.heading = roadHeading(state.x);
  state.surface = 'road';
  state.parkedAt = -1;
  state.parkingTime = 0;
  vehicleBody.position.set(state.x, 1, state.z);
  vehicleBody.angularVelocity?.setZero();
  vehicleBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), state.heading);
  byId('arrival-number').textContent = 'SOS';
  byId('arrival-name').textContent = reason === 'pass-fall' ? 'Zurück auf der Passstrasse' : boatLevel ? 'Zurück im Fahrwasser' : 'Zurück auf der Route';
  byId('arrival').querySelector('small').textContent = reason === 'pass-fall' ? 'NACH ABSTURZ GEBORGEN' : 'FAHRZEUG GEBORGEN';
  byId('arrival').classList.add('visible');
  clearTimeout(arrivalTimer);
  arrivalTimer = setTimeout(() => byId('arrival').classList.remove('visible'), 3200);
}

function checkParking(delta) {
  const candidate = routes[state.mode].findIndex((key) => {
    const [x, z] = stations[key].position;
    return Math.abs(state.x - x) < 3.3 && Math.abs(state.z - z) < 2.6;
  });
  if (candidate < 0 || Math.abs(state.velocity) > .35) {
    state.parkingTime = 0;
    state.parkedAt = -1;
    return;
  }
  if (state.parkedAt !== candidate) state.parkingTime = 0;
  state.parkedAt = candidate;
  const previousTime = state.parkingTime;
  state.parkingTime += delta;
  if (previousTime < .65 && state.parkingTime >= .65) {
    state.index = candidate;
    state.visited.add(candidate);
    state.completed = state.visited.size === routes[state.mode].length;
    updateStation(true);
    syncCacheDrop();
  }
}

function animate(timestamp) {
  const delta = Math.min((timestamp - (lastTime || timestamp)) / 1000, .05);
  lastTime = timestamp;
  const paused = document.hidden || !!document.querySelector('dialog[open]');
  if (!paused) advance(delta);
  positionTruck();
  if (!paused) animateCacheDrop(delta);
  animateVehicleTrail();
  animateBoatEffects();
  if (snowfall && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    const snowPositions = snowfall.geometry.attributes.position;
    for (let index = 0; index < snowPositions.count; index++) {
      snowPositions.setY(index, ((index * 31 - timestamp * .0025) % 92 + 92) % 92 - 5);
    }
    snowPositions.needsUpdate = true;
  }
  const tracking = 1 - Math.exp(-delta * 4);
  cameraTarget.x += (state.x + Math.sin(state.heading) * 5 - cameraTarget.x) * tracking;
  cameraTarget.z += (state.z + Math.cos(state.heading) * 5 - cameraTarget.z) * tracking;
  if (renderer) cameraTarget.y += (terrainHeight(state.x, state.z) - cameraTarget.y) * tracking;
  updateCamera(false);
  if (sunlight) {
    sunlight.position.set(state.x - 35, 65, state.z + 30);
    sunlight.target.position.set(state.x, 0, state.z);
  }
  buildings.forEach(({ halo }) => { halo.material.opacity = .42 + Math.sin(state.elapsed * 2) * .15; });
  windRotors.forEach((rotor, index) => { rotor.rotation.z = state.elapsed * (.4 + index * .08); });
  if (timestamp - uiTime > 100) { updateProgress(); uiTime = timestamp; }
  if (renderer) renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);
}

function initScene() {
  try {
    if (!window.THREE) throw new Error('Die 3D-Bibliothek konnte nicht vom CDN geladen werden.');
    if (!window.CANNON) throw new Error('Die Fahrphysik konnte nicht vom CDN geladen werden.');
    const atmosphere = {
      forest: { sky: 0x8ea9a4, fogNear: 105, fogFar: 410 },
      snow: { sky: 0xb8ccd7, fogNear: 150, fogFar: 520 },
      desert: { sky: 0xe3c69a, fogNear: 175, fogFar: 560 },
      river: { sky: 0x91bdc7, fogNear: 145, fogFar: 500 },
      harbor: { sky: 0x8daeb8, fogNear: 135, fogFar: 470 },
      lab: { sky: 0xaebfc8, fogNear: 155, fogFar: 510 },
      city: { sky: 0xb6cbd1, fogNear: 165, fogFar: 540 }
    }[level.environment] || { sky: 0xc6dde7, fogNear: 210, fogFar: 620 };
    scene = new THREE.Scene();
    scene.background = new THREE.Color(atmosphere.sky);
    scene.fog = new THREE.Fog(atmosphere.sky, atmosphere.fogNear, atmosphere.fogFar);
    camera = new THREE.OrthographicCamera(-60, 60, 40, -40, .1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(atmosphere.sky, 1);
    sceneHost.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0xe7f4ff, .85));
    sunlight = new THREE.DirectionalLight(0xffedda, 2.5);
    sunlight.position.set(-35, 65, 30);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(2048, 2048);
    Object.assign(sunlight.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: .5, far: 180 });
    sunlight.shadow.normalBias = .045;
    sunlight.shadow.bias = -.0002;
    sunlight.shadow.radius = 3;
    scene.add(sunlight);
    scene.add(sunlight.target);
    scene.add(new THREE.HemisphereLight(0xe8f6ff, 0x768e9b, 1.25));
    buildWorld();
    updateCamera();
    resizeObserver=new ResizeObserver(()=>updateCamera());resizeObserver.observe(sceneHost);
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      pauseDriving();
      byId('canvas-error').hidden = false;
    });
    renderer.domElement.addEventListener('webglcontextrestored', () => { byId('canvas-error').hidden = true; });
  } catch (error) {
    console.error(error);
    scene = null;
    renderer = null;
    byId('canvas-error').hidden = false;
    vehicleBody = null;
    if (!window.THREE || !window.CANNON) {
      byId('error-title').textContent = 'Die lokalen 3D-Bibliotheken konnten nicht laden.';
      byId('error-text').textContent = 'Öffne die App aus dem vollständigen Projektordner oder lade die Seite neu. Die Stationen, Demos und Wissenschecks bleiben über die Routenliste verfügbar.';
    }
    byId('play-button').disabled = true;
    byId('pedal').disabled = true;
    byId('zoom-in').disabled = true;
    byId('zoom-out').disabled = true;
  }
}


function addGrassTexture(){
  if(!['city','forest','river','harbor'].includes(level.environment))return;
  const count=level.environment==='forest'?1500:520,grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.08,.5,3),makeMaterial(level.environment==='harbor'?0x688b73:0x5f8f58,{flatShading:true}),count),transform=new THREE.Object3D();
  for(let index=0;index<count;index++){
    const x=-300+(index*83%600),z=-170+(index*127%340);
    if(Math.abs(z-roadZ(x))<12){transform.scale.setScalar(0);}
    else{const scale=.65+(index%5)*.12;transform.position.set(x,routeHeight(x)+.18,z);transform.rotation.set(0,index*2.399,0);transform.scale.set(scale,scale,scale);}
    transform.updateMatrix();grass.setMatrixAt(index,transform.matrix);
  }
  grass.receiveShadow=true;worldGroup.add(grass);
}

function addBiomeLandscape(){
  const palette={city:0xb1c7ad,forest:0x83a77e,river:0xaec6a3,harbor:0xa9bdbb,desert:0xe5c58e,lab:0xc0d0d3},baseColor=new THREE.Color(palette[level.environment]||0xb1c7ad),ground=new THREE.PlaneGeometry(650,370,100,50);
  ground.rotateX(-Math.PI/2);const positions=ground.attributes.position,colors=[];
  for(let index=0;index<positions.count;index++){
    const x=positions.getX(index),z=positions.getZ(index),height=routeHeight(x)-.14-Math.abs(Math.sin(x*.17+z*.13))*.1;
    positions.setY(index,height);const color=baseColor.clone().multiplyScalar(.9+((index*31)%17)/100);colors.push(color.r,color.g,color.b);
  }
  ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();
  const groundMesh=new THREE.Mesh(ground,makeMaterial(0xffffff,{vertexColors:true,flatShading:true}));groundMesh.receiveShadow=true;worldGroup.add(groundMesh);addGrassTexture();
  if(!waterLevel)for(let index=0;index<9;index++){
    const hill=new THREE.Mesh(new THREE.SphereGeometry(1,14,7),makeMaterial(level.environment==='desert'?0xd9b474:0x719070,{flatShading:true}));
    hill.scale.set(22+index%3*8,6+index%4*2,13+index%2*5);hill.position.set(-220+index*55,routeHeight(-220+index*55)-5,(index%2?1:-1)*(82+index%3*18));worldGroup.add(hill);
  }
  if(level.environment==='forest'){
    for(const x of [-40,35]){const path=box(worldGroup,5,.03,55,0xb0ac8e,x,routeHeight(x)+.015,roadZ(x)+24);path.rotation.y=x<0?.65:-.6;}
    for(const x of [-40,35]){cylinder(worldGroup,.15,4,0x6b6251,x+5,routeHeight(x)+2,roadZ(x)+6,6);label(worldGroup,x<0?'NORDWEG / GESPERRT':'SÜDWEG / CAMP',x+5,routeHeight(x)+4.8,roadZ(x)+6,true,.45);}
  }
  if(level.environment==='harbor'){
    for(let i=0;i<14;i++){const x=-150+i*23,z=roadZ(x)+21,y=routeHeight(x);box(worldGroup,7,2.7,3,i%2?0x4f7f88:0xce8a63,x,y+1.35,z);box(worldGroup,7,2.7,3,0xc4ad79,x,y+4.05,z);}
    for(const x of [-60,60]){const z=roadZ(x)+15,y=routeHeight(x);box(worldGroup,1,18,1,0xd5a64f,x,y+9,z);box(worldGroup,16,.8,1,0xd5a64f,x-5,y+18,z);cylinder(worldGroup,.1,11,0x466274,x-12,y+12.5,z,6);}
  }
  for(let i=0;i<(level.environment==='forest'?560:100);i++){
    const x=-240+i*71%480,side=i%2?1:-1,distance=level.environment==='forest'?11+i*17%104:23+i*17%90,z=roadZ(x)+side*distance;
    if(level.environment==='forest'&&routes.llm.some(key=>Math.abs(stations[key].position[0]-x)<12&&Math.abs(stations[key].position[1]-z)<16))continue;
    const tree=level.environment==='desert'?AIModels.cactus():AIModels.tree();tree.position.set(x,routeHeight(x),z);tree.scale.setScalar(level.environment==='forest'?1+i%6*.24:.8+i%5*.25);tree.userData.effect=level.environment==='forest'?'forest-tree':'biome-plant';worldGroup.add(tree);
  }
  if(level.environment==='desert'){
    for(let i=0;i<18;i++){const x=-220+i*27,dune=new THREE.Mesh(new THREE.SphereGeometry(1,12,6),makeMaterial(i%2?0xdcb87c:0xe8ce9c));dune.scale.set(12+i%4*3,3+i%3,7);dune.position.set(x,routeHeight(x)-.5,roadZ(x)+(i%2?1:-1)*42);worldGroup.add(dune);}
    for(const key of routes.llm){const [x,z]=stations[key].position;cylinder(worldGroup,7,.1,0x69aaa7,x-12,routeHeight(x)+.02,z-10,16);}
  }
  if(level.environment==='lab'){
    for(let i=0;i<30;i++){const x=-170+i*12,z=roadZ(x)+5;const cone=new THREE.Mesh(new THREE.ConeGeometry(.3,.8,8),makeMaterial(0xdc7850));cone.position.set(x,routeHeight(x)+.4,z);worldGroup.add(cone);}
    for(const x of [-100,0,100]){box(worldGroup,10,.2,14,0x9cb3bb,x,routeHeight(x)+.05,roadZ(x)+30);for(let j=0;j<4;j++)box(worldGroup,1.3,3,2.5,0x577986,x-3+j*2,routeHeight(x)+1.5,roadZ(x)+30);}
  }
  if(level.environment==='city')for(let i=0;i<14;i++){
    const house=AIModels.building({name:'',building:i%3?'terminal':'factory'},i+1,false);
    house.children.filter(o=>o.type==='Sprite').forEach(o=>{o.material.map?.dispose();o.material.dispose();house.remove(o);});
    const x=-160+i*25;house.position.set(x,routeHeight(x),roadZ(x)+29+i%2*15);house.scale.setScalar(.6);worldGroup.add(house);
  }
}
function guide(index=state.index){
  if(!vehicleBody)return;pauseDriving();state.index=index;updateStation();
  const [x,z]=stations[routes.llm[index]].position,points=[];
  const direction=Math.sign(x-state.x)||1;
  points.push({x:state.x,z:roadZ(state.x)+1.65});
  for(let px=state.x;direction*(x-10*direction-px)>0;px+=direction*4)points.push({x:px,z:roadZ(px)+1.65});
  points.push({x,z});tour={points,index:0};
}
function advanceTour(delta){
  state.elapsed+=delta;const target=tour.points[tour.index],dx=target.x-state.x,dz=target.z-state.z,d=Math.hypot(dx,dz),step=8*state.speed*delta;
  if(d<=step){state.x=target.x;state.z=target.z;tour.index++;if(tour.index===tour.points.length){tour=null;state.velocity=0;}}
  else {state.x+=dx/d*step;state.z+=dz/d*step;state.heading=Math.atan2(dx,dz);state.velocity=8*state.speed;}
  vehicleBody.position.set(state.x,1,state.z);vehicleBody.velocity.setZero();state.surface=roadSurface(state.x,state.z);window.GameAudio?.setMotion({speed:Math.abs(state.velocity),surface:state.surface,boat:boatLevel});checkParking(delta);
}
on(byId('play-button'),'click',togglePlay);on(byId('tour-button'),'click',()=>guide());
on(byId('reset-button'),'click',()=>{tour=null;resetJourney();});
on(byId('speed'),'input',e=>{state.speed=Number(e.target.value);byId('speed-value').textContent=state.speed+'×';});
on(byId('zoom-in'),'click',()=>changeZoom(.12));on(byId('zoom-out'),'click',()=>changeZoom(-.12));
function changeZoom(amount){cameraZoom=Math.min(1.8,Math.max(.6,cameraZoom+amount));updateCamera();}
function overview(){cameraFollow=!cameraFollow;cameraZoom=1;byId('view-overview').setAttribute('aria-pressed',String(!cameraFollow));updateCamera();}
on(byId('view-overview'),'click',overview);on(byId('minimap-button'),'click',overview);
on(byId('view-reset'),'click',()=>{cameraFollow=true;cameraZoom=1;cameraAngle=.68;updateCamera();});
on(sceneHost,'pointerdown',e=>{drag={x:e.clientX,angle:cameraAngle,id:e.pointerId};sceneHost.setPointerCapture(e.pointerId);});
on(sceneHost,'pointermove',e=>{if(drag?.id===e.pointerId){cameraAngle=drag.angle-(e.clientX-drag.x)*.006;updateCamera();}});
on(sceneHost,'pointerup',()=>drag=null);on(sceneHost,'pointercancel',()=>drag=null);
on(sceneHost,'wheel',e=>{e.preventDefault();changeZoom(-Math.sign(e.deltaY)*.06);},{passive:false});
function refreshDrivingInput(){const actions={forward:['KeyW','ArrowUp'],reverse:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],brake:['Space']};
 for(const [action,keys]of Object.entries(actions))driveInput[action]=keys.some(k=>pressedKeys.has(k))||[...touchInputs.values()].includes(action);
 byId('pedal').classList.toggle('held',driveInput.forward);document.querySelectorAll('[data-drive]').forEach(b=>b.classList.toggle('held',driveInput[b.dataset.drive]));}
function clearDrivingInput(){pressedKeys.clear();touchInputs.clear();refreshDrivingInput();}
function pauseDriving(){tour=null;clearDrivingInput();state.velocity=0;state.running=false;vehicleBody?.velocity.setZero();window.GameAudio?.setMotion({speed:0,surface:state.surface,boat:boatLevel});updatePlayButton();drag=null;}
for(const b of [byId('pedal'),...document.querySelectorAll('[data-drive]')]){
 on(b,'pointerdown',e=>{if(!vehicleBody)return;e.preventDefault();touchInputs.set(e.pointerId,b.dataset.drive||'forward');b.setPointerCapture(e.pointerId);refreshDrivingInput();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])on(b,type,e=>{touchInputs.delete(e.pointerId);refreshDrivingInput();});
}
on(window,'keydown',e=>{
 if(document.querySelector('dialog[open]')||e.target.matches('input,textarea,select,[contenteditable]')||!renderer)return;
 if(e.code==='Space'&&e.target.closest('button,a'))return;
 if(!['Space','KeyP','KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;
 e.preventDefault();if(e.code==='KeyP'&&!e.repeat)togglePlay();pressedKeys.add(e.code);refreshDrivingInput();
});
on(window,'keyup',e=>{pressedKeys.delete(e.code);refreshDrivingInput();});on(window,'blur',pauseDriving);
on(document,'visibilitychange',()=>{if(document.hidden)pauseDriving();lastTime=0;});
initScene();updateStation();updateProgress();animationFrame=requestAnimationFrame(animate);
return {
 select(index){state.index=index;updateStation();updateProgress();}, guide, pause:pauseDriving,
  status(){return {x:state.x,z:state.z,surface:state.surface,height:terrainHeight(state.x,state.z),grade:state.grade,boatLevel};},
 mark(id){const index=routes.llm.indexOf(id);if(index>=0)state.visited.add(index);updateProgress();},
 destroy(){pauseDriving();events.abort();resizeObserver?.disconnect();cancelAnimationFrame(animationFrame);clearTimeout(arrivalTimer);disposeWorld();renderer?.dispose();renderer?.domElement.remove();}
};
};
