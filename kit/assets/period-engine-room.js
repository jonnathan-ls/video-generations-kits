import * as THREE from 'three';import {cloud} from './period-steam.js';import {surface} from './period-surface-materials.js';import {block,lamp,wallFinish} from './period-room-parts.js';import {mesh,beam,mat} from './maritime-shapes.js';
export function create({variant='padrao'}={}){const cutaway=variant==='open-cutaway';const r=new THREE.Group(),iron=surface('iron'),brass=surface('brass');const W=128,H=64,data=new Uint8Array(W*H*4);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=x/W,v=y/H,soft=Math.exp(-(((v-.32)/.22)**2)),panel=Math.exp(-(((u-.24)/.10)**2))+Math.exp(-(((u-.72)/.10)**2)),n=Math.min(1,.15+.36*soft+.46*panel*soft),i=(y*W+x)*4;data[i]=255*n;data[i+1]=232*n;data[i+2]=199*n;data[i+3]=255;}const reflections=new THREE.DataTexture(data,W,H);reflections.mapping=THREE.EquirectangularReflectionMapping;reflections.colorSpace=THREE.SRGBColorSpace;reflections.needsUpdate=true;for(const material of [iron,brass]){material.envMap=reflections;material.envMapIntensity=.75;}iron.color.set(cutaway?'#697477':'#536467');iron.roughness=.55;block(r,'steel-platform',[10,.18,9.5],[0,-.09,-.25],iron);if(!cutaway)block(r,'rear-steel-wall',[10,4,.15],[0,2,-5.5],mat('#596565'));const steam=cloud();steam.position.set(3.7,2.7,-3);r.add(steam);const wheels=[],rods=[];
 for(const x of [-2.5,0,2.5]){block(r,'engine-foundation',[1.8,.4,3],[x,.2,-2],iron);for(const z of [-3,-1]){const body=mesh(r,new THREE.CylinderGeometry(.58,.62,1.8,24),iron,[x,1.4,z]);for(const y of [.6,2.2])mesh(r,new THREE.TorusGeometry(.61,.055,8,24),brass,[x,y,z]).rotation.x=Math.PI/2;const rod=mesh(r,new THREE.CylinderGeometry(.09,.09,1.5,16),brass,[x,1.2,z+.7]);rods.push({rod,y:1.2});}
  const wheel=new THREE.Group();wheel.position.set(x,1.1,0);r.add(wheel);mesh(wheel,new THREE.TorusGeometry(.8,.09,8,40),iron);for(let k=0;k<6;k++){const a=k*Math.PI/3;beam(wheel,[0,0,0],[.75*Math.cos(a),.75*Math.sin(a),0],.035,brass);}mesh(wheel,new THREE.CylinderGeometry(.15,.15,.28,16),brass).rotation.x=Math.PI/2;wheels.push(wheel);
 }
 for(const x of [-4.5,4.5]){beam(r,[x,.2,-4],[x,3.7,-4],.14,brass);beam(r,[x,3.7,-4],[x,3.7,cutaway?2.5:3],.14,brass);for(const z of [-3,0,3])lamp(r,x*.8,3.5,z,4.2);}
 for(const x of [-4.5,4.5])for(let z=-4;z<=4;z+=2)beam(r,[x,0,z],[x,1.05,z],.035,brass);for(const x of [-4.5,4.5])beam(r,[x,1.05,-4],[x,1.05,4],.035,brass);
 r.userData.sample=t=>{steam.userData.sample(t);wheels.forEach((w,i)=>w.rotation.z=t*1.5+i*.8);rods.forEach(({rod,y},i)=>rod.position.y=y+Math.sin(t*1.5+i*.8)*.23);};r.userData.sample(0);
 if(cutaway){
  // Preserve the enclosing shape of a ship's working deck while opening the
  // camera-facing side. The hull edge and plated bulkhead keep the machinery
  // from reading as a loose display board over the ocean.
  const shell=mat('#4f5b5d',{metalness:.35,roughness:.62});
  const boot=mat('#753237',{metalness:.22,roughness:.58});
  block(r,'far-hull-inner-side',[.18,3.35,8.9],[-4.84,1.25,0],wallFinish('#8b887a'));
  block(r,'far-hull-boot-stripe',[.22,.42,9],[-4.86,-.48,0],boot);
  for(const z of [-3.45,-1.15,1.15,3.45]){
   beam(r,[-4.62,-.7,z],[-4.62,3.25,z],.07,shell);
   for(const y of [.2,.65,1.1,1.55,2,2.45,2.9])mesh(r,new THREE.SphereGeometry(.045,8,6),brass,[-4.51,y,z]);
  }
  // Three fitted bulkhead panels replace the featureless slab behind the
  // engines; exposed pipes, seams and rivets identify a working interior.
  const panel=wallFinish('#73756d');
  for(const x of [-3.08,0,3.08])block(r,'segmented-rear-bulkhead',[2.94,3.25,.18],[x,1.52,-4.78],panel);
  for(const x of [-4.48,-1.55,1.55,4.48])beam(r,[x,.1,-4.63],[x,3.15,-4.63],.055,brass);
  for(const y of [.42,2.72])beam(r,[-4.6,y,-4.6],[4.6,y,-4.6],.035,brass);
  for(const x of [-4.1,-2.05,0,2.05,4.1])for(const y of [.55,1.2,1.85,2.5])mesh(r,new THREE.SphereGeometry(.027,8,6),brass,[x,y,-4.59]);
  // The near side stays open for the camera, with a finished cut edge and
  // structural framing visible around the opening.
  for(const z of [-4,0,3.5])beam(r,[4.72,.08,z],[4.72,1.9,z],.065,brass);
  beam(r,[4.72,.08,-4],[4.72,.08,3.5],.065,brass);
  beam(r,[4.72,1.9,-4],[4.72,1.9,2.5],.065,brass);
  beam(r,[-4.5,3.7,-4],[4.5,3.7,-4],.065,brass);
 }else{
  block(r,'ceiling',[10,.12,10],[0,4.2,-.5],mat('#d4cbb8'));
  for(const side of [-1,1])block(r,'side-wall',[.15,3.5,10],[side*5,1.75,-.5],wallFinish('#9f9b89'));
 }
 return r;}
