import * as THREE from 'three';import {createGeometry} from './geometry.js';import {createMaterial} from './materials.js';import {applyMotion} from './motion.js';
// LLM-authored recipes become deterministic modules; no prompt or remote service is executed here.
export function createResource(recipe,{variant}={}){
 const root=new THREE.Group(),entries=[];root.name=recipe.id||'resource';
 const vars=recipe.variants?.[variant]||{};
 for(const part of recipe.parts||[]){const mesh=new THREE.Mesh(createGeometry(part),createMaterial({...part.material,...vars.material}));mesh.name=part.id;mesh.position.fromArray(part.position||[0,0,0]);if(part.rotation)mesh.rotation.fromArray([...part.rotation.map(v=>v*Math.PI/180),'XYZ']);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);entries.push({mesh,part,base:{position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()}});}
 root.userData.sample=t=>{for(const {mesh,part,base}of entries)applyMotion(mesh,base,part.motion,t);};root.userData.sample(0);return root;
}
