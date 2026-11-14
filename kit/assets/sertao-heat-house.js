import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function surfaceTexture(hex, variation = 8, seed = 7, size = 128) {
  const data = new Uint8Array(size * size * 4), base = [hex >> 16 & 255, hex >> 8 & 255, hex & 255];
  let s = seed >>> 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const grain = ((s / 4294967296) - .5) * variation;
    const drift = Math.sin(x * .11 + y * .037) * variation * .16 + Math.sin(y * .15 - x * .024) * variation * .11;
    const index = (y * size + x) * 4;
    data[index] = Math.max(0, Math.min(255, base[0] + grain + drift));
    data[index + 1] = Math.max(0, Math.min(255, base[1] + grain + drift));
    data[index + 2] = Math.max(0, Math.min(255, base[2] + grain + drift));
    data[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 1.7); texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true;
  return texture;
}

const MAT = {
  ground: new THREE.MeshStandardMaterial({ color: 0x9d6743, roughness: 0.96 }),
  soil: new THREE.MeshStandardMaterial({ color: 0x70462f, roughness: 1 }),
  plaster: new THREE.MeshStandardMaterial({ color: 0xd9c6a4, roughness: 0.88 }),
  plasterLight: new THREE.MeshStandardMaterial({ color: 0xe8d9bd, roughness: 0.82 }),
  cut: new THREE.MeshStandardMaterial({ color: 0x8f6851, roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x70482f, roughness: 0.68 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xa7784f, roughness: 0.63 }),
  tile: new THREE.MeshStandardMaterial({ color: 0x98533a, roughness: 0.76 }),
  tileLight: new THREE.MeshStandardMaterial({ color: 0xb46b4a, roughness: 0.73 }),
  tilePale: new THREE.MeshStandardMaterial({ color: 0xc7a981, roughness: 0.72 }),
  concrete: new THREE.MeshStandardMaterial({ color: 0x9c8b76, roughness: 0.83 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x8a918f, metalness: 0.77, roughness: 0.24 }),
  fanBlade: new THREE.MeshPhysicalMaterial({ color: 0xc6cbc9, metalness: 0.28, roughness: 0.4, clearcoat: 0.22, clearcoatRoughness: 0.32, side: THREE.DoubleSide }),
  foil: new THREE.MeshPhysicalMaterial({ color: 0xaab4b1, metalness: 0.86, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.22, side: THREE.DoubleSide }),
  wool: new THREE.MeshStandardMaterial({ color: 0xbba878, roughness: 0.94, side: THREE.DoubleSide }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x6ca9a1, roughness: 0.24, metalness: 0.08, transmission: 0.12, transparent: true, opacity: 0.58 }),
  linen: new THREE.MeshStandardMaterial({ color: 0xe2d6c2, roughness: 0.95 }),
  linenBlue: new THREE.MeshStandardMaterial({ color: 0x65837d, roughness: 0.94 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x718c84, roughness: 0.86 }),
  trousers: new THREE.MeshStandardMaterial({ color: 0x536962, roughness: 0.8 }),
  skin: new THREE.MeshStandardMaterial({ color: 0x9f684b, roughness: 0.72 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x332720, roughness: 0.84 }),
  heat: new THREE.MeshBasicMaterial({ color: 0xff8b52, transparent: true, opacity: 0.77, depthWrite: false }),
  heatSoft: new THREE.MeshBasicMaterial({ color: 0xff9d59, transparent: true, opacity: 0.36, depthWrite: false }),
  air: new THREE.MeshBasicMaterial({ color: 0x71ded6, transparent: true, opacity: 0.92, depthWrite: false }),
  airSoft: new THREE.MeshBasicMaterial({ color: 0x8fe4dd, transparent: true, opacity: 0.2, depthWrite: false }),
  glint: new THREE.MeshBasicMaterial({ color: 0xf5e6bc, transparent: true, opacity: 0.8, depthWrite: false }),
  dark: new THREE.MeshStandardMaterial({ color: 0x342c28, roughness: 0.8 }),
  ceramic: new THREE.MeshStandardMaterial({ color: 0xf1e7d6, roughness: 0.34 }),
  clothAccent: new THREE.MeshStandardMaterial({ color: 0xb37459, roughness: 0.9 })
};
MAT.plaster.map = surfaceTexture(0xd9c6a4, 10, 37);
MAT.plasterLight.map = surfaceTexture(0xe8d9bd, 8, 49);
MAT.tile.map = surfaceTexture(0x98533a, 15, 73);
MAT.tileLight.map = surfaceTexture(0xb46b4a, 13, 101);
MAT.tilePale.map = surfaceTexture(0xc7a981, 10, 131);
MAT.wood.map = surfaceTexture(0x70482f, 16, 177);
MAT.woodLight.map = surfaceTexture(0xa7784f, 15, 211);
MAT.concrete.map = surfaceTexture(0x9c8b76, 9, 263);
MAT.wool.map = surfaceTexture(0xbba878, 8, 307);

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 24);
const ease = x => { const t = THREE.MathUtils.clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function group(name) { const g = new THREE.Group(); g.name = name; return g; }
function mesh(parent, geo, material, position, scale, name = '') {
  const m = new THREE.Mesh(geo, material); m.position.set(...position); m.scale.set(...scale); m.name = name;
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function box(parent, material, position, scale, name = '') { return mesh(parent, boxGeo, material, position, scale, name); }
function softBox(parent, material, position, scale, radius, name = '') {
  const geo = new RoundedBoxGeometry(scale[0],scale[1],scale[2],2,Math.min(radius,scale[1]*0.45));
  return mesh(parent,geo,material,position,[1,1,1],name);
}
function sphere(parent, material, position, scale, name = '') { return mesh(parent, sphereGeo, material, position, scale, name); }
function tube(parent, points, radius, material, name = '') {
  const curve = new THREE.CatmullRomCurve3(points.map(p => Array.isArray(p) ? v3(...p) : p));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 8, false), material);
  m.name = name; m.castShadow = false; m.receiveShadow = false; parent.add(m); return { mesh: m, curve };
}
function cylinderBetween(parent, a, b, radius, material, name = '') {
  const p1 = v3(...a), p2 = v3(...b), d = p2.clone().sub(p1);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 12), material);
  m.position.copy(p1.add(p2).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize());
  m.name = name; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function curvedTileGeometry(length = 0.62, width = 0.61, thickness = 0.065, direction = 1, angle = 0.406) {
  const along = 8, across = 12, vertices = [], indices = [];
  const normalX = -direction * Math.sin(angle), normalY = Math.cos(angle);
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i <= along; i++) for (let j = 0; j <= across; j++) {
      const u = i / along, v = j / across, s = (u - 0.5) * length, z = (v - 0.5) * width;
      const crown = 0.058 * Math.sin(v * Math.PI);
      let x = direction * s * Math.cos(angle), y = s * Math.sin(angle) + crown;
      if (layer) { x -= normalX * thickness; y -= normalY * thickness; }
      vertices.push(x, y, z);
    }
  }
  const row = across + 1, layerSize = (along + 1) * row, idx = (i,j,l=0) => l * layerSize + i * row + j;
  for (let i = 0; i < along; i++) for (let j = 0; j < across; j++) {
    const a=idx(i,j), b=idx(i+1,j), c=idx(i,j+1), d=idx(i+1,j+1);
    const A=idx(i,j,1), B=idx(i+1,j,1), C=idx(i,j+1,1), D=idx(i+1,j+1,1);
    if(direction>0){indices.push(a,c,b,c,d,b,A,B,C,C,B,D);}
    else{indices.push(a,b,c,b,d,c,A,C,B,C,D,B);}
  }
  // Edge closures: left/right ends and the two tile sides.
  for (let i=0;i<along;i++) {
    const a=idx(i,0),b=idx(i+1,0),A=idx(i,0,1),B=idx(i+1,0,1);indices.push(a,b,A,b,B,A);
    const c=idx(i,across),d=idx(i+1,across),C=idx(i,across,1),D=idx(i+1,across,1);indices.push(c,C,d,d,C,D);
  }
  for (let j=0;j<across;j++) {
    const a=idx(0,j),b=idx(0,j+1),A=idx(0,j,1),B=idx(0,j+1,1);indices.push(a,A,b,b,A,B);
    const c=idx(along,j),d=idx(along,j+1),C=idx(along,j,1),D=idx(along,j+1,1);indices.push(c,d,C,d,D,C);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}
