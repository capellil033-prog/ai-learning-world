(function(root){
  'use strict';
  function tokenize(text){return (text.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu)||[]).flatMap(part=>part.trim()&&/^[\p{L}\p{N}]+$/u.test(part)?Array.from(part).reduce((a,ch,i)=>{if(i%4===0)a.push('');a[a.length-1]+=ch;return a;},[]):[part]);}
  function cargo(demo,selected){const used=demo.reserve+demo.cargo.filter(c=>selected.includes(c.id)).reduce((n,c)=>n+c.tokens,0);return {used,over:used>demo.capacity,missing:demo.cargo.filter(c=>c.required&&!selected.includes(c.id)).map(c=>c.id),valid:used<=demo.capacity&&demo.cargo.every(c=>!c.required||selected.includes(c.id))};}
  function toolCall(text,demo){
    let call;try{call=JSON.parse(text);}catch{return {error:'Der Aufruf ist kein gültiges JSON.'};}
    if(!call||call.name!==demo.tool)return {error:'Dieses Werkzeug ist nicht zugelassen.'};
    const args=call.arguments;
    if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).length!==1||typeof args[demo.argument]!=='string'||!args[demo.argument].trim())return {error:'Die Argumente passen nicht zum Schema: '+demo.argument+' muss eine nicht leere Zeichenkette sein.'};
    const value=args[demo.argument];if(!Object.hasOwn(demo.results,value))return {error:'Für diese Eingabe fehlen Beispieldaten. Verfügbar: '+Object.keys(demo.results).join(', ')+'.'};
    return {call,result:demo.results[value]};
  }
  const api={tokenize,cargo,toolCall};root.LearningLogic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
