import {createArchPreview} from './arch-preview.js';
import {baseTransform,findPart,resolveTarget,smoothStep} from './behavior-utils.js';

export function apply(context,time,params={}){
 const arch=resolveTarget(context,params,'arch','arco_alvenaria');if(!arch)return;
 const key=findPart(arch,'peca_de_fecho');if(!key)return;
 const base=baseTransform(key),progress=smoothStep(time,0,0.95);
 key.position.copy(base.position);key.rotation.copy(base.rotation);key.scale.copy(base.scale);
 key.position.y+=0.62*(1-progress);key.position.z+=0.035*(1-progress);
}
export function create(){return createArchPreview(apply,'arch');}
