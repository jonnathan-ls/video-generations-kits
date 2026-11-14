import * as THREE from 'three';import {mat,mesh,beam,recipe,box,hull} from './maritime-shapes.js';
export function create({variant='titanic'}={}){
 const titanic=variant==='titanic',L=titanic?269.1:170,W=titanic?28.2:19.5,root=new THREE.Group();root.name=variant;
 root.add(hull(L,W,7,-8.5,'#14202b'));const parts=[box('main-deck',[W*.91,.65,L*.79],[0,7.1,-L*.012],'#aa9272')];
 for(let i=0;i<3;i++)parts.push(box('superstructure-'+i,[W*(.86-i*.07),3.1,L*(.65-i*.06)],[0,9+i*3.15,-L*.018],'#d5d2c7'));
 parts.push(box('bridge-wing',[W*1.2,.25,L*.055],[0,16.5,L*.29],'#a69373'));
 parts.push(box('bridge',[W*.9,3.2,L*.045],[0,17,L*.29],'#dad7ca'));
 root.add(recipe('liner-decks',parts));const rail=mat('#c0beb2'),black=mat('#171c21'),funnel=mat(titanic?'#bd8c4f':'#91483c');
 for(let i=0;i<(titanic?4:1);i++){const z=titanic?L*(.24-i*.16):-L*.02;const f=mesh(root,new THREE.CylinderGeometry(titanic?3:2.7,titanic?3.15:2.9,14,18),funnel,[0,24,z]);f.rotation.x=-.07;mesh(root,new THREE.CylinderGeometry(titanic?3.04:2.74,titanic?3.04:2.74,3.8,18),black,[0,30,z]);}
 for(const z of (titanic?[-L*.34,L*.38]:[-L*.38,-L*.2,L*.25,L*.4])){beam(root,[0,7,z],[0,titanic?41:31,z],.23,mat('#9c7b50'));beam(root,[0,35,z],[-W*.37,8,z+10],.035,rail);beam(root,[0,35,z],[W*.37,8,z-10],.035,rail);}
 for(const side of [-1,1]){for(let i=0;i<3;i++)beam(root,[side*W*.45,17.7+i*.28,-L*.31],[side*W*.45,17.7+i*.28,L*.32],.055,rail);for(let j=0;j<19;j++)beam(root,[side*W*.45,17.6,-L*.31+j*L*.035],[side*W*.45,18.35,-L*.31+j*L*.035],.04,rail);}
 const windowMat=mat('#d9b16c',{emissive:'#d9a455',emissiveIntensity:.35});const windows=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.75,1.2),windowMat,240);const dummy=new THREE.Object3D();let k=0;
 for(const side of [-1,1])for(let level=0;level<3;level++)for(let i=0;i<40;i++){dummy.position.set(side*(W*(.86-level*.07)/2+.06),9+level*3.15,-L*.29+i*L*.0145);dummy.updateMatrix();windows.setMatrixAt(k++,dummy.matrix);}root.add(windows);
 const ports=new THREE.InstancedMesh(new THREE.SphereGeometry(.25,6,4),windowMat,100);k=0;for(const side of [-1,1])for(let i=0;i<50;i++){dummy.position.set(side*W*.475,4.7,-L*.35+i*L*.014);dummy.updateMatrix();ports.setMatrixAt(k++,dummy.matrix);}root.add(ports);
 // Lifeboats, davits and ventilators articulate the boat deck instead of a featureless slab.
 if(titanic){const wood=mat('#b0a18b'),davits=mat('#a9b2b0');for(const side of [-1,1])for(let i=0;i<8;i++){const z=-67+i*18.7,x=side*W*.37;const boat=hull(8.5,2.5,.85,-.4,'#b0a18b',true);boat.position.set(x,18.6,z);root.add(boat);for(const dz of [-2.7,2.7]){beam(root,[side*W*.44,17.9,z+dz],[side*W*.44,20.5,z+dz],.065,davits);beam(root,[side*W*.44,20.5,z+dz],[x,20.5,z+dz],.06,davits);beam(root,[x,20.5,z+dz],[x,19.3,z+dz],.025,davits);}}}
 for(let i=0;i<(titanic?10:6);i++){const z=-L*.27+i*L*.055;mesh(root,new THREE.CylinderGeometry(.6,.6,2.5,12),mat('#b5aa8e'),[W*.18,18.6,z]);const vent=mesh(root,new THREE.SphereGeometry(.9,12,8),mat('#b5aa8e'),[W*.18,19.8,z]);vent.scale.set(1,.7,1);}
 for(const z of [-L*.41,L*.42]){root.add(recipe('raised-deck',[box('raised-forecastle',[W*.65,1.2,L*.08],[0,7.9,z],'#cfcbc0'),box('raised-deck-top',[W*.66,.18,L*.081],[0,8.6,z],'#aa9272')]));}
 const line=mesh(root,new THREE.BoxGeometry(W*.98,.15,L*.69),mat('#c8a358'),[0,7,-L*.015]);line.name='sheer-line';
 root.userData.sample=()=>{};return root;
}
