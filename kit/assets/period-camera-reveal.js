import * as THREE from 'three';import {create as room} from './period-radio-room.js';
export function create(){return room();}
export function apply({camera},t,p={}){if(!p.from)return;const u=THREE.MathUtils.smoothstep(t,0,p.duration||4);camera.position.fromArray(p.from).lerp(new THREE.Vector3(...(p.to||p.from)),u);camera.lookAt(new THREE.Vector3(...(p.target||[0,1,0])));}
