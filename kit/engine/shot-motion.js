import * as THREE from 'three';

const bases=new WeakMap();
const vectorProperties=new Set(['position','rotation','scale']);
const scalarProperties=new Set(['opacity','emissiveIntensity']);
const lerp=(a,b,u)=>Array.isArray(a)?a.map((n,i)=>n+(b[i]-n)*u):a+(b-a)*u;
export function captureMotionBases(shot,targets){
 for(const track of shot.motion||[]){let object=targets.get(track.target);if(track.part)object=object?.getObjectByName(track.part);if(!object)throw new Error(`Movimento sem alvo real: ${track.target}/${track.part||''}`);bases.set(object,{position:object.position.toArray(),rotation:[object.rotation.x,object.rotation.y,object.rotation.z],scale:object.scale.toArray()});}
}
export function sampleKeyframes(frames,time,ease='smooth'){
 if(!Array.isArray(frames)||!frames.length)throw new Error('Movimento sem keyframes.');
 if(time<=frames[0].time)return structuredClone(frames[0].value);
 for(let i=1;i<frames.length;i++)if(time<=frames[i].time){const a=frames[i-1],b=frames[i];let u=(time-a.time)/(b.time-a.time);if(ease!=='linear')u=u*u*(3-2*u);return lerp(a.value,b.value,u);}
 return structuredClone(frames.at(-1).value);
}
export function validateShotMotion(shot){
 const errors=[];
 for(const [i,track]of(shot.motion||[]).entries()){
  const name=`${shot.id||'cena'} movimento ${i+1}`;
  if(!(shot.assets||[]).some(a=>(a.instanceId||a.id)===track.target))errors.push(`${name}: alvo ausente ${track.target}.`);
  if(!vectorProperties.has(track.property)&&!scalarProperties.has(track.property))errors.push(`${name}: propriedade inválida.`);
  if(!Array.isArray(track.keyframes)||track.keyframes.length<2){errors.push(`${name}: declarar preparação e resultado.`);continue;}
  let previous=-Infinity;
  for(const k of track.keyframes){if(!Number.isFinite(k.time)||k.time<0||k.time>(shot.sourceDuration??shot.duration)+.001||k.time<=previous)errors.push(`${name}: tempos inválidos.`);previous=k.time;
   if(vectorProperties.has(track.property)?!Array.isArray(k.value)||k.value.length!==3||!k.value.every(Number.isFinite):!Number.isFinite(k.value))errors.push(`${name}: valor inválido.`);}
 }
 return errors;
}
export function applyShotMotion(shot,targets,time){
 for(const track of shot.motion||[]){
  let object=targets.get(track.target);if(track.part)object=object?.getObjectByName(track.part);
  if(!object)throw new Error(`Movimento sem alvo real: ${track.target}/${track.part||''}`);
  const value=sampleKeyframes(track.keyframes,time,track.ease);
  let base=bases.get(object);if(!base){base={position:object.position.toArray(),rotation:[object.rotation.x,object.rotation.y,object.rotation.z],scale:object.scale.toArray()};bases.set(object,base);}
  if(vectorProperties.has(track.property)){
   const values=value.map((n,i)=>track.relative===false?n:track.property==='scale'?base.scale[i]*n:base[track.property][i]+n);
   object[track.property].set(...values);
  }else{
   const apply=material=>{if(track.property==='opacity')material.transparent=true;material[track.property]=value;};
   object.traverse(node=>{if(node.isMesh)for(const material of Array.isArray(node.material)?node.material:[node.material])apply(material);});
  }
 }
}
