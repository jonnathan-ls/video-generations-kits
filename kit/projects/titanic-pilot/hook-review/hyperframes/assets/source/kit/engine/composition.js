import * as THREE from 'three';
import {makeScenery,updateScenery,setProgress,makePreset,playClip} from '../../kit-video-3d/assets/index.js';
import {smooth} from './motion.js';
import {isBehavior,applyBehavior,sampleResource} from './behaviors.js';
// A shared seek-only renderer. UI playback belongs to the catalog; film state belongs to t.
export async function mountComposition({canvas,project,registry,loadCustom}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setSize(project.width,project.height,false);renderer.setPixelRatio(1);renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#bbd6e7');scene.add(new THREE.HemisphereLight('#ffffff','#847e69',2.8));const sun=new THREE.DirectionalLight('#fff0d4',3);sun.position.set(8,14,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#bdc7b1',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;scene.add(ground);
 const camera=new THREE.PerspectiveCamera(38,project.width/project.height,.02,2000),lookup=new Map(registry.map(a=>[a.id,a])),stages=[];
 for(const shot of project.scenes){const group=new THREE.Group(),items=[],behaviors=[],materials=[],targets=new Map();scene.add(group);
  for(const use of shot.assets){const def=lookup.get(use.id);if(!def)throw new Error(`Asset não registrado: ${use.id}`);if(!['object','scene','character'].includes(def.kind)&&!def.module)continue;
   let module=null;if(def.module){module=await loadCustom(def.module);if(module.prepare)await module.prepare();if(isBehavior(def,module)){behaviors.push({module,def,use});continue;}if(def.kind==='material'&&typeof module.createMaterial==='function'){materials.push({module,def,use});continue;}}
   let object,character=null;if(def.kind==='character'&&!module){character=makePreset(def.preset||'construtor');object=character.root;}else if(def.source==='legacy')object=makeScenery(def.id,use.variant?{variant:use.variant}:{});else object=module.create({variant:use.variant||def.variants[0]});
   object.position.fromArray(use.position||[0,0,0]);object.rotation.y=(use.rotation||0)*Math.PI/180;object.scale.setScalar(use.scale||1);object.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});group.add(object);items.push({object,character,use});targets.set(use.instanceId||use.id,object);
  }
  for(const {module,use}of materials){const target=targets.get(use.target);if(!target)throw new Error(`Alvo de material não encontrado: ${use.target}`);target.traverse(o=>{if(o.isMesh)o.material=module.createMaterial(use.params||{});});}
  group.visible=false;stages.push({shot,group,items,behaviors,targets});
 }
 function renderAt(t){t=Math.min(project.duration,Math.max(0,t));let active=stages.find(({shot})=>t>=shot.start&&t<shot.start+shot.duration);if(!active&&t===project.duration)active=stages.at(-1);
  for(const stage of stages)stage.group.visible=stage===active;
  if(!active){renderer.render(scene,camera);return;}
  const {shot,items,group,behaviors,targets}=active,local=Math.max(0,t-shot.start),u=smooth(local/shot.duration);group.updateMatrixWorld(true);
  for(const {object,character,use}of items){if(character)playClip(character,use.clip||'talk',local);else{updateScenery(object,local);if(object.userData.setProgress)setProgress(object,local/shot.duration);sampleResource(object,use,local,t);}}
  const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const d=Math.max(size.x/camera.aspect,size.y,size.z,1)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.35;
  const from=shot.camera?.from||[d*.62,center.y+d*.42,d*.92],to=shot.camera?.to||from;
  const moveDuration=Math.min(shot.duration,Math.max(0.15,Number(shot.camera?.moveDuration)||shot.duration)),cameraU=smooth(local/moveDuration);
  const fallbackTarget=shot.camera?.target||[center.x,center.y,center.z];
  const targetFrom=shot.camera?.targetFrom||fallbackTarget,targetTo=shot.camera?.targetTo||fallbackTarget;
  camera.position.fromArray(from).lerp(new THREE.Vector3(...to),cameraU);
  camera.lookAt(new THREE.Vector3(...targetFrom).lerp(new THREE.Vector3(...targetTo),cameraU));
  const cut=shot.assets.some(a=>a.id==='revelar_corte');const plane=new THREE.Plane(new THREE.Vector3(-1,0,0),cut?size.x*(u-.5):10000);
  for(const {object}of items)object.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.clippingPlanes=cut&&u<.999?[plane]:[];m.clipShadows=true;}});
  for(const {module,def,use}of behaviors)applyBehavior(module,def,use,{camera,scene,targets},local);
  renderer.render(scene,camera);
 }
 renderAt(0);if(renderer.extensions.has('KHR_parallel_shader_compile'))await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);return {renderAt,renderer};
}
