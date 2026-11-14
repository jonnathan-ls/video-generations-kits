import {createArchPreview} from './arch-preview.js';
import {baseTransform,findPart,resolveTarget,smoothStep} from './behavior-utils.js';

export function apply(context,time,params={}){
 const arch=resolveTarget(context,params,'arch','arco_alvenaria');
 const supports=resolveTarget(context,params,'supports','apoios_arco');
 const supportMove=smoothStep(time,0,0.58),jointOpen=smoothStep(time,0.65,0.72),right=findPart(supports,'encontro_direito');
 if(right){const base=baseTransform(right);right.position.copy(base.position);right.rotation.copy(base.rotation);right.scale.copy(base.scale);right.position.x+=0.22*supportMove;}
 for(const [name,distance,angle]of[['cunha_01',0.10,0.045],['cunha_02',0.035,0.018]]){
  const block=findPart(arch,name);if(!block)continue;const base=baseTransform(block);
  block.position.copy(base.position);block.rotation.copy(base.rotation);block.scale.copy(base.scale);
  block.position.x+=distance*jointOpen;block.rotation.z+=angle*jointOpen;
 }
}
export function create(){return createArchPreview(apply,'arch');}
