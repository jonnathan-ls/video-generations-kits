import * as THREE from 'three';
import { makeScenery, rollWheels } from '../../kit-video-3d/assets/scenery/index.js';
import { create as createWallScene } from './contexto-obra-arco.js';

function makeStoneTexture() {
  const size = 96;
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const seed = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = seed - Math.floor(seed);
      const shade = 239 + Math.round(noise * 16);
      const bump = 122 + Math.round(noise * 12);
      for (const data of [colorData, bumpData]) data[i + 3] = 255;
      colorData[i] = colorData[i + 1] = colorData[i + 2] = shade;
      bumpData[i] = bumpData[i + 1] = bumpData[i + 2] = bump;
    }
  }
  const texture = new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 5);
  texture.needsUpdate = true;
  const bump = new THREE.DataTexture(bumpData, size, size, THREE.RGBAFormat);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.copy(texture.repeat);
  bump.needsUpdate = true;
  return { texture, bump };
}

function soften(object, amount = 0.22) {
  const neutral = new THREE.Color('#c4c3b5');
  object.traverse((part) => {
    if (!part.isMesh) return;
    part.material = (Array.isArray(part.material) ? part.material : [part.material]).map((source) => {
      const material = source.clone();
      material.color.lerp(neutral, amount);
      material.roughness = Math.max(material.roughness ?? 0.8, 0.78);
      return material;
    });
    if (part.material.length === 1) part.material = part.material[0];
  });
}

function addMountain(root, name, points, color, z) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) shape.lineTo(x, y);
  shape.lineTo(points.at(-1)[0], 0);
  shape.lineTo(points[0][0], 0);
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
  );
  mesh.name = name;
  mesh.position.z = z;
  root.add(mesh);
  return mesh;
}

function addSkylineBuilding(root, name, x, width, height, color, z) {
  const group = new THREE.Group();
  group.name = name;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.28),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  body.position.y = height / 2;
  group.add(body);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.08, 0.12, 0.34),
    new THREE.MeshStandardMaterial({ color: '#7e8d8b', roughness: 1 }),
  );
  roof.position.y = height + 0.06;
  group.add(roof);
  for (let y = 0.52; y < height - 0.3; y += 0.7) {
    for (let wx = -width / 2 + 0.34; wx < width / 2 - 0.16; wx += 0.58) {
      const window = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.025),
        new THREE.MeshBasicMaterial({ color: '#bed7db' }),
      );
      window.position.set(wx, y, 0.155);
      group.add(window);
    }
  }
  group.position.set(x, 0, z);
  root.add(group);
  return group;
}

function makeSun() {
  const group = new THREE.Group();
  group.name = 'sol_com_halo_sutil';
  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(0.78, 32),
    new THREE.MeshBasicMaterial({ color: '#f5d997', transparent: true, opacity: 0.16, depthWrite: false }),
  );
  halo.position.z = -0.015;
  group.add(halo);
  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 32),
    new THREE.MeshBasicMaterial({ color: '#ffe39b' }),
  );
  group.add(disk);
  group.position.set(3.2, 6.55, -11.8);
  return group;
}

function makeBirds() {
  const flock = new THREE.Group();
  flock.name = 'passaros_em_voo';
  const material = new THREE.MeshBasicMaterial({ color: '#3d5558', side: THREE.DoubleSide });
  const birds = [];
  for (let index = 0; index < 3; index++) {
    const bird = new THREE.Group();
    const wings = [];
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.085), material);
      wing.position.x = side * 0.15;
      wing.rotation.z = side * -0.22;
      bird.add(wing);
      wings.push({ wing, side });
    }
    bird.position.set(index * 1.2, (index % 2) * 0.22, 0);
    bird.scale.setScalar(1.25);
    flock.add(bird);
    birds.push({ bird, wings, phase: index * 1.7 });
  }
  flock.position.set(-2.3, 7.18, -13.2);
  return { flock, birds };
}

function makeAirplane() {
  const group = new THREE.Group();
  group.name = 'aviao_distante';
  const body = new THREE.Shape();
  body.moveTo(-1.05, 0);
  body.lineTo(-0.48, 0.08);
  body.lineTo(-0.16, 0.5);
  body.lineTo(0.03, 0.5);
  body.lineTo(-0.02, 0.1);
  body.lineTo(0.86, 0.12);
  body.lineTo(1.08, 0.02);
  body.lineTo(0.84, -0.06);
  body.lineTo(-0.05, -0.02);
  body.lineTo(0.12, -0.28);
  body.lineTo(-0.04, -0.3);
  body.lineTo(-0.48, -0.04);
  body.closePath();
  const silhouette = new THREE.Mesh(
    new THREE.ShapeGeometry(body),
    new THREE.MeshBasicMaterial({ color: '#65777a', side: THREE.DoubleSide }),
  );
  group.add(silhouette);
  group.scale.setScalar(0.68);
  group.position.set(-5.5, 8.02, -14.7);
  return group;
}

function makeGardenStatue() {
  const group = new THREE.Group();
  group.name = 'estatua_de_jardim';
  const stone = new THREE.MeshStandardMaterial({ color: '#a9a695', roughness: 0.96 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.5), stone);
  plinth.position.y = 0.1;
  group.add(plinth);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.68, 8), stone);
  column.position.y = 0.54;
  group.add(column);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 6), stone);
  torso.scale.set(0.82, 1.35, 0.68);
  torso.position.y = 1.04;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), stone);
  head.position.y = 1.38;
  group.add(head);
  const arms = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.14), stone);
  arms.position.set(0, 1.12, 0);
  group.add(arms);
  group.position.set(-3.5, 0, 0.35);
  group.scale.setScalar(0.74);
  return group;
}