function createRoom() {
  const r = group('quarto-corte');
  // Solo e piso assentam no mesmo nível; a frente e parte da lateral ficam cortadas para leitura.
  box(r, MAT.soil, [0, -0.19, 0], [5.45, 0.4, 4.25], 'sapata-de-solo');
  box(r, MAT.concrete, [0, 0.035, 0], [5.45, 0.16, 4.25], 'piso-terrazzo');
  box(r, MAT.plaster, [0, 1.45, -2.02], [5.45, 2.9, 0.18], 'parede-fundo');
  // Paredes laterais com vãos opostos, compostas para que a ventilação não atravesse alvenaria.
  for (const side of [-1, 1]) {
    const x = side * 2.63;
    box(r, MAT.plaster, [x, 0.72, -1.35], [0.22, 1.44, 1.32], `parede-lateral-${side}-posterior`);
    box(r, MAT.plaster, [x, 0.72, 1.35], [0.22, 1.44, 1.32], `parede-lateral-${side}-frontal`);
    box(r, MAT.plaster, [x, 0.34, 0], [0.22, 0.68, 1.38], `parede-lateral-${side}-peitoril`);
    box(r, MAT.plaster, [x, 2.47, 0], [0.22, 0.5, 1.38], `parede-lateral-${side}-verga`);
  }
  // Gable back closes the interior; the open front remains a clean section cut.
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-2.72, 2.82); gableShape.lineTo(2.72, 2.82); gableShape.lineTo(0, 4.16); gableShape.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(gableShape, { depth: 0.16, bevelEnabled: false }), MAT.plasterLight);
  gable.position.z = -2.13; gable.name = 'frontao-de-empenas'; gable.castShadow = true; r.add(gable);
  // Cut edges have a darker reveal, making the removal read as an intentional section.
  box(r, MAT.cut, [-2.72, 1.48, 0.05], [0.035, 2.88, 4.1], 'aresta-corte-lateral');
  box(r, MAT.cut, [0, 0.12, 2.13], [5.35, 0.04, 0.04], 'aresta-corte-frontal');
  // Bed, frame and linen give the room scale and return composition.
  softBox(r, MAT.wood, [-0.56, 0.38, -0.12], [2.45, 0.42, 1.54],0.055,'estrutura-cama');
  for(const x of [-1.58,0.46])for(const z of [-0.72,0.48])cylinderBetween(r,[x,0.13,z],[x,0.34,z],0.065,MAT.woodLight,`pe-cama-${x}-${z}`);
  softBox(r, MAT.linen, [-0.56, 0.72, -0.12], [2.34, 0.22, 1.43],0.075,'colchao');
  softBox(r, MAT.ceramic, [-1.22, 0.86, -0.12], [0.68, 0.22, 0.93],0.1,'travesseiro');
  softBox(r, MAT.linenBlue, [-0.24, 0.81, 0.02], [1.43, 0.1, 1.3],0.045,'manta-de-cama');
  for (let i = 0; i < 4; i++) box(r, MAT.clothAccent, [-0.85 + i * 0.32, 0.87, 0.68], [0.018, 0.018, 0.34], `costura-manta-${i}`);
  // A low clay washstand and a small clay vessel anchor the room without turning it into a prop shelf.
  softBox(r, MAT.woodLight, [1.78, 0.58, -1.28], [0.95, 0.14, 0.62],0.04,'mesa-lateral');
  for (const x of [1.42, 2.14]) box(r, MAT.wood, [x, 0.29, -1.28], [0.09, 0.58, 0.09], `pe-mesa-${x}`);
  const vase = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(0.14, 0.02), new THREE.Vector2(0.2, 0.18), new THREE.Vector2(0.17, 0.39), new THREE.Vector2(0.11, 0.49), new THREE.Vector2(0.08, 0.62)
  ], 20), new THREE.MeshStandardMaterial({ color: 0x9b654c, roughness: 0.78 }));
  vase.position.set(1.77, 0.68, -1.28); vase.name = 'pote-ceramico-local'; r.add(vase);
  // Ground layer with a quiet semi-arid horizon and restrained native planting.
  box(r, MAT.ground, [0, -0.47, -0.1], [12, 0.16, 8], 'terreno-ocre');
  const hillMats = [0x8b654b, 0xa17453, 0xb0835d].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  for (let i = 0; i < 4; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), hillMats[i % hillMats.length]);
    hill.scale.set(2.5 + i * 0.4, 0.88 + i * 0.12, 0.48); hill.position.set(-4.7 + i * 3.2, -0.3, -3.1 - (i % 2) * 0.35); hill.name = `relevo-semiarido-${i}`; r.add(hill);
  }
  const shrubMats = [0x697653,0x7c8054,0x586b52].map(color=>new THREE.MeshStandardMaterial({color,roughness:0.94}));
  for (let i = 0; i < 5; i++) {
    const x = -4.9 + i * 2.45, z = 2.95 + (i % 2) * 0.28;
    for(let j=0;j<6;j++){
      const theta=j*2.399+i*.37,spread=.16+(j%3)*.075;
      const leaf=sphere(r,shrubMats[(i+j)%shrubMats.length],[x+Math.cos(theta)*spread,-0.325+(j%2)*.025,z+Math.sin(theta)*spread*.7],[.2,.055,.085],`folhagem-baixa-${i}-${j}`);
      leaf.rotation.y=theta;
    }
    cylinderBetween(r,[x,-0.37,z],[x+0.07,-0.19,z+0.04],0.022,MAT.wood,`galho-baixo-${i}`);
  }
  return r;
}

