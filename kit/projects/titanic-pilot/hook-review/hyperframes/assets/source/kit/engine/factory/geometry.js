import * as THREE from 'three';
export function createGeometry(part){const size=part.size||[1,1,1];if(!size.every(n=>Number.isFinite(n)&&n>0))throw new Error('Dimensões precisam ser positivas.');
 switch(part.shape||'box'){
 case 'box':return new THREE.BoxGeometry(...size);
 case 'cylinder':return new THREE.CylinderGeometry(size[0],size[0],size[1],16);
 case 'sphere':return new THREE.SphereGeometry(size[0],20,14);
 case 'pipe':{if(!part.points?.length)throw new Error('Tubo sem percurso.');return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(part.points.map(p=>new THREE.Vector3(...p))),48,size[0],10,false);}
 default:throw new Error(`Forma não suportada: ${part.shape}`);
 }}
