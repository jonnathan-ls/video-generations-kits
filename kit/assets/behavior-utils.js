import * as THREE from 'three';

export const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
export const smoothStep=(time,start=0,duration=3)=>{const u=clamp((time-start)/duration);return u*u*(3-2*u);};
const transforms=new WeakMap();
export function baseTransform(object){
 if(!transforms.has(object))transforms.set(object,{position:object.position.clone(),rotation:object.rotation.clone(),scale:object.scale.clone()});
 return transforms.get(object);
}
export function findPart(root,name){return root?.getObjectByName(name)||null;}
export function resolveTarget(context,params,key,fallback){
 const id=params?.[key]||fallback;
 return (id&&context.targets?.get(id))||context.target||null;
}
export function lowerCimbra(root,lowerProgress,withdrawProgress=0,amount=0.18,withdraw=0){
 if(!root)return;
 const rootBase=baseTransform(root);root.position.copy(rootBase.position);root.rotation.copy(rootBase.rotation);root.scale.copy(rootBase.scale);root.position.z+=withdraw*withdrawProgress;
 root.traverse(object=>{
  if(!object.isMesh||object===root)return;
  const base=baseTransform(object);object.position.copy(base.position);object.rotation.copy(base.rotation);object.scale.copy(base.scale);
  if(object.name.startsWith('costela_'))object.position.y-=amount*lowerProgress;
  else if(object.name.startsWith('travessa_'))object.position.y-=amount*0.5*lowerProgress;
  else if(object.name.startsWith('escora_')){
   object.geometry.computeBoundingBox();const height=object.geometry.boundingBox.max.y-object.geometry.boundingBox.min.y;
   const reduction=Math.min(height*0.8,amount*lowerProgress);
   object.scale.y=base.scale.y*(height-reduction)/height;object.position.y-=reduction*0.5;
  }
 });
}
