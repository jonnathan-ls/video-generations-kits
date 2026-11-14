import {create as ship} from './historical-liners.js';
export function create(){return ship({variant:'carpathia'});}
export function apply({camera},t,params={}){const a=params.from||[30,20,50],b=params.to||[20,15,40],target=params.target||[0,10,0],u=Math.min(1,t/(params.duration||6));camera.position.set(...a.map((v,i)=>v+(b[i]-v)*u));camera.lookAt(...target);}