function createRoof() {
  const r = group('cobertura-em-corte');
  const eaveY = 3.17, ridgeY = 4.34, half = 2.72, angle = Math.atan((ridgeY - eaveY) / half), slope = Math.hypot(half, ridgeY - eaveY);
  for (let i = 0; i < 7; i++) {
    const z = -1.85 + i * 0.62;
    // Rafters and purlins remain visible in section and give the roof real depth.
    cylinderBetween(r, [-half, eaveY - 0.06, z], [0, ridgeY - 0.06, z], 0.065, MAT.wood, `caibro-esquerdo-${i}`);
    cylinderBetween(r, [0, ridgeY - 0.06, z], [half, eaveY - 0.06, z], 0.065, MAT.wood, `caibro-direito-${i}`);
  }
  for (const x of [-1.82, -0.82, 0.82, 1.82]) box(r, MAT.woodLight, [x, 3.08, 0], [0.075, 0.16, 4.12], `terca-${x}`);
  // Individually overlapped clay tiles; deterministic rows preserve the local hand-laid character.
  const tileGeoLeft = curvedTileGeometry(0.64,0.61,0.065,1,angle), tileGeoRight = curvedTileGeometry(0.64,0.61,0.065,-1,angle);
  const tilePalette = [MAT.tile, MAT.tileLight, MAT.tile.clone(), MAT.tile.clone()];
  tilePalette[2].color.set(0x9f5b40); tilePalette[3].color.set(0xaa6245);
  const tileMeshes=[];
  for (const side of [-1, 1]) {
    const geo = side < 0 ? tileGeoLeft : tileGeoRight;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const along = 0.31 + row * 0.47;
        const x = side < 0 ? -half + along*Math.cos(angle) : half - along*Math.cos(angle);
        const y = eaveY + along*Math.sin(angle) + 0.06;
        const z = -1.86 + col * 0.61 + (row % 2) * 0.12;
        const mat = tilePalette[(row*3 + col*2 + (row%2)) % tilePalette.length];
        const tile = new THREE.Mesh(geo,mat);tile.position.set(x,y,z);tile.name=`telha-${side}-${row}-${col}`;tile.castShadow=true;tile.receiveShadow=true;tile.userData.baseMaterial=mat;tile.userData.lightTileMaterial=MAT.tilePale;tile.userData.lightTilePlane=side>0;tile.userData.roofSide=side;tile.userData.row=row;tile.userData.col=col;r.add(tile);tileMeshes.push(tile);
      }
    }
  }
  const reflectionLines=[];
  for(const z of [-0.52,0.09,0.7]){
    const slope=(ridgeY-eaveY)/half,x=1.16,y=ridgeY-slope*x+0.12;
    const streak=tube(r,[[x-0.05,y+0.02,z-0.16],[x,y,z],[x+0.05,y-0.02,z+0.16]],0.006,MAT.glint.clone(),`reflexo-telha-clara-${z}`);
    streak.mesh.userData.reflectionBasePosition=streak.mesh.position.clone();
    streak.mesh.visible=false;reflectionLines.push(streak.mesh);
  }
  // Clay ridge caps overlap one another along the ridge; each is a curved, hollow ceramic segment.
  const ridgeGeo = new THREE.CylinderGeometry(0.19,0.19,0.7,20,1,true,Math.PI,Math.PI);
  ridgeGeo.rotateX(Math.PI/2);
  for(let i=0;i<7;i++){
    const cap=new THREE.Mesh(ridgeGeo,i%3===0?MAT.tileLight:MAT.tile);cap.position.set(0,ridgeY+0.12,-1.9+i*0.62);cap.name=`peca-cumeeira-${i}`;cap.castShadow=true;cap.receiveShadow=true;r.add(cap);
  }
  // Eaves and ridge openings are physical dark slots, not animated arrows pretending to be openings.
  for (const side of [-1, 1]) {
    box(r, MAT.dark, [side * 2.66, eaveY - 0.03, 0], [0.13, 0.18, 1.22], `entrada-beiral-${side}`);
    for (let j = 0; j < 5; j++) box(r, MAT.woodLight, [side * 2.58, eaveY - 0.03, -0.5 + j * 0.25], [0.06, 0.03, 0.035], `tela-beiral-${side}-${j}`);
  }
  box(r, MAT.dark, [0, ridgeY + 0.015, -0.1], [0.22, 0.08, 1.18], 'saida-cumeeira');
  r.userData.dimensions = { ridge: ridgeY, eave: eaveY, slope, angle };r.userData.tileMeshes=tileMeshes;r.userData.reflectionLines=reflectionLines;
  return r;
}

