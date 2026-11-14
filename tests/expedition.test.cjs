const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const THREE=require('../assets/vendor/three.min.js'),CANNON=require('../assets/vendor/cannon.min.js');
const roadZ=x=>{const bounded=Math.max(-230,Math.min(230,x));return Math.sin(bounded*.038)*19+Math.sin(bounded*.076)*4;};
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
test('all seven environments construct with moving water, snow, sand or dust trails',()=>{
 const h=harness();for(const level of h.context.AIWorld.levels){
  const engine=h.context.createExpedition({level,visited:[]});assert.equal(h.byId('canvas-error').hidden,true,level.id);h.tick(2);
  const trails=[];h.scene().traverse(object=>{if(object.userData?.effect==='vehicle-trail')trails.push(object);});
  const expected=['river','harbor'].includes(level.environment)?'water':level.environment==='snow'?'snow':level.environment==='desert'?'sand':'dust';
  assert.equal(trails.length,1,`${level.id} trail count`);assert.equal(trails[0].userData.kind,expected,`${level.id} trail kind`);
  h.key('keydown','KeyW');h.tick(50);assert.ok(trails[0].material.opacity>0,`${level.id} moving trail`);h.key('keyup','KeyW');engine.destroy();
 }
});
test('only boats receive a visible wake, bow spray and water motion',()=>{
 const boatHarness=harness(),boatLevel=boatHarness.context.AIWorld.levels.find(level=>level.vehicle==='boat'),boat=boatHarness.context.createExpedition({level:boatLevel,visited:[]});
 boatHarness.tick(1);
 const boatEffects=[];boatHarness.scene().traverse(object=>{if(['boat-wake','boat-bow-spray'].includes(object.userData?.effect))boatEffects.push(object);});
 assert.equal(boatEffects.filter(effect=>effect.userData.effect==='boat-wake').length,2);assert.equal(boatEffects.filter(effect=>effect.userData.effect==='boat-bow-spray').length,1);
 boatHarness.key('keydown','KeyW');boatHarness.tick(80);assert.ok(boatEffects.every(effect=>effect.material.opacity>.25));boat.destroy();
 const carHarness=harness(),carLevel=carHarness.context.AIWorld.levels.find(level=>level.vehicle==='truck'),car=carHarness.context.createExpedition({level:carLevel,visited:[]});
 carHarness.tick(1);
 const carEffects=[];carHarness.scene().traverse(object=>{if(['boat-wake','boat-bow-spray'].includes(object.userData?.effect))carEffects.push(object);});
 assert.equal(carEffects.length,0);car.destroy();
});
test('land levels use narrow roads with substantial elevation changes',()=>{
 const h=harness();for(const level of h.context.AIWorld.levels.filter(level=>!['river','harbor'].includes(level.environment))){
  const engine=h.context.createExpedition({level,visited:[]}),roads=[];h.tick(1);h.scene().traverse(object=>{if(object.userData?.effect==='road-surface')roads.push(object);});
  const drivingSurface=roads.find(road=>road.userData.width===6.5);assert.ok(drivingSurface,`${level.id} narrow road`);assert.ok(drivingSurface.userData.heightRange>=15,`${level.id} elevation range`);engine.destroy();
 }
});
test('forest biomes contain dense tree coverage',()=>{
 const forestHarness=harness(),forestLevel=forestHarness.context.AIWorld.levels.find(level=>level.environment==='forest'),forest=forestHarness.context.createExpedition({level:forestLevel,visited:[]});
 forestHarness.tick(1);let trees=0;forestHarness.scene().traverse(object=>{if(object.userData?.effect==='forest-tree')trees++;});assert.ok(trees>=400);forest.destroy();
 const snowHarness=harness(),snowLevel=snowHarness.context.AIWorld.levels.find(level=>level.environment==='snow'),snow=snowHarness.context.createExpedition({level:snowLevel,visited:[]});
 snowHarness.tick(1);let canopyCount=0;snowHarness.scene().traverse(object=>{if(object.userData?.effect==='forest-canopy')canopyCount+=object.count;});assert.ok(canopyCount>=360);snow.destroy();
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
test('boats stay in the channel while wheeled vehicles can drive onto land',()=>{
 const boatHarness=harness(),boatLevel=boatHarness.context.AIWorld.levels.find(level=>level.vehicle==='boat'),boat=boatHarness.context.createExpedition({level:boatLevel,visited:[]});
 boatHarness.key('keydown','KeyW');boatHarness.key('keydown','KeyA');boatHarness.tick(520);const boatState=boat.status();
 assert.equal(boatState.boatLevel,true);assert.ok(Math.abs(boatState.z-roadZ(boatState.x))<=6.051);boat.destroy();
 const wheelHarness=harness(),wheelLevel=wheelHarness.context.AIWorld.levels.find(level=>level.vehicle==='truck'),wheel=wheelHarness.context.createExpedition({level:wheelLevel,visited:[]});
 wheelHarness.key('keydown','KeyW');wheelHarness.key('keydown','KeyA');for(let frame=0;frame<700&&wheel.status().surface!=='grass';frame++)wheelHarness.tick(1);
 assert.equal(wheel.status().boatLevel,false);assert.equal(wheel.status().surface,'grass');wheel.destroy();
});
test('Snowcat can leave the pass and respawns on the road after a deep fall',()=>{
 const h=harness(),level=h.context.AIWorld.levels.find(candidate=>candidate.vehicle==='snowcat'),engine=h.context.createExpedition({level,visited:[]});
 h.key('keydown','KeyW');h.tick(60);h.key('keydown','KeyA');h.tick(90);h.key('keyup','KeyA');for(let frame=0;frame<1200&&h.byId('arrival-name').textContent!=='Zurück auf der Passstrasse';frame++)h.tick(1);
 assert.equal(h.byId('arrival-name').textContent,'Zurück auf der Passstrasse');assert.equal(engine.status().surface,'road');assert.ok(Math.abs(engine.status().z-roadZ(engine.status().x))<2);engine.destroy();
});
test('missing 3D library keeps station selection usable and disables vehicle controls',()=>{
 const h=harness(true);let selected;const engine=h.context.createExpedition({level:h.context.AIWorld.levels[0],visited:[],onTarget:i=>selected=i});
 assert.equal(h.byId('canvas-error').hidden,false);assert.equal(h.byId('play-button').disabled,true);engine.select(3);assert.equal(selected,3);assert.equal(h.byId('detail-title').textContent,'Was das Modell sehen kann');engine.destroy();
});
