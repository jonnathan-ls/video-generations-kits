import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {surface} from './period-surface-materials.js';
import {mesh} from './maritime-shapes.js';
export function create({variant='compartments',params={}}={}){
 const root=new THREE.Group(),steel=surface('iron');steel.color.set('#50616a');steel.roughness=.48;
 const part=(name,size,pos,material=steel)=>mesh(root,new RoundedBoxGeometry(...size,2,.015),material,pos,name);
 part('cut-bottom',[7.2,.12,1.9],[0,.1,0]);part('far-hull-side',[7.2,1.45,.1],[0,.83,-.95]);part('near-cut-rim',[7.2,.14,.1],[0,.2,.95]);
 for(let index=0;index<7;index++){const x=-3.5+index*1.17;part('bulkhead-'+index,[.07,1.32,1.9],[x,.82,0]);for(const y of [.3,.55,.8,1.05,1.3])for(const z of [-.9,.9])mesh(root,new THREE.SphereGeometry(.016,8,6),steel,[x+.045,y,z]);}
 const waters=[];for(let index=0;index<6;index++){const w=part('water-compartment-'+index,[1.08,.5,1.72],[-2.915+index*1.17,.41,0],new THREE.MeshPhysicalMaterial({color:'#4a9eaa',metalness:.06,roughness:.22,transparent:true,opacity:.92,clearcoat:.82,clearcoatRoughness:.16,emissive:'#061b20',emissiveIntensity:.24}));waters.push(w);w.scale.y=index<2?1:.012;}
 const edge=new THREE.MeshStandardMaterial({color:'#cba275',roughness:.5,metalness:.35});for(const x of [-3.5,3.52])part('section-edge',[.095,1.4,1.94],[x,.83,0],edge);
 const floodInterval=Math.max(.5,Number(params.floodInterval)||4.1),floodRise=Math.max(.5,Number(params.floodRise)||3.3),timeOffset=Math.max(0,Number(params.timeOffset)||0);
 root.userData.sample=t=>{const progress=Math.max(0,t+timeOffset);for(let index=0;index<waters.length;index++){const w=waters[index],u=variant==='flood-path'?THREE.MathUtils.smoothstep(progress,index*floodInterval,index*floodInterval+floodRise):index<2?THREE.MathUtils.smoothstep(t,.15,1.6):0;const h=.02+.9*u;w.scale.y=h/.5;w.position.y=.19+h/2;}};root.userData.sample(0);return root;
}
