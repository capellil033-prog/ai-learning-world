const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const THREE=require('../assets/vendor/three.min.js'),CANNON=require('../assets/vendor/cannon.min.js');
function harness(noWebGL=false){
 const nodes=new Map(),windowEvents=new Map();let frame,renderedScene;
 function node(){const events=new Map(),children=[];return {events,children,hidden:true,open:false,clientWidth:1100,clientHeight:700,width:336,height:184,style:{},dataset:{},textContent:'',classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this[k]=v;},addEventListener(t,f){events.set(t,f);},appendChild(n){children.push(n);},remove(){},close(){this.open=false;},focus(){},matches(){return false;},closest(){return null;},querySelector(){return node();},setPointerCapture(){},getContext(){return new Proxy({},{get(t,k){return t[k]||(()=>{});},set(t,k,v){t[k]=v;return true;}});}};}
 const byId=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 class Renderer{constructor(){this.domElement=node();this.shadowMap={};}setPixelRatio(){}setSize(){}setClearColor(){}render(scene){renderedScene=scene;}dispose(){}}
 const T={...THREE,WebGLRenderer:Renderer};
 const context={THREE:T,CANNON,AbortController,console:{error(){},warn(){}},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(f){frame=f;return 1;},cancelAnimationFrame(){frame=null;},ResizeObserver:class{observe(){}disconnect(){}},document:{hidden:false,getElementById:byId,createElement:node,querySelectorAll(){return [];},querySelector(){return null;},addEventListener(){}},innerWidth:1440,devicePixelRatio:1,matchMedia(){return {matches:true};},addEventListener(t,f){windowEvents.set(t,f);}};
 context.window=context;vm.createContext(context);context.THREE=noWebGL?undefined:T;
 for(const file of ['data/world.js',...fs.readdirSync(path.join(root,'data')).filter(f=>f.startsWith('level-')).sort().map(f=>'data/'+f),'lib/models.js','lib/expedition.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 let timestamp=0;const tick=count=>{for(let i=0;i<count;i++){timestamp+=1000/60;const current=frame;if(current)current(timestamp);}};
 const key=(type,code)=>windowEvents.get(type)?.({code,target:byId('scene'),preventDefault(){},repeat:false});
 return {context,byId,tick,key,scene:()=>renderedScene,click:id=>byId(id).events.get('click')?.()};
}
function visibleBounds(THREE,object){
 object.updateMatrixWorld(true);const bounds=new THREE.Box3();
 object.traverse(child=>{if(!child.visible||!child.geometry)return;child.geometry.computeBoundingBox();bounds.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld));});
 return bounds;
}
function intersectsHeight(THREE,object,height){
 object.updateMatrixWorld(true);let intersects=false;
 object.traverse(child=>{if(!child.visible||!child.geometry)return;child.geometry.computeBoundingBox();const bounds=child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);if(bounds.min.y<=height+.025&&bounds.max.y>=height-.025)intersects=true;});
 return intersects;
}
test('all seven environments construct with moving water, snow, sand or dust trails',()=>{
 const h=harness();for(const level of h.context.AIWorld.levels){
  const engine=h.context.createExpedition({level,visited:[]});assert.equal(h.byId('canvas-error').hidden,true,level.id);h.tick(2);
  const trails=[];h.scene().traverse(object=>{if(object.userData?.effect==='vehicle-trail')trails.push(object);});
  const expected=['river','harbor'].includes(level.environment)?'water':level.environment==='snow'?'snow':level.environment==='desert'?'sand':'dust';
  assert.equal(trails.length,1,`${level.id} trail count`);assert.equal(trails[0].userData.kind,expected,`${level.id} trail kind`);
  h.key('keydown','KeyW');h.tick(50);assert.ok(trails[0].material.opacity>0,`${level.id} moving trail`);h.key('keyup','KeyW');engine.destroy();
 }
});
test('Token Pass keeps its steep road and slope while every level keeps 3D models grounded',()=>{
 const h=harness();for(const level of h.context.AIWorld.levels){
  const engine=h.context.createExpedition({level,visited:[]});h.tick(2);const terrains=[],roads=[],buildings=[];let vehicle;
  h.scene().traverse(object=>{if(object.userData?.effect==='terrain')terrains.push(object);if(object.userData?.effect==='road-surface')roads.push(object);if(object.userData?.effect==='station-building')buildings.push(object);if(object.userData?.effect==='vehicle')vehicle=object;});
  assert.equal(terrains.length,1,`${level.id} terrain`);
  const terrainY=terrains[0].geometry.attributes.position,terrainHeights=[];for(let index=0;index<terrainY.count;index++)terrainHeights.push(terrainY.getY(index));
  const roadRanges=roads.map(road=>{const y=road.geometry.attributes.position,values=[];for(let index=0;index<y.count;index++)values.push(y.getY(index));return Math.max(...values)-Math.min(...values);});
  if(level.environment==='snow'){
   assert.ok(roadRanges.every(range=>range>20),`${level.id} steep road`);
   assert.ok(Math.max(...terrainHeights)-Math.min(...terrainHeights)>50,`${level.id} steep roadside slope`);
  }else{
   assert.ok(terrainHeights.every(height=>Math.abs(height)<1e-9),`${level.id} flat terrain`);
   assert.ok(roadRanges.every(range=>range<1e-9),`${level.id} flat road`);
  }
  assert.equal(buildings.length,level.stations.length,`${level.id} station buildings`);
  for(const building of buildings)assert.ok(intersectsHeight(h.context.THREE,building,building.userData.groundHeight),`${level.id} ${building.userData.station} ground contact`);
  const vehicleBounds=visibleBounds(h.context.THREE,vehicle);
  if(['river','harbor'].includes(level.environment)){assert.ok(vehicleBounds.min.y<0&&vehicleBounds.max.y>0,`${level.id} hull crosses waterline`);}
  else assert.ok(Math.abs(vehicle.position.y-vehicle.userData.surfaceHeight-vehicle.userData.groundOffset)<1e-9,`${level.id} vehicle ground offset`);
  engine.destroy();
 }
});
test('guided driving reaches a real parking stop and opens its station',()=>{
 const h=harness();let arrival;const engine=h.context.createExpedition({level:h.context.AIWorld.levels[0],visited:[],onStation:(index,arrived)=>arrival={index,arrived}});
 engine.guide(0);h.tick(500);assert.equal(arrival?.index,0);assert.equal(arrival?.arrived,true);assert.equal(h.byId('vehicle-speed').textContent,'0');engine.destroy();
});
test('manual throttle, braking and takeover from cruise control use the actual Cannon body',()=>{
 const h=harness(),engine=h.context.createExpedition({level:h.context.AIWorld.levels[0],visited:[]});
 h.click('play-button');assert.equal(h.byId('play-button')['aria-pressed'],'true');h.key('keydown','KeyW');h.tick(80);assert.equal(h.byId('play-button')['aria-pressed'],'false');assert.ok(Number(h.byId('vehicle-speed').textContent)>0);
 h.key('keyup','KeyW');h.key('keydown','Space');h.tick(90);assert.equal(h.byId('vehicle-speed').textContent,'0');h.key('keyup','Space');engine.destroy();
});
test('missing 3D library keeps station selection usable and disables vehicle controls',()=>{
 const h=harness(true);let selected;const engine=h.context.createExpedition({level:h.context.AIWorld.levels[0],visited:[],onTarget:i=>selected=i});
 assert.equal(h.byId('canvas-error').hidden,false);assert.equal(h.byId('play-button').disabled,true);engine.select(3);assert.equal(selected,3);assert.equal(h.byId('detail-title').textContent,'Was das Modell sehen kann');engine.destroy();
});
