import * as THREE from 'three';
import {createArchBlockGeometry} from './arch-geometry.js';
import {makeMortarJointParts} from './arch-layout.js';

export function create(){
 const root=new THREE.Group();root.name='argamassa_juntas_arco';
 const material=new THREE.MeshStandardMaterial({color:'#e4d2ae',roughness:0.98,metalness:0});
 for(const part of makeMortarJointParts()){
  const geometry=createArchBlockGeometry(part);
  const joint=new THREE.Mesh(geometry,material);
  joint.name=part.id;
  joint.position.fromArray(part.position);
  joint.castShadow=true;joint.receiveShadow=true;root.add(joint);
 }
 root.userData.sample=()=>{};
 return root;
}
