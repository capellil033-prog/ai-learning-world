// Geometry reused from Token Transit; source hashes: docs/template-hashes.json.
window.AIModels = (() => {
  'use strict';
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


function building(station, number = 1, snow = true) {
  const worldGroup = new THREE.Group(), buildings = [];
  const stations = { landmark: { ...station, position: [0, 0] } };
  const addObstacle = () => {};
function addBuilding(key, number) {
  const station = stations[key];
  const [x, z] = station.position;
  const group = new THREE.Group();
  group.position.set(x, 0, z - 6.4);
  worldGroup.add(group);
  const palettes = {
    terminal: { wall: 0xeee7db, roof: 0xb64c3c, trim: 0x965c49, glass: 0xffd18c },
    factory: { wall: 0xdee8e7, roof: 0x317a7c, trim: 0x58777a, glass: 0xffce81 },
    warehouse: { wall: 0xddd4bd, roof: 0x9b683c, trim: 0x88715b, glass: 0xffd185 },
    workshop: { wall: 0xdf7660, roof: 0x4b646c, trim: 0xe9ddd0, glass: 0xffd494 },
    processor: { wall: 0x789b9c, roof: 0x35565c, trim: 0xd7e3de, glass: 0xa2e4df },
    generator: { wall: 0xd5e1e6, roof: 0x496b7c, trim: 0x69848d, glass: 0x9cdde6 },
    output: { wall: 0xc96554, roof: 0x74504c, trim: 0xece1cb, glass: 0xffd79c }
  };
  const palette = palettes[station.building];
  const color = palette.roof;
  box(group, 12.6, .35, 9.1, 0xa2b4bc, 0, .12, 0);
  box(group, 12.8, .12, 9.3, 0xf1f6f7, 0, .36, 0);
  box(group, 12.6, 9, .65, 0x6d828d, 0, -4.2, -4.2);
  for (const side of [-1, 1]) {
    box(group, .65, 14, .8, 0x81949d, side * 4.9, -6.7, -3.8);
    box(group, 12.5, .12, .12, 0x77919a, 0, 1.1 + (side + 1) * .22, -4.45);
  }
  for (let post = -6; post <= 6; post += 2) box(group, .1, 1.1, .1, 0x77919a, post, .95, -4.45);
  const marker = cylinder(group, .66, .16, 0xf5f7ed, -4.4, .4, 3.2);
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.3, 40), new THREE.MeshBasicMaterial({ color: 0xf08a59, transparent: true, opacity: .6, side: THREE.DoubleSide }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(x, .12, z);
  worldGroup.add(halo);
  if (station.building === 'warehouse' || station.building === 'workshop') {
    box(group, 8.5, 3.3, 5.5, palette.wall, 0, 1.9, 0);
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-4.65, 0);
    roofShape.lineTo(0, 1.7);
    roofShape.lineTo(4.65, 0);
    roofShape.closePath();
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 6, bevelEnabled: false }), makeMaterial(0xe8f1f3));
    roof.position.set(0, 3.65, -3);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);
    box(group, 9.1, .3, 6, color, 0, 3.7, 0);
    for (let door = 0; door < 3; door++) {
      box(group, 1.9, 2.3, .15, palette.glass, -2.7 + door * 2.7, 1.55, 2.82);
      for (let slat = 0; slat < 5; slat++) box(group, 1.75, .04, .05, 0xbfc6b2, -2.7 + door * 2.7, .8 + slat * .37, 2.92);
    }
    for (let crate = 0; crate < 4; crate++) {
      box(group, .9, .8, .9, 0xd8bc77, 3.7 + (crate % 2) * 1.1, .7 + Math.floor(crate / 2) * .83, 3.3);
    }
  } else if (station.building === 'processor') {
    box(group, 7.7, 5, 5.6, palette.wall, 0, 2.8, 0);
    box(group, 8.2, .4, 6.1, color, 0, 5.5, 0);
    box(group, 5.3, 1, 3.7, palette.trim, 0, 6.1, -.4);
    for (let chimney = 0; chimney < 3; chimney++) {
      cylinder(group, .45, 1.3, 0x8eaa96, -1.6 + chimney * 1.6, 7.15, -.5);
      cylinder(group, .57, .15, 0xcbd6c3, -1.6 + chimney * 1.6, 7.8, -.5);
    }
    for (let column = 0; column < 5; column++) {
      box(group, .85, 2.4, .13, palette.glass, -2.8 + column * 1.4, 3.6, 2.86);
      box(group, .85, .08, .08, 0xd1e4d7, -2.8 + column * 1.4, 3.7, 2.96);
    }
    box(group, 2.3, 1.5, .2, 0x567b68, 0, 1.1, 2.9);
  } else if (station.building === 'generator') {
    box(group, 6.8, 4.1, 5.1, palette.wall, 0, 2.35, 0);
    box(group, 7.3, .3, 5.6, color, 0, 4.55, 0);
    for (let vent = 0; vent < 2; vent++) {
      box(group, 2, .8, 2.4, 0xb5c6bf, -1.7 + vent * 3.4, 5.1, -.3);
      for (let slat = 0; slat < 4; slat++) box(group, 1.6, .07, .16, 0x829c96, -1.7 + vent * 3.4, 5.55, -1.1 + slat * .5);
    }
    box(group, 5.4, 1.2, .12, palette.glass, 0, 3, 2.62);
    box(group, 2.2, 1.8, .16, 0xaabeb4, 0, 1.2, 2.66);
    for (let token = 0; token < 3; token++) box(group, .7, .7, .7, 0x9dbbaa, 4.2 + token * .9, .65, 1.5);
  } else if (station.building === 'output') {
    box(group, 8.5, 3.4, 4.8, palette.wall, 0, 2, 0);
    box(group, 9, .32, 5.4, color, 0, 3.87, 0);
    box(group, 2.4, 2.4, .15, 0xb5b7a3, -1.9, 1.6, 2.5);
    box(group, 2.4, 1.2, .15, palette.glass, 1.7, 2.4, 2.5);
    box(group, 9.2, .2, 1.8, palette.trim, 0, 3.1, 3.1);
    for (const post of [-4.3, 4.3]) cylinder(group, .09, 2.7, 0xbcbba7, post, 1.7, 3.8, 8);
    box(group, 1.2, .9, 1.2, 0xd99c7f, 4.1, .8, 2.7);
  } else {
    box(group, 7.7, 3.5, 5.1, palette.wall, 0, 2.05, 0);
    box(group, 8.2, .35, 5.6, color, 0, 3.98, 0);
    if (station.building === 'factory') {
      box(group, 3, 2.5, 3.6, palette.trim, -1.5, 5.3, -.5);
      box(group, 3.4, .25, 4, color, -1.5, 6.7, -.5);
      cylinder(group, .42, 2.1, 0x93aa94, 2.4, 5.2, -1.4);
      cylinder(group, .48, .2, 0xc1cfb8, 2.4, 6.3, -1.4);
    } else {
      box(group, 5, .2, 3.5, 0x718f7e, 0, 4.3, -.2);
      for (let stripe = 0; stripe < 5; stripe++) box(group, .05, .025, 3.3, 0xb3c6b6, -2 + stripe, 4.42, -.2);
    }
    for (const windowX of [-2.5, 2.5]) box(group, 1.5, 1.3, .15, palette.glass, windowX, 2.7, 2.62);
    box(group, 1.5, 2.2, .15, color, 0, 1.55, 2.65);
  }
  for (const side of [-1, 1]) {
    box(group, .2, 2.7, .2, palette.trim, side * 3.55, 1.75, 2.75);
    box(group, 1.8, .45, .8, 0x7d969c, side * 3.1, .55, 3.5);
    box(group, 1.9, .22, .9, 0xf5f9fa, side * 3.1, .87, 3.5);
  }
  const roofSurfaces = group.children.filter((mesh) => mesh.geometry?.type === 'BoxGeometry' && mesh.geometry.parameters.width > 3 && mesh.geometry.parameters.depth > 3 && mesh.geometry.parameters.height <= .4 && mesh.position.y > 3);
  roofSurfaces.forEach((roof) => box(group, roof.geometry.parameters.width + .18, .19, roof.geometry.parameters.depth + .18, 0xf4f8fa, roof.position.x, roof.position.y + roof.geometry.parameters.height / 2 + .09, roof.position.z));
  group.traverse((object) => {
    if (object.material?.color?.getHex() === palette.glass) {
      object.material.emissive.setHex(palette.glass);
      object.material.emissiveIntensity = .35;
    }
  });
  for (const side of [-1, 1]) {
    box(group, .16, 3, .16, palette.trim, side * 3.4, 1.9, 2.97);
    cylinder(group, .09, 3.2, 0x506770, side * 5.3, 1.95, 2.5, 8);
    box(group, .35, .55, .35, 0xffd7a2, side * 5.3, 3.6, 2.5, makeMaterial(0xffd7a2, { emissive: 0xffb957, emissiveIntensity: .7 }));
  }
  box(group, 7.3, .13, .15, palette.trim, 0, 1.2, 2.97);
  cylinder(group, .07, 3.3, 0x6e828c, 4.5, 5.1, -1.9, 8);
  const antenna = new THREE.Mesh(new THREE.SphereGeometry(.24, 8, 6), makeMaterial(color));
  antenna.position.set(4.5, 6.85, -1.9);
  group.add(antenna);
  box(group, 3.4, .08, 1.3, 0xb9c7af, 0, .34, 3.25);
  label(group, `${String(number).padStart(2, '0')}  ${station.name.toLocaleUpperCase('de')}`, 0, station.building === 'processor' ? 9.7 : station.building === 'factory' ? 8.5 : 6.6, 0);
  buildings.push({ key, group, marker, halo });
  addObstacle(x, z - 6.4, 8.7, 5.7);
  
}


  addBuilding('landmark', number);
  const result = buildings[0];result.halo.visible = false;result.group.position.z = 0;
  if (!snow) result.group.traverse(o => {
    if (o.material?.color && [0xf4f8fa,0xf1f6f7,0xf5f9fa,0xe8f1f3].includes(o.material.color.getHex())) o.material.color.setHex(0xc8d9ce);
  });
  worldGroup.remove(result.group);result.halo.geometry.dispose();result.halo.material.dispose();
  return result.group;
}
function vehicle(type = 'truck') {
  const worldGroup = new THREE.Group();let truck, wheels = [], tokenCrates = [];
function makeTruck() {
  truck = new THREE.Group();
  wheels = [];
  tokenCrates = [];
  box(truck, 1.65, .34, 3.5, 0x344c56, 0, .62, 0);
  box(truck, 1.7, .8, 1.05, 0xd9533d, 0, 1.17, 1.2);
  box(truck, 1.7, .38, 1.4, 0xe7694d, 0, .94, 1.05);
  box(truck, 1.73, .13, 1.15, 0xf1f6f7, 0, 1.63, 1.18);
  box(truck, 1.42, .47, .04, 0x426b7c, 0, 1.32, 1.74);
  box(truck, 1.4, .11, .15, 0x405963, 0, 1.86, 1.2);
  for (const lampX of [-.5, 0, .5]) box(truck, .22, .18, .16, 0xfff0c4, lampX, 1.98, 1.2, makeMaterial(0xfff0c4, { emissive: 0xffe6a3, emissiveIntensity: 1 }));
  for (const side of [-1, 1]) {
    box(truck, .04, .44, .68, 0x426b7c, side * .87, 1.32, 1.22);
    box(truck, .13, .32, .25, 0x344c56, side * 1.02, 1.36, 1.5);
    box(truck, .23, .16, .08, 0xfff7ce, side * .52, .94, 1.8);
    box(truck, .12, .48, 2.2, 0xe6ebe0, side * .82, 1.02, -.53);
  }
  box(truck, 1.7, .15, 2.25, 0xe6e9dc, 0, .84, -.53);
  box(truck, 1.7, .48, .13, 0xe6ebe0, 0, 1.02, -1.63);
  box(truck, 1.8, .15, .16, 0x657764, 0, .65, 1.79);
  for (const side of [-1, 1]) {
    for (const axle of [-1.12, 1.06]) {
      const wheel = cylinder(truck, .37, .22, 0x26373e, side * .88, .43, axle, 16);
      wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(truck, .17, .24, 0xd2dfe4, side * .9, .43, axle, 12);
      hub.rotation.z = Math.PI / 2;
      wheels.push(wheel);
    }
  }
  for (let index = 0; index < 6; index++) {
    const crate = box(truck, .62, .55, .57, 0xe8c065, (index % 2) * .73 - .365, 1.2, -.98 + Math.floor(index / 2) * .64);
    box(crate, .12, .02, .59, 0xf8e5aa, 0, .28, 0);
    tokenCrates.push(crate);
  }
  truck.scale.setScalar(1.14);
  worldGroup.add(truck);
}


  makeTruck();return { group: truck, wheels, crates: tokenCrates };
}
function tree(snow = false) {
  const group = new THREE.Group();cylinder(group,.16,1.7,0x705e50,0,.85,0,6);
  for (let tier=0;tier<3;tier++) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.5-tier*.35,2.5,7),makeMaterial(0x285e57));
    crown.position.y=2+tier*1.1;crown.castShadow=true;group.add(crown);
    if(snow){const cap=new THREE.Mesh(new THREE.ConeGeometry((1.5-tier*.35)*.94,1.95,7),makeMaterial(0xeaf5f6));cap.position.y=2.35+tier*1.1;group.add(cap);}
  }return group;
}
function dispose(group) {
  group.traverse(o => {o.geometry?.dispose();for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){m.map?.dispose();m.dispose();}});
}
return { makeMaterial, box, cylinder, label, building, vehicle, tree, dispose };
})();
