import * as THREE from 'three';import {mat,mesh} from './maritime-shapes.js';
export function create({variant='field'}={}){const root=new THREE.Group(),ice=mat('#b0cbd2',{roughness:.9,flatShading:true});const list=variant==='iceberg'?[[0,0,0,26,20,18]]:[[-40,0,75,9,3,6],[45,0,-40,12,4,9],[-90,0,-60,7,3,5],[110,0,100,10,4,6]];
for(const [x,y,z,sx,sy,sz]of list){const g=new THREE.IcosahedronGeometry(1,0);const m=mesh(root,g,ice,[x,y+sy*.3,z]);m.scale.set(sx,sy,sz);m.rotation.y=x*.01;}
return root;}