function createFoil() {
  const r = group('manta-refletiva');
  const eaveY = 3.17, ridgeY = 4.34, half = 2.72, angle = Math.atan((ridgeY - eaveY) / half);
  for (const side of [-1, 1]) {
    const panel = box(r, MAT.foil, [side * 1.36, (eaveY + ridgeY) * 0.5 - 0.04, 0], [3.08, 0.026, 3.72], `folha-aluminizada-${side}`);
    panel.rotation.z = side < 0 ? angle : -angle;
    // Fine transverse folds stay inside each roof plane and catch the light at mobile scale.
    for (let line = 0; line < 8; line++) {
      const along = 0.22 + line * 0.36;
      const x = side * (half - along * Math.cos(angle));
      const y = eaveY + along * Math.sin(angle) - 0.025;
      const crease = box(r, MAT.metal, [x, y, 0], [0.012, 0.012, 3.68], `vinco-manta-${side}-${line}`);
      crease.rotation.z = side < 0 ? angle : -angle;
    }
  }
  return r;
}

function createWool() {
  const r = group('isolamento-la-rocha');
  const baseY = 2.92;
  for (let i = 0; i < 10; i++) {
    const x = -2.32 + i * 0.515;
    const pad = box(r, i % 2 ? MAT.wool : new THREE.MeshStandardMaterial({ color: 0xc4b07d, roughness: 0.95 }), [x, baseY + 0.105, 0], [0.58, 0.2, 3.72], `manta-fibra-${i}`);
    // Subtle ridges make the soft fibrous blanket read as insulation rather than a second slab.
    for (let ridge = 0; ridge < 4; ridge++) {
      const line = box(r, MAT.tilePale, [x - 0.22 + ridge * 0.14, baseY + 0.21, 0], [0.012, 0.018, 3.56], `fibra-longa-${i}-${ridge}`);
      line.material = MAT.wool;
    }
    pad.castShadow = false;
  }
  return r;
}

function createFan() {
  const r = group('ventilador-pedestal'); r.position.set(1.82, 0, 0.88); r.rotation.y = -Math.PI / 2;
  const pedestal = group('pedestal'); pedestal.position.set(0, 0, 0); r.add(pedestal);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.43, 0.1, 40), MAT.metal); base.position.y = 0.12; base.name = 'base-circular'; pedestal.add(base);
  cylinderBetween(pedestal, [0, 0.18, 0], [0, 1.06, 0], 0.047, MAT.metal, 'coluna-telescopica');
  box(pedestal, MAT.dark, [0, 0.32, 0], [0.19, 0.18, 0.17], 'seletor-de-velocidade');
  const head = group('cabeca-do-ventilador'); head.position.set(0, 1.32, 0); pedestal.add(head); r.userData.head = head;
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.03, 8, 48), MAT.metal); guard.name = 'aro-frontal'; guard.position.z = 0.08; head.add(guard);
  const rearGuard = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.014, 6, 40), MAT.metal); rearGuard.name = 'aro-traseiro'; rearGuard.position.z = -0.02; head.add(rearGuard);
  const rotor = group('rotor'); rotor.position.z = 0.04; head.add(rotor); r.userData.rotor = rotor;
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), MAT.ceramic); hub.name = 'miolo'; rotor.add(hub);
  for (let i = 0; i < 3; i++) {
    const shape = new THREE.Shape(); shape.moveTo(0.08, 0.07); shape.quadraticCurveTo(0.38, 0.3, 0.43, 0.45); shape.quadraticCurveTo(0.17, 0.39, 0.04, 0.16); shape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.028, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.008, bevelThickness: 0.006, curveSegments: 12 });
    bladeGeo.translate(0, 0, -0.014);
    const blade = new THREE.Mesh(bladeGeo, MAT.fanBlade);
    blade.rotation.z = i * Math.PI * 2 / 3; blade.position.z = -0.02; blade.name = `helice-${i}`; rotor.add(blade);
  }
  for (let i = 0; i < 20; i++) {
    const theta = i * Math.PI * 2 / 20;
    const spoke = box(head, MAT.metal, [Math.cos(theta) * 0.26, Math.sin(theta) * 0.26, 0.05], [0.53, 0.014, 0.014], `grade-radial-${i}`);
    spoke.rotation.z = theta;
  }
  return r;
}

