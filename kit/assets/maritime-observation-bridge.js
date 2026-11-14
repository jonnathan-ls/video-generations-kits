import * as THREE from 'three';
import { mat, mesh, beam, recipe, box } from './maritime-shapes.js';

function addOpenWingRails(root) {
  const iron = mat('#8c9ca1', { metalness: .42, roughness: .48 });
  const deckHalfWidth = 3.6;
  const deckHalfLength = 3.05;
  const railHeight = 1.12;
  const railLines = [.46, .83, railHeight];

  for (const x of [-deckHalfWidth, deckHalfWidth]) {
    for (let z = -deckHalfLength; z <= deckHalfLength + .001; z += 1.02) {
      beam(root, [x, .02, z], [x, railHeight, z], .025, iron);
    }
    for (const y of railLines) beam(root, [x, y, -deckHalfLength], [x, y, deckHalfLength], .029, iron);
  }

  for (const z of [-deckHalfLength, deckHalfLength]) {
    for (let x = -deckHalfWidth; x <= deckHalfWidth + .001; x += 1.2) {
      beam(root, [x, .02, z], [x, railHeight, z], .025, iron);
    }
    for (const y of railLines) beam(root, [-deckHalfWidth, y, z], [deckHalfWidth, y, z], .029, iron);
  }

  // Warm deck lamps are physically attached to the aft rail posts; the moon
  // remains the cool key light on the open ocean beyond the guardrail.
  for (const x of [-3.05, 3.05]) {
    const lamp = new THREE.Group();
    lamp.position.set(x, 1.18, -2.72);
    root.add(lamp);
    mesh(lamp, new THREE.CylinderGeometry(.105, .13, .14, 16), mat('#80613d', { metalness: .56, roughness: .38 }), [0, 0, 0], 'deck-lantern-collar');
    mesh(lamp, new THREE.SphereGeometry(.105, 16, 10), new THREE.MeshStandardMaterial({ color: '#ffd6a0', emissive: '#e08b37', emissiveIntensity: 1.05, roughness: .34 }), [0, .16, 0], 'deck-lantern-glass');
    const glow = new THREE.PointLight('#ffbd77', .52, 4.5, 2);
    glow.position.set(0, .16, 0);
    lamp.add(glow);
  }
}

export function create({ params = {} } = {}) {
  const openWing = params.openWing === true;
  const halfWidth = openWing ? 3.7 : 2.5;
  const halfLength = openWing ? 3.25 : 2;
  const parts = [box('bridge-deck', [halfWidth * 2, .18, halfLength * 2], [0, -.1, 0], '#806b50')];

  if (!openWing) {
    parts.push(
      box('port-cabin-wall', [.2, 2.7, 4], [-2.6, 1.35, -.6], '#7d8c91'),
      box('port-window-frame', [.08, 1.2, 1.4], [-2.47, 1.9, -.7], '#24363c')
    );
  }

  const root = recipe(openWing ? 'observation-bridge-open-wing' : 'observation-bridge', parts);
  const metal = mat('#8c9ca1', { metalness: .34, roughness: .5 });

  if (openWing) {
    addOpenWingRails(root);
    if (params.crewLight === true) {
      // Task lantern mounted on the forward rail, positioned to motivate the handoff light.
      const taskLamp = new THREE.Group();
      taskLamp.position.set(0, 1.18, 2.72);
      root.add(taskLamp);
      mesh(taskLamp, new THREE.CylinderGeometry(.095, .12, .14, 14), mat('#80613d', { metalness: .56, roughness: .38 }), [0, 0, 0], 'crew-task-lantern-collar');
      mesh(taskLamp, new THREE.SphereGeometry(.095, 14, 9), new THREE.MeshStandardMaterial({ color: '#ffe0b0', emissive: '#e08b37', emissiveIntensity: 1.15, roughness: .34 }), [0, .16, 0], 'crew-task-lantern-glass');
      const taskGlow = new THREE.PointLight('#ffd09a', 3.2, 8.4, 1.8);
      taskGlow.position.set(0, .2, 0);
      taskLamp.add(taskGlow);
    }
    for (let i = 0; i < 38; i++) {
      const z = -3.05 + i * .165;
      beam(root, [-3.5, .005, z], [3.5, .005, z], .004, mat(i % 2 ? '#3d382e' : '#514736'));
    }
  } else {
    for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) beam(root, [x, 0, 1.8], [x, 1.1, 1.8], .025, metal);
    for (const y of [.45, .8, 1.1]) beam(root, [-2.4, y, 1.8], [2.4, y, 1.8], .025, metal);
    for (let i = 0; i < 22; i++) beam(root, [-2.4, .005, -1.8 + i * .17], [2.4, .005, -1.8 + i * .17], .004, mat('#3d382e'));
    mesh(root, new THREE.BoxGeometry(.08, 2.8, .08), metal, [2.45, 1.3, 1.8]);
    mesh(root, new THREE.BoxGeometry(.03, 1.05, 1.25), new THREE.MeshStandardMaterial({ color: '#34444a', emissive: '#b8814b', emissiveIntensity: .18, roughness: .32, metalness: .12 }), [-2.42, 1.9, -.7]);
    const mullion = mat('#24363c');
    beam(root, [-2.38, 1.35, -.7], [-2.38, 2.45, -.7], .025, mullion);
    beam(root, [-2.38, 1.9, -1.32], [-2.38, 1.9, -.08], .025, mullion);
    const lamp = new THREE.PointLight('#ffce9f', 1.9, 6, 2);
    lamp.position.set(-1.8, 2.2, 1.4);
    root.add(lamp);
  }

  return root;
}
