"""Extract supplied geometry, retaining model design and proportions."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = (root / 'lib/token-transit.js').read_text(encoding='utf-8')
helpers = source[source.index('function makeMaterial('):source.index('function addTree(')]
building = source[source.index('function addBuilding('):source.index('function createCacheDepot(')].replace("if (key === 'cache') createCacheDepot(x - 6, z - 3.2);", '')
truck = source[source.index('function makeTruck('):source.index('function disposeWorld(')]
output = '''// Geometry reused from Token Transit; source hashes: docs/template-hashes.json.
window.AIModels = (() => {
  'use strict';
''' + helpers + '''
function building(station, number = 1, snow = true) {
  const worldGroup = new THREE.Group(), buildings = [];
  const stations = { landmark: { ...station, position: [0, 0] } };
  const addObstacle = () => {};
''' + building + '''
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
''' + truck + '''
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
'''
(root/'lib/models.js').write_text(output,encoding='utf-8')
