window.WorldAtlas = (() => {
  'use strict';
  let renderer, scene, camera, observer, mapRoot, planet, animationFrame, events, drag;
  let nodeEntries = [], targetRotation = { x: .12, y: 0 }, zoom = 1;
  const placements = [
    [-132, 24], [-84, -17], [-38, 32], [8, -24], [54, 17], [98, -12], [142, 27]
  ];
  const biomeStyles = {
    city: { land: 0x83b979, coast: 0xc5d77f, side: 0x517d58, size: [17.2, 12.7], plants: 11 },
    snow: { land: 0xe8f4f2, coast: 0xb9dce1, side: 0x9dbdc3, size: [17.8, 13.2], plants: 14 },
    river: { land: 0x72ad68, coast: 0xb9d77a, side: 0x477956, size: [18.4, 13.4], plants: 15 },
    forest: { land: 0x4f8b5b, coast: 0x8fb967, side: 0x315f45, size: [18.2, 14.2], plants: 24 },
    harbor: { land: 0x759f7d, coast: 0xd1c78c, side: 0x4c7569, size: [17, 13], plants: 12 },
    desert: { land: 0xdfb86f, coast: 0xf1d69b, side: 0xa8794d, size: [18.8, 13], plants: 14 },
    lab: { land: 0x9dbfc2, coast: 0xcbe0da, side: 0x627f83, size: [16.8, 12.8], plants: 9 }
  };

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

  function surfaceHeight(x, z, lift = .34) {
    const radius = 48.15;
    return Math.sqrt(Math.max(0, radius * radius - x * x - z * z)) - radius + lift;
  }

  function biomeProfile(environment, index, scale = 1) {
    const style = biomeStyles[environment] || biomeStyles.city, points = [], count = 22, seed = (index + 1) * 1.731;
    for (let point = 0; point < count; point++) {
      const angle = point / count * Math.PI * 2;
      const coastNoise = 1 + Math.sin(angle * 3 + seed) * .14 + Math.sin(angle * 5 - seed * .8) * .09 + Math.cos(angle * 7 + seed * 1.4) * .055;
      const peninsula = point === (index * 3 + 2) % count || point === (index * 5 + 11) % count ? 1.2 : 1;
      points.push(new THREE.Vector2(Math.cos(angle) * style.size[0] * coastNoise * peninsula * scale, Math.sin(angle) * style.size[1] * coastNoise * peninsula * scale));
    }
    return points;
  }

  function makeLandform(points, topColor, sideColor, lift, environment, layer) {
    const topPositions = [0, surfaceHeight(0, 0, lift + .08), 0], topIndices = [];
    points.forEach(point => topPositions.push(point.x, surfaceHeight(point.x, point.y, lift), point.y));
    for (let point = 0; point < points.length; point++) topIndices.push(0, (point + 1) % points.length + 1, point + 1);
    const topGeometry = new THREE.BufferGeometry(), topColors = [], baseColor = new THREE.Color(topColor);
    for (let vertex = 0; vertex <= points.length; vertex++) {
      const color = baseColor.clone().offsetHSL((vertex % 5 - 2) * .004, (vertex % 4 - 2) * .008, (vertex % 7 - 3) * .012);
      topColors.push(color.r, color.g, color.b);
    }
    topGeometry.setAttribute('position', new THREE.Float32BufferAttribute(topPositions, 3)); topGeometry.setAttribute('color', new THREE.Float32BufferAttribute(topColors, 3)); topGeometry.setIndex(topIndices); topGeometry.computeVertexNormals();
    const top = new THREE.Mesh(topGeometry, material(0xffffff, { vertexColors: true, flatShading: true }));
    top.castShadow = true; top.receiveShadow = true; top.userData.biomeSurface = environment; top.userData.layer = layer;
    const sidePositions = [], sideIndices = [];
    points.forEach((point, index) => {
      const topY = surfaceHeight(point.x, point.y, lift), bottomY = topY - .72;
      sidePositions.push(point.x, topY, point.y, point.x, bottomY, point.y);
      const next = (index + 1) % points.length, offset = index * 2, nextOffset = next * 2;
      sideIndices.push(offset, offset + 1, nextOffset, nextOffset, offset + 1, nextOffset + 1);
    });
    const sideGeometry = new THREE.BufferGeometry();
    sideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sidePositions, 3)); sideGeometry.setIndex(sideIndices); sideGeometry.computeVertexNormals();
    const side = new THREE.Mesh(sideGeometry, material(sideColor, { flatShading: true })); side.castShadow = true;
    const group = new THREE.Group(); group.add(top, side); return group;
  }

  function addBox(parent, width, height, depth, color, x, z, rotation = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, { flatShading: true }));
    mesh.position.set(x, surfaceHeight(x, z, .48) + height / 2, z); mesh.rotation.y = rotation; mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }

  function stripLabels(group) {
    group.children.filter(child => child.type === 'Sprite').forEach(child => { child.material.map?.dispose(); child.material.dispose(); group.remove(child); });
  }

  function addRiver(group, style, harbor = false) {
    const points = [];
    for (let step = 0; step < 7; step++) {
      const x = THREE.MathUtils.lerp(-style.size[0] * .82, style.size[0] * .8, step / 6), z = Math.sin(step * 1.18 + (harbor ? .8 : 0)) * style.size[1] * .25 + (harbor ? -2.2 : 0);
      points.push(new THREE.Vector3(x, surfaceHeight(x, z, .56), z));
    }
    const river = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, harbor ? .72 : .6, 7, false), material(harbor ? 0x6fc7cf : 0x58b7c4, { roughness: .28, emissive: 0x0a3d46, emissiveIntensity: .18 }));
    river.receiveShadow = true; group.add(river);
  }

  function addBiomeDetails(group, level, index, style) {
    const M = AIModels, environment = level.environment;
    for (let item = 0; item < style.plants; item++) {
      const angle = item * 2.399963 + index * .63, radius = .34 + (item * 37 % 43) / 100;
      const x = Math.cos(angle) * style.size[0] * radius, z = Math.sin(angle) * style.size[1] * radius;
      const plant = environment === 'desert' ? M.cactus() : M.tree(environment === 'snow');
      const plantScale = environment === 'forest' ? .34 : environment === 'snow' || environment === 'desert' ? .3 : .26;
      plant.position.set(x, surfaceHeight(x, z, .5), z); plant.scale.setScalar(plantScale + item % 4 * .045); plant.rotation.y = angle; group.add(plant);
    }
    if (environment === 'city') {
      addBox(group, 18, .12, 1.05, 0xdce5df, 0, 2.8, -.18); addBox(group, 1, .12, 13, 0xdce5df, -2.5, 0, .18);
      for (let item = 0; item < 4; item++) {
        const building = M.building({ name: '', building: item % 2 ? 'terminal' : 'factory' }, item + 1, false); stripLabels(building);
        const x = -7 + item * 4.6, z = item % 2 ? -2.2 : 5.2; building.position.set(x, surfaceHeight(x, z, .5), z); building.scale.setScalar(.13 + item % 2 * .025); building.rotation.y = item * .7; group.add(building);
      }
    }
    if (environment === 'river' || environment === 'harbor') addRiver(group, style, environment === 'harbor');
    if (environment === 'forest') {
      for (const [x, z] of [[-7, 1], [2, -5], [7, 4]]) addBox(group, 2.7, .18, 1.5, 0xc08d5a, x, z, .5);
    }
    if (environment === 'snow') {
      for (const [item, x, z] of [[0, -7, 1], [1, -2, -4], [2, 5, 2], [3, 8, -3]]) {
        const mountain = new THREE.Mesh(new THREE.ConeGeometry(1.8 + item % 2 * .4, 4.6 + item % 3, 7), material(0x9fb8ba, { flatShading: true }));
        mountain.position.set(x, surfaceHeight(x, z, .46) + (4.6 + item % 3) / 2, z); mountain.castShadow = true; group.add(mountain);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(1.05 + item % 2 * .22, 2.05, 7), material(0xf7fcfb, { flatShading: true }));
        cap.position.set(x, mountain.position.y + 1.55 + item % 3 * .42, z); cap.castShadow = true; group.add(cap);
      }
    }
    if (environment === 'harbor') {
      for (let dock = 0; dock < 3; dock++) addBox(group, 4.5, .18, .72, 0xc59a68, style.size[0] * .42, -4 + dock * 2.2, -.2);
      addBox(group, .35, 3.8, .35, 0xd8aa53, 5.2, 3.1); addBox(group, 4.8, .3, .35, 0xd8aa53, 3, 3.1);
    }
    if (environment === 'desert') {
      for (let item = 0; item < 5; item++) {
        const dune = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5), material(item % 2 ? 0xe8c987 : 0xd4a962, { flatShading: true }));
        const x = -8 + item * 4, z = item % 2 ? 3.6 : -3.2; dune.scale.set(2.7, .55, 1.3); dune.position.set(x, surfaceHeight(x, z, .42), z); dune.castShadow = true; group.add(dune);
      }
    }
    if (environment === 'lab') {
      for (let item = 0; item < 6; item++) {
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.72 + item % 3 * .18, 0), material(item % 2 ? 0x73d4d1 : 0xd7f4ef, { flatShading: true, emissive: 0x1e6d70, emissiveIntensity: .25 }));
        const angle = item / 6 * Math.PI * 2, x = Math.cos(angle) * 6.8, z = Math.sin(angle) * 4.8;
        crystal.scale.y = 2 + item % 2 * .7; crystal.position.set(x, surfaceHeight(x, z, .52) + crystal.scale.y * .45, z); crystal.castShadow = true; group.add(crystal);
      }
      addBox(group, 12, .12, .52, 0xe9f5f3, 0, 0, .55); addBox(group, .52, .12, 8, 0xe9f5f3, 0, 0, .55);
    }
  }

  function addClouds() {
    const locations = [[-158, -34], [-112, 48], [-12, 58], [33, 5], [77, -48], [124, 51], [171, -5]];
    const cloudMaterial = material(0xe9f6f4, { transparent: true, opacity: .58, roughness: 1 });
    locations.forEach(([longitude, latitude], cloudIndex) => {
      const lon = THREE.MathUtils.degToRad(longitude), lat = THREE.MathUtils.degToRad(latitude), normal = new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
      const cloud = new THREE.Group(); cloud.position.copy(normal.clone().multiplyScalar(51.2)); cloud.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      for (let puff = 0; puff < 4; puff++) {
        const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 + puff % 2 * .45, 1), cloudMaterial.clone());
        mesh.position.set((puff - 1.5) * 1.35, .15 + puff % 2 * .35, Math.sin(puff * 2.1) * .7); mesh.scale.z = .72; cloud.add(mesh);
      }
      cloud.rotation.y = cloudIndex * .8; planet.add(cloud);
    });
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

  function addRegion(level, index, progress, selected) {
    const M = AIModels, normal = coordinates(index, 1).normalize(), group = new THREE.Group();
    group.position.copy(coordinates(index, 48.15));
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    planet.add(group);
    const style = biomeStyles[level.environment] || biomeStyles.city, coast = biomeProfile(level.environment, index, 1.1), land = biomeProfile(level.environment, index, 1);
    group.add(makeLandform(coast, style.coast, style.side, .08, level.environment, 'coast'));
    group.add(makeLandform(land, style.land, style.side, .38, level.environment, 'land'));
    addBiomeDetails(group, level, index, style);
    const landmark = M.building({ name: level.title, building: level.landmark || 'processor' }, level.number, level.environment === 'snow');
    landmark.scale.setScalar(.27); landmark.position.set(0, surfaceHeight(0, -.4, .52), -.4); landmark.rotation.y = index * .7; group.add(landmark);
    const outlinePoints = land.map(point => new THREE.Vector3(point.x, surfaceHeight(point.x, point.y, .58), point.y));
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outlinePoints), new THREE.LineBasicMaterial({ color: selected === level.id ? 0xffd37a : progress.completedLevels.includes(level.id) ? 0x58dac5 : 0xb7e1d4, transparent: true, opacity: selected === level.id ? .95 : .48 }));
    outline.userData.biomeOutline = level.environment; group.add(outline);
  }

  function makeScene(levels, progress, selected) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 1, .1, 700); camera.position.set(0, 0, 225);
    scene.add(new THREE.AmbientLight(0xb9d8dd, 1.3));
    const sun = new THREE.DirectionalLight(0xffead1, 3.1); sun.position.set(-70, 85, 110); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xd9f8ff, 0x071119, .95));
    addStars();
    planet = new THREE.Group(); scene.add(planet);
    const globeGeometry = new THREE.IcosahedronGeometry(47.9, 5), globeColors = [], oceanBase = new THREE.Color(0x238ba4);
    for (let vertex = 0; vertex < globeGeometry.attributes.position.count; vertex++) {
      const color = oceanBase.clone().offsetHSL((vertex % 11 - 5) * .0016, (vertex % 7 - 3) * .006, (vertex % 13 - 6) * .006);
      globeColors.push(color.r, color.g, color.b);
    }
    globeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(globeColors, 3));
    const globe = new THREE.Mesh(globeGeometry, material(0xffffff, { vertexColors: true, flatShading: true, emissive: 0x083d4b, emissiveIntensity: .26 }));
    globe.castShadow = true; globe.receiveShadow = true; planet.add(globe);
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(48.08, 64, 40), material(0x7bd9df, { transparent: true, opacity: .16, roughness: .2, emissive: 0x0c4550, emissiveIntensity: .22 }));
    planet.add(ocean);
    const waterPattern = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(48.11, 3)), new THREE.LineBasicMaterial({ color: 0xb5f1ef, transparent: true, opacity: .045 }));
    planet.add(waterPattern);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(50.3, 48, 32), new THREE.MeshBasicMaterial({ color: 0x77d7df, transparent: true, opacity: .09, side: THREE.BackSide }));
    planet.add(atmosphere);
    addRoute(levels, progress);
    levels.forEach((level, index) => addRegion(level, index, progress, selected));
    addClouds();
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
