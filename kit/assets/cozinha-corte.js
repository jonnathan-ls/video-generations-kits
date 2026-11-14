import * as THREE from 'three';
export function create({variant='clara'}={}) {
  const root=new THREE.Group();const box=(w,h,d,x,y,z,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,roughness:.7}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;};
  const wood=variant==='madeira'?'#9f7351':'#dadbd5';
  box(4.8,.16,3.8,0,.08,0,'#b7b6b0');box(4.8,2.8,.13,0,1.56,-1.8,'#e4e2dc');box(.13,2.8,3.8,-2.35,1.56,0,'#d5d8d4');
  for(let i=0;i<5;i++){box(.86,.85,.65,-1.75+i*.88,.58,-1.36,wood);box(.72,.05,.04,-1.75+i*.88,.83,-1.01,'#555c60');}
  box(4.5,.07,.8,0,1.04,-1.32,'#626a70');box(1.12,.04,.55,-.9,1.09,-1.32,'#9aaeb7');
  box(.055,.4,.055,-.9,1.3,-1.6,'#a7b0b4');box(.3,.055,.055,-.78,1.5,-1.6,'#a7b0b4');
  for(let i=0;i<3;i++)box(1.15,.65,.4,-1.3+i*1.3,2.16,-1.5,wood);
  const door=new THREE.Group();door.position.set(-2.16,.15,-.985);root.add(door);const face=new THREE.Mesh(new THREE.BoxGeometry(.86,.85,.045),new THREE.MeshStandardMaterial({color:wood}));face.position.set(.43,.43,0);door.add(face);
  root.userData.sample=t=>{const u=Math.min(1,Math.max(0,t/2));door.rotation.y=-u*u*(3-2*u)*.85;};return root;
}
