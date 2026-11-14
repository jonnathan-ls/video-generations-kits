import {create as atlas} from './atlas-relief.js';
export function create(){return atlas();}
export const overlayContract={implementation:'HTML timed overlay',zone:'title-safe',maxSimultaneous:1};
