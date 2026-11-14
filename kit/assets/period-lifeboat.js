import * as THREE from 'three';
import { person } from './period-person-rig.js';
import { surface } from './period-surface-materials.js';
import { mat, mesh, recipe, box } from './maritime-shapes.js';

const LENGTH = 9;
const BEAM = 2.8;
const BENCH_COUNT = 6;
const BENCH_Z = Array.from({ length: BENCH_COUNT }, (_, i) => -2.65 + i * 1.05);

function beamAt(z) {
  const u = z / (LENGTH / 2);
  const round = Math.sqrt(Math.max(0, 1 - u * u));
  // A slightly fuller stern and a finer bow give the small open boat a clear direction.
  const fullness = u > 0 ? 1 - 0.13 * u : 1 + 0.035 * -u;
  return Math.max(0.12, (BEAM / 2) * round * fullness);
}

function sheerAt(z) {
  return 1.16 + 0.19 * Math.pow(Math.abs(z / (LENGTH / 2)), 1.7);
}

function openHullGeometry() {
  const stations = 28;
  const section = [
    [-1.00, 1.00], [-0.97, 0.58], [-0.82, 0.20], [-0.70, -0.10],
    [-0.56, -0.58], [-0.40, -0.86], [0.00, -0.96], [0.40, -0.86],
    [0.56, -0.58], [0.70, -0.10], [0.82, 0.20], [0.97, 0.58], [1.00, 1.00]
  ];
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let station = 0; station <= stations; station++) {
    const u = THREE.MathUtils.lerp(-0.985, 0.985, station / stations);
    const z = u * LENGTH / 2;
    const halfWidth = beamAt(z);
    const sheer = sheerAt(z);
    const bottom = -0.46;
    for (let point = 0; point < section.length; point++) {
      const [xRatio, yRatio] = section[point];
      positions.push(xRatio * halfWidth, bottom + ((yRatio + 1) / 2) * (sheer - bottom), z);
      uvs.push(point / (section.length - 1), station / stations * 5.5);
    }
  }
  const width = section.length;
  for (let station = 0; station < stations; station++) {
    for (let point = 0; point < width - 1; point++) {
      const a = station * width + point;
      const b = a + 1;
      const c = (station + 1) * width + point;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function longitudinalLine(parent, yAt, xRatioAt, material, radius, name) {
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i <= 40; i++) {
      const z = THREE.MathUtils.lerp(-4.32, 4.32, i / 40);
      points.push(new THREE.Vector3(side * beamAt(z) * xRatioAt(z), yAt(z), z));
    }
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    mesh(parent, new THREE.TubeGeometry(curve, 80, radius, 7, false), material, [0, 0, 0], `${name}-${side}`);
  }
}

function floorReach(edgeX) {
  let reach = 4.05;
  for (let step = 1; step <= 81; step++) {
    const z = step * 0.05;
    if (beamAt(z) * 0.63 < Math.abs(edgeX) + 0.035) {
      reach = Math.max(0.55, z - 0.10);
      break;
    }
  }
  return reach;
}

