import * as THREE from 'three';
import { create as lifeboat } from './period-lifeboat.js';
import { mesh } from './maritime-shapes.js';

export function create({ variant = 'seats' } = {}) {
  const departure = variant === 'empty-spaces';
  const root = new THREE.Group();
  root.name = 'lifeboat-capacity-evidence';
  const boat = lifeboat({ variant: 'occupied' });
  boat.name = 'capacity-boat';
  root.add(boat);

  const boatBody = boat.getObjectByName('lifeboat-body');
  const seating = boat.userData.seating;
  const highlightedRows = departure ? seating.vacantBenches : seating.benchZ.map((_, index) => index);
  const evidence = new THREE.Group();
  evidence.name = departure ? 'unoccupied-bench-evidence' : 'available-seat-rows';
  boatBody.add(evidence);

  const trim = new THREE.MeshPhysicalMaterial({
    color: departure ? '#efbd67' : '#c6ad7c',
    emissive: departure ? '#a56821' : '#51432d',
    emissiveIntensity: departure ? 0.34 : 0.10,
    roughness: 0.38,
    metalness: 0.20,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25
  });
  for (const index of highlightedRows) {
    const z = seating.benchZ[index];
    const span = Math.max(0.55, seating.benchSpans[index] - 0.18);
    const marker = mesh(
      evidence,
      new THREE.BoxGeometry(span, 0.018, 0.045),
      trim,
      [0, seating.benchTopY + 0.012, z],
      departure ? `vacant-thwart-${index}` : `seat-row-${index}`
    );
    marker.castShadow = false;
  }

  root.userData.evidence = {
    variant: departure ? 'empty-spaces' : 'seats',
    schematic: true,
    highlightedBenches: [...highlightedRows]
  };
  root.userData.sample = (time = 0) => boat.userData.sample?.(time);
  root.userData.sample(0);
  return root;
}
