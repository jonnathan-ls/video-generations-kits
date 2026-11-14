import {recipe,box} from './maritime-shapes.js';
export function create(){return recipe('sound-preview',[box('sound-wave',[2,.25,.3],[0,.2,0],'#6b9294')]);}
export const soundContract={source:'local-deterministic-noise',role:'quiet-calm-sea',duration:54};
