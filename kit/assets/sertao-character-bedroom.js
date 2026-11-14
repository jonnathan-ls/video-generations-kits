import * as THREE from 'three';
import { person } from './period-person-rig.js';

const BED_SCENES = new Set([0, 2, 9, 12]);
const WINDOW_SCENES = new Set([10, 11]);
const smooth = value => {
  const t = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
  return t * t * (3 - 2 * t);
};
const radians = THREE.MathUtils.degToRad;

function createSertaoPerson({ name = 'pessoa-anonima-do-sertao', seated = false } = {}) {
  // This local kit rig has a specific casual-clothing construction intended
  // for contemporary scenes; its older filename reflects its first project.
  const actor = person({
    name,
    seated,
    color: '#ded5c4',
    trouserColor: '#394b55',
    shirtColor: '#e8dfcf',
    skinColor: '#8c5d48',
    hairColor: '#29221e',
    female: false,
    hat: false,
    hairStyle: 'short',
    pose: 'watch',
    build: 'average',
    coatStyle: 'casual',
  });
  actor.name = name;
  actor.scale.setScalar(0.98);
  const hair = actor.getObjectByName('hair');
  if (hair) {
    const p = hair.geometry.parameters;
    hair.geometry = new THREE.SphereGeometry(p.radius, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.39);
    hair.scale.set(0.98, 1.13, 0.96);
    hair.position.y = 0.015;
  }
  const head = actor.getObjectByName('head');
  if (head) head.scale.set(1.08, 1.08, 1.06);
  actor.traverse(object => {
    if (object.name === 'eye-white') object.scale.set(1.28, 0.92, 0.72);
    if (object.name === 'pupil') object.scale.setScalar(1.24);
    if (object.name === 'brow') object.scale.set(1.28, 1.14, 1.08);
    if (object.name === 'nose') object.scale.set(1.08, 1.9, 1.42);
    if (object.name === 'shoe') object.scale.set(0.84, 0.88, 0.9);
    if (object.name === 'lip') object.scale.set(1.3, 1.1, 1.08);
    if (object.name === 'short-sleeve-hem') object.visible = false;
    if (object.name === 'pupil') {
      const side = Math.sign(object.position.x) || 1;
      const glint = new THREE.Mesh(
        new THREE.SphereGeometry(0.0022, 12, 8),
        new THREE.MeshBasicMaterial({ color: '#fff8e9' }),
      );
      glint.name = 'eye-catchlight';
      glint.position.set(object.position.x - side * 0.002, object.position.y + 0.003, object.position.z + 0.004);
      object.parent.add(glint);
    }
  });
  for (const { hand, side } of actor.userData.rig.arms) {
    const skinMaterial = hand.material;
    for (let finger = 0; finger < 4; finger++) {
      const x = (finger - 1.5) * 0.012;
      const tip = new THREE.Mesh(new THREE.CapsuleGeometry(0.0048, 0.022, 2, 7), skinMaterial);
      tip.name = `dedo-da-mao-${side}-${finger + 1}`;
      tip.position.set(x, -0.039, 0.018);
      tip.castShadow = false;
      hand.add(tip);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.019, 2, 7), skinMaterial);
    thumb.name = `polegar-da-mao-${side}`;
    thumb.position.set(side * 0.031, -0.006, 0.02);
    thumb.rotation.z = side * 0.72;
    thumb.castShadow = false;
    hand.add(thumb);
  }
  const sweat = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 18, 14),
    new THREE.MeshPhysicalMaterial({ color: '#a8c5c2', roughness: 0.18, metalness: 0, clearcoat: 0.86, clearcoatRoughness: 0.12, transparent: true, opacity: 0.72, depthWrite: false }),
  );
  sweat.name = 'reflexo-de-suor-discreto';
  sweat.scale.set(0.44, 0.9, 0.34);
  sweat.position.set(0.073, -0.012, 0.092);
  sweat.visible = false;
  sweat.castShadow = false;
  head?.add(sweat);
  actor.userData.sweatDrop = { mesh: sweat, baseY: sweat.position.y };
  actor.userData.studioCharacter = {
    sourceRig: 'kit/assets/period-person-rig.js',
    variant: 'coatStyle=casual',
    outfit: 'camiseta de algodão cru e calça de trabalho azul-acinzentada',
    identity: 'adulto anônimo; sem parentesco ou fala novos',
  };
  const rig = actor.userData.rig;
  rig.eyeWhites = [];
  actor.traverse(object => { if (object.name === 'eye-white') rig.eyeWhites.push(object); });
  rig.eyeWhites.forEach(eye => { eye.userData.restScale = eye.scale.clone(); });
  rig.pupils.forEach(pupil => { pupil.userData.rest = pupil.position.clone(); });
  rig.pupils.forEach(pupil => { pupil.userData.restScale = pupil.scale.clone(); });
  rig.brows.forEach(brow => { brow.userData.restRotation = brow.rotation.clone(); });
  rig.lips.forEach(({ lip }) => {
    lip.userData.restPosition = lip.position.clone();
    lip.userData.restRotation = lip.rotation.clone();
  });
  return actor;
}

