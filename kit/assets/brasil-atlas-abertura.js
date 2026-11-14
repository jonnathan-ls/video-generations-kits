import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { const u = clamp(x); return u * u * (3 - 2 * u); };
const mix = (a, b, t) => a + (b - a) * t;

const MAT = (color, roughness = .78, metalness = .03, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

function box(g, size, pos, color, options = {}) {
  const geometry = options.round
    ? new RoundedBoxGeometry(...size, 2, Math.min(options.round, size[0] * .18, size[1] * .18, size[2] * .18))
    : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, MAT(color, options.roughness ?? .8, options.metalness ?? .03, options.material || {}));
  mesh.position.set(...pos);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function cylinder(g, rt, rb, h, pos, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, options.segments || 24, 1, !!options.open),
    MAT(color, options.roughness ?? .62, options.metalness ?? .15, options.material || {})
  );
  mesh.position.set(...pos);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
  return mesh;
}

function paperEdge(g, w, d, y, color = '#cbb994') {
  const t = .018;
  box(g, [w, t, d], [0, y, 0], color, { round: .01, roughness: .92, castShadow: false });
  const edge = MAT('#b5a27f', .95, .01);
  for (const [sx, sz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(sx ? .018 : w, .022, sz ? .018 : d),
      edge
    );
    mesh.position.set(sx * w / 2, y + .012, sz * d / 2);
    mesh.receiveShadow = true;
    g.add(mesh);
  }
}

const brazilPoints = [
    [0.15, -2.93], [0.11, -2.84], [0.17, -2.77], [0.09, -2.67], [-0.03, -2.58], [-0.19, -2.49], [-0.24, -2.49],
    [-0.39, -2.38], [-0.49, -2.39], [-0.29, -2.19], [-0.12, -2.04], [-0.02, -1.98], [0.11, -1.90], [0.11, -1.78],
    [0.03, -1.69], [-0.04, -1.72], [-0.01, -1.64], [0.01, -1.55], [0.01, -1.46], [-0.04, -1.44], [-0.10, -1.46],
    [-0.16, -1.45], [-0.17, -1.40], [-0.19, -1.26], [-0.22, -1.21], [-0.32, -1.17], [-0.38, -1.20], [-0.54, -1.17],
    [-0.53, -0.97], [-0.57, -0.89], [-0.52, -0.86], [-0.54, -0.77], [-0.50, -0.70], [-0.47, -0.59], [-0.51, -0.49],
    [-0.59, -0.45], [-0.60, -0.39], [-0.58, -0.31], [-0.87, -0.30], [-0.93, -0.12], [-0.88, -0.12], [-0.89, -0.06],
    [-0.92, -0.01], [-0.92, 0.07], [-1.01, 0.12], [-1.10, 0.12], [-1.17, 0.16], [-1.27, 0.19], [-1.33, 0.25],
    [-1.49, 0.27], [-1.66, 0.40], [-1.64, 0.50], [-1.66, 0.56], [-1.65, 0.67], [-1.84, 0.65], [-1.92, 0.59],
    [-2.05, 0.53], [-2.09, 0.49], [-2.16, 0.48], [-2.28, 0.50], [-2.36, 0.47], [-2.43, 0.49], [-2.42, 0.72],
    [-2.54, 0.63], [-2.67, 0.63], [-2.73, 0.71], [-2.83, 0.72], [-2.80, 0.78], [-2.88, 0.88], [-2.94, 1.01],
    [-2.90, 1.04], [-2.90, 1.10], [-2.81, 1.14], [-2.83, 1.23], [-2.79, 1.28], [-2.78, 1.35], [-2.61, 1.45],
    [-2.49, 1.48], [-2.47, 1.50], [-2.33, 1.49], [-2.26, 1.91], [-2.26, 1.97], [-2.28, 2.06], [-2.35, 2.11],
    [-2.35, 2.22], [-2.26, 2.25], [-2.23, 2.23], [-2.23, 2.29], [-2.32, 2.30], [-2.32, 2.40], [-2.03, 2.39],
    [-1.98, 2.44], [-1.94, 2.40], [-1.91, 2.31], [-1.88, 2.33], [-1.80, 2.25], [-1.68, 2.26], [-1.65, 2.30],
    [-1.54, 2.34], [-1.48, 2.36], [-1.46, 2.43], [-1.35, 2.47], [-1.36, 2.50], [-1.49, 2.51], [-1.51, 2.61],
    [-1.50, 2.71], [-1.57, 2.75], [-1.54, 2.76], [-1.43, 2.74], [-1.31, 2.70], [-1.27, 2.74], [-1.16, 2.76],
    [-0.99, 2.82], [-0.94, 2.88], [-0.96, 2.92], [-0.88, 2.93], [-0.84, 2.89], [-0.86, 2.83], [-0.81, 2.80],
    [-0.78, 2.73], [-0.82, 2.68], [-0.84, 2.55], [-0.80, 2.48], [-0.79, 2.41], [-0.70, 2.34], [-0.63, 2.33],
    [-0.61, 2.36], [-0.56, 2.37], [-0.50, 2.39], [-0.45, 2.43], [-0.36, 2.42], [-0.33, 2.42], [-0.25, 2.41],
    [-0.23, 2.44], [-0.26, 2.47], [-0.24, 2.52], [-0.18, 2.50], [-0.11, 2.52], [-0.02, 2.49], [0.04, 2.46],
    [0.09, 2.50], [0.12, 2.49], [0.14, 2.45], [0.21, 2.46], [0.27, 2.51], [0.32, 2.63], [0.41, 2.76],
    [0.46, 2.77], [0.49, 2.69], [0.58, 2.42], [0.66, 2.40], [0.66, 2.30], [0.55, 2.17], [0.60, 2.13],
    [0.86, 2.10], [0.87, 1.95], [0.98, 2.05], [1.17, 2.00], [1.42, 1.91], [1.49, 1.82], [1.47, 1.74],
    [1.64, 1.78], [1.93, 1.70], [2.16, 1.71], [2.38, 1.58], [2.57, 1.42], [2.69, 1.37], [2.81, 1.37],
    [2.87, 1.32], [2.92, 1.13], [2.94, 1.04], [2.88, 0.79], [2.81, 0.69], [2.60, 0.48], [2.50, 0.31],
    [2.39, 0.18], [2.35, 0.18], [2.31, 0.07], [2.32, -0.21], [2.28, -0.44], [2.26, -0.54], [2.22, -0.60],
    [2.19, -0.80], [2.04, -1.00], [2.01, -1.15], [1.89, -1.22], [1.86, -1.31], [1.69, -1.31], [1.46, -1.36],
    [1.35, -1.43], [1.18, -1.47], [1.01, -1.59], [0.88, -1.74], [0.86, -1.85], [0.88, -1.94], [0.85, -2.09],
    [0.82, -2.16], [0.72, -2.24], [0.55, -2.51], [0.42, -2.63], [0.32, -2.70], [0.25, -2.84]
];

