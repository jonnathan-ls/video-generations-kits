import {create as atlas} from './atlas-relief.js';
export function create(){return atlas();}
export function apply({target},t,params={}){const u=Math.min(1,Math.max(0,t/(params.duration||6)));target.rotation.y=-.12*(1-u);}
