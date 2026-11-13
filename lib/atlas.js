window.WorldAtlas = (() => {
  'use strict';
  let renderer, scene, camera, observer, mapRoot, planet, animationFrame, events, drag;
  let nodeEntries = [], targetRotation = { x: .12, y: 0 }, zoom = 1;
  const placements = [
    [-132, 24], [-84, -17], [-38, 32], [8, -24], [54, 17], [98, -12], [142, 27]
  ];

  function coordinates(index, radius = 48) {
    const [longitude, latitude] = placements[index] || [index * 42 - 120, index % 2 ? -18 : 22];
    const lon = THREE.MathUtils.degToRad(longitude), lat = THREE.MathUtils.degToRad(latitude);
    return new THREE.Vector3(
      radius * Math.cos(lat) * Math.sin(lon),
      radius * Math.sin(lat),
      radius * Math.cos(lat) * Math.cos(lon)
    );
  }

  function material(color, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: .86, metalness: 0, ...extra });
  }

  function addStars() {
    const positions = [];
    for (let index = 0; index < 900; index++) {
      const radius = 190 + index % 7 * 19;
      const longitude = index * 2.399963, latitude = Math.asin(((index * 47) % 200) / 100 - 1);
      positions.push(radius * Math.cos(latitude) * Math.sin(longitude), radius * Math.sin(latitude), radius * Math.cos(latitude) * Math.cos(longitude));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xdff9ff, size: .55, transparent: true, opacity: .82, depthWrite: false })));
  }

  function addRoute(levels, progress) {
    for (let index = 1; index < levels.length; index++) {
      const start = coordinates(index - 1, 49.1).normalize(), end = coordinates(index, 49.1).normalize(), points = [];
      for (let step = 0; step <= 34; step++) points.push(start.clone().lerp(end, step / 34).normalize().multiplyScalar(49.25));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const done = progress.completedLevels.includes(levels[index - 1].id);
      const route = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: done ? 0x65dfca : 0xa7c6c8, dashSize: 1.15, gapSize: .7, transparent: true, opacity: done ? .95 : .62 }));
      route.computeLineDistances(); planet.add(route);
    }
  }

  function addRegion(level, index, progress) {
    const M = AIModels, normal = coordinates(index, 1).normalize(), group = new THREE.Group();
    group.position.copy(coordinates(index, 48.15));
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    planet.add(group);
    const colors = { city: 0x8ebfa3, snow: 0xeaf7f7, river: 0x5caab4, forest: 0x568b67, harbor: 0x78a9b5, desert: 0xe4ba70, lab: 0xa9c6cb };
    const patch = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 8.4, .72, 16), material(colors[level.environment] || 0x8ebfa3, { flatShading: true }));
    patch.position.y = .18; patch.receiveShadow = true; group.add(patch);
    const landmark = M.building({ name: level.title, building: level.landmark || 'processor' }, level.number, level.environment === 'snow');
    landmark.scale.setScalar(.31); landmark.position.set(0, .58, -.4); landmark.rotation.y = index * .7; group.add(landmark);
    const detailColor = level.environment === 'desert' ? 0x8ea26b : level.environment === 'snow' ? 0xc9e1e5 : 0x365f50;
    for (let item = 0; item < 7; item++) {
      const decoration = level.environment === 'desert' ? M.cactus() : M.tree(level.environment === 'snow');
      const angle = item / 7 * Math.PI * 2;
      decoration.position.set(Math.cos(angle) * 5.8, .65, Math.sin(angle) * 5.8);
      decoration.scale.setScalar(.22 + item % 3 * .04); group.add(decoration);
    }
    const beacon = new THREE.Mesh(new THREE.RingGeometry(8.7, 9.1, 48), new THREE.MeshBasicMaterial({ color: progress.completedLevels.includes(level.id) ? 0x58dac5 : detailColor, transparent: true, opacity: .72, side: THREE.DoubleSide }));
    beacon.rotation.x = -Math.PI / 2; beacon.position.y = .62; group.add(beacon);
  }

  function makeScene(levels, progress, selected) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, .1, 700); camera.position.set(0, 0, 225);
    scene.add(new THREE.AmbientLight(0xb9d8dd, 1.3));
    const sun = new THREE.DirectionalLight(0xffead1, 3.1); sun.position.set(-70, 85, 110); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xd9f8ff, 0x071119, .95));
    addStars();
    planet = new THREE.Group(); scene.add(planet);
    const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(47.9, 5), material(0x4d8580, { flatShading: true, emissive: 0x123c3e, emissiveIntensity: .42 }));
    globe.castShadow = true; globe.receiveShadow = true; planet.add(globe);
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(48.15, 64, 40), material(0x3f91a0, { transparent: true, opacity: .28, roughness: .28, emissive: 0x0c3037, emissiveIntensity: .3 }));
    planet.add(ocean);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(50.3, 48, 32), new THREE.MeshBasicMaterial({ color: 0x77d7df, transparent: true, opacity: .09, side: THREE.BackSide }));
    planet.add(atmosphere);
    addRoute(levels, progress);
    levels.forEach((level, index) => addRegion(level, index, progress));
    const selectedIndex = Math.max(0, levels.findIndex(level => level.id === selected));
    const [longitude, latitude] = placements[selectedIndex];
    targetRotation = { x: THREE.MathUtils.degToRad(latitude) * .72, y: -THREE.MathUtils.degToRad(longitude) };
    planet.rotation.set(targetRotation.x, targetRotation.y, 0);
  }

  function updateNodes() {
    if (!camera || !planet || !mapRoot) return;
    planet.updateMatrixWorld(true);
    const width = mapRoot.clientWidth, height = mapRoot.clientHeight, cameraDirection = camera.position.clone().normalize();
    for (const entry of nodeEntries) {
      const world = entry.point.clone().applyMatrix4(planet.matrixWorld), projected = world.clone().project(camera);
      const visible = world.clone().normalize().dot(cameraDirection) > .08 && projected.z < 1;
      entry.button.style.left = `${(projected.x * .5 + .5) * width}px`;
      entry.button.style.top = `${(-projected.y * .5 + .5) * height}px`;
      entry.button.style.opacity = visible ? '1' : '0';
      entry.button.style.pointerEvents = visible ? 'auto' : 'none';
      entry.button.style.transform = `translate(-50%,-50%) scale(${visible ? 1 : .72})`;
    }
  }

  function resize() {
    if (!renderer || !camera || !mapRoot) return;
    const width = Math.max(1, mapRoot.clientWidth), height = Math.max(1, mapRoot.clientHeight);
    renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); updateNodes();
  }

  function animate() {
    if (!renderer || !scene || !camera || !planet) return;
    planet.rotation.x += (targetRotation.x - planet.rotation.x) * .1;
    planet.rotation.y += (targetRotation.y - planet.rotation.y) * .1;
    camera.position.z += (225 / zoom - camera.position.z) * .12;
    planet.children.forEach(child => { if (child.type === 'Line') child.material.dashOffset -= .008; });
    updateNodes(); renderer.render(scene, camera); animationFrame = requestAnimationFrame(animate);
  }

  function bindControls(stage) {
    events = new AbortController(); const signal = events.signal;
    stage.addEventListener('pointerdown', event => {
      if (event.target.closest?.('.map-node')) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, rx: targetRotation.x, ry: targetRotation.y };
      stage.setPointerCapture?.(event.pointerId); stage.classList.add('dragging');
    }, { signal });
    stage.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId) return;
      targetRotation.y = drag.ry + (event.clientX - drag.x) * .008;
      targetRotation.x = THREE.MathUtils.clamp(drag.rx + (event.clientY - drag.y) * .006, -.8, .8);
    }, { signal });
    const stop = event => { if (drag?.id === event.pointerId) { drag = null; stage.classList.remove('dragging'); } };
    stage.addEventListener('pointerup', stop, { signal }); stage.addEventListener('pointercancel', stop, { signal });
    stage.addEventListener('wheel', event => { event.preventDefault(); zoom = THREE.MathUtils.clamp(zoom - Math.sign(event.deltaY) * .08, .78, 1.25); }, { signal, passive: false });
  }

  function render(levels, progress, selected, select) {
    destroy();
    zoom = 1;
    const host = document.getElementById('world-map');
    host.innerHTML = '<div class="atlas-stage"><div id="atlas-scene" aria-hidden="true"></div><div class="planet-hint"><span>DRAG</span> Planet drehen · Scrollen zum Zoomen</div><div id="atlas-nodes"></div><span class="atlas-north">ORBIT 01<small>KI-PLANET / FREIE WAHL</small></span></div>';
    mapRoot = host.firstElementChild;
    const nodeHost = document.getElementById('atlas-nodes'); nodeEntries = [];
    levels.forEach((level, index) => {
      const done = progress.completedLevels.includes(level.id), visited = progress.visitedLevels.includes(level.id), button = document.createElement('button');
      button.className = `map-node ${selected === level.id ? 'selected' : ''} ${visited ? 'visited' : ''} ${done ? 'done' : ''}`;
      button.setAttribute('aria-label', `${level.title}, Level ${level.number}, ${done ? 'abgeschlossen' : visited ? 'besucht' : 'frei verfügbar'}`);
      button.innerHTML = `<span class="node-pin">${done ? '✓' : String(level.number).padStart(2, '0')}</span><span class="node-label"><small>LEVEL ${String(level.number).padStart(2, '0')}</small><strong>${level.title}</strong><em>${done ? 'Abgeschlossen' : visited ? 'Besucht · erneut starten' : level.vehicleName + ' · frei'}</em></span>`;
      button.addEventListener('click', () => select(level.id)); nodeHost.append(button);
      nodeEntries.push({ button, point: null, index });
    });
    try {
      if (!window.THREE) throw new Error('Three.js fehlt');
      nodeEntries.forEach(entry => { entry.point = coordinates(entry.index, 54); });
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7)); renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      document.getElementById('atlas-scene').append(renderer.domElement); makeScene(levels, progress, selected);
      bindControls(mapRoot); observer = new ResizeObserver(resize); observer.observe(mapRoot); resize(); animate();
    } catch (error) {
      nodeEntries.forEach(({ button, index }) => { button.style.left = `${14 + index * 12}%`; button.style.top = `${30 + index % 2 * 28}%`; button.style.opacity = '1'; button.style.pointerEvents = 'auto'; });
      document.getElementById('atlas-scene').innerHTML = '<div class="map-fallback">3D ist nicht verfügbar. Alle Levels bleiben über die Planetenmarkierungen und die Liste erreichbar.</div>';
      console.warn(error);
    }
    window.lucide?.createIcons();
  }

  function destroy() {
    events?.abort(); events = null; observer?.disconnect(); observer = null; cancelAnimationFrame(animationFrame); animationFrame = null; drag = null;
    if (scene) { AIModels.dispose(scene); scene = null; }
    renderer?.dispose(); renderer?.domElement?.remove(); renderer = null; camera = null; planet = null; mapRoot = null; nodeEntries = [];
  }

  return { render, destroy };
})();
