import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = x => { const u = clamp(x); return u * u * (3 - 2 * u); };
const mat = (color, roughness = .78, metalness = .03, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const brass = () => mat('#b08d57', .32, .68);
const paper = (color = '#e8dcc4') => mat(color, .94, .01);
const ink = (color = '#1f3a46') => mat(color, .62, .04);

function add(g, geometry, material, position, rotation) {
  const m = new THREE.Mesh(geometry, material);
  if (position) m.position.set(...position);
  if (rotation) m.rotation.set(...rotation);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function box(g, size, pos, material, options = {}) {
  const geo = options.round ? new RoundedBoxGeometry(...size, 2, Math.min(options.round, size[0] * .2, size[1] * .2, size[2] * .2)) : new THREE.BoxGeometry(...size);
  return add(g, geo, material, pos, options.rotation);
}
function cyl(g, rt, rb, h, pos, material, options = {}) {
  return add(g, new THREE.CylinderGeometry(rt, rb, h, options.seg || 20), material, pos, options.rotation);
}
function card(g, variant) {
  const colors = { '55': '#d9bf7c', '70': '#c98d62', '1888': '#8fa79a', '1500': '#7b9a83' };
  const accent = colors[variant] || '#d9bf7c';
  box(g, [1.05, .024, 1.42], [0, .012, 0], paper(), { round: .015 });
  box(g, [.92, .006, 1.28], [0, .034, 0], mat(accent, .8, .02), { round: .01 });
  box(g, [.62, .006, .88], [0, .044, 0], paper('#d2c3a2'), { round: .008 });
  for (const [x, z] of [[-.51, -.7], [.51, -.7], [-.51, .7], [.51, .7]]) box(g, [.035, .008, .035], [x, .052, z], brass(), { round: .008 });
  return g;
}
function stamp(g) {
  const lift = new THREE.Group(); g.add(lift);
  box(lift, [.52, .07, .52], [0, .035, 0], brass(), { round: .03 });
  box(lift, [.3, .24, .3], [0, .18, 0], brass(), { round: .04 });
  cyl(lift, .07, .09, .62, [0, .62, 0], brass(), { seg: 16 });
  add(lift, new THREE.SphereGeometry(.12, 16, 10), brass(), [0, .98, 0]);
  g.userData.sample = t => { const down = smooth((t - .25) / .45); const up = smooth((t - .95) / .45); lift.position.y = .58 * (1 - down + up); };
}
function dados(g) {
  box(g, [4.2, .025, 2.8], [0, .012, 0], mat('#243a33', .9, .02), { round: .04 });
  for (const [x, color] of [[-1.15, '#e1d4b7'], [1.15, '#cbb894']]) {
    box(g, [1.0, .025, 1.55], [x, .045, .1], paper(color), { round: .02 });
    box(g, [.55, .03, .14], [x, .078, -.4], ink('#5b6e66'), { round: .01 });
    box(g, [.42, .03, .12], [x, .078, -.1], ink('#5b6e66'), { round: .01 });
  }
  for (let i = 0; i < 5; i++) cyl(g, .19, .19, .035, [0, .06 + i * .035, .95], brass(), { seg: 24 });
  const bar = box(g, [.26, .22, .9], [0, .13, -.55], brass(), { round: .04 });
  const line = box(g, [.035, .006, 1.0], [0, .245, -.55], ink('#7a3d27'), { round: .004 });
  g.userData.sample = t => { const p = smooth((t - .2) / 1.1); bar.scale.z = .02 + .98 * p; bar.position.z = -.95 + .8 * p; line.scale.z = .02 + .98 * p; line.position.z = bar.position.z; };
  return g;
}
function lei(g) {
  box(g, [4.4, .03, 2.8], [0, .015, 0], paper(), { round: .02 });
  const flap = new THREE.Group(); flap.position.set(-2.15, .05, 0); g.add(flap);
  box(flap, [2.1, .022, 2.7], [1.05, 0, 0], paper('#dfd0b2'), { round: .01 });
  for (let i = 0; i < 3; i++) {
    box(g, [.95, .008, 1.15], [-1.05 + i * 1.05, .04, .15], mat('#5c5141', .9, .01), { round: .01 });
    box(g, [.78, .006, .96], [-1.05 + i * 1.05, .048, .15], mat('#2c312f', .95, .01), { round: .008 });
  }
  cyl(g, .035, .045, 1.4, [1.55, .1, -1.05], paper('#c9b58d'), { rotation: [0, 0, .9], seg: 10 });
  cyl(g, .16, .16, .06, [1.55, .05, .8], mat('#7a3d27', .6, .05), { seg: 20 });
  g.userData.flap = flap;
  g.userData.sample = t => { const p = smooth((t - .1) / .8); flap.rotation.z = -1.15 * p; };
  return g;
}
function mosaico(g) {
  box(g, [4.2, .16, 3.0], [0, .08, 0], mat('#3b2a1e', .9, .02), { round: .05 });
  box(g, [3.95, .035, 2.75], [0, .17, 0], mat('#4f6b4b', .92, .01), { round: .03 });
  box(g, [3.1, .02, .32], [-.2, .19, .55], mat('#4a7a8a', .45, .05), { round: .2, rotation: [0, .35, 0] });
  for (let i = 0; i < 9; i++) {
    const x = -1.5 + (i % 3) * 1.0, z = -.85 + Math.floor(i / 3) * .82;
    cyl(g, .035, .045, .28, [x, .31, z], mat('#5b3d28', .9, .02), { seg: 8 });
    add(g, new THREE.ConeGeometry(.28, .7, 7), mat(i % 2 ? '#2f5a3b' : '#3f6e45', .85, .01), [x, .62, z]);
  }
  for (let i = 0; i < 4; i++) {
    const x = -.9 + (i % 2) * 1.7, z = -.1 + Math.floor(i / 2) * .95;
    box(g, [.42, .28, .42], [x, .32, z], mat('#c8b28b', .88, .02), { round: .03 });
    add(g, new THREE.ConeGeometry(.34, .26, 4), mat('#7a4a32', .8, .02), [x, .6, z], [0, Math.PI / 4, 0]);
  }
  for (const [x, z, w, r] of [[-1.8, 1.2, 1.2, .3], [1.2, 1.15, 1.3, -.4], [.2, -.9, 1.0, .8]]) box(g, [w, .008, .07], [x, .2, z], mat('#d0b980', .8, .02), { rotation: [0, r, 0] });
  const light = new THREE.PointLight('#ffd7a0', 1.2, 3, 2); light.position.set(0, 1.0, 0); g.add(light);
  return g;
}
function poeira(g) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    const a = i * 2.399963, r = .4 + (i % 19) * .16;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = .3 + ((i * 11) % 29) * .045; pos[i * 3 + 2] = Math.sin(a) * r;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#e8c98c', size: .018, transparent: true, opacity: .4, depthWrite: false }));
  g.add(points);
  g.userData.sample = t => { points.position.y = Math.sin(t * .3) * .03; points.rotation.y = t * .015; };
  return g;
}
function renda(g) {
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(7.2, .025, 5.2), new THREE.MeshStandardMaterial({ color: '#1b2b36', roughness: .6, metalness: .08, transparent: true, opacity: .62, depthWrite: false }));
  sheet.position.y = .6; g.add(sheet);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(7.25, .03, .04), new THREE.MeshBasicMaterial({ color: '#b08d57', transparent: true, opacity: .7 }));
  edge.position.set(0, .62, -2.6); g.add(edge);
  g.userData.sample = t => { const p = smooth((t - .2) / 1.0); sheet.position.y = .6 - .58 * p; edge.position.y = .62 - .58 * p; };
  return g;
}

export function create({ variant = 'carimbo' } = {}) {
  const root = new THREE.Group(); root.name = `brasil-abertura-props:${variant}`;
  if (variant === 'carimbo') { stamp(root); }
  else if (variant === 'dados') { dados(root); }
  else if (variant === 'lei') { lei(root); root.userData.sample = root.userData.sample || (() => {}); }
  else if (variant === 'mos1500') { mosaico(root); }
  else if (variant === 'poeira') { poeira(root); }
  else if (variant === 'renda') { renda(root); }
  else if (['55', '70', '1888', '1500'].includes(variant)) { const c = card(root, variant); c.name = `cartao-${variant}`; }
  else { card(root, '55'); }
  if (!root.userData.sample) root.userData.sample = () => {};
  root.userData.sample(0);
  return root;
}
