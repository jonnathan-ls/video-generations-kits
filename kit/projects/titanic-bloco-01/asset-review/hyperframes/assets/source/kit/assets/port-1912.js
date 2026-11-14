import * as THREE from 'three';
import {mat,mesh,beam,recipe,box} from './maritime-shapes.js';
// Illustrative Edwardian commercial quay; not an archaeological port reconstruction.
export function create(){
 const root=recipe('port-1912',[box('quay-wall',[82,6,3000],[-65,1,-70],'#686b67'),box('quay-paving',[82,.24,3000],[-65,4.12,-70],'#a29c8b'),box('quay-cap',[1.2,.4,3000],[-24.2,4.15,-70],'#c0b9a3')]);
root.add(recipe('port-land',[box('land',[1600,6,3000],[-906,1,-70],'#929184')]));
 const iron=mat('#384344'),brick=mat('#805c48'),roof=mat('#555d60'),glass=mat('#526871'),stone=mat('#b5ac95');
 for(let n=0;n<3;n++){
  const z=-165+n*95;const shed=recipe('warehouse-'+n,[box('brick-walls',[32,13,72],[-76,10.6,z],'#805c48')]);root.add(shed);
  const shape=new THREE.Shape();shape.moveTo(-17,0);shape.lineTo(0,8);shape.lineTo(17,0);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:74,bevelEnabled:false});mesh(root,g,roof,[-76,17.1,z-37]);
  for(let j=0;j<9;j++){const zz=z-32+j*8;mesh(root,new THREE.BoxGeometry(.25,3,2.6),glass,[-59.85,13,zz]);mesh(root,new THREE.BoxGeometry(.4,4,.3),stone,[-59.7,13,zz-1.5]);}
  for(let j=0;j<3;j++)mesh(root,new THREE.BoxGeometry(.35,6,8),mat('#3e413d'),[-59.7,7.3,z-24+j*24]);
 }
 for(let i=0;i<3;i++){
  const z=-145+i*100;mesh(root,new THREE.CylinderGeometry(2.8,3.4,1.4,16),iron,[-37,4.9,z]);
  for(const dx of [-1.6,1.6])for(const dz of [-1.6,1.6])beam(root,[-37+dx,5.5,z+dz],[-37+dx*.4,23,z+dz*.4],.18,iron);
  beam(root,[-37,22,z],[-17,32,z],.28,iron);beam(root,[-37,25,z],[-17,32,z],.12,iron);beam(root,[-37,22,z],[-43,28,z],.22,iron);beam(root,[-43,28,z],[-17,32,z],.075,iron);beam(root,[-17,32,z],[-17,13,z],.035,iron);mesh(root,new THREE.TorusGeometry(.35,.09,6,12,Math.PI*1.5),iron,[-17,12.8,z]);
 }
 for(let z=-230;z<100;z+=18){mesh(root,new THREE.CylinderGeometry(.35,.45,.7,12),iron,[-25.8,4.7,z]);mesh(root,new THREE.CylinderGeometry(.55,.55,.16,12),iron,[-25.8,5.1,z]);}
 // Low-rise port district recedes behind the working quay; no invented exact street plan.
 for(let row=0;row<3;row++)for(let i=0;i<9;i++){
  const x=-145-row*85,z=-355+i*80+row*13,w=27+(i%3)*6,h=9+(i%4)*3,l=48+(i%2)*12;
  root.add(recipe('port-district-'+row+'-'+i,[box('walls',[w,h,l],[x,4.24+h/2,z],['#867263','#8e8170','#776d60'][i%3])]));
  const shape=new THREE.Shape();shape.moveTo(-w/2-1,0);shape.lineTo(0,4.5);shape.lineTo(w/2+1,0);shape.closePath();mesh(root,new THREE.ExtrudeGeometry(shape,{depth:l+2,bevelEnabled:false}),roof,[x,4.24+h,z-l/2-1]);
 }
 for(const x of [-111,-115])beam(root,[x,4.35,-650],[x,4.35,500],.045,iron);
 // Masonry joints run along the waterline rather than a featureless slab.
 for(let y=-1;y<4;y+=.75)beam(root,[-23.98,y,-245],[-23.98,y,105],.025,mat('#494e4a'));
 return root;
}