function floorPlankGeometry(centerX, width) {
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const leftReach = floorReach(left);
  const rightReach = floorReach(right);
  const shape = new THREE.Shape();
  shape.moveTo(left, -leftReach);
  shape.lineTo(right, -rightReach);
  shape.lineTo(right, rightReach);
  shape.lineTo(left, leftReach);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.09, steps: 1, bevelEnabled: true,
    bevelSegments: 1, bevelSize: 0.012, bevelThickness: 0.008, curveSegments: 2
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function makeBoat() {
  const pivot = new THREE.Group();
  pivot.name = 'lifeboat-motion-pivot';
  pivot.position.y = 0.36;
  const body = new THREE.Group();
  body.name = 'lifeboat-body';
  body.position.y = -0.36;
  pivot.add(body);

  const hullMaterial = new THREE.MeshPhysicalMaterial({
    color: '#c1b49a', roughness: 0.43, metalness: 0.015,
    clearcoat: 0.42, clearcoatRoughness: 0.31, side: THREE.DoubleSide
  });
  const shell = mesh(body, openHullGeometry(), hullMaterial, [0, 0, 0], 'open-wooden-hull');
  shell.castShadow = true;
  shell.receiveShadow = true;

  const wood = surface('deck');
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.26;
    const board = mesh(body, floorPlankGeometry(x, 0.24), wood, [0, 0.42, 0], `floor-plank-${i + 1}`);
    board.castShadow = true;
    board.receiveShadow = true;
  }
  const keelson = mesh(body, new THREE.BoxGeometry(0.14, 0.13, 6.95), surface('wood'), [0, 0.50, 0], 'interior-keelson');
  keelson.castShadow = true;

  const benchParts = [];
  for (let i = 0; i < BENCH_COUNT; i++) {
    const z = BENCH_Z[i];
    const span = beamAt(z) * 1.56;
    benchParts.push(box(`bench-${i}`, [span, 0.15, 0.34], [0, 0.84, z], '#735638'));
  }
  const benches = recipe('lifeboat-thwarts', benchParts);
  benches.name = 'boat-benches';
  benches.traverse((object) => {
    if (!object.isMesh) return;
    object.material = wood;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  body.add(benches);

  // Cross-bench knees and a restrained dark waterline make the hull read as a built object.
  for (let i = 0; i < BENCH_COUNT; i++) {
    const z = BENCH_Z[i];
    for (const x of [-0.70, 0.70]) {
      const knee = mesh(body, new THREE.BoxGeometry(0.10, 0.38, 0.13), surface('deck'), [x, 0.61, z], `thwart-knee-${i}-${x}`);
      knee.castShadow = true;
    }
  }
  const strakeMaterial = mat('#8a7961', { roughness: 0.64, metalness: 0.015 });
  longitudinalLine(body, () => 0.62, () => 0.985, strakeMaterial, 0.018, 'upper-hull-strake');
  longitudinalLine(body, () => 0.27, () => 0.86, strakeMaterial, 0.016, 'lower-hull-strake');
  longitudinalLine(body, () => -0.05, () => 0.66, mat('#263643', { roughness: 0.48 }), 0.025, 'waterline-band');

  const gunwaleMaterial = surface('deck');
  longitudinalLine(body, (z) => sheerAt(z) - 0.015, () => 0.99, gunwaleMaterial, 0.045, 'gunwale');
  const rowlockMaterial = mat('#a78b58', { metalness: 0.55, roughness: 0.38 });
  for (let i = 0; i < BENCH_COUNT; i++) {
    const z = BENCH_Z[i];
    for (const side of [-1, 1]) {
      const x = side * beamAt(z) * 0.88;
      const rowlock = mesh(body, new THREE.CylinderGeometry(0.047, 0.055, 0.045, 12), rowlockMaterial, [x, sheerAt(z) + 0.014, z], `rowlock-${i}-${side}`);
      rowlock.castShadow = true;
    }
  }

  const stern = mesh(body, new THREE.BoxGeometry(0.54, 0.62, 0.10), surface('deck'), [0, 0.72, -4.36], 'stern-transom');
  stern.castShadow = true;
  stern.receiveShadow = true;
  const bow = mesh(body, new THREE.SphereGeometry(0.14, 12, 8), surface('deck'), [0, 0.48, 4.34], 'bow-stem-cap');
  bow.scale.set(0.62, 1.55, 1.0);
  bow.castShadow = true;

  return { pivot, body };
}

export function create({ variant = 'occupied' } = {}) {
  const root = new THREE.Group();
  root.name = 'period-lifeboat';
  const { pivot, body } = makeBoat();
  root.add(pivot);

  const occupiedSeats = [
    { bench: 0, x: -0.25, color: '#293746', female: false, hat: false, scale: 0.89, turn: -0.15, gaze: -0.18 },
    { bench: 0, x: 0.25, color: '#705845', female: true, hat: true, scale: 0.83, turn: 0.12, gaze: 0.20 },
    { bench: 1, x: -0.34, color: '#56606a', female: false, hat: true, scale: 0.91, turn: -0.08, gaze: 0.27 },
    { bench: 4, x: 0.34, color: '#493d3b', female: true, hat: false, scale: 0.86, turn: 0.09, gaze: -0.23 }
  ];
  const passengers = [];
  if (variant === 'occupied') {
    for (const [index, seat] of occupiedSeats.entries()) {
      const passenger = person({ seated: true, color: seat.color, female: seat.female, hat: seat.hat });
      passenger.scale.setScalar(seat.scale);
      passenger.position.set(seat.x, 0.08, BENCH_Z[seat.bench]);
      passenger.rotation.y = seat.turn;
      body.add(passenger);
      passengers.push({ passenger, gaze: seat.gaze, phase: index * 0.61 });
    }
  }

  root.userData.seating = {
    benchZ: [...BENCH_Z],
    benchSpans: BENCH_Z.map((z) => beamAt(z) * 1.56),
    occupiedBenches: variant === 'occupied' ? [0, 1, 4] : [],
    vacantBenches: variant === 'occupied' ? [2, 3, 5] : [...BENCH_Z.keys()],
    benchTopY: 0.915,
    schematic: true
  };
  root.userData.sample = (time = 0) => {
    const t = Number.isFinite(time) ? time : 0;
    pivot.position.y = 0.36 + 0.022 * Math.sin(t * 0.78 + 0.2);
    pivot.rotation.x = 0.010 * Math.sin(t * 0.67 + 0.4);
    pivot.rotation.z = 0.014 * Math.sin(t * 0.53);
    passengers.forEach(({ passenger, gaze, phase }) => {
      passenger.userData.sample?.(t * 0.72 + phase);
      const rig = passenger.userData.rig;
      if (!rig) return;
      rig.head.rotation.y = gaze + Math.sin(t * 0.28 + phase) * 0.025;
      rig.upper.rotation.y = passenger.rotation.y * 0.22;
    });
  };
  root.userData.sample(0);
  return root;
}