export function create() {
  const root = createWallScene();
  root.name = 'contexto_arco_jardim';

  const wall = root.getObjectByName('parede_com_abertura_em_arco');
  if (wall?.material && wall.geometry?.attributes?.uv) {
    const { texture, bump } = makeStoneTexture();
    wall.material = wall.material.clone();
    wall.material.map = texture;
    wall.material.bumpMap = bump;
    wall.material.bumpScale = 0.014;
    wall.material.roughness = 0.96;
    wall.material.needsUpdate = true;
  }

  const lawn = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 12),
    new THREE.MeshStandardMaterial({ color: '#739b62', roughness: 1 }),
  );
  lawn.name = 'gramado_ao_fundo';
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, -0.025, -8.2);
  lawn.receiveShadow = true;
  root.add(lawn);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 7.2),
    new THREE.MeshStandardMaterial({ color: '#b9ad96', roughness: 0.96 }),
  );
  path.name = 'caminho_no_jardim';
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, -0.014, -6.4);
  root.add(path);

  const road = makeScenery('rua_reta', { variant: 'sem_calcada', length: 32 });
  road.name = 'rua_em_frente_ao_piso_de_concreto';
  road.rotation.y = Math.PI / 2;
  road.position.set(0, 0, 3.4);
  root.add(road);

  const car = makeScenery('carro_sedan', { variant: 'azul' });
  car.name = 'sedan_azul_em_passagem';
  car.rotation.y = Math.PI / 2;
  car.scale.setScalar(0.55);
  car.position.set(-13, 0.06, 1.7);
  root.add(car);

  const house = makeScenery('casa_simples', { variant: 'verde' });
  house.name = 'casa_ao_fundo';
  house.scale.setScalar(0.56);
  house.position.set(0, 0, -9.25);
  soften(house, 0.26);
  root.add(house);

  for (const [name, x, z, scale] of [
    ['arvore_esquerda', -5.25, -3.9, 0.76],
    ['arvore_direita', 5.25, -4.3, 0.69],
  ]) {
    const tree = makeScenery('arvore_redonda', { variant: 'escura' });
    tree.name = name;
    tree.scale.setScalar(scale);
    tree.position.set(x, 0, z);
    root.add(tree);
  }

  for (const [name, x, z, scale] of [
    ['arbusto_esquerdo', -4.35, -2.5, 0.58],
    ['arbusto_direito', 4.35, -2.9, 0.58],
    ['arbusto_jardim_fundo', 2.8, -7.0, 0.48],
  ]) {
    const bush = makeScenery('arbusto', { variant: 'claro' });
    bush.name = name;
    bush.scale.setScalar(scale);
    bush.position.set(x, 0, z);
    root.add(bush);
  }

  addMountain(root, 'montanhas_distantes', [
    [-13, 2.15], [-9, 3.1], [-6, 2.45], [-2.6, 3.3], [0.4, 2.5], [4.6, 3.35], [7.8, 2.5], [13, 3.0],
  ], '#9bb6b5', -14.4);
  addMountain(root, 'colinas_do_jardim', [
    [-13, 1.1], [-9, 1.85], [-5.5, 1.25], [-1.2, 2.05], [2.6, 1.3], [7.2, 1.9], [13, 1.2],
  ], '#91aa8e', -13.4);
  addSkylineBuilding(root, 'predio_distante_esquerdo', -5.0, 2.2, 6.7, '#c9cdc4', -11.6);
  addSkylineBuilding(root, 'predio_distante_direito', 5.1, 2.45, 7.35, '#b7c7c7', -12.0);
  root.add(makeSun());
  const { flock, birds } = makeBirds();
  root.add(flock);
  const airplane = makeAirplane();
  root.add(airplane);
  root.add(makeGardenStatue());

  root.userData.sample = (localTime, absoluteTime = localTime) => {
    const time = Number.isFinite(absoluteTime) ? absoluteTime : localTime;
    const carPhase = (time - 3.5) / 2.0;
    car.visible = carPhase >= 0 && carPhase <= 1;
    const carProgress = Math.max(0, Math.min(1, carPhase));
    const carDistance = carProgress * 26;
    car.position.x = -13 + carDistance;
    rollWheels(car, carDistance);
    const flightPhase = (time - 10.65) / 5.0;
    airplane.visible = flightPhase >= 0 && flightPhase <= 1;
    airplane.position.x = -5.5 + 11 * Math.max(0, Math.min(1, flightPhase));
    const drift = Math.sin(time * 0.23);
    flock.position.x = -2.3 + drift * 0.45;
    flock.position.y = 7.18 + Math.sin(time * 0.9) * 0.12;
    for (const { bird, wings, phase } of birds) {
      bird.position.y = Math.sin(time * 0.8 + phase) * 0.05;
      for (const { wing, side } of wings) {
        wing.rotation.z = side * (-0.22 + Math.sin(time * 10.5 + phase) * 0.34);
      }
    }
  };
  root.userData.sample(0, 0);

  return root;
}
