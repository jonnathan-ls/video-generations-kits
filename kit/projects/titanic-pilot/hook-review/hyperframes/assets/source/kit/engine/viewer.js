import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeScenery,updateScenery,setProgress,makePreset,playClip} from '../../kit-video-3d/assets/index.js';
import {stageState} from './motion.js';
import {InspectionControls} from './inspection.js';
export class AssetViewer{
 constructor(host){
  this.host=host;this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.localClippingEnabled=true;host.append(this.renderer.domElement);
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#eef0f2');this.camera=new THREE.PerspectiveCamera(38,1,.02,2000);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;
  this.scene.add(new THREE.HemisphereLight('#ffffff','#7e8790',2.7));const sun=new THREE.DirectionalLight('#fff2de',3.1);sun.position.set(8,14,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;this.scene.add(sun);this.scene.add(new THREE.DirectionalLight('#c6dcff',.6));
  this.floor=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:'#e2e6e8',roughness:1}));this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-.025;this.floor.receiveShadow=true;this.scene.add(this.floor);
  this.grid=new THREE.GridHelper(30,30,'#bdc6cf','#d1d8de');this.grid.position.y=-.01;this.scene.add(this.grid);
  this.holder=new THREE.Group();this.scene.add(this.holder);this.plane=new THREE.Plane(new THREE.Vector3(-1,0,0),1000);this.scale=1;this.rotation=0;this.section=1;this.time=0;this.clip='talk';this.generation=0;
  this.inspection=new InspectionControls(this);
  this.controls.addEventListener('change',()=>this.render());this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.resize();
 }
 resize(){const r=this.host.getBoundingClientRect();this.renderer.setSize(r.width,r.height);if(this.camera.isPerspectiveCamera)this.camera.aspect=r.width/Math.max(r.height,1);else {const h=(this.camera.top-this.camera.bottom)/2;this.camera.left=-h*r.width/Math.max(r.height,1);this.camera.right=-this.camera.left;}this.camera.updateProjectionMatrix();this.render();}
 async load(asset,variant=''){
  const generation=++this.generation;let obj,character=null;
  if(asset.kind==='character'||asset.clip){character=makePreset(asset.preset||'construtor');obj=character.root;}
  else if(asset.source==='legacy')obj=makeScenery(asset.id,variant?{variant}:{});
  else if(asset.module){const mod=await import(`/kit/assets/${asset.module}`);if(mod.prepare)await mod.prepare();obj=mod.create({variant:variant||asset.variants[0]});}
  else if(asset.factory==='assembly')obj=(await import('/kit/assets/piso-camadas.js')).create();
  else obj=(await import('/kit/assets/parede-hidraulica.js')).create();
  if(generation!==this.generation){this.disposeObject(obj);return false;}
  this.holder.children.forEach(child=>this.disposeObject(child));this.holder.clear();this.asset=asset;this.lastCameraSide=undefined;this.character=character;this.obj=obj;this.variant=variant;this.holder.add(obj);
  obj.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});
  obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj),center=b.getCenter(new THREE.Vector3());obj.position.x-=center.x;obj.position.z-=center.z;obj.position.y-=b.min.y;this.bounds=new THREE.Box3().setFromObject(obj);this.size=this.bounds.getSize(new THREE.Vector3());this.scale=1;this.rotation=0;this.section=1;this.inspection.attach();this.sample(0);this.frame('iso');return true;
 }
 disposeObject(obj){const geometries=new Set(),materials=new Set();obj.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 frame(view='iso'){
  if(!this.obj)return;const h=Math.max(this.size.y,1)*this.scale;const target=new THREE.Vector3(0,h*.42,0);const span=Math.max(this.size.x/(this.host.clientWidth/Math.max(this.host.clientHeight,1)),this.size.y,this.size.z,1)*this.scale;const d=span/(2*Math.tan(THREE.MathUtils.degToRad(38/2)))*1.5;
  const dirs={iso:[1,.72,1.25],front:[0,.15,1],side:[1,.15,0],top:[0,1,.001]};this.camera.position.copy(target).addScaledVector(new THREE.Vector3(...(dirs[view]||dirs.iso)).normalize(),d);this.camera.far=Math.max(2000,d*5);if(this.camera.isOrthographicCamera){const h=span*.75;this.camera.top=h;this.camera.bottom=-h;this.camera.left=-h*this.host.clientWidth/this.host.clientHeight;this.camera.right=-this.camera.left;}this.camera.updateProjectionMatrix();this.controls.target.copy(target);this.controls.update();this.render();
 }
 setTransform({scale=this.scale,rotation=this.rotation,section=this.section,wire=false}={}){this.scale=scale;this.rotation=rotation;this.section=section;this.wire=wire;this.sample(this.time);}
 sample(t){if(!this.obj)return;this.time=t;const a=this.asset,state=stageState(a.factory,t);this.holder.scale.setScalar(this.scale);this.holder.rotation.y=this.rotation*Math.PI/180;
  if(this.character)playClip(this.character,a.clip||this.clip,t);
  else {updateScenery(this.obj,t);if(this.obj.userData.setProgress)setProgress(this.obj,t/6);if(this.obj.userData.sample)this.obj.userData.sample(t);}
  const section=a.factory==='section'?state.section:this.section;this.effectiveSection=section;
  this.plane.constant=((section-.5)*this.size.x+this.size.x*.01)*this.scale;
  this.obj.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.clippingPlanes=section>=.999?[]:[this.plane];m.clipShadows=true;m.wireframe=this.wire||false;}});
  if(a.factory==='cut'&&this.lastCameraSide!==state.cameraSide){this.lastCameraSide=state.cameraSide;this.frame(state.cameraSide?'side':'front');}
  this.inspection.apply();this.renderer.render(this.scene,this.camera);
 }
 render(){this.inspection?.apply();this.renderer.render(this.scene,this.camera);}
 screenshot(){return this.renderer.domElement.toDataURL('image/png');}
}
