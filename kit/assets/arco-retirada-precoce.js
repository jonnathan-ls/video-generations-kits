import {createArchPreview} from './arch-preview.js';
import {baseTransform,findPart,lowerCimbra,resolveTarget,smoothStep} from './behavior-utils.js';

export function apply(context,time,params={}){
 const arch=resolveTarget(context,params,'arch','arco_alvenaria');
 const centering=resolveTarget(context,params,'centering','cimbra_arco');
 const lower=smoothStep(time,0.05,0.62),yielding=smoothStep(time,0.9,1.05);lowerCimbra(centering,lower,0,0.22,0);
 const key=findPart(arch,'peca_de_fecho');if(key){const base=baseTransform(key);key.position.copy(base.position);key.rotation.copy(base.rotation);key.scale.copy(base.scale);key.position.y-=0.14*yielding;}
 for(const [name,side] of [['cunha_06',-1],['cunha_08',1]]){
  const block=findPart(arch,name);if(!block)continue;const base=baseTransform(block);
  block.position.copy(base.position);block.rotation.copy(base.rotation);block.scale.copy(base.scale);
  block.position.x+=side*0.045*yielding;block.position.y-=0.025*yielding;block.rotation.z+=side*0.018*yielding;
 }
}
export function create(){return createArchPreview(apply,'arch');}
