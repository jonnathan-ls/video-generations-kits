import * as THREE from 'three';
export function create(){const r=new THREE.Group();for(let i=0;i<20;i++){const h=.1+.4*Math.abs(Math.sin(i*1.7));const m=new THREE.Mesh(new THREE.BoxGeometry(.04,h,.04),new THREE.MeshStandardMaterial({color:'#c6a764'}));m.position.set((i-10)*.06,h/2,0);r.add(m);}return r;}
