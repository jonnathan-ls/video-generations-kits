import * as THREE from 'three';
export function create({variant='ceramica'}={}) {
  const root=new THREE.Group(),layers=[];
  const spec=[[.32,'#8e7053'],[.18,'#a0a09a'],[.055,'#4f9ea5'],[.13,'#c6c1b5'],[.035,'#8e8a7b'],[.06,variant==='porcelanato'?'#d8dce0':'#d5b18c']];
  let y=0;for(const [h,color]of spec){const m=new THREE.Mesh(new THREE.BoxGeometry(3.6,h,2.8),new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.y=y+h/2;m.castShadow=m.receiveShadow=true;root.add(m);layers.push([m,m.position.y]);y+=h;}
  root.userData.sample=(t)=>{const u=Math.min(1,Math.max(0,t/3)),e=u*u*(3-2*u);layers.forEach(([m,y],i)=>m.position.y=y+i*.18*e);};return root;
}