function createPerson() {
  const r = group('pessoa-na-cama'); r.position.set(-0.3, 0.73, 0.1);
  const body = group('corpo'); body.rotation.z = -0.08; r.add(body);
  // Person is a stylized adult with layered clothing and a clear silhouette, not a copied reference character.
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.78, 8, 16), MAT.shirt);
  torso.rotation.z = Math.PI / 2; torso.position.set(-0.1, 0.01, 0); torso.name = 'tronco-deitado'; body.add(torso);
  const hip = new THREE.Mesh(new THREE.CapsuleGeometry(0.23, 0.42, 6, 14), MAT.trousers); hip.rotation.z = Math.PI / 2; hip.position.set(-0.78, -0.02, 0); hip.name = 'quadril'; body.add(hip);
  const head = sphere(body, MAT.skin, [0.58, 0.11, 0], [0.29, 0.28, 0.26], 'rosto');
  sphere(body, MAT.hair, [0.56, 0.27, -0.015], [0.29, 0.16, 0.265], 'cabelo');
  sphere(body, MAT.dark, [0.77, 0.13, 0.225], [0.026, 0.027, 0.018], 'olho-visivel');
  const arm = group('braco-gestual'); arm.position.set(0.13, 0.05, 0.18); body.add(arm); r.userData.gestureArm = arm;
  cylinderBetween(arm, [0, 0, 0], [0.37, -0.05, 0.1], 0.09, MAT.shirt, 'braço-superior');
  cylinderBetween(arm, [0.37, -0.05, 0.1], [0.53, 0.04, 0.12], 0.066, MAT.skin, 'antebraço');
  sphere(arm, MAT.skin, [0.55, 0.045, 0.12], [0.09, 0.055, 0.055], 'mão');
  const farArm = group('braco-apoiado'); farArm.position.set(0.06, -0.02, -0.2); body.add(farArm);
  cylinderBetween(farArm, [0, 0, 0], [0.36, -0.11, -0.04], 0.082, MAT.shirt, 'manga');
  cylinderBetween(farArm, [0.36, -0.11, -0.04], [0.52, -0.11, -0.02], 0.057, MAT.skin, 'mão-apoiada');
  // An ear and collar catch the warm key and prevent a blank, mannequin-like head.
  sphere(body, MAT.skin, [0.48, 0.095, 0.245], [0.07, 0.09, 0.03], 'orelha');
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 8, 24), MAT.ceramic); collar.position.set(0.28, 0.02, 0); collar.rotation.y = Math.PI / 2; body.add(collar);
  // A second authored pose lets the same person work the opposite window during cross-ventilation.
  const windowFigure = group('pessoa-junto-a-janela'); windowFigure.position.set(-1.62,-0.73,0.16); windowFigure.rotation.y=-Math.PI/2; windowFigure.visible=false; r.add(windowFigure); r.userData.windowPerson=windowFigure;
  const uprightTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.245,0.47,8,16),MAT.shirt);uprightTorso.position.set(0,1.26,0);uprightTorso.name='tronco-em-pe';windowFigure.add(uprightTorso);
  const waist = new THREE.Mesh(new THREE.CapsuleGeometry(0.21,0.24,6,14),MAT.trousers);waist.position.set(0,0.82,0);waist.name='quadril-em-pe';windowFigure.add(waist);
  sphere(windowFigure,MAT.skin,[0,1.79,0],[0.25,0.285,0.235],'rosto-em-pe');
  sphere(windowFigure,MAT.hair,[0,1.95,-0.015],[0.255,0.145,0.24],'cabelo-em-pe');
  sphere(windowFigure,MAT.dark,[-0.085,1.82,0.207],[0.023,0.026,0.018],'olho-em-pe');
  cylinderBetween(windowFigure,[-0.13,0.82,0],[ -0.16,0.18,0.035],0.095,MAT.trousers,'perna-esquerda');
  cylinderBetween(windowFigure,[0.13,0.82,0],[0.16,0.18,0.035],0.095,MAT.trousers,'perna-direita');
  box(windowFigure,MAT.dark,[-0.16,0.11,0.1],[0.25,0.11,0.42],'sapato-esquerdo');
  box(windowFigure,MAT.dark,[0.16,0.11,0.1],[0.25,0.11,0.42],'sapato-direito');
  const reach = group('braco-que-alcanca-veneziana');reach.position.set(-0.25,1.48,0);windowFigure.add(reach);r.userData.windowGestureArm=reach;
  cylinderBetween(reach,[0,0,0],[0,0.02,0.39],0.082,MAT.shirt,'manga-alcancando');
  cylinderBetween(reach,[0,0.02,0.39],[0,0.03,0.66],0.058,MAT.skin,'antebraco-alcancando');
  sphere(reach,MAT.skin,[0,0.035,0.71],[0.07,0.045,0.1],'mão-na-lâmina');
  const relaxedArm=group('braco-relaxado-janela');relaxedArm.position.set(0.25,1.48,0);windowFigure.add(relaxedArm);
  cylinderBetween(relaxedArm,[0,0,0],[0,-0.28,0.06],0.08,MAT.shirt,'manga-relaxada');
  cylinderBetween(relaxedArm,[0,-0.28,0.06],[0.01,-0.52,0.12],0.055,MAT.skin,'antebraco-relaxado');
  r.userData.windowRelaxedArm=relaxedArm;
  return r;
}

function createWindows() {
  const r = group('janelas-opostas-veneziana');
  const leaves = [];
  for (const side of [-1, 1]) {
    const x = side * 2.63;
    const frame = group(`caixilho-${side}`); frame.position.set(x, 1.48, 0); frame.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; r.add(frame);
    box(frame, MAT.wood, [0, 0, 0], [1.44, 1.34, 0.12], `marco-${side}`);
    box(frame, MAT.glass, [0, 0, 0.075], [1.27, 1.17, 0.026], `vidro-${side}`);
    box(frame, MAT.woodLight, [0, 0, 0.1], [0.075, 1.2, 0.06], `montante-${side}`);
    for (const hinge of [-1, 1]) {
      const shutter = group(`veneziana-${side}-${hinge}`); shutter.position.set(hinge * 0.31, 0, 0.15); frame.add(shutter); leaves.push({ shutter, side, hinge });
      const inward = -hinge * 0.31;
      box(shutter, MAT.wood, [inward, 0, 0], [0.63, 1.22, 0.1], `folha-${side}-${hinge}`);
      for (let i = 0; i < 8; i++) {
        const slat = box(shutter, MAT.woodLight, [inward, -0.5 + i * 0.14, 0.065], [0.58, 0.045, 0.035], `lamela-${side}-${hinge}-${i}`); slat.rotation.z = -0.13;
      }
      // Small bronze handles meet near the center of the closed pair.
      sphere(shutter, MAT.metal, [inward + hinge * 0.2, 0, 0.12], [0.035, 0.06, 0.035], `puxador-${side}-${hinge}`);
    }
  }
  r.userData.shutters = leaves;
  return r;
}

function createSlab() {
  const r = group('laje-de-concreto');
  box(r, MAT.concrete, [0, 2.83, 0], [5.5, 0.32, 4.2], 'corpo-da-laje');
  box(r, MAT.cut, [0, 2.83, 2.11], [5.54, 0.35, 0.035], 'face-em-corte');
  // Fine aggregate flecks add scale; placement is deterministic and deliberately sparse.
  for (let i = 0; i < 34; i++) {
    const x = ((i * 17) % 47) / 10 - 2.3, z = ((i * 11) % 33) / 10 - 1.6;
    sphere(r, i % 3 ? MAT.cut : MAT.plasterLight, [x, 2.997, z], [0.025 + (i % 3) * 0.008, 0.008, 0.018], `agregado-${i}`);
  }
  return r;
}

