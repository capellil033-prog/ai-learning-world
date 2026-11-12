const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const context={};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'data/world.js'),'utf8'),context);context.AIWorld=context.window.AIWorld;
for(const file of fs.readdirSync(path.join(root,'data')).filter(f=>f.startsWith('level-')).sort())vm.runInContext(fs.readFileSync(path.join(root,'data',file),'utf8'),context);
const levels=JSON.parse(JSON.stringify(context.AIWorld.levels));
const P=require('../lib/progress.js'),L=require('../lib/logic.js');
test('world data has a contiguous prerequisite chain and usable learning content',()=>{
  const ids=new Set();levels.forEach((l,i)=>{assert.equal(l.number,i+1);assert.equal(l.unlockedAfter,i?levels[i-1].id:null);assert.ok(!ids.has(l.id));ids.add(l.id);if(!l.ready)return;assert.ok(l.stations.length>=3);assert.ok(l.stations.some(s=>s.demo));assert.ok(l.checkpoints.length>=3);for(const q of l.checkpoints)assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);assert.equal(new Set(l.stations.map(s=>s.id)).size,l.stations.length);});
});
test('corrupt and unavailable storage fall back to only level one',()=>{
  for(const storage of [{getItem(){return '{broken';}},{getItem(){throw Error('blocked');}},{getItem(){return 'null';}}])assert.deepEqual(P.load(levels,storage,'x').unlockedLevels,[levels[0].id]);
});
test('prerequisites cannot be skipped with stale or inconsistent saved state',()=>{
  const p=P.normalize(levels,{completedLevels:[levels[1].id],unlockedLevels:levels.map(l=>l.id),currentLevel:levels[1].id});assert.deepEqual(p.completedLevels,[]);assert.deepEqual(p.unlockedLevels,[levels[0].id]);
});
test('completion needs visited stations, demo and correct checkpoints',()=>{
  const level=levels[0],p=P.normalize(levels);assert.equal(P.canComplete(level,p),false);
  p.visitedStations[level.id]=level.stations.map(s=>s.id);p.passedCheckpoints[level.id]=level.checkpoints.map(q=>q.id);assert.equal(P.canComplete(level,p),false);
  p.completedDemos[level.id]=level.stations.filter(s=>s.demo).map(s=>s.demo.id);assert.equal(P.canComplete(level,p),true);
  p.completedLevels.push(level.id);const next=P.normalize(levels,p);assert.ok(next.unlockedLevels.includes(levels[1].id));
  assert.deepEqual(next.visitedStations[level.id],p.visitedStations[level.id]);
});
test('illustrative tokenization preserves text including whitespace and Unicode',()=>{
  for(const text of ['Schneefahrzeug!','Grüezi 👋\n世界','  Kontext  mit  Leerzeichen ',''])assert.equal(L.tokenize(text).join(''),text);
});
test('context capacity includes output reserve and required source',()=>{
  const demo=levels[1].stations.find(s=>s.demo?.type==='cargo').demo;
  assert.equal(L.cargo(demo,demo.cargo.map(c=>c.id)).over,true);
  assert.equal(L.cargo(demo,['task','report']).valid,true);
  assert.equal(L.cargo(demo,['task']).valid,false);
});
test('tool execution rejects malformed JSON, unknown names and wrong argument types',()=>{
 const d=levels.find(l=>l.id==='tool-river')?.stations.find(s=>s.demo?.type==='tool').demo;if(!d)return;
 for(const raw of ['{broken','null',JSON.stringify({name:'delete',arguments:{city:'Berlin'}}),JSON.stringify({name:'weather',arguments:{city:12}}),JSON.stringify({name:'weather',arguments:{city:'__proto__'}})])assert.ok(L.toolCall(raw,d).error);
 assert.equal(L.toolCall(JSON.stringify(d.call),d).result.temperature,18);
});
test('agent observations change the successful route and repeated checks reach the limit',()=>{
 const d=levels.find(l=>l.id==='agent-forest')?.stations.find(s=>s.demo?.type==='agent').demo;if(!d)return;
 const start=()=>({node:d.start,steps:0,stopped:false,success:false,history:[]});let s=start();
 for(const c of [0,0,1,0,0])s=L.agentStep(d,s,c);assert.equal(s.success,true);assert.equal(s.stopped,true);
 s=start();while(!s.stopped)s=L.agentStep(d,s,0);assert.equal(s.steps,d.maxSteps);assert.equal(s.success,false);
});
test('MCP capabilities require a connection and belong to the selected server',()=>{
 const d=levels.find(l=>l.id==='mcp-harbor')?.stations.find(s=>s.demo?.type==='mcp').demo;if(!d)return;
 const a=d.servers[0],b=d.servers[1];assert.ok(L.mcpMessage(a,a.capabilities[0].id,false).error);assert.equal(L.mcpMessage(a,a.capabilities[0].id,true).kind,'tool');assert.ok(L.mcpMessage(a,b.capabilities[0].id,true).error);assert.equal(L.mcpMessage(b,b.capabilities[0].id,true).kind,'resource');
});
test('retrieval ranks example vectors but requires an appropriate current source',()=>{
 const d=levels.find(l=>l.id==='retrieval-desert').stations.find(s=>s.demo?.type==='retrieval').demo;
 for(const q of d.queries){assert.equal(L.search(d,q,'semantic')[0].id,q.required[0]);assert.equal(L.retrieve(q,q.required),true);assert.equal(L.retrieve(q,['old']),false);assert.equal(L.retrieve(q,[...q.required,'cafe']),false);}
 assert.equal(L.cosine([0,0],[1,0]),0);assert.ok(Math.abs(L.cosine([1,0],[1,0])-1)<1e-10);
});
test('evaluation exposes faulty output and accepts the supplied corrected output',()=>{
 const d=levels.find(l=>l.id==='verification-lab').stations.find(s=>s.demo?.type==='evaluation').demo;
 assert.equal(L.evaluate(d,d.candidates[0]).filter(r=>r.passed).length,1);
 assert.equal(L.evaluate(d,d.candidates[1]).every(r=>r.passed),true);
});
test('all seven levels can complete sequentially and resume with their learning state',()=>{
 assert.equal(levels.length,7);let p=P.normalize(levels);
 for(const level of levels){assert.ok(p.unlockedLevels.includes(level.id));p.visitedStations[level.id]=level.stations.map(s=>s.id);p.completedDemos[level.id]=level.stations.filter(s=>s.demo).map(s=>s.demo.id);p.passedCheckpoints[level.id]=level.checkpoints.map(q=>q.id);assert.ok(P.canComplete(level,p));p.completedLevels.push(level.id);p=P.normalize(levels,JSON.parse(JSON.stringify(p)));}
 assert.equal(p.completedLevels.length,7);assert.equal(p.unlockedLevels.length,7);
});
test('all scripts and styles are local and present for offline startup',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]),styles=[...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m=>m[1]);for(const file of [...scripts,...styles]){assert.ok(!file.startsWith('http'));assert.ok(fs.existsSync(path.join(root,file.split('?')[0])),file);}
 assert.ok(!html.includes('lib/token-transit.js'));
});
