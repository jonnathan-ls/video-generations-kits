import * as THREE from 'three';import {person} from './period-person-rig.js';import {mat,mesh,hull,figure,recipe,box} from './maritime-shapes.js';
export function create({variant='occupied'}={}){const root=new THREE.Group();root.add(hull(9,2.8,1.25,-.45,'#b1a38c',true));const inner=mesh(root,new THREE.BoxGeometry(1.94,.13,6.9),mat('#5b4432'),[0,.4,0]);
 const seats=[];for(let i=0;i<6;i++)seats.push(box('bench-'+i,[2.35,.13,.3],[0,.85,-2.65+i*1.05],'#937752'));root.add(recipe('boat-benches',seats));
 if(variant==='occupied')for(const [i,x]of [[0,-.55],[0,.55],[1,-.55],[4,.55]]){const p=person({seated:true,color:i===4?'#68533e':'#333b48'});p.scale.setScalar(.9);p.position.set(x,.08,-2.65+i*1.05);root.add(p);}
 root.userData.sample=t=>{inner.rotation.z=0;root.rotation.z=Math.sin(t*.7)*.012;};root.userData.sample(0);return root;}
