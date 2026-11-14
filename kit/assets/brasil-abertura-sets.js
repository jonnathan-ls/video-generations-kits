import * as THREE from 'three';
import { brazilPoints } from './brasil-atlas-abertura.js';

const mat = (color, roughness = .8, metalness = .03, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
function box(g, size, pos, material, extra = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.position.set(...pos); m.castShadow = true; m.receiveShadow = true;
  if (extra.rotation) m.rotation.set(...extra.rotation);
  g.add(m); return m;
}
function room(g, wall, floor) {
  const shell = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 16), new THREE.MeshStandardMaterial({ color: wall, roughness: .95, metalness: .01, side: THREE.BackSide }));
  shell.position.set(0, 4.4, 0); g.add(shell);
  box(g, [15.6, .08, 15.6], [0, .04, 0], mat(floor, .96, .01));
}
function desk(g, color, y = 1.2, w = 7.4, d = 5.0) {
  box(g, [w, .3, d], [0, y - .15, 0], mat(color, .82, .02));
  for (const [x, z] of [[-w/2+.45, -d/2+.45], [w/2-.45, -d/2+.45], [-w/2+.45, d/2-.45], [w/2-.45, d/2-.45]]) box(g, [.18, y-.3, .18], [x, (y-.3)/2, z], mat('#2a211b', .9, .02));
}
function lamp(g, pos, color = '#ffd39a', intensity = 2.2) {
  const root = new THREE.Group(); root.position.set(...pos); g.add(root);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .06, 20), mat('#b08d57', .35, .65)); base.position.y = .03; root.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .035, .7, 12), mat('#8b6d45', .4, .55)); stem.position.y = .38; root.add(stem);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.3, .3, 20, 1, true), new THREE.MeshStandardMaterial({ color, roughness: .6, metalness: .1, side: THREE.DoubleSide, emissive: color, emissiveIntensity: .18 })); shade.position.y = .78; root.add(shade);
  const light = new THREE.PointLight(color, intensity, 10, 2); light.position.y = .78; root.add(light);
  return light;
}
function paper(g, w, d, y, color = '#e4d6bb') {
  box(g, [w, .018, d], [0, y, 0], mat(color, .95, .01));
  box(g, [w - .18, .004, d - .18], [0, y + .013, 0], mat('#d2c2a2', .96, .01));
}
function mapShape(scale = .95) {
  const shape = new THREE.Shape();
  brazilPoints.forEach(([x, z], i) => { if (i === 0) shape.moveTo(x * scale, z * scale); else shape.lineTo(x * scale, z * scale); });
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
function setDados(g) {
  room(g, '#15262a', '#0e1b1d');
  desk(g, '#29433d');
  paper(g, 5.4, 3.4, 1.22, '#d8c7a8');
  lamp(g, [-2.6, 1.2, -1.4], '#ffc98a', 2.4);
  const spot = new THREE.SpotLight('#ffd7a6', 5, 12, Math.PI / 5, .7, 1.4); spot.position.set(-2.4, 5.2, 2.4); spot.target.position.set(0, 1.2, 0); g.add(spot, spot.target);
  box(g, [.9, .03, .9], [2.7, 1.23, 1.3], mat('#7a3d27', .7, .04));
}
function setDocumento(g) {
  room(g, '#1e1a16', '#120f0c');
  desk(g, '#4a3325');
  paper(g, 5.6, 3.5, 1.22, '#e2d3b5');
  lamp(g, [2.4, 1.2, -1.2], '#ffd49a', 2.8);
  const spot = new THREE.SpotLight('#ffd9a8', 5.2, 12, Math.PI / 5, .75, 1.4); spot.position.set(2.0, 5.4, 2.0); spot.target.position.set(0, 1.2, 0); g.add(spot, spot.target);
  box(g, [.55, .16, .55], [-2.5, 1.28, 1.2], mat('#6d3d28', .75, .03));
  box(g, [.16, .05, .5], [-1.8, 1.25, -1.2], mat('#c9b58d', .9, .01));
}
function setMacro(g) {
  room(g, '#171a17', '#0c0f0c');
  box(g, [8.4, .2, 6.2], [0, 1.1, 0], mat('#d8c5a4', .95, .01));
  paper(g, 6.8, 4.8, 1.21, '#eadcc2');
  const spot = new THREE.SpotLight('#ffe0b8', 5.6, 12, Math.PI / 5.5, .85, 1.4); spot.position.set(.8, 5.2, 2.2); spot.target.position.set(.6, 1.22, .7); g.add(spot, spot.target);
  lamp(g, [-2.7, 1.2, -1.4], '#ffbf7a', 1.4);
}
function setMapa(g) {
  room(g, '#101b28', '#0a1119');
  box(g, [9.6, .28, 6.6], [0, 1.06, 0], mat('#1c2b33', .9, .02));
  paper(g, 8.8, 5.8, 1.21, '#d8c8aa');
  const map = new THREE.Mesh(mapShape(1.08), mat('#2d5a6b', .82, .02, { side: THREE.DoubleSide })); map.rotation.x = -Math.PI / 2; map.position.set(0, 1.235, 0); g.add(map);
  const border = new THREE.LineSegments(new THREE.EdgesGeometry(mapShape(1.08)), new THREE.LineBasicMaterial({ color: '#c9a15c', transparent: true, opacity: .8 })); border.rotation.x = -Math.PI / 2; border.position.set(0, 1.24, 0); g.add(border);
  for (let i = -3; i <= 3; i++) box(g, [.015, .004, 5.2], [i * 1.15, 1.232, 0], mat('#a88d63', .9, .01));
  const spot = new THREE.SpotLight('#cfe8ff', 5.2, 14, Math.PI / 4.8, .75, 1.3); spot.position.set(-4, 6, 2.4); spot.target.position.set(0, 1.2, 0); g.add(spot, spot.target);
  lamp(g, [3.6, 1.2, -2.2], '#ffc98a', 1.2);
}
function setDiorama(g) {
  room(g, '#14201a', '#0b120e');
  box(g, [12, .12, 8.4], [0, .06, 0], mat('#5a5033', .96, .01));
  box(g, [11.6, .02, 8.0], [0, .13, 0], mat('#6f7a4b', .94, .01));
  box(g, [1.2, .03, 6.2], [-2.2, .15, -.5], mat('#4e7a86', .5, .03, { rotation: [0, .22, 0] }));
  for (let i = 0; i < 14; i++) {
    const x = -5.2 + (i % 7) * 1.7, z = -3.2 + Math.floor(i / 7) * 6.4;
    box(g, [.18, 1.8 + (i % 3) * .5, .18], [x, .9, z], mat('#3b2b1d', .95, .01));
    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.0 + (i % 3) * .18, 2.2 + (i % 2) * .7, 7), mat(i % 2 ? '#2e5536' : '#3e6340', .9, .01)); crown.position.set(x, 2.5 + (i % 3) * .2, z); g.add(crown);
  }
  const spot = new THREE.SpotLight('#ffe0a8', 5.4, 16, Math.PI / 4.6, .8, 1.2); spot.position.set(-3.5, 7, 3.5); spot.target.position.set(0, .5, 0); g.add(spot, spot.target);
}
export function create({ variant = 'macro' } = {}) {
  const root = new THREE.Group(); root.name = `brasil-abertura-set:${variant}`;
  if (variant === 'dados') setDados(root);
  else if (variant === 'documento') setDocumento(root);
  else if (variant === 'mapa') setMapa(root);
  else if (variant === 'diorama') setDiorama(root);
  else setMacro(root);
  root.userData.sample = () => {};
  return root;
}