function create() {
  const root = new THREE.Group();
  root.name = 'pessoa-quarto-e-janela-rig-casual-do-kit';
  const seated = createSertaoPerson({ name: 'pessoa-do-sertao-sentada', seated: true });
  const standing = createSertaoPerson({ name: 'pessoa-do-sertao-em-pe', seated: false });
  root.add(seated, standing);
  root.userData.seated = seated;
  root.userData.standing = standing;
  root.userData.actor = seated;
  root.userData.sample = time => applyMotion(root, 0, Math.max(0, Number(time) || 0));
  applyMotion(root, 0, 0);
  return root;
}

function resetExpression(actor) {
  const { pupils, brows, lips, eyeWhites = [] } = actor.userData.rig;
  eyeWhites.forEach(eye => eye.scale.copy(eye.userData.restScale));
  pupils.forEach(pupil => pupil.position.copy(pupil.userData.rest));
  pupils.forEach(pupil => pupil.scale.copy(pupil.userData.restScale));
  brows.forEach(brow => brow.rotation.copy(brow.userData.restRotation));
  lips.forEach(({ lip }) => {
    lip.position.copy(lip.userData.restPosition);
    lip.rotation.copy(lip.userData.restRotation);
  });
}

function setExpression(actor, { lookX = 0, lookY = 0, worry = 0, smile = 0 } = {}) {
  const { pupils, brows, lips } = actor.userData.rig;
  pupils.forEach(pupil => {
    pupil.position.x = pupil.userData.rest.x + lookX * 0.006;
    pupil.position.y = pupil.userData.rest.y + lookY * 0.006;
  });
  brows.forEach((brow, index) => {
    const side = index === 0 ? -1 : 1;
    brow.rotation.z += radians(side * worry * 7);
  });
  lips.forEach(({ lip, side }) => {
    lip.position.y = lip.userData.restPosition.y + side * 0.006 * smile;
    lip.rotation.z = lip.userData.restRotation.z + side * 0.12 * smile;
  });
}

function setArm(actor, side, { shoulder = 0, forward = 0, elbow = 0 } = {}) {
  const arm = actor.userData.rig.arms.find(item => item.side === side);
  if (!arm) return;
  arm.arm.rotation.z += side * shoulder;
  arm.arm.rotation.x += forward;
  arm.elbow.rotation.x += elbow;
}