function createHeat() {
  const r = group('radiação-e-calor-residual');
  const atticGlow = sphere(r, new THREE.MeshBasicMaterial({ color: 0xff8f50, transparent: true, opacity: 0.1, depthWrite: false }), [0, 3.64, -0.12], [1.55, 0.42, 1.88], 'bolsa-de-ar-aquecido');
  atticGlow.castShadow = false;
  const rays = [];
  for (let i = 0; i < 5; i++) {
    const x = -1.8 + i * 0.9;
    const z = 1.72;
    const item = tube(r, [[x, 4.0, z], [x + 0.1, 3.75, z], [x - 0.04, 3.53, z], [x + 0.11, 3.32, z]], 0.018, MAT.heat, `raio-radiativo-${i}`);
    const orb = sphere(r, MAT.glint, [x, 3.8, z], [0.075, 0.075, 0.075], `pulso-radiacao-${i}`);
    rays.push({ ...item, orb });
  }
  // Heat entering the room follows the slab's inner surface, not a smoke column.
  // Keep the heat transfer legible beside the bed rather than drawing a hot
  // diagonal through the person's face and torso in the reverse close-up.
  const roomPath = tube(r, [[-2.18, 2.62, 1.66], [-2.08, 2.14, 1.64], [-1.85, 1.68, 1.6], [-1.58, 1.25, 1.56]], 0.031, MAT.heatSoft, 'calor-da-laje-ao-quarto');
  // Small original visual insert for the spoken oven analogy, kept separate from the house model.
  const ovenAnalogy = group('analogia-forno-sem-encostar'); ovenAnalogy.visible = false;
  const card = new THREE.Mesh(new RoundedBoxGeometry(1.08,0.58,0.035,3,0.055), new THREE.MeshBasicMaterial({color:0x11191d,transparent:true,opacity:0.88,depthWrite:false}));
  card.name='fundo-da-analogia';card.position.z=-0.025;ovenAnalogy.add(card);
  const ovenClay = new THREE.MeshStandardMaterial({color:0x99563d,roughness:0.9});
  softBox(ovenAnalogy,ovenClay,[-0.17,-0.07,0.06],[0.52,0.32,0.18],0.08,'forno-de-barro');
  sphere(ovenAnalogy,new THREE.MeshBasicMaterial({color:0x2b1b17}),[-0.16,-0.07,0.162],[0.13,0.105,0.024],'boca-do-forno');
  sphere(ovenAnalogy,new THREE.MeshBasicMaterial({color:0xff8c44,transparent:true,opacity:0.86}),[-0.16,-0.06,0.19],[0.075,0.065,0.012],'calor-visivel-no-forno');
  cylinderBetween(ovenAnalogy,[-0.41,-0.25,0.04],[0.2,-0.25,0.04],0.025,MAT.woodLight,'apoio-do-forno');
  const retreatingHand=group('mao-que-recuo');retreatingHand.position.set(0.42,-0.08,0.15);ovenAnalogy.add(retreatingHand);
  cylinderBetween(retreatingHand,[0.15,0,0],[0,0.03,0.015],0.065,MAT.shirt,'antebraco-da-analogia');
  cylinderBetween(retreatingHand,[0,0.03,0.015],[-0.13,0.055,0.035],0.047,MAT.skin,'mao-da-analogia');
  sphere(retreatingHand,MAT.skin,[-0.15,0.055,0.04],[0.065,0.055,0.045],'dedos-da-analogia');
  const heatShimmer=[];
  for(let i=0;i<3;i++)heatShimmer.push(tube(ovenAnalogy,[[-0.02+i*0.055,-0.01,0.18],[0.015+i*0.055,0.07,0.19],[-0.005+i*0.055,0.14,0.2]],0.008,MAT.heat,`ar-quente-do-forno-${i}`).mesh);
  ovenAnalogy.userData.hand=retreatingHand;ovenAnalogy.userData.shimmer=heatShimmer;
  r.add(ovenAnalogy);
  r.userData.rays = rays; r.userData.roomPath = roomPath.curve; r.userData.ovenAnalogy=ovenAnalogy;
  return r;
}

function createAirflow() {
  const r = group('fluxos-de-ar');
  const paths = [];
  for (const z of [0.42, 1.38]) for (const side of [-1,1]) {
    const item = tube(r, [[side*2.64,3.13,z],[side*2.08,3.38,z],[side*1.35,3.69,z],[side*0.66,4.04,z],[side*0.14,4.3,z]], 0.038, MAT.air, `caminho-de-ar-${side}-${z}`);
    const particle = sphere(r, MAT.glint, [side*2.3,3.3,z], [0.082,0.082,0.082], `particula-de-ar-${side}-${z}`);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.095,0.2,12),MAT.air);arrow.position.set(side*0.19,4.21,z);arrow.quaternion.setFromUnitVectors(v3(0,1,0),item.curve.getTangentAt(0.92));arrow.name=`seta-saida-alta-${side}-${z}`;r.add(arrow);
    paths.push({ ...item, particle, arrow });
  }
  const failedMaterial = MAT.air.clone();
  const failed = tube(r, [[0,3.67,1.38],[0.08,3.86,1.38],[-0.08,4.04,1.38],[0,4.21,1.38]], 0.028, failedMaterial, 'tentativa-sem-entrada');
  const roomPaths = [];
  for (const z of [-0.55, 0.24, 0.94]) {
    const item = tube(r, [[-2.55,1.62+z*0.08,z],[-1.55,1.72+z*0.06,z+0.08],[-0.2,1.54,z],[1.08,1.62,z-0.08],[2.53,1.76,z]],0.035,MAT.air,`ventilacao-cruzada-quarto-${z}`);
    const particle = sphere(r, MAT.glint, [-2.15, 1.65, z], [0.075, 0.075, 0.075], `particula-quarto-${z}`);
    roomPaths.push({ ...item, particle });
  }
  // Arc above the eyes, then curl toward the cheek. A low, thin strand read as
  // a rigid laser line across the neck at phone scale.
  const localBreeze = tube(r, [[1.72, 1.32, 0.88], [1.25, 1.8, 0.84], [0.48, 2.08, 0.8], [-0.34, 2.0, 0.74], [-0.42, 1.58, 0.7]], 0.008, MAT.air, 'brisa-local-ventilador');
  localBreeze.mesh.material = MAT.air.clone();
  localBreeze.mesh.material.color.set(0x91d9d3);
  localBreeze.mesh.material.opacity = 0.42;
  localBreeze.particle = sphere(r, MAT.glint, [1.72, 1.32, 0.88], [0.042, 0.042, 0.042], 'particula-brisa-ventilador');
  r.userData.paths = paths; r.userData.roomPaths = roomPaths; r.userData.localBreeze = localBreeze;
  r.userData.failed = failed.mesh;
  return r;
}

