(function(root){
  'use strict';
  function tokenize(text){return (text.match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu)||[]).flatMap(part=>part.trim()&&/^[\p{L}\p{N}]+$/u.test(part)?Array.from(part).reduce((a,ch,i)=>{if(i%4===0)a.push('');a[a.length-1]+=ch;return a;},[]):[part]);}
  function cargo(demo,selected){const used=demo.reserve+demo.cargo.filter(c=>selected.includes(c.id)).reduce((n,c)=>n+c.tokens,0);return {used,over:used>demo.capacity,missing:demo.cargo.filter(c=>c.required&&!selected.includes(c.id)).map(c=>c.id),valid:used<=demo.capacity&&demo.cargo.every(c=>!c.required||selected.includes(c.id))};}
  const api={tokenize,cargo};root.LearningLogic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
