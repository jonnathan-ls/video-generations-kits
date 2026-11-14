import * as THREE from 'three';
import {createGeometry} from '../engine/factory/geometry.js';
import {createMaterial} from '../engine/factory/materials.js';
import {applyMotion} from '../engine/factory/motion.js';
import {createArchBlockGeometry} from './arch-geometry.js';

export function createArchResource(recipe,{variant}={}){
 const root=new THREE.Group(),entries=[],vars=recipe.variants?.[variant]||{};root.name=recipe.id||'arch-resource';
 for(const part of recipe.parts||[]){
  const geometry=part.shape==='arch_block'?createArchBlockGeometry(part):createGeometry(part);
  const mesh=new THREE.Mesh(geometry,createMaterial({...part.material,...vars.material}));mesh.name=part.id;
  mesh.position.fromArray(part.position||[0,0,0]);if(part.rotation)mesh.rotation.fromArray([...part.rotation.map(v=>v*Math.PI/180),'XYZ']);
  mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);entries.push({mesh,part,base:{position:mesh.position.clone(),rotation:mesh.rotation.clone(),scale:mesh.scale.clone()}});
 }
 root.userData.sample=t=>{for(const {mesh,part,base}of entries)applyMotion(mesh,base,part.motion,t);};root.userData.sample(0);return root;
}
