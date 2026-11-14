import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

let photoMap,labelMap,photoAspect=4.92/3.64;

export async function prepare(){
  if(photoMap||typeof Image==='undefined')return;
  const image=new Image();
  image.decoding='async';
  image.src=new URL('./media/titanic-survivors-carpathia-2048.jpg',import.meta.url).href;
  await image.decode();
  photoAspect=image.naturalWidth/image.naturalHeight;
  photoMap=new THREE.Texture(image);
  photoMap.colorSpace=THREE.SRGBColorSpace;
  photoMap.anisotropy=8;
  photoMap.needsUpdate=true;
  const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=210;
  const c=canvas.getContext('2d');
  c.fillStyle='#111719';c.fillRect(0,0,canvas.width,canvas.height);
  c.fillStyle='#c7a965';c.fillRect(0,0,9,canvas.height);
  c.fillStyle='#f1e8d4';c.font='700 60px Arial, sans-serif';c.textBaseline='middle';
  c.fillText('SOBREVIVENTES A CAMINHO DO CARPATHIA',40,73);
  c.fillStyle='#c1cbc9';c.font='600 38px Arial, sans-serif';
  c.fillText('BAIN NEWS SERVICE  ·  LIBRARY OF CONGRESS  ·  ABRIL DE 1912',40,158);
  labelMap=new THREE.CanvasTexture(canvas);labelMap.colorSpace=THREE.SRGBColorSpace;labelMap.anisotropy=8;
}

export function create({params={}}={}){
  const root=new THREE.Group();root.name='archival-photo-motion-inset';
  root.visible=false;
  const card=new THREE.Group();card.name='archival-photo-card';root.add(card);
  const trimMaterial=new THREE.MeshBasicMaterial({color:'#b99552',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  const frameMaterial=new THREE.MeshBasicMaterial({color:'#121819',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  const photoMaterial=new THREE.MeshBasicMaterial({map:photoMap||null,color:photoMap?'#ffffff':'#d7d1c4',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  const labelMaterial=new THREE.MeshBasicMaterial({map:labelMap||null,color:labelMap?'#ffffff':'#171d1f',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  const shadowMaterial=new THREE.MeshBasicMaterial({color:'#020607',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false});
  const frameWidth=5.3,photoWidth=4.8,photoHeight=photoWidth/photoAspect,creditHeight=.44,gap=.13,frameHeight=photoHeight+1.07;
  const innerY=(frameHeight-photoHeight-gap-creditHeight)/2;
  const trim=new THREE.Mesh(new RoundedBoxGeometry(frameWidth+.09,frameHeight+.09,.075,4,.06),trimMaterial);trim.position.z=-.055;trim.renderOrder=1899;card.add(trim);
  const frame=new THREE.Mesh(new RoundedBoxGeometry(frameWidth,frameHeight,.12,4,.07),frameMaterial);frame.position.z=0;frame.renderOrder=1900;card.add(frame);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(frameWidth+.32,frameHeight+.32),shadowMaterial);shadow.position.set(.035,-.04,-.11);shadow.renderOrder=1898;card.add(shadow);
  const photo=new THREE.Mesh(new THREE.PlaneGeometry(photoWidth,photoHeight),photoMaterial);photo.position.set(0,frameHeight/2-innerY-photoHeight/2,.068);photo.name='archival-photo';photo.renderOrder=1901;card.add(photo);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(photoWidth,creditHeight),labelMaterial);label.position.set(0,-frameHeight/2+innerY+creditHeight/2,.071);label.name='archival-credit-strip';label.renderOrder=1902;card.add(label);
  const enterAt=Number.isFinite(params.enterAt)?params.enterAt:.35;
  const exitAt=Number.isFinite(params.exitAt)?params.exitAt:3.7;
  const fadeInDuration=THREE.MathUtils.clamp(Number(params.fadeInDuration)||.42,.08,.7);
  const fadeOutDuration=THREE.MathUtils.clamp(Number(params.fadeOutDuration)||.34,.08,.7);
  const templates={slide:{x:.24,y:0,scale:.94,rotate:-.025},rise:{x:0,y:-.2,scale:.94,rotate:.012},focus:{x:0,y:0,scale:.84,rotate:0},reveal:{x:0,y:-.06,scale:.9,rotate:-.018},document:{x:0,y:0,scale:.94,rotate:-.035},'evidence-board':{x:0,y:-.035,scale:.92,rotate:0}};
  const motion=templates[params.template||'slide']||templates.slide;
  root.userData.sample=(time,global,{camera}={})=>{
    if(!camera)return;
    const fadeIn=THREE.MathUtils.clamp((time-enterAt)/fadeInDuration,0,1),fadeOut=THREE.MathUtils.clamp((exitAt+fadeOutDuration-time)/fadeOutDuration,0,1);
    const easedIn=1-Math.pow(1-fadeIn,3),alpha=easedIn*fadeOut;
    root.visible=alpha>.002;
    const forward=camera.getWorldDirection(new THREE.Vector3());
    const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion).normalize();
    const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion).normalize();
    const distance=12.6;
    const viewHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const viewWidth=viewHeight*camera.aspect;
    const widthPercent=THREE.MathUtils.clamp(Number(params.frameWidthPercent)||48,44,52)/100;
    const insetScale=Math.min(viewWidth*widthPercent/frameWidth,viewHeight*.70/frameHeight);
    const x=(1-easedIn)*viewWidth*motion.x;
    const y=viewHeight*(.02+motion.y*(1-easedIn));
    root.position.copy(camera.position).addScaledVector(forward,distance).addScaledVector(right,x).addScaledVector(up,y);
    root.quaternion.copy(camera.quaternion);
    const settle=Math.max(0,time-enterAt-fadeInDuration);
    root.scale.setScalar(insetScale*(motion.scale+(1-motion.scale)*easedIn)*(1+Math.min(.012,settle*.003)));
    card.rotation.z=motion.rotate*(1-easedIn)+Math.sin(settle*.7)*.0006;
    const photoZoom=1+Math.min(.012,settle*.003);photo.scale.set(photoZoom,photoZoom,1);
    root.traverse(object=>{
      const attached=Array.isArray(object.material)?object.material:object.material?[object.material]:[];
      for(const material of attached)material.opacity=alpha;
    });
  };
  root.userData.sample(0,0,{});
  return root;
}
