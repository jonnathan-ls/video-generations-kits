import * as THREE from 'three';

function arrowLayer(color,{outline=false}={}){
 const layer=new THREE.Group();
 const material=new THREE.MeshStandardMaterial({color,roughness:outline?0.72:0.42,metalness:0,emissive:outline?'#000000':color,emissiveIntensity:outline?0:0.34});
 const shaftRadius=outline?0.085:0.057,shaftHeight=outline?0.39:0.36;
 const headRadius=outline?0.18:0.145,headHeight=outline?0.27:0.23;
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(shaftRadius,shaftRadius,shaftHeight,16),material);
 const tip=new THREE.Mesh(new THREE.ConeGeometry(headRadius,headHeight,16),material);
 shaft.position.y=shaftHeight/2;tip.position.y=shaftHeight+headHeight/2-0.025;layer.add(shaft,tip);return layer;
}
function arrowMesh(color){
 const root=new THREE.Group(),outline=arrowLayer('#202b31',{outline:true}),accent=arrowLayer(color);
 outline.position.z=-0.018;accent.position.z=0.025;root.add(outline,accent);
 root.traverse(object=>{if(object.isMesh)object.frustumCulled=false;});return root;
}
export function arrowOverlay(target,name,specs,color){
 let overlay=target.getObjectByName(name);
 if(overlay)return overlay;
 overlay=new THREE.Group();overlay.name=name;
 specs.forEach((spec,index)=>{
  const arrow=arrowMesh(spec.color||color),direction=new THREE.Vector3(...spec.direction).normalize();
  arrow.position.fromArray(spec.position);arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);arrow.visible=false;arrow.userData.basePosition=arrow.position.clone();arrow.userData.direction=direction;arrow.userData.sequence=spec.sequence??index;arrow.userData.sequenceIndex=index;
  overlay.add(arrow);
 });
 target.add(overlay);return overlay;
}
export function revealArrows(overlay,time,delay=0.2,interval=0.3){
 const sequences=[...new Set(overlay.children.map((arrow,index)=>arrow.userData.sequence??index))].sort((a,b)=>a-b);
 overlay.children.forEach((arrow,index)=>{
  const sequence=arrow.userData.sequence??index,start=delay+interval*sequences.indexOf(sequence),progress=Math.min(1,Math.max(0,(time-start)/0.18));
  arrow.visible=time>=start;const eased=progress*progress*(3-2*progress);
  arrow.position.copy(arrow.userData.basePosition).addScaledVector(arrow.userData.direction,-0.16*(1-eased));
  arrow.scale.setScalar(1.08*(0.42+0.58*eased));
 });
}
