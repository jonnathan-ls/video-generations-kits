import * as THREE from 'three';
import { createSertaoPerson, applySertaoGesture } from './sertao-character-bedroom.js';

const mat = (color, roughness = 0.88, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

function addBox(parent, name, color, position, scale, roughness = 0.9) {
  const mesh = new THREE.Mesh(boxGeo, mat(color, roughness));
  mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

function makeOvenBody() {
  const outline = new THREE.Shape();
  outline.moveTo(-1.05, 0); outline.lineTo(1.05, 0); outline.lineTo(1.05, 0.7);
  outline.quadraticCurveTo(1.02, 1.5, 0, 1.58); outline.quadraticCurveTo(-1.02, 1.5, -1.05, 0.7); outline.closePath();
  const mouth = new THREE.Path();
  mouth.moveTo(-0.36, 0); mouth.lineTo(0.36, 0); mouth.lineTo(0.36, 0.47);
  mouth.quadraticCurveTo(0.34, 0.86, 0, 0.88); mouth.quadraticCurveTo(-0.34, 0.86, -0.36, 0.47); mouth.closePath();
  outline.holes.push(mouth);
  const geo = new THREE.ExtrudeGeometry(outline, { depth: 0.94, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.045, bevelThickness: 0.045, curveSegments: 16 });
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, mat(0x9b5539, 0.93));
  body.name = 'forno-de-barro-com-boca-em-arco'; body.position.set(0.55, 0.05, -0.55);
  body.castShadow = true; body.receiveShadow = true;
  return body;
}

function create() {
  const root = new THREE.Group(); root.name = 'insert-contexto-forno-sertanejo';
  addBox(root, 'chao-de-terra-compactada', 0x9b704e, [0, -0.13, 0], [11, 0.22, 8.5], 1);
  const rear = addBox(root, 'muro-baixo-de-taipa', 0xcbb38b, [0, 0.8, -2.38], [9.2, 1.6, 0.2], 0.96);
  rear.castShadow = false;
  for (let i = 0; i < 7; i++) {
    const joint = addBox(root, `junta-irregular-taipa-${i}`, 0x947855, [-3.7 + i * 1.22, 0.81 + (i % 2) * 0.34, -2.265], [0.018, 0.52, 0.012], 1);
    joint.castShadow = false;
  }
  for (let i = 0; i < 4; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat([0x87674d, 0xa17856, 0xb88a5e, 0x967352][i], 1));
    hill.name = `horizonte-semiarido-${i}`; hill.scale.set(2.9 + i * 0.6, 0.76 + i * 0.1, 0.35);
    hill.position.set(-5.2 + i * 3.5, -0.03, -3.75 - (i % 2) * 0.24); root.add(hill);
  }
  const stones = [];
  for (let i = 0; i < 9; i++) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + (i % 3) * 0.03, 0), mat(i % 2 ? 0x75614b : 0x9a8163, 1));
    stone.name = `pedra-de-lenha-${i}`; stone.position.set(-1.35 + i * 0.43, -0.005, 0.68 + (i % 2) * 0.16);
    stone.scale.set(1.45, 0.58, 0.82); stone.rotation.y = i * 0.6; stone.castShadow = true; root.add(stone); stones.push(stone);
  }
  const oven = new THREE.Group(); oven.name = 'forno-e-brasa'; oven.position.x = -0.25; oven.add(makeOvenBody()); root.add(oven);
  addBox(oven, 'base-de-pedra-do-forno', 0x79503a, [0.55, -0.01, -0.05], [2.4, 0.22, 1.62], 0.98);
  const fire = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff7436, transparent: true, opacity: 0.78 }));
  fire.name = 'brasa-visivel-no-interior'; fire.position.set(0.55, 0.39, 0.4); fire.scale.set(1.15, 0.72, 0.12); oven.add(fire);
  const fireLight = new THREE.PointLight(0xff7137, 3.8, 4.4, 1.8);
  fireLight.name = 'luz-viva-da-brasa'; fireLight.position.set(0.55, 0.48, 0.88); fireLight.castShadow = false; oven.add(fireLight);
  const mouthRim = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.042, 8, 32, Math.PI), mat(0x71412f, 0.9));
  mouthRim.name = 'aro-da-boca-do-forno'; mouthRim.position.set(0.55, 0.52, 0.43); mouthRim.rotation.z = Math.PI; oven.add(mouthRim);
  const logs = [];
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.48, 8), mat(i % 2 ? 0x4e3325 : 0x65412a, 0.96));
    log.name = `lenha-${i}`; log.position.set(0.42 + i * 0.13, 0.29, 0.48); log.rotation.z = 0.32 * (i - 1); log.rotation.x = Math.PI / 2; oven.add(log); logs.push(log);
  }
  const shimmerMat = new THREE.MeshBasicMaterial({ color: 0xffa160, transparent: true, opacity: 0.5, depthWrite: false });
  const shimmer = [];
  for (let i = 0; i < 4; i++) {
    const pts = [new THREE.Vector3(0.35 + i * 0.12, 0.56, 0.46), new THREE.Vector3(0.39 + i * 0.1, 0.79, 0.48), new THREE.Vector3(0.34 + i * 0.12, 1.01, 0.46)];
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 6, false), shimmerMat.clone());
    line.name = `onda-de-calor-${i}`; line.castShadow = false; oven.add(line); shimmer.push(line);
  }
  const clayPot = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.13, 0.02), new THREE.Vector2(0.19, 0.2), new THREE.Vector2(0.15, 0.42), new THREE.Vector2(0.09, 0.52), new THREE.Vector2(0.08, 0.57)], 18), mat(0x884d38, 0.74));
  clayPot.name = 'pote-de-barro-do-quintal'; clayPot.position.set(2.22, 0, 0.58); root.add(clayPot);
  const cactusMat = mat(0x5f7250, 0.96);
  const cactus = new THREE.Group(); cactus.name = 'cacto-de-mandacaru'; cactus.position.set(-3.25, 0, -0.3); root.add(cactus);
  const cactusBody = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 1.62, 10), cactusMat); cactusBody.position.y = 0.81; cactusBody.castShadow = true; cactus.add(cactusBody);
  const cactusArm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.74, 10), cactusMat); cactusArm.position.set(0.25, 0.85, 0); cactusArm.rotation.z = -0.9; cactusArm.castShadow = true; cactus.add(cactusArm);

  const actor = createSertaoPerson({ name: 'pessoa-aproxima-e-recuo' });
  // Keep a three-quarter face visible to camera while the body and reaching arm
  // still turn toward the oven; a strict side profile hid both eyes.
  actor.rotation.y = 0.56; root.add(actor);
  root.userData.actor = actor;
  root.userData.animationParts = { fire, fireLight, shimmer, logs, stones };
  root.userData.sample = time => applyMotion(root, Math.max(0, Number(time) || 0));
  applyMotion(root, 0);
  return root;
}