function brazilShape() {
  // Silhueta esquemática Natural Earth 110m para a prévia. A versão de produção usará malha do IBGE.
  const shape = new THREE.Shape();
  brazilPoints.forEach(([x, z], i) => { if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z); });
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2, curveSegments: 2 });
}

export function create({ variant = 'padrao', params = {} } = {}) {
  const root = new THREE.Group();
  root.name = `brasil-atlas-abertura:${variant}`;

  // Sala de trabalho: escura, fechada, com uma janela fria ao fundo.
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(24, 10, 20),
    new THREE.MeshStandardMaterial({ color: '#151d1f', roughness: .96, metalness: .02, side: THREE.BackSide })
  );
  room.position.set(0, 5, 0);
  room.receiveShadow = true;
  root.add(room);
  box(root, [24, .12, 20], [0, .06, 0], '#231b16', { roughness: .96, castShadow: false });
  box(root, [24, .12, 20], [0, 9.88, 0], '#11181a', { roughness: .98, castShadow: true });

  // Janela ao fundo: fonte fria motivada.
  box(root, [4.2, 4.2, .14], [0, 4.8, -9.88], '#0d1518', { roughness: .9, castShadow: false });
  box(root, [3.55, 3.55, .08], [0, 4.8, -9.80], '#326b7c', {
    roughness: .45, metalness: .05, material: { emissive: '#1d4c5b', emissiveIntensity: .55 }
  });
  for (const x of [-1.9, 0, 1.9]) box(root, [.09, 3.9, .18], [x, 4.8, -9.72], '#593f2a', { roughness: .72 });
  for (const y of [2.9, 4.8, 6.7]) box(root, [3.95, .09, .18], [0, y, -9.72], '#593f2a', { roughness: .72 });
  const windowLight = new THREE.PointLight('#67a7b8', 9, 22, 2);
  windowLight.position.set(0, 4.8, -8.9);
  root.add(windowLight);

  // Estante baixa e mapas enrolados ao fundo.
  box(root, [7.2, .18, 1.1], [-3.5, 2.45, -8.8], '#4c3426', { round: .04, roughness: .85 });
  for (let i = 0; i < 5; i++) {
    const roll = cylinder(root, .16, .16, 1.5 + (i % 2) * .35, [-6.2 + i * .78, 2.7, -8.8], i % 2 ? '#c9b58d' : '#9f835c', {
      rotation: [0, 0, Math.PI / 2], segments: 14, roughness: .9
    });
    roll.castShadow = true;
  }

  // Mesa de trabalho.
  const tableY = 1.02;
  box(root, [13.2, .34, 7.6], [0, tableY, 0], '#4a2f22', { round: .06, roughness: .8 });
  box(root, [12.7, .055, 7.15], [0, tableY + .19, 0], '#1e3530', { round: .035, roughness: .88, castShadow: false });
  box(root, [12.75, .02, 7.2], [0, tableY + .225, 0], '#b08a4f', { roughness: .5, metalness: .35, castShadow: false });
  for (const x of [-5.7, 5.7]) for (const z of [-2.9, 2.9]) {
    box(root, [.44, tableY, .44], [x, tableY / 2, z], '#3b261b', { round: .03, roughness: .82 });
  }

  // Pilha de camadas: papel, acrílico e tinta.
  const stack = new THREE.Group();
  root.add(stack);
  const layerDefs = [
    { y: 1.30, w: 9.3, d: 5.6, color: '#3f5a44', opacity: .82, rot: -.028, x: -.18, z: -.10 },
    { y: 1.37, w: 9.7, d: 5.85, color: '#8a5f32', opacity: .78, rot: .018, x: .12, z: .04 },
    { y: 1.44, w: 10.05, d: 6.05, color: '#2f4560', opacity: .74, rot: -.012, x: -.06, z: -.03 }
  ];
  const lowerLayers = [];
  for (const [i, def] of layerDefs.entries()) {
    const g = new THREE.Group();
    g.position.set(def.x, 0, def.z);
    g.rotation.y = def.rot;
    stack.add(g);
    const sheet = new THREE.Mesh(
      new RoundedBoxGeometry(def.w, .022, def.d, 2, .025),
      new THREE.MeshStandardMaterial({
        color: def.color, roughness: .62, metalness: .02, transparent: false,
        opacity: 1, depthWrite: true, side: THREE.DoubleSide
      })
    );
    sheet.position.y = def.y;
    sheet.receiveShadow = true;
    g.add(sheet);
    paperEdge(g, def.w, def.d, def.y + .002, '#c7b28c');
    const borderMat = new THREE.MeshBasicMaterial({ color: '#d7c39b', transparent: true, opacity: .55 });
    for (const [bx, bz, bw, bd] of [[0, -def.d/2, def.w, .035], [0, def.d/2, def.w, .035], [-def.w/2, 0, .035, def.d], [def.w/2, 0, .035, def.d]]) {
      const border = new THREE.Mesh(new THREE.BoxGeometry(bw, .012, bd), borderMat);
      border.position.set(bx, def.y + .018, bz);
      g.add(border);
    }
    // Linhas de fronteira/rota: abstratas, só aparecem quando a camada de cima sobe.
    const lineColor = i === 0 ? '#d7bd7d' : i === 1 ? '#e2c78d' : '#b9c9d2';
    for (let k = 0; k < 4; k++) {
      const len = 2.4 + k * .55;
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(len, .012, .034),
        new THREE.MeshBasicMaterial({ color: lineColor, transparent: true, opacity: .85 })
      );
      line.position.set((k % 2 ? -1 : 1) * (.9 + k * .25), def.y + .030, -1.5 + k * 1.0);
      line.rotation.y = (k % 2 ? 1 : -1) * (.18 + k * .08);
      g.add(line);
    }
    const lowerBrazil = new THREE.Mesh(brazilShape(), new THREE.MeshStandardMaterial({
      color: i === 0 ? '#d9c58d' : i === 1 ? '#e2c78d' : '#b9c9d2',
      roughness: .58, metalness: .04, transparent: true, opacity: .62
    }));
    lowerBrazil.rotation.x = -Math.PI / 2;
    lowerBrazil.scale.set(.70, 1, .70);
    lowerBrazil.position.set(0, def.y + .022, 0);
    g.add(lowerBrazil);
    lowerLayers.push({ group: g, baseX: def.x, baseZ: def.z, baseRot: def.rot });
  }

  // Camada de cima: papel com a silhueta do Brasil.
  const top = new THREE.Group();
  top.position.set(.14, 0, .05);
  top.rotation.y = .012;
  stack.add(top);
  const topSheet = new THREE.Mesh(
    new RoundedBoxGeometry(8.4, .028, 6.4, 2, .03),
    new THREE.MeshStandardMaterial({ color: '#e8dcc4', roughness: .92, metalness: .01 })
  );
  topSheet.position.y = 1.51;
  topSheet.castShadow = true;
  topSheet.receiveShadow = true;
  top.add(topSheet);
  paperEdge(top, 8.4, 6.4, 1.535, '#d0bd99');
  const neatMat = new THREE.MeshBasicMaterial({ color: '#8a6a3f', transparent: true, opacity: .62 });
  for (const [bx, bz, bw, bd] of [[0, -3.08, 8.05, .028], [0, 3.08, 8.05, .028], [-3.98, 0, .028, 6.16], [3.98, 0, .028, 6.16]]) {
    const neat = new THREE.Mesh(new THREE.BoxGeometry(bw, .008, bd), neatMat);
    neat.position.set(bx, 1.548, bz);
    top.add(neat);
  }
  const gridMat = new THREE.MeshBasicMaterial({ color: '#9c8054', transparent: true, opacity: .30 });
  for (let k = -2; k <= 2; k++) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(7.9, .006, .012), gridMat);
    h.position.set(0, 1.547, k * 1.15); top.add(h);
    const v = new THREE.Mesh(new THREE.BoxGeometry(.012, .006, 6.0), gridMat);
    v.position.set(k * 1.45, 1.547, 0); top.add(v);
  }
  const brazil = new THREE.Mesh(brazilShape(), new THREE.MeshStandardMaterial({ color: '#203c48', roughness: .58, metalness: .08 }));
  brazil.rotation.x = -Math.PI / 2;
  brazil.scale.set(.95, 1, .95);
  brazil.position.set(0, 1.555, 0);
  brazil.castShadow = true;
  top.add(brazil);
  const coast = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(brazilPoints.map(([x, z]) => new THREE.Vector3(x * .95, 0, z * .95))),
    new THREE.LineBasicMaterial({ color: '#c3a15f', transparent: true, opacity: .78 })
  );
  coast.position.y = 1.566;
  top.add(coast);
  // Luva de trabalho: motiva a camada que desliza para fora da pilha.
  const hand = new THREE.Group();
  hand.position.set(4.02, 1.535, 2.02);
  hand.rotation.y = -.20;
  top.add(hand);
  const glove = new THREE.MeshStandardMaterial({ color: '#2b3534', roughness: .66, metalness: .04 });
  const palm = new THREE.Mesh(new RoundedBoxGeometry(.52, .15, .58, 2, .07), glove);
  palm.castShadow = true; hand.add(palm);
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new RoundedBoxGeometry(.44, .105, .095, 2, .04), glove);
    finger.position.set(-.38, .015, -.20 + i * .135);
    finger.rotation.z = -.05;
    finger.castShadow = true; hand.add(finger);
  }
  const thumb = new THREE.Mesh(new RoundedBoxGeometry(.30, .11, .12, 2, .05), glove);
  thumb.position.set(-.22, .015, .30);
  thumb.rotation.y = .55;
  thumb.castShadow = true; hand.add(thumb);
  const cuff = new THREE.Mesh(new RoundedBoxGeometry(.34, .18, .46, 2, .06), new THREE.MeshStandardMaterial({ color: '#6b5235', roughness: .62, metalness: .10 }));
  cuff.position.set(.32, .01, 0); cuff.castShadow = true; hand.add(cuff);
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(.15, .20, 1.65, 16), new THREE.MeshStandardMaterial({ color: '#3b4a46', roughness: .82 }));
  forearm.rotation.z = Math.PI / 2; forearm.rotation.x = .05;
  forearm.position.set(1.18, .02, .02); forearm.castShadow = true; hand.add(forearm);
  const button = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 8), new THREE.MeshStandardMaterial({ color: '#b08d57', roughness: .3, metalness: .7 }));
  button.position.set(.31, .105, -.20); hand.add(button);

  // Rótulo abstrato de "camada atual": três pequenos selos de papel.
  for (let i = 0; i < 3; i++) {
    box(top, [.55, .018, .38], [3.25, 1.57, -1.95 + i * .55], i === 0 ? '#d4b26d' : i === 1 ? '#c78d66' : '#8ca79a', {
      round: .01, roughness: .9, rotation: [0, -.12 + i * .08, 0], castShadow: false
    });
  }

  // Objetos de trabalho nas bordas: régua, lápis, mapas enrolados, papel.
  box(root, [3.1, .035, .13], [-3.9, 1.27, 2.85], '#b19159', { round: .012, metalness: .55, roughness: .35, rotation: [0, .13, 0] });
  for (let i = 0; i < 8; i++) box(root, [.025, .028, .10], [-5.2 + i * .38, 1.285, 2.85], '#6f5536', { castShadow: false, rotation: [0, .13, 0] });
  cylinder(root, .035, .035, 1.25, [2.55, 1.28, 3.0], '#c19a4e', { rotation: [0, 0, Math.PI / 2], segments: 10, roughness: .66 });
  cylinder(root, .018, .018, .18, [3.18, 1.28, 3.0], '#2d2721', { rotation: [0, 0, Math.PI / 2], segments: 8, roughness: .9 });
  for (let i = 0; i < 3; i++) {
    box(root, [1.15, .018, 1.45], [-4.35 + i * .02, 1.27 + i * .022, 1.75 + i * .015], i === 0 ? '#e0d2b7' : i === 1 ? '#d7c7a9' : '#cbb894', {
      round: .008, roughness: .95, rotation: [0, -.08 + i * .02, 0], castShadow: false
    });
  }
  for (let i = 0; i < 3; i++) {
    cylinder(root, .17, .17, 1.45, [4.55 + i * .28, 1.28, 2.35 - i * .12], i % 2 ? '#b59a70' : '#d3c09a', {
      rotation: [0, 0, Math.PI / 2], segments: 14, roughness: .92
    });
  }

  // Lâmpada de mesa: fonte quente principal.
  const lamp = new THREE.Group();
  lamp.position.set(-5.1, 1.24, -2.55);
  root.add(lamp);
  cylinder(lamp, .34, .42, .10, [0, .05, 0], '#8d6d3f', { metalness: .65, roughness: .34 });
  cylinder(lamp, .055, .07, 1.55, [0, .82, 0], '#a47e46', { metalness: .72, roughness: .28, rotation: [0, 0, -.16] });
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(.24, .72, .58, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: '#b78c4e', roughness: .38, metalness: .58, side: THREE.DoubleSide, emissive: '#3b2410', emissiveIntensity: .25 })
  );
  shade.position.set(.18, 1.53, .02);
  shade.rotation.z = -.22;
  shade.castShadow = true;
  lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffe3ae' }));
  bulb.position.set(.16, 1.42, .02);
  lamp.add(bulb);
  const spot = new THREE.SpotLight('#ffd39a', 95, 16, .72, .58, 1.4);
  spot.position.set(-4.9, 2.78, -2.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -.002;
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(.3, 1.35, .2);
  root.add(spotTarget);
  spot.target = spotTarget;
  root.add(spot);
  const glow = new THREE.PointLight('#ffca8b', 7.5, 5.5, 2);
  glow.position.set(-4.9, 2.72, -2.5);
  root.add(glow);

  // Poeira fina no feixe: pontos determinísticos, sem aleatoriedade em tempo de render.
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(140 * 3);
  for (let i = 0; i < 140; i++) {
    const a = i * 2.399963, r = .55 + (i % 17) * .14;
    dustPositions[i * 3] = -4.2 + Math.cos(a) * r;
    dustPositions[i * 3 + 1] = 1.7 + ((i * 7) % 23) * .055;
    dustPositions[i * 3 + 2] = -2.0 + Math.sin(a) * r;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#e8c98c', size: .018, transparent: true, opacity: .42, depthWrite: false }));
  root.add(dust);

  if (params.hideTop) top.visible = false;

  // Animação absoluta: a camada de cima sobe, as de baixo se abrem.
  const topBase = { x: .14, y: 0, z: .05, rot: .012 };
  root.userData.sample = (t = 0) => {
    const lift = smooth((t - 7.4) / 6.2);
    top.position.set(topBase.x + 2.90 * lift, topBase.y + .16 * lift, topBase.z + .15 * lift);
    top.rotation.y = topBase.rot - .22 * lift;
    top.rotation.z = -.012 * lift;
    lowerLayers.forEach((layer, i) => {
      const spread = lift * (.22 + i * .18);
      layer.group.position.x = layer.baseX - spread;
      layer.group.position.z = layer.baseZ + spread * .35;
      layer.group.rotation.y = layer.baseRot + spread * .5;
    });
    spot.intensity = 88 + 10 * smooth((t - .2) / 1.6) + 1.4 * Math.sin(t * 1.7);
    glow.intensity = 7.0 + .8 * smooth((t - .2) / 1.6);
    bulb.material.color.set('#ffe3ae');
    dust.material.opacity = .24 + .18 * smooth((t - 1.0) / 1.5);
    dust.position.y = Math.sin(t * .22) * .025;
  };
  root.userData.sample(0);
  return root;
}

export { brazilPoints };
