const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

class Parameter{
 constructor(value=0){this.value=value;}
 cancelScheduledValues(){}
 setValueAtTime(value){this.value=value;}
 linearRampToValueAtTime(value){this.value=value;}
}
class AudioNode{connect(target){return target;}start(){}stop(){}}
class GainNode extends AudioNode{constructor(){super();this.gain=new Parameter();}}
class OscillatorNode extends AudioNode{constructor(){super();this.frequency=new Parameter();this.type='sine';}}
class FilterNode extends AudioNode{constructor(){super();this.frequency=new Parameter();this.Q=new Parameter();this.type='lowpass';}}
class AudioContext{
 constructor(){this.currentTime=0;this.sampleRate=120;this.state='suspended';this.destination=new AudioNode();}
 createGain(){return new GainNode();}
 createOscillator(){return new OscillatorNode();}
 createBiquadFilter(){return new FilterNode();}
 createBuffer(channels,length){const data=Array.from({length:channels},()=>new Float32Array(length));return{getChannelData:index=>data[index]};}
 createBufferSource(){return new AudioNode();}
 async resume(){this.state='running';}
 async close(){this.state='closed';}
}

test('procedural audio switches between space, road and water without external files',async()=>{
 const values=new Map(),context={AudioContext,localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};
 context.window=context;vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..','lib','audio.js'),'utf8'),context);
 const audio=context.GameAudio;
 assert.deepEqual(JSON.parse(JSON.stringify(audio.getState())),{enabled:true,unlocked:false,scene:'space',motion:{speed:0,surface:'road',boat:false}});
 assert.equal(await audio.unlock(),true);
 audio.setScene('road');audio.setMotion({speed:8,surface:'shoulder',boat:false});
 assert.equal(audio.getState().scene,'road');assert.equal(audio.getState().motion.speed,8);assert.equal(audio.getState().motion.surface,'shoulder');
 audio.setScene('water');audio.setMotion({speed:5,boat:true});assert.equal(audio.getState().scene,'water');assert.equal(audio.getState().motion.boat,true);
 audio.setEnabled(false);assert.equal(audio.getState().enabled,false);assert.equal(values.get('ai-learning-world-sound'),'off');
 audio.destroy();assert.equal(audio.getState().unlocked,false);
});
