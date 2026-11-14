import * as THREE from 'three';
import { makeScenery } from '../../kit-video-3d/assets/scenery/index.js';

const mat = (color, roughness = 0.92, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function addHill(root, name, points, color, z) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
  shape.lineTo(points.at(-1)[0], -0.2);
  shape.lineTo(points[0][0], -0.2);
  shape.closePath();
  const hill = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 12),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: false }),
  );
  hill.name = name;
  hill.position.set(0, 0, z);
  root.add(hill);
  return hill;
}

function addMandacaru(root, x, z, scale = 1) {
  const cactus = new THREE.Group();
  cactus.name = `mandacaru-${x < 0 ? 'oeste' : 'leste'}`;
  cactus.position.set(x, 0, z);
  cactus.scale.setScalar(scale);
  const skin = mat('#496449', 0.95);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.72, 16, 1), skin);
  body.name = 'coluna-principal'; body.position.y = 0.86; body.castShadow = true; body.receiveShadow = true;
  cactus.add(body);
  for (const [side, height, lean] of [[-1, 0.88, -0.72], [1, 1.18, 0.78]]) {
    const branch = new THREE.Group();
    branch.position.set(side * 0.13, height, 0);
    branch.rotation.z = lean;
    const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.57, 12), skin);
    upright.position.y = 0.27; upright.castShadow = true; upright.receiveShadow = true;
    branch.add(upright);
    const elbow = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.075, 0.34, 12), skin);
    elbow.position.set(-side * 0.12, 0.48, 0); elbow.rotation.z = -lean * 0.42;
    elbow.castShadow = true; elbow.receiveShadow = true; branch.add(elbow);
    cactus.add(branch);
  }
  root.add(cactus);
  return cactus;
}

function addStone(root, x, y, z, scale, color) {
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), mat(color, 1));
  stone.name = 'pedra-do-terreiro';
  stone.position.set(x, y, z); stone.scale.set(...scale);
  stone.rotation.set(x * 0.2, z * 0.17, y * 0.6);
  stone.castShadow = true; stone.receiveShadow = true; root.add(stone);
  return stone;
}

function create({ variant = 'terreiro-tarde' } = {}) {
  const defaultNight = variant === 'terreiro-noite';
  const root = new THREE.Group();
  root.name = 'contexto-exterior-casa-do-sertao';

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 44, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#835c41', roughness: 1 }),
  );
  ground.name = 'chao-terroso-apoio'; ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.16, 0);
  ground.receiveShadow = true; root.add(ground);

  addHill(root, 'serra-distante', [
    [-22, 0.4], [-18, 2.6], [-14, 1.6], [-9, 3.0], [-5, 1.4], [0, 2.5], [4, 1.4], [9, 3.1], [14, 1.5], [18, 2.6], [22, 0.3],
  ], '#8c7965', -13.8);
  addHill(root, 'serrote-do-horizonte', [
    [-22, 0.0], [-18, 1.05], [-13, 0.55], [-8, 1.45], [-3, 0.52], [3, 1.2], [9, 0.42], [14, 1.15], [18, 0.62], [22, 0.0],
  ], '#725b48', -12.8);

  const house = makeScenery('casa_simples', {
    variant: 'amarela', wall: '#d8c6a3', roof: '#944a36', door: '#60422f', trim: '#eee3cd', chimney: false,
  });
  house.name = 'casa-terrea-caiada-reutilizada-do-kit';
  root.add(house);

  const warmWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.82),
    new THREE.MeshBasicMaterial({ color: '#ffbf69', transparent: true, opacity: 0, depthWrite: false }),
  );
  warmWindow.name = 'luz-quente-janela-esquerda'; warmWindow.position.set(-1.8, 2.0, 3.54); root.add(warmWindow);
  const warmWindowRight = warmWindow.clone();
  warmWindowRight.name = 'luz-quente-janela-direita'; warmWindowRight.position.x = 1.8; root.add(warmWindowRight);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 28, 18),
    new THREE.MeshBasicMaterial({ color: '#ffe3a1', transparent: true, opacity: 0.92 }),
  );
  sun.name = 'disco-solar-de-contexto'; sun.position.set(-5.5, 7.3, -8.2); root.add(sun);

  addMandacaru(root, -4.05, 2.1, 0.82);
  addMandacaru(root, 4.05, 1.9, 0.68);
  addStone(root, -3.55, -0.06, 3.95, [1.6, 0.45, 0.82], '#987b5c');
  addStone(root, -2.95, -0.055, 3.75, [0.92, 0.4, 0.66], '#795c43');
  addStone(root, 3.7, -0.06, 3.7, [1.3, 0.42, 0.78], '#9a7b59');

  const windows = [warmWindow, warmWindowRight];
  root.userData.sample = (_time = 0, options = {}) => {
    const night = typeof options.night === 'boolean' ? options.night : defaultNight;
    const sunset = THREE.MathUtils.clamp(options.sunset ?? 0, 0, 1);
    sun.visible = !night;
    sun.position.x = THREE.MathUtils.lerp(-5.5, 3.8, sunset);
    sun.position.y = THREE.MathUtils.lerp(7.3, 2.7, sunset);
    sun.material.opacity = 0.92 * (1 - sunset * 0.38);
    windows.forEach(window => {
      window.material.opacity = night ? 0.72 : 0.02;
      window.material.color.set(night ? '#ffb65d' : '#f4d9a2');
    });
  };
  root.userData.sample(0);
  root.userData.context = { variant, houseAsset: 'casa_simples::amarela', environment: 'terreiro-semiarido-ilustrativo' };
  return root;
}

export { create };
