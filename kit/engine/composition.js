import * as THREE from 'three';
import {makeScenery,updateScenery,setProgress,makePreset,playClip} from '../../kit-video-3d/assets/index.js';
import {smooth} from './motion.js';
import {isBehavior,applyBehavior,sampleResource} from './behaviors.js';
import {applyShotMotion,captureMotionBases} from './shot-motion.js';

// Seek-only renderer. Build one shot at a time so feature-length timelines do
// not keep every ship, room and passenger rig resident in GPU memory.
export async function mountComposition({canvas,project,registry,loadCustom}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 if(project.renderLook==='cinematic-pbr'){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;}
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.setSize(project.width,project.height,false);renderer.setPixelRatio(1);renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#bbd6e7');
 scene.add(new THREE.HemisphereLight('#ffffff','#847e69',2.8));
 const sun=new THREE.DirectionalLight('#fff0d4',3);sun.position.set(8,14,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#bdc7b1',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;scene.add(ground);
 const camera=new THREE.PerspectiveCamera(38,project.width/project.height,.02,2000),lookup=new Map(registry.map(a=>[a.id,a])),moduleCache=new Map();
 for(const def of registry){if(!def.module||moduleCache.has(def.module))continue;const module=await loadCustom(def.module);if(module.prepare)await module.prepare();moduleCache.set(def.module,module);}
 function disposeStage(stage){if(!stage)return;stage.group.removeFromParent();stage.group.traverse(object=>{object.geometry?.dispose?.();for(const material of Array.isArray(object.material)?object.material:object.material?[object.material]:[])material.dispose?.();});}
 function makeStage(shot){const group=new THREE.Group(),items=[],behaviors=[],materials=[],targets=new Map();scene.add(group);
  // The shared ground is useful for land sets but can show through the
  // animated ocean at wave troughs, creating pale slabs under ships.
  ground.visible=!(shot.assets||[]).some(asset=>['mar_cinematico','atlantico_noturno'].includes(asset.id));
  for(const use of shot.assets){const def=lookup.get(use.id);if(!def)throw new Error(`Asset não registrado: ${use.id}`);if(!['object','scene','character'].includes(def.kind)&&!def.module)continue;
   const module=def.module?moduleCache.get(def.module):null;if(module&&isBehavior(def,module)){behaviors.push({module,def,use});continue;}if(def.kind==='material'&&module&&typeof module.createMaterial==='function'){materials.push({module,def,use});continue;}
   let object,character=null;if(def.kind==='character'&&!module){character=makePreset(def.preset||'construtor');object=character.root;}else if(def.source==='legacy')object=makeScenery(def.id,use.variant?{variant:use.variant}:{});else if(module?.create)object=module.create({variant:use.variant||def.variants?.[0],params:use.params||{}});else continue;
   object.position.fromArray(use.position||[0,0,0]);object.rotation.y=(use.rotation||0)*Math.PI/180;
   if(Array.isArray(use.scale)){
    if(use.scale.length!==3||!use.scale.every(Number.isFinite))throw new Error(`Escala vetorial inválida no asset ${use.id}.`);
    object.scale.fromArray(use.scale);
   }else object.scale.setScalar(Number.isFinite(use.scale)?use.scale:1);
   object.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material?.clone?.()||o.material;}});group.add(object);items.push({object,character,use,overlay:def.kind==='overlay'});targets.set(use.instanceId||use.id,object);
  }
  for(const {module,use}of materials){const target=targets.get(use.target);if(!target)throw new Error(`Alvo de material não encontrado: ${use.target}`);target.traverse(o=>{if(o.isMesh)o.material=module.createMaterial(use.params||{});});}
  captureMotionBases(shot,targets);return {shot,group,items,behaviors,targets};
 }
 let activeIndex=-1,active=null; const cameraTarget=new THREE.Vector3();
 function sceneIndexAt(t){let lo=0,hi=project.scenes.length-1;while(lo<=hi){const mid=(lo+hi)>>1,s=project.scenes[mid];if(t<s.start)hi=mid-1;else if(t>=s.start+s.duration)lo=mid+1;else return mid;}return t===project.duration?project.scenes.length-1:-1;}
 function renderAt(t){t=Math.min(project.duration,Math.max(0,t));const index=sceneIndexAt(t);if(index!==activeIndex){disposeStage(active);active=index>=0?makeStage(project.scenes[index]):null;activeIndex=index;}
  if(!active){ground.visible=true;renderer.render(scene,camera);return;}
  const {shot,items,group,behaviors,targets}=active,sourceDuration=shot.sourceDuration??shot.duration,local=Math.max(0,t-shot.start+(shot.sourceLocalOffset||0)),u=smooth(local/sourceDuration);group.updateMatrixWorld(true);
  for(const {object,character,use,overlay}of items){if(overlay)continue;if(character)playClip(character,use.clip||'talk',local);else{updateScenery(object,local);if(object.userData.setProgress)setProgress(object,local/sourceDuration);sampleResource(object,use,local,t+(project.timelineOffset||0));}}
  const cameraShots=Array.isArray(shot.camera?.shots)?shot.camera.shots.filter(c=>Number.isFinite(c.start)&&c.start>=0).sort((a,b)=>a.start-b.start):[];
  let cameraPose=shot.camera||{},cameraPoseOffset=local;
  for(const cue of cameraShots){if(cue.start>local)break;cameraPose=cue;cameraPoseOffset=local-cue.start;}
  camera.fov=cameraPose.fov||shot.camera?.fov||38;camera.updateProjectionMatrix();renderer.toneMappingExposure=shot.render?.exposure??project.renderOptions?.exposure??1.05;
  let center=new THREE.Vector3(),size=new THREE.Vector3(1,1,1);
  if(!shot.camera?.from){const box=new THREE.Box3().setFromObject(group);size=box.getSize(size);center=box.getCenter(center);}
  const d=Math.max(size.x/camera.aspect,size.y,size.z,1)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*1.35;
  const from=cameraPose.from||[d*.62,center.y+d*.42,d*.92],to=cameraPose.to||from;
  const poseDuration=cameraPose.duration||Math.max(.15,sourceDuration-(cameraPose.start||0));
  const moveDuration=Math.min(poseDuration,Math.max(.15,Number(cameraPose.moveDuration)||poseDuration)),cameraU=smooth(cameraPoseOffset/moveDuration),fallbackTarget=cameraPose.target||shot.camera?.target||[center.x,center.y,center.z];
  const targetFrom=cameraPose.targetFrom||fallbackTarget,targetTo=cameraPose.targetTo||fallbackTarget;
  camera.position.fromArray(from).lerp(new THREE.Vector3(...to),cameraU);cameraTarget.fromArray(targetFrom).lerp(new THREE.Vector3(...targetTo),cameraU);camera.lookAt(cameraTarget);
  for(const {object,use,overlay}of items)if(overlay)sampleResource(object,use,local,t+(project.timelineOffset||0),{camera,shot});
  group.updateMatrixWorld(true);
  const cut=shot.assets.some(a=>a.id==='revelar_corte');if(cut){const plane=new THREE.Plane(new THREE.Vector3(-1,0,0),size.x*(u-.5));for(const {object}of items)object.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.clippingPlanes=u<.999?[plane]:[];m.clipShadows=true;}});}
  for(const {module,def,use}of behaviors)applyBehavior(module,def,use,{camera,scene,targets},local);
  applyShotMotion(shot,targets,local);
  renderer.render(scene,camera);
 }
 renderAt(0);if(renderer.extensions.has('KHR_parallel_shader_compile'))await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);return {renderAt,renderer,scene,camera,getActiveShot:()=>active?.shot,getCameraTarget:()=>cameraTarget.clone()};
}