function ease(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t);
}

function applyMotion(root, time) {
  const { actor, animationParts } = root.userData;
  if (!actor || !animationParts) return;
  const approach = ease(time / 1.35);
  const retreat = ease((time - 2.62) / 0.43);
  actor.position.set(THREE.MathUtils.lerp(-1.35, -0.2, approach) - 0.43 * retreat, 0, 0.84);
  actor.rotation.set(0, 0.56, 0);
  actor.userData.sample(time);
  applySertaoGesture(actor, 'oven', time);
  const flamePulse = Math.sin(time * 17) ** 2;
  animationParts.fire.material.opacity = 0.64 + 0.2 * flamePulse;
  animationParts.fireLight.intensity = 3.1 + 1.2 * flamePulse;
  animationParts.shimmer.forEach((line, i) => {
    line.material.opacity = 0.22 + 0.47 * (0.5 + 0.5 * Math.sin(time * 6.4 + i * 1.7));
    line.position.x = Math.sin(time * 2.5 + i) * 0.035;
  });
  animationParts.logs.forEach((log, i) => { log.rotation.z = 0.32 * (i - 1) + 0.03 * Math.sin(time * 8 + i); });
  animationParts.stones.forEach((stone, i) => { stone.material.emissive?.setHex(0x000000); if (i < 3) stone.position.y = -0.005 + 0.012 * ease((time - 2.58) / 0.16) * (1 - ease((time - 2.82) / 0.22)); });
}

export { create, applyMotion };
