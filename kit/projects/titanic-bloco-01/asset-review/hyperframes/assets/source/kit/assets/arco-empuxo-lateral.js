import {arrowOverlay,revealArrows} from './arrow-visuals.js';
import {createArchPreview} from './arch-preview.js';
import {resolveTarget} from './behavior-utils.js';

const specs=[
 {position:[-2.23,2.38,0.38],direction:[-1,0,0],color:'#e45b49',sequence:0},
 {position:[2.23,2.38,0.38],direction:[1,0,0],color:'#e45b49',sequence:0},
 {position:[-2.67,1.94,0.42],direction:[1,0,0],color:'#28a99b',sequence:1},
 {position:[2.67,1.94,0.42],direction:[-1,0,0],color:'#28a99b',sequence:1}
];
export function apply(context,time,params={}){
 const arch=resolveTarget(context,params,'arch','arco_alvenaria');if(!arch)return;
 const reactionOnly=params.mode==='reaction-only';
 const activeSpecs=reactionOnly?specs.filter(spec=>spec.sequence===1).map((spec,index)=>({...spec,sequence:index})):specs;
 const delay=reactionOnly?0.04:0.08,interval=reactionOnly?0.18:0.36;
 const overlay=arrowOverlay(arch,reactionOnly?'reacao_resistente_apoios':'empuxo_e_reacao',activeSpecs,'#e45b49');
 revealArrows(overlay,time,delay,interval);
 if(reactionOnly)overlay.children.forEach((arrow,index)=>{
  if(!arrow.visible)return;
  const local=Math.max(0,time-delay-interval*index),pulse=1+0.055*Math.sin(local*7.5)*Math.exp(-local*1.4);
  arrow.scale.multiplyScalar(pulse);
 });
}
export function create(){return createArchPreview(apply,'arch');}
