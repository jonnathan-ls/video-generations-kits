import * as THREE from 'three';
export const PALETTE={concrete:'#b3b3af',plaster:'#dfd9d0',brick:'#b66a4e',water:'#247fbb',metal:'#7f8b94',wood:'#876849',rubber:'#30363b'};
export function createMaterial(spec={}){return new THREE.MeshStandardMaterial({color:spec.color||PALETTE[spec.surface]||PALETTE.concrete,roughness:spec.roughness??.72,metalness:spec.metalness??(spec.surface==='metal'?.45:0)});}
