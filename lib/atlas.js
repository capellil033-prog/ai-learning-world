window.WorldAtlas = (() => {
  'use strict';
  let renderer, scene, camera, observer, mapRoot;
  const width = AIWorld.map.width, height = AIWorld.map.height;
  const unproject = ([x,y]) => ({x:(x-width/2)/5.7,z:(y-height/2)/4.03});
  function makeScene(levels, progress) {
    const M = AIModels;scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-width/11.4,width/11.4,height/11.4,-height/11.4,.1,1000);
    camera.position.set(0,180,180);camera.lookAt(0,0,0);
    scene.add(new THREE.AmbientLight(0xedf5f4,2));
    const sun = new THREE.DirectionalLight(0xfff0d9,3);sun.position.set(-80,180,60);scene.add(sun);
    const island = new THREE.Group();scene.add(island);
    M.box(island,228,8,180,0x8ca6a0,0,-6,0);M.box(island,228,1,180,0xbfd4bd,0,-1.5,0);
    for(let i=0;i<60;i++){
      const x=-107+(i*47%214),z=-82+(i*67%164);
      if(levels.some(l=>{const p=unproject(l.position);return Math.hypot(p.x-x,p.z-z)<27;}))continue;
      const tree=M.tree();tree.position.set(x,0,z);tree.scale.setScalar(.65+i%4*.2);island.add(tree);
    }
    levels.forEach(level=>{
      const p=unproject(level.position),region=new THREE.Group();region.position.set(p.x,0,p.z);island.add(region);
      const palettes={city:0xaec9b3,snow:0xe8f2f3,river:0x83b8ba,forest:0x7da485,harbor:0x87b6c1,desert:0xe4c68e,lab:0xbdcdd1};
      M.cylinder(region,27,1.6,palettes[level.environment],0,-.2,0,8);
      const landmark=M.building({name:level.title,building:level.landmark||'processor'},level.number,level.environment==='snow');
      landmark.scale.setScalar(1.3);landmark.position.set(0,.8,-4);region.add(landmark);
      if(level.environment==='snow')for(let i=0;i<3;i++){
        const mountain=new THREE.Mesh(new THREE.ConeGeometry(11+i*2,20+i*7,5),M.makeMaterial(0x90a8b4));mountain.position.set(-19+i*17,8+i*3,-21-i%2*8);region.add(mountain);
        const cap=new THREE.Mesh(new THREE.ConeGeometry((11+i*2)*.46,(20+i*7)*.46,5),M.makeMaterial(0xf5fafb));cap.position.copy(mountain.position);cap.position.y+=(20+i*7)*.27;region.add(cap);
      }
      for(let i=0;i<6;i++){const tree=M.tree(level.environment==='snow');tree.position.set(-21+i*8,0,11+i%2*5);tree.scale.setScalar(1.1);region.add(tree);}
      if(level.id===progress.currentLevel){const v=M.vehicle(level.vehicle).group;v.scale.setScalar(2.2);v.position.set(12,1.3,7);v.rotation.y=Math.PI/3;region.add(v);}
    });
  }
  function render(levels, progress, selected, select) {
    destroy();const host=document.getElementById('world-map');
    host.innerHTML='<div class="atlas-stage"><div id="atlas-scene" aria-hidden="true"></div><svg id="atlas-route" viewBox="0 0 '+width+' '+height+'" aria-hidden="true"></svg><div id="atlas-nodes"></div><span class="atlas-north">N ↑<small>KI-ATLAS / 01</small></span></div>';
    mapRoot=host.firstElementChild;
    const points=levels.map(l=>l.position);
    document.getElementById('atlas-route').innerHTML=points.slice(1).map((p,i)=>{const a=points[i];const path=`M${a[0]} ${a[1]} C${a[0]+140} ${a[1]},${p[0]-140} ${p[1]},${p[0]} ${p[1]}`;return `<path d="${path}" class="route-shadow"/><path d="${path}" class="${progress.completedLevels.includes(levels[i].id)?'route-done':'route-future'}"/>`;}).join('');
    const nodeHost=document.getElementById('atlas-nodes');
    levels.forEach(l=>{
      const locked=!progress.unlockedLevels.includes(l.id),done=progress.completedLevels.includes(l.id),button=document.createElement('button');
      button.className=`map-node ${locked?'locked':''} ${selected===l.id?'selected':''} ${done?'done':''}`;
      button.style.left=`${l.position[0]/width*100}%`;button.style.top=`${l.position[1]/height*100}%`;
      button.setAttribute('aria-label',`${l.title}, Level ${l.number}, ${locked?'gesperrt':done?'abgeschlossen':'verfügbar'}`);
      button.innerHTML=`<span class="node-pin">${done?'✓':locked?'<i data-lucide="lock-keyhole"></i>':String(l.number).padStart(2,'0')}</span><span class="node-label"><small>LEVEL ${String(l.number).padStart(2,'0')}</small><strong>${l.title}</strong><em>${locked?'Gesperrt':done?'Abgeschlossen':l.vehicleName+' · Verfügbar'}</em></span>`;
      button.addEventListener('click',()=>select(l.id));nodeHost.append(button);
    });
    try {
      if(!window.THREE)throw new Error('Three.js fehlt');
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
      document.getElementById('atlas-scene').append(renderer.domElement);makeScene(levels,progress);
      const resize=()=>{renderer.setSize(mapRoot.clientWidth,mapRoot.clientHeight);renderer.render(scene,camera);};
      observer=new ResizeObserver(resize);observer.observe(mapRoot);resize();
    }catch(error){document.getElementById('atlas-scene').innerHTML='<div class="map-fallback">3D nicht verfügbar. Alle Levels bleiben über die Karte und Reiseroute erreichbar.</div>';console.warn(error);}
    window.lucide?.createIcons();
  }
  function destroy(){observer?.disconnect();observer=null;if(scene){AIModels.dispose(scene);scene=null;}renderer?.dispose();renderer=null;}
  return {render,destroy};
})();
