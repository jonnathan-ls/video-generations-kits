import * as THREE from 'three';
export function create({variant='fria'}={}) {
  const root=new THREE.Group();
  const box=(w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.78}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;};
  box(3.6,.16,1.3,0,.08,0,'#b3b3af');
  box(3.6,2.8,.12,0,1.56,-.22,'#dfd9d0');
  const pipe=new THREE.Group();root.add(pipe);
  const pts=[[-1.15,.25,0],[-1.15,1.6,0],[.65,1.6,0],[.65,2.55,0]].map(p=>new THREE.Vector3(...p));
  const curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',.05);
  pipe.add(new THREE.Mesh(new THREE.TubeGeometry(curve,56,.065,10,false),new THREE.MeshStandardMaterial({color:variant==='quente'?'#cc5b42':'#247fbb',roughness:.5})));
  const particles=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.042,8,6),new THREE.MeshBasicMaterial({color:'#bdeaff'}));root.add(m);particles.push(m);}
  // Fileiras abertas deixam o mecanismo visível mesmo sem clipping.
  for(let row=0;row<9;row++)for(let col=0;col<8;col++){
    const x=-1.58+col*.45,y=.18+row*.3;
    if(x>-.5&&x<1.05&&y>1&&y<2.2)continue;
    box(.43,.28,.16,x,y+.14,.23,'#b66a4e');
  }
  root.userData.sample=(t)=>{for(let i=0;i<particles.length;i++)particles[i].position.copy(curve.getPoint((t*.18+i/particles.length)%1));};
  root.userData.sample(0);return root;
}
