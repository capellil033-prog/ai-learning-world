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
