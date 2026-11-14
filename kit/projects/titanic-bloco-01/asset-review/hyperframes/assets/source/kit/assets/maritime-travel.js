import {create as boat} from './period-lifeboat.js';
export function create(){return boat();}
export function apply({target},t,params={}){const base=params.origin||[0,0,0],delta=params.delta||[0,0,15],u=Math.min(1,Math.max(0,t/(params.duration||8)));target.position.set(base[0]+delta[0]*u,base[1]+delta[1]*u,base[2]+delta[2]*u);}
