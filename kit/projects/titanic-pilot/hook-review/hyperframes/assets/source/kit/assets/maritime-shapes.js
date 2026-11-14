import * as THREE from 'three';
import {createResource} from '../engine/factory/index.js';
export const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.72,...extra});
export function mesh(root,geo,material,pos=[0,0,0],name='part'){const m=new THREE.Mesh(geo,material);m.position.fromArray(pos);m.name=name;root.add(m);return m;}
export function beam(root,a,b,r,material){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=mesh(root,new THREE.CylinderGeometry(r,r,v.length(),6),material,new THREE.Vector3(...a).addScaledVector(v,.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
export function recipe(id,parts){return createResource({id,parts});}
export function box(id,size,position,color){return {id,size,position,material:{color,roughness:.7}};}
export function hull(length,width,top,bottom,color,openTop=false){const rings=[[-.5,.06],[-.46,.57],[-.36,.94],[-.20,1],[.20,1],[.36,.9],[.46,.48],[.5,.012]];const pts=[],indices=[];
for(const [z,w]of rings){const x=width*w/2;for(const [u,y]of [[-1,top],[-1,0],[-.68,bottom*.76],[0,bottom],[.68,bottom*.76],[1,0],[1,top]])pts.push(u*x,y,z*length);}
for(let j=0;j<rings.length-1;j++)for(let i=0;i<(openTop?6:7);i++){const a=j*7+i,b=j*7+(i+1)%7,c=(j+1)*7+(i+1)%7,d=(j+1)*7+i;indices.push(a,b,d,b,c,d);}
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(indices);g.computeVertexNormals();return new THREE.Mesh(g,mat(color,{side:THREE.DoubleSide}));}
export function figure({captain=false,color='#4b5260'}={}){const r=recipe('period-figure',[box('coat',[.5,.73,.32],[0,1.03,0],color),box('left-leg',[.18,.61,.21],[-.13,.33,0],'#151c26'),box('right-leg',[.18,.61,.21],[.13,.33,0],'#151c26'),box('left-arm',[.13,.65,.19],[-.32,1.02,0],color),box('right-arm',[.13,.65,.19],[.32,1.02,0],color)]);mesh(r,new THREE.SphereGeometry(.18,12,8),mat('#bb967b'),[0,1.57,0]);mesh(r,new THREE.CylinderGeometry(.23,.23,.08,12),mat(captain?'#182536':'#36302b'),[0,1.8,0]);if(captain)mesh(r,new THREE.BoxGeometry(.23,.03,.09),mat('#d5c398'),[0,1.22,.17]);return r;}