function createSunAndLight() {
  const r = group('incidencia-solar-e-sombra');
  const hemi = new THREE.HemisphereLight(0xffdfb3, 0x4d4036, 1.25); hemi.name = 'ambiente-dia-noite'; r.add(hemi);
  const key = new THREE.DirectionalLight(0xffc77f, 3.3); key.name = 'luz-chave-solar'; key.position.set(-5.2,8.4,6.7); key.castShadow = true;
  key.shadow.mapSize.set(2048,2048); key.shadow.camera.left=-8; key.shadow.camera.right=8; key.shadow.camera.top=9; key.shadow.camera.bottom=-4; key.shadow.bias=-0.00035; key.shadow.normalBias=0.025;
  key.target.position.set(0,2.15,0); key.target.name='alvo-luz-solar'; r.add(key,key.target);
  const fill = new THREE.DirectionalLight(0xaac8dc, 1.05); fill.name='preenchimento-frio'; fill.position.set(6,5,3); r.add(fill);
  const warmRoom = new THREE.PointLight(0xff9463,0.72,8,1.7); warmRoom.name='luz-quarto'; warmRoom.position.set(0.1,2.35,0.55); r.add(warmRoom);
  const edge = new THREE.DirectionalLight(0xf8d5a0,1.1); edge.name='recorte-contraluz'; edge.position.set(1.8,5.4,-5.8); r.add(edge);
  r.userData.lights = { hemi, key, fill, warmRoom, edge };
  // A translucent warm beam is a visual cue; actual direct light is provided by the keyed light rig.
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffcd7d, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
  const shape = new THREE.Shape(); shape.moveTo(-0.32, 0); shape.lineTo(0.32, 0); shape.lineTo(1.45, -2.4); shape.lineTo(-1.45, -2.4); shape.closePath();
  const beam = new THREE.Mesh(new THREE.ShapeGeometry(shape), beamMat); beam.position.set(-2.52, 2.2, 0.15); beam.rotation.y = Math.PI / 2; beam.name = 'raio-de-sol'; r.add(beam);
  // Louver shadow stripes travel across the bed when the shutter closes.
  const shadow = group('sombra-das-lamelas'); shadow.position.set(-0.56, 1.43, 0.05); shadow.userData.initialY = shadow.position.y; r.add(shadow);
  const shadeMat = new THREE.MeshBasicMaterial({ color: 0x45372f, transparent: true, opacity: 0.16, depthWrite: false });
  for (let i = 0; i < 6; i++) box(shadow, shadeMat, [0, 0, -0.53 + i * 0.2], [2.35, 0.008, 0.055], `faixa-sombra-${i}`);
  r.userData.beam = beam; r.userData.shadow = shadow;
  return r;
}

function createMarkers() {
  const r = group('marcadores-de-conceito');
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27 + i * 0.08, 0.012, 8, 36), i === 0 ? MAT.air : MAT.heat);
    ring.position.set(0, 3.36, 0.4); ring.rotation.x = Math.PI / 2; ring.name = `anel-conceito-${i}`; r.add(ring);
  }
  const transition = box(r, MAT.glint, [0, 4.75, 0], [0.4, 0.035, 0.035], 'traço-match-cut');
  transition.rotation.z = -0.32;
  return r;
}

function createSoundGlyph() {
  const r = group('preview-fx-local');
  for (let i = 0; i < 5; i++) {
    const h = 0.12 + [0.12, 0.29, 0.18, 0.36, 0.16][i];
    box(r, i % 2 ? MAT.air : MAT.glint, [-0.3 + i * 0.15, h * 0.5, 0], [0.055, h, 0.055], `pulso-sonoro-${i}`);
  }
  return r;
}

function createCameraRig() {
  const r = group('camera-caminho-cobertura-quarto');
  const camera = new THREE.PerspectiveCamera(38,9/16,0.1,1000); camera.name='camera-de-revisao-9x16';
  camera.position.set(7.6,5.3,14.2); camera.lookAt(0,2.15,0); r.add(camera); r.userData.camera=camera;
  const body=box(r,MAT.dark,[0,0,0],[0.44,0.31,0.25],'corpo-camera-inspecao');
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.14,0.16,20),MAT.metal);lens.rotation.x=Math.PI/2;lens.position.set(0,0,0.19);lens.name='lente-camera';r.add(lens);
  body.castShadow=false;camera.layers.enable(1);
  return r;
}

const factories = {
  room: createRoom, roof: createRoof, foil: createFoil, wool: createWool, fan: createFan,
  person: createPerson, windows: createWindows, slab: createSlab, heat: createHeat,
  airflow: createAirflow, sun: createSunAndLight, labels: createMarkers, sound: createSoundGlyph, camera: createCameraRig
};

