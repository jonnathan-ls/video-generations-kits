import {arrowOverlay,revealArrows} from './arrow-visuals.js';
import {createArchPreview} from './arch-preview.js';
import {resolveTarget} from './behavior-utils.js';

const specs=[];
for(const angle of [24,49,74]){
 const radians=angle*Math.PI/180,point=(r)=>[r*Math.cos(radians),2.15+r*Math.sin(radians),0.355];
 specs.push({position:point(2.10),direction:[Math.sin(radians),-Math.cos(radians),0]});
 specs.push({position:[-point(2.10)[0],point(2.10)[1],0.355],direction:[-Math.sin(radians),-Math.cos(radians),0]});
}
export function apply(context,time,params={}){
 const arch=resolveTarget(context,params,'arch','arco_alvenaria');if(!arch)return;
 revealArrows(arrowOverlay(arch,'trajeto_compressivo',specs,'#f2b52b'),time,0.12,0.16);
}
export function create(){return createArchPreview(apply,'arch');}
