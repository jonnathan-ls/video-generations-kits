import * as THREE from 'three';
// Contrato: metros, chão em y=0, frente +Z, sem dependência do quadro anterior.
export function create({variant='padrao'}={}) {
 const root=new THREE.Group();
 const piece=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#aaa9a3',roughness:.8}));
 piece.position.y=.5;root.add(piece);
 root.userData.sample=t=>{piece.position.y=.5+Math.min(1,Math.max(0,t/3))*.15;};
 root.userData.sample(0);return root;
}