const factoryFor = {
  'scene-quarto-sertao': 'room', 'lighting-ciclo-dia-noite': 'sun', 'camera-caminho-cobertura-quarto': 'camera',
  'transition-volta-tarde': 'sun', 'roof-stack-corte': 'roof', 'material-telha-clara': 'roof',
  'animation-radiacao-e-transferencia': 'heat', 'effect-calor-armazenado-laje': 'slab',
  'object-ventilador-pedestal': 'fan', 'character-pessoa-quarto': 'person', 'animation-ventilador-alvo': 'airflow',
  'sound-motor-ventilador': 'sound', 'animation-atico-falha-solucao': 'airflow', 'overlay-rotulos-conceitos': 'labels',
  'effect-irradiacao-restante': 'heat', 'object-manta-refletiva': 'foil', 'material-aluminio-manta': 'foil',
  'animation-manta-comparacao': 'foil', 'sound-foley-camadas': 'sound', 'object-la-rocha': 'wool',
  'material-la-rocha': 'wool', 'animation-isolamento-fresta': 'wool', 'animation-inercia-laje': 'slab',
  'object-janelas-veneziana': 'windows', 'overlay-temperatura-relativa': 'labels', 'animation-ventilacao-cruzada': 'airflow',
  'animation-veneziana-sombra': 'sun', 'sound-fecho-veneziana': 'sound', 'animation-payoff-cama': 'person',
  'effect-calor-noite-teto': 'heat', 'effect-reflexao-telha': 'roof', 'overlay-label-barreira': 'labels',
  'overlay-label-isolamento': 'labels', 'overlay-label-inercia': 'labels', 'effect-calor-atico-fechado': 'heat'
};

export function createSceneSet() {
  return Object.fromEntries(Object.entries(factories).filter(([key]) => key !== 'camera').map(([key, factory]) => {
    const root = factory();
    root.userData.sample = t => {
      const time = Math.max(0, Number(t) || 0);
      if (root.userData.rotor) root.userData.rotor.rotation.z = time * 8.4;
      if (root.userData.gestureArm) root.userData.gestureArm.rotation.z = -0.1 + ease((time - 1.6) / 0.7) * 0.54 * (1 - ease((time - 3.5) / 0.6));
      if (root.userData.paths) root.userData.paths.forEach((path, i) => path.particle.position.copy(path.curve.getPointAt((time * 0.24 + i * 0.22) % 1)));
      if (root.userData.roomPaths) root.userData.roomPaths.forEach((path, i) => path.particle.position.copy(path.curve.getPointAt((time * 0.28 + i * 0.3) % 1)));
    };
    return [key, root];
  }));
}

export function create({ variant = 'scene-quarto-sertao' } = {}) {
  const normalized = String(variant).replace(/^[a-z0-9-]+:/, '');
  const key = factoryFor[normalized] || factoryFor[variant] || 'room';
  const root = factories[key]();
  root.userData.sample = t => {
    const time = Math.max(0, Number(t) || 0);
    if (root.userData.rotor) root.userData.rotor.rotation.z = time * 8.4;
    if (root.userData.gestureArm) root.userData.gestureArm.rotation.z = -0.1 + ease((time - 1.6) / 0.7) * 0.54 * (1 - ease((time - 3.5) / 0.6));
    if (root.userData.paths) root.userData.paths.forEach((path, i) => path.particle.position.copy(path.curve.getPointAt((time * 0.24 + i * 0.22) % 1)));
  };
  return root;
}

export function apply(context, t, params = {}) {
  const variant = String(context?.variant || '').replace(/^[a-z0-9-]+:/, '');
  const time = Math.max(0, Number(t) || 0);
  if (variant === 'lighting-ciclo-dia-noite') {
    const { hemi, key, fill, warmRoom, edge, sky, scene, night = false, dusk = false } = context;
    if (hemi && key && fill && warmRoom && edge) {
      hemi.color.set(night ? 0x8c9bb8 : dusk ? 0xf6c998 : 0xffdfb3);
      hemi.groundColor.set(night ? 0x263247 : 0x5c4535); hemi.intensity = night ? 0.62 : dusk ? 1.05 : 1.25;
      key.color.set(night ? 0x8ca2c6 : dusk ? 0xffbd7d : 0xffcb89); key.intensity = night ? 0.42 : dusk ? 2.15 : 3.35;
      fill.color.set(night ? 0x98b2da : 0xb3cbdc); fill.intensity = night ? 0.78 : 0.68;
      warmRoom.intensity = night ? 1.3 : 0.4; edge.intensity = night ? 0.34 : 0.92;
      if (sky) sky.visible = !night;
      if (scene?.fog) { scene.fog.color.set(night ? 0x273247 : dusk ? 0x95806e : 0xc79b72); scene.fog.density = night ? 0.013 : 0.014; }
    }
    return;
  }
  if (variant === 'camera-caminho-cobertura-quarto' && context.camera && context.from && context.to) {
    const progress = ease(time / Math.max(0.001, params.duration || 5));
    const a = context.from, b = context.to, liftY = Number(params.liftY || 0);
    context.camera.position.set(THREE.MathUtils.lerp(a[0],b[0],progress),THREE.MathUtils.lerp(a[1],b[1],progress)+liftY,THREE.MathUtils.lerp(a[2],b[2],progress));
    const target = context.lookAt || new THREE.Vector3(0,0,0);
    target.set(THREE.MathUtils.lerp(a[3],b[3],progress),THREE.MathUtils.lerp(a[4],b[4],progress)+liftY,THREE.MathUtils.lerp(a[5],b[5],progress));
    context.camera.lookAt(target);
    if (context.controls) { context.controls.target.copy(target); context.controls.update(); }
    return;
  }
  const target = context?.target || context?.root || context?.targets?.[0];
  if (!target) return;
  if (target.userData.rotor) target.userData.rotor.rotation.z = time * (params.speed || 8.4);
  if (target.userData.sample) target.userData.sample(time);
}

export function createMaterial(params = {}) {
  const name = String(params.variant || params.name || '').toLowerCase();
  if (name.includes('alumin') || name.includes('folha')) return MAT.foil.clone();
  if (name.includes('lã') || name.includes('wool') || name.includes('rocha')) return MAT.wool.clone();
  if (name.includes('clara') || name.includes('telha')) return MAT.tilePale.clone();
  return MAT.plasterLight.clone();
}