function sampleGesture(actor, action, time) {
  const t = Math.max(0, Number(time) || 0);
  const rig = actor.userData.rig;
  resetExpression(actor);
  const sweat = actor.userData.sweatDrop;
  if (sweat) {
    const active = action === 'fan' && t >= 0.38 && t < 2.12;
    sweat.mesh.visible = active;
    sweat.mesh.position.y = sweat.baseY - 0.012 * smooth((t - 0.48) / 1.45);
  }

  if (action === 'oven') {
    const point = smooth((t - 1.16) / 0.18) * (1 - smooth((t - 2.36) / 0.18));
    const recoil = smooth((t - 2.64) / 0.08) * (1 - smooth((t - 3.2) / 0.22));
    const shrug = smooth((t - 3.4) / 0.2) * (1 - smooth((t - 4.18) / 0.18));
    setArm(actor, 1, { shoulder: 0.62 * point + 0.9 * recoil + 1.1 * shrug, forward: -0.12 * point - 0.4 * recoil, elbow: -0.38 * point - 0.3 * recoil - 0.75 * shrug });
    setArm(actor, -1, { shoulder: 0.28 * recoil + 0.72 * shrug, elbow: -0.22 * recoil - 0.5 * shrug });
    rig.head.rotation.x -= radians(4 * recoil);
    setExpression(actor, { lookX: -0.24 * point, worry: 0.75 * recoil, smile: 0.2 * shrug });
    return;
  }

  if (action === 'opening') {
    rig.upper.rotation.x -= radians(2.8);
    rig.head.rotation.x -= radians(8.5);
    setExpression(actor, { lookY: 0.8, worry: 0.5 });
    return;
  }

  if (action === 'fan') {
    const point = smooth((t - 1.02) / 0.1) * (1 - smooth((t - 2.0) / 0.12));
    const wind = smooth((t - 2.12) / 0.08) * (1 - smooth((t - 2.5) / 0.25));
    const discomfort = smooth((t - 0.38) / 0.18) * (1 - smooth((t - 2.16) / 0.14));
    const relief = smooth((t - 2.12) / 0.1) * (1 - smooth((t - 2.82) / 0.24));
    setArm(actor, 1, { shoulder: 1.22 * point + 0.38 * wind, forward: -0.14 * point - 0.2 * wind, elbow: -0.72 * point - 0.3 * wind });
    rig.head.rotation.x += radians(2.4 * wind);
    rig.head.rotation.z -= radians(3.2 * wind);
    rig.upper.rotation.z -= radians(1.4 * wind);
    setExpression(actor, { lookX: 0.42 * point - 0.12 * wind, lookY: 0.18 * discomfort, worry: 0.62 * discomfort, smile: 0.78 * relief });
    return;
  }

  if (action === 'window-open') {
    const reach = smooth((t - 0.28) / 0.42) * (1 - smooth((t - 2.1) / 0.3));
    const freshAir = smooth((t - 2.05) / 0.18);
    setArm(actor, -1, { shoulder: 1.04 * reach, forward: -0.22 * reach, elbow: -0.62 * reach });
    rig.upper.rotation.y -= radians(3.2 * freshAir);
    rig.head.rotation.z += radians(2.8 * freshAir);
    setExpression(actor, { lookX: -0.22 * reach, worry: 0.12 * (1 - freshAir), smile: 0.26 * freshAir });
    return;
  }

  if (action === 'window-close') {
    const close = smooth((t - 1.55) / 0.22) * (1 - smooth((t - 2.2) / 0.22));
    setArm(actor, -1, { shoulder: 0.74 * close, forward: -0.22 * close, elbow: -0.48 * close });
    rig.head.rotation.x += radians(3.8 * close);
    setExpression(actor, { lookX: -0.25 * close, worry: 0.18 * close });
    return;
  }

  if (action === 'payoff') {
    const relax = smooth((t - 1.25) / 0.45);
    const breeze = smooth((t - 2.02) / 0.12) * (1 - smooth((t - 2.82) / 0.24));
    const blink = Math.max(0, 1 - Math.abs(t - 2.27) / 0.075);
    rig.upper.rotation.x -= radians(2.2 * relax + 3.8 * breeze);
    rig.upper.rotation.z -= radians(1.1 * breeze);
    rig.head.rotation.x -= radians(1.6 * breeze);
    rig.head.rotation.z += radians(2.0 * relax + 5.6 * breeze);
    setArm(actor, 1, { shoulder: 0.045 * breeze, forward: -0.02 * breeze, elbow: -0.035 * breeze });
    setArm(actor, -1, { shoulder: 0.035 * breeze, forward: -0.015 * breeze, elbow: -0.03 * breeze });
    rig.eyeWhites?.forEach(eye => { eye.scale.y = eye.userData.restScale.y * (1 - 0.86 * blink); });
    rig.pupils.forEach(pupil => { pupil.scale.y = pupil.userData.restScale.y * (1 - 0.9 * blink); });
    setExpression(actor, { lookX: 0.06, worry: 0.2 * (1 - breeze), smile: 1.05 * breeze });
    return;
  }

  if (action === 'night') {
    rig.head.rotation.x -= radians(2.5);
    setExpression(actor, { lookY: 0.25, worry: 0.18 });
  }
}

function applySertaoGesture(actor, action, time) {
  sampleGesture(actor, action, time);
}

function applyMotion(root, sceneIndex, time) {
  const seated = root.userData.seated;
  const standing = root.userData.standing;
  if (!seated || !standing) return;
  const inBed = BED_SCENES.has(sceneIndex);
  const atWindow = WINDOW_SCENES.has(sceneIndex);
  seated.visible = inBed;
  standing.visible = atWindow;
  root.userData.actor = inBed ? seated : standing;

  if (inBed) {
    seated.position.set(-0.56, 0.035, 0.48);
    seated.rotation.set(0, 0.1, 0);
    seated.userData.sample(time);
    seated.userData.rig.upper.rotation.z = 0;
    seated.userData.rig.head.rotation.z = 0;
    sampleGesture(seated, sceneIndex === 0 ? 'opening' : sceneIndex === 12 ? 'payoff' : sceneIndex === 9 ? 'night' : 'fan', time);
  }
  if (atWindow) {
    const stepIn = smooth((time - 0.12) / 0.62);
    standing.position.set(-1.98 - 0.19 * stepIn, 0.035, 0.38);
    standing.rotation.set(0, -0.56, 0);
    standing.userData.sample(time);
    standing.userData.rig.upper.rotation.z = 0;
    standing.userData.rig.head.rotation.z = 0;
    sampleGesture(standing, sceneIndex === 10 ? 'window-open' : 'window-close', time);
  }
}

export { create, createSertaoPerson, applySertaoGesture, applyMotion };
