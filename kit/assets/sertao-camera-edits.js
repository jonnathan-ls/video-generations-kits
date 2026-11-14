import * as THREE from 'three';

const box = new THREE.BoxGeometry(1, 1, 1);

function create() {
  const root = new THREE.Group();
  root.name = 'camera-editorial-cortes-sertao';
  const camera = new THREE.PerspectiveCamera(38, 9 / 16, 0.1, 1000);
  camera.name = 'camera-de-revisao-9x16';
  root.add(camera);
  const body = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ color: 0x342c28, roughness: 0.72 }));
  body.name = 'corpo-camera-inspecao';
  body.position.set(0, 0.22, 0);
  body.scale.set(0.36, 0.25, 0.22);
  root.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.18, 20), new THREE.MeshStandardMaterial({ color: 0x8a918f, metalness: 0.72, roughness: 0.26 }));
  lens.name = 'lente-camera-inspecao';
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0.39, 0.17);
  root.add(lens);
  root.userData.camera = camera;
  root.userData.sample = () => {};
  return root;
}

const ease = value => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function applyCameraEdit(camera, shots, time, { liftY = 0 } = {}) {
  if (!camera || !Array.isArray(shots) || !shots.length) return;
  const last = shots[shots.length - 1];
  const t = THREE.MathUtils.clamp(Number(time) || 0, 0, last.end);
  let shot = shots.find(row => t >= row.start && t < row.end) || (t >= last.end ? last : shots[0]);
  const normalized = ease((t - shot.start) / Math.max(0.001, shot.end - shot.start));
  const progress = shot.easing === 'snap' ? 1 - (1 - normalized) ** 3 : normalized;
  const mix = (a, b) => THREE.MathUtils.lerp(a, b, progress);
  camera.position.set(
    mix(shot.from[0], shot.to[0]),
    mix(shot.from[1], shot.to[1]) + liftY,
    mix(shot.from[2], shot.to[2]),
  );
  const target = new THREE.Vector3(
    mix(shot.targetFrom[0], shot.targetTo[0]),
    mix(shot.targetFrom[1], shot.targetTo[1]) + liftY,
    mix(shot.targetFrom[2], shot.targetTo[2]),
  );
  camera.zoom = mix(shot.zoomFrom ?? 1, shot.zoomTo ?? 1);
  camera.updateProjectionMatrix();
  camera.lookAt(target);
  camera.userData.shotId = shot.id;
  camera.userData.context = shot.context || 'house';
  camera.userData.target = target;
}

export { create, applyCameraEdit };
