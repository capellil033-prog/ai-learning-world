"""Reuse the supplied road, collision, camera, parking and scenery implementation."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source=(root/'lib/token-transit.js').read_text(encoding='utf-8')
body=source[source.index('const state ='):source.index("byId('llm-mode').addEventListener")]
start=body.index('function renderRoute(');end=body.index('function updateStation(')
body=body[:start]+"function renderRoute() { options.onTarget?.(state.index); }\n\n"+body[end:]
start=body.index('function openStationDialog(');end=body.index('function updatePlayButton(')
body=body[:start]+"function openStationDialog(arrived = false) { pauseDriving(); options.onStation?.(state.index, arrived); }\n\n"+body[end:]
start=body.index('function addBuilding(');end=body.index('function createCacheDepot(')
body=body[:start]+'''function addBuilding(key, number) {
  const station=stations[key], [x,z]=station.position;
  const group=AIModels.building(station,number,level.environment==='snow');
  group.position.set(x,0,z-6.4);worldGroup.add(group);
  const marker=AIModels.cylinder(group,.66,.16,0xf1f6f7,-4.4,.4,3.2);
  const halo=new THREE.Mesh(new THREE.RingGeometry(1.1,1.3,40),new THREE.MeshBasicMaterial({color:0xf08a59,transparent:true,opacity:.6,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;halo.position.set(x,.12,z);worldGroup.add(halo);
  buildings.push({key,group,marker,halo});addObstacle(x,z-6.4,8.7,5.7);
  if(key==='cache')createCacheDepot(x-6,z-3.2);
}

'''+body[end:]
start=body.index('function makeTruck(');end=body.index('function disposeWorld(')
body=body[:start]+'''function makeTruck() {
  const vehicle=AIModels.vehicle(level.vehicle);truck=vehicle.group;wheels=vehicle.wheels;tokenCrates=vehicle.crates;worldGroup.add(truck);
}

'''+body[end:]
body=body.replace("visited: new Set() });", "visited: new Set((options.visited || []).map(id => routes.llm.indexOf(id)).filter(i => i >= 0)) });")
body=body.replace('function terrainHeight(x, z) {', "function terrainHeight(x, z) {\n  if(level.environment!=='snow')return -.08;")
body=body.replace('function addLandscape() {', "function addLandscape() {\n  if(level.environment!=='snow'){addBiomeLandscape();return;}")
body=body.replace('560, 440, 420, 330','560, 440, 220, 165')
body=body.replace('  addPassBarriers();', "  if(level.environment==='snow')addPassBarriers();")
body=body.replace("'NORDGRAT  /  2.240 m' : 'PASSHÖHE  /  GUTE FAHRT'", "level.title.toUpperCase() : 'GUTE REISE / KI VERSTEHEN'")
body=body.replace('function advance(delta) {', "function advance(delta) {\n  if(tour && !Object.values(driveInput).some(Boolean)){advanceTour(delta);return;}\n  if(tour)tour=null;")
body=body.replace('  state.velocity = 0;\n  state.running = false;', '  tour=null;\n  state.velocity = 0;\n  state.running = false;')
body=body.replace('new ResizeObserver(updateCamera).observe(sceneHost);', 'resizeObserver=new ResizeObserver(()=>updateCamera());resizeObserver.observe(sceneHost);')
prefix='''// Adapted from Token Transit. Geometry, collision, road, parking and camera retained.
window.createExpedition = function(options) {
 'use strict';
 const level=options.level, byId=id=>document.getElementById(id), icons=()=>window.lucide?.createIcons();
 const stations=Object.fromEntries(level.stations.map(s=>[s.id,{...s,position:[0,0]}]));
 const routes={llm:level.stations.map(s=>s.id)};
 const events=new AbortController();let resizeObserver,tour=null;
 const on=(target,event,fn,opts={})=>target.addEventListener(event,fn,{...opts,signal:events.signal});
'''
suffix='''
function addBiomeLandscape(){
  const palette={city:0xb1c7ad,forest:0x83a77e,river:0x78b1bf,harbor:0x7aa8b8,desert:0xe5c58e,lab:0xc0d0d3};
  box(worldGroup,650,3,370,palette[level.environment]||0xb1c7ad,0,-1.6,0);
  for(let i=0;i<100;i++){
    const x=-240+i*71%480,z=roadZ(x)+(i%2?1:-1)*(23+i*17%90);
    const tree=AIModels.tree();tree.position.set(x,0,z);tree.scale.setScalar(.8+i%5*.25);worldGroup.add(tree);
  }
  if(level.environment==='city')for(let i=0;i<14;i++){
    const house=AIModels.building({name:'',building:i%3?'terminal':'factory'},i+1,false);
    house.children.filter(o=>o.type==='Sprite').forEach(o=>{o.material.map?.dispose();o.material.dispose();house.remove(o);});
    const x=-160+i*25;house.position.set(x,0,roadZ(x)+29+i%2*15);house.scale.setScalar(.6);worldGroup.add(house);
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
  vehicleBody.position.set(state.x,1,state.z);vehicleBody.velocity.setZero();state.surface=roadSurface(state.x,state.z);checkParking(delta);
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
function pauseDriving(){tour=null;clearDrivingInput();state.velocity=0;state.running=false;vehicleBody?.velocity.setZero();updatePlayButton();drag=null;}
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
 mark(id){const index=routes.llm.indexOf(id);if(index>=0)state.visited.add(index);updateProgress();},
 destroy(){pauseDriving();events.abort();resizeObserver?.disconnect();cancelAnimationFrame(animationFrame);clearTimeout(arrivalTimer);disposeWorld();renderer?.dispose();renderer?.domElement.remove();}
};
};
'''
(root/'lib/expedition.js').write_text(prefix+body+suffix,encoding='utf-8')
template=Path(r'C:\Users\lucac\Documents\Persönliches\Programmierung\prompt3_low\prompt3_low\index.html').read_text(encoding='utf-8')
shell=template[template.index('  <main class="workspace">'):template.index('  <dialog id="station-dialog"')]
shell=shell.replace('<main class="workspace">','<div class="workspace">').replace('</main>','</div>')
shell=shell.replace('Der KI-Pass<span>2.240 m</span>','<span id="level-heading"></span>')
shell=shell.replace('<div class="pass-meta">','<div class="pass-meta" id="level-meta">')
shell=shell.replace('<div class="altitude-marker">','<div class="altitude-marker" hidden>')
shell=shell.replace('<div class="drive-controls">','<div class="drive-controls"><button class="secondary" id="tour-button" title="Geführt zur ausgewählten Station fahren">Tour</button>')
shell=shell.replace('  </footer>','    <button class="secondary" id="summary-button">Wissenscheck</button>\n  </footer>')
shell+='''<dialog id="station-dialog" class="station-dialog" aria-labelledby="station-heading"></dialog>
<dialog id="help-dialog" aria-labelledby="help-heading"><div class="dialog-header"><span class="eyebrow">AI LEARNING WORLD / STEUERUNG</span><button class="icon-button" id="close-help" aria-label="Hilfe schliessen">×</button></div><h2 id="help-heading">Entdecken. Ausprobieren. Verstehen.</h2><p>Klicke eine Station an und lies ihre Erklärung. Mit „Station verstanden“ hältst du deinen Lernfortschritt fest. Die Tour fährt zur gewählten Station und hält dort an.</p><p>W / ↑: Gas · S / ↓: Bremsen und rückwärts · A/D / ←/→: Lenken · Leertaste: Anhalten · P: Tempomat. Manuelle Eingaben übernehmen die Kontrolle. Auf Touchscreens Pedale und Lenkknöpfe gedrückt halten.</p><p>Maus ziehen: Kamera drehen · Mausrad und +/−: Zoom · Kartenknopf: Übersicht. Ein echter Halt in einer Parkbucht öffnet die Station nach 0,65 Sekunden. Der Tempomat hält nicht an Stationen.</p><p>Lokale Lernsimulation: kein echtes Modell, keine KI-Anfragen, keine Live-Daten. Alle Tokenzahlen und Rechenschritte sind didaktisch vereinfacht.</p></dialog>
<dialog id="checkpoint-dialog" class="station-dialog" aria-labelledby="checkpoint-heading"></dialog>
<dialog id="intro-dialog" aria-labelledby="intro-heading"></dialog>'''
(root/'lib/level-view.js').write_text('window.levelShell = '+repr(shell).replace('\\x','\\u00')+';\n',encoding='utf-8')
