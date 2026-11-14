import * as THREE from 'three';
import { createArchResource } from './arch-resource.js';
import { makeArchParts } from './arch-layout.js';

const recipe = { id: 'arco_alvenaria', parts: makeArchParts() };

function makeBrickMaps() {
  const size = 96;
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = value - Math.floor(value);
      const tone = 228 + Math.round(noise * 27);
      const relief = 80 + Math.round(noise * 96);
      for (const data of [colorData, bumpData]) data[i + 3] = 255;
      colorData[i] = colorData[i + 1] = colorData[i + 2] = tone;
      bumpData[i] = bumpData[i + 1] = bumpData[i + 2] = relief;
    }
  }
  const color = new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(3, 3);
  color.needsUpdate = true;
  const bump = new THREE.DataTexture(bumpData, size, size, THREE.RGBAFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(3, 3);
  bump.needsUpdate = true;
  return { color, bump };
}

function addBrickSurface(root) {
  const maps = makeBrickMaps();
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.getAttribute('position');
    const uvs = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      uvs[i * 2] = positions.getX(i) / 4.76 + 0.5;
      uvs[i * 2 + 1] = positions.getY(i) / 4.76 + 0.5;
    }
    mesh.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const material = mesh.material.clone();
    material.map = maps.color.clone();
    material.bumpMap = maps.bump.clone();
    material.bumpScale = 0.015;
    material.roughness = 0.94;
    material.needsUpdate = true;
    mesh.material = material;
  });
}

export const create = (options) => {
  const root = createArchResource(recipe, options);
  addBrickSurface(root);
  return root;
};
