import {createArchPreview} from './arch-preview.js';
import {baseTransform,lowerCimbra,resolveTarget,smoothStep} from './behavior-utils.js';

export function apply(context,time,params={}){
 const centering=resolveTarget(context,params,'centering','cimbra_arco');
 const lower=smoothStep(time,0,params.lowerDuration??0.72),withdraw=smoothStep(time,params.withdrawStart??0.42,params.withdrawDuration??0.98);
 lowerCimbra(centering,lower,0,params.lowerAmount??0.18,0);
 if(centering){
  const base=baseTransform(centering);
  centering.position.copy(base.position);centering.rotation.copy(base.rotation);centering.scale.copy(base.scale);
  centering.position.x+=(params.withdrawX??-3.6)*withdraw;
  centering.position.z+=(params.withdrawZ??0)*withdraw;
 }
}
export function create(){return createArchPreview(apply,'centering');}
