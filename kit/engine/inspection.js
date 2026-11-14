import * as THREE from 'three';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
// Inspection-only helpers. None participates in the production scene or asset revision.
export class InspectionControls{
 constructor(viewer){this.viewer=viewer;this.axis='x';this.mode='original';this.opacity=1;this.meshes=[];this.isolate=false;
  this.axes=new THREE.AxesHelper(2);viewer.scene.add(this.axes);this.axes.visible=false;
  this.bounds=new THREE.BoxHelper(new THREE.Group(),'#596ee1');viewer.scene.add(this.bounds);this.bounds.visible=false;
  this.selectionBox=new THREE.BoxHelper(new THREE.Group(),'#a56b15');viewer.scene.add(this.selectionBox);this.selectionBox.visible=false;
  this.planeHelper=new THREE.PlaneHelper(viewer.plane,5,'#d2a23e');viewer.scene.add(this.planeHelper);this.planeHelper.visible=false;
  this.gizmo=new TransformControls(viewer.camera,viewer.renderer.domElement);this.gizmoHelper=this.gizmo.getHelper();viewer.scene.add(this.gizmoHelper);this.gizmo.enabled=false;this.gizmoHelper.visible=false;
  this.gizmo.addEventListener('dragging-changed',e=>{viewer.controls.enabled=!e.value;});this.gizmo.addEventListener('change',()=>viewer.render());
 }
 attach(){this.gizmo.detach();this.meshes=[];this.selected=null;this.viewer.obj.traverse(o=>{if(o.isMesh){const original=o.material;this.meshes.push({mesh:o,original,visible:o.visible,clay:new THREE.MeshStandardMaterial({color:'#d9dde2',roughness:.8}),normal:new THREE.MeshNormalMaterial()});}});this.bounds.setFromObject(this.viewer.obj);this.gizmo.attach(this.viewer.obj);this.apply();}
 setProjection(mode){const v=this.viewer,old=v.camera;if(mode==='orthographic'&&!old.isOrthographicCamera){const d=old.position.distanceTo(v.controls.target),h=d*Math.tan(THREE.MathUtils.degToRad(38/2));v.camera=new THREE.OrthographicCamera(-h*old.aspect,h*old.aspect,h,-h,.02,2000);}else if(mode==='perspective'&&!old.isPerspectiveCamera)v.camera=new THREE.PerspectiveCamera(38,v.host.clientWidth/v.host.clientHeight,.02,2000);else return;
  v.camera.position.copy(old.position);v.camera.quaternion.copy(old.quaternion);v.controls.object=v.camera;this.gizmo.camera=v.camera;v.resize();v.controls.update();
 }
 selectPart(index){this.selected=this.meshes[Number(index)]?.mesh||null;this.apply();this.viewer.render();}
 configure(options={}){Object.assign(this,options);this.axes.visible=!!this.showAxes;this.bounds.visible=!!this.showBounds;this.planeHelper.visible=!!this.showPlane;this.viewer.grid.visible=this.showGrid!==false;
  if(options.projection)this.setProjection(options.projection);
  if(options.gizmoMode){const enabled=options.gizmoMode!=='none';this.gizmo.enabled=enabled;this.gizmoHelper.visible=enabled;if(enabled)this.gizmo.setMode(options.gizmoMode);}
  if(options.space)this.gizmo.setSpace(options.space);
  if(Number.isFinite(options.exposure))this.viewer.renderer.toneMappingExposure=options.exposure;
  this.apply();this.viewer.render();
 }
 apply(){const v=this.viewer;if(!v.obj)return;v.obj.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(v.obj),size=box.getSize(new THREE.Vector3());
  const section=v.effectiveSection??v.section,axis=this.axis||'x';v.plane.normal.set(axis==='x'?-1:0,axis==='y'?-1:0,axis==='z'?-1:0);v.plane.constant=box.min[axis]+size[axis]*section+size[axis]*.01;
  this.planeHelper.size=Math.max(size.x,size.y,size.z,1)*1.2;
  for(const row of this.meshes){const material=this.mode==='clay'?row.clay:this.mode==='normal'?row.normal:row.original;row.mesh.material=material;row.mesh.visible=this.isolate&&this.selected?row.mesh===this.selected:row.visible;for(const m of Array.isArray(material)?material:[material]){m.wireframe=!!v.wire;m.clippingPlanes=section<.999?[v.plane]:[];m.clipShadows=true;m.opacity=this.opacity;m.transparent=this.opacity<1;}}
  if(this.showBounds)this.bounds.setFromObject(v.obj);if(this.selected){this.selectionBox.setFromObject(this.selected);this.selectionBox.visible=true;}else this.selectionBox.visible=false;
 }
 metrics(){let triangles=0;for(const {mesh}of this.meshes)triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position?.count||0)/3;return {meshes:this.meshes.length,triangles:Math.round(triangles),parts:this.meshes.map(({mesh},i)=>({id:i,label:mesh.name||`Peça ${i+1}`}))};}
}
