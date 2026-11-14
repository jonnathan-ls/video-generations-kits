import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let textures;

export async function prepare() {
  if (textures || typeof Image === 'undefined') return;
  const image = new Image();
  image.decoding = 'async';
  image.src = new URL('./media/mesaba-titanic-warning-1912.jpg', import.meta.url).href;
  await image.decode();
  // Use the upper three quarters of the original sheet: it contains the
  // date, sender/recipient fields and the beginning of the warning, while
  // avoiding the blank lower margin that made the document tiny on screen.
  const crop = document.createElement('canvas');
  crop.width = image.naturalWidth;
  crop.height = Math.round(image.naturalHeight * .75);
  crop.getContext('2d').drawImage(image, 0, 0, image.naturalWidth, crop.height, 0, 0, crop.width, crop.height);
  const photo = new THREE.CanvasTexture(crop);
  photo.colorSpace = THREE.SRGBColorSpace;
  photo.anisotropy = 8;
  photo.needsUpdate = true;

  const canvas = document.createElement('canvas');
  canvas.width = 1800;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  context.fillStyle = '#101719';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#d1aa58';
  context.fillRect(0, 0, 12, canvas.height);
  context.textBaseline = 'middle';
  context.fillStyle = '#f4ead4';
  context.font = '700 72px Arial, sans-serif';
  context.fillText('MESABA → TITANIC · GELO · 14 ABR · 19:50', 48, 68);
  context.fillStyle = '#c6d0d2';
  context.font = '600 50px Arial, sans-serif';
  context.fillText('MUSEUMSSTIFTUNG · CC BY-SA 4.0', 48, 168);
  const credit = new THREE.CanvasTexture(canvas);
  credit.colorSpace = THREE.SRGBColorSpace;
  credit.anisotropy = 8;
  textures = { photo, credit };
}

export function create({ params = {} } = {}) {
  const root = new THREE.Group();
  root.name = 'mesaba-telegram-archive-motion-inset';
  root.visible = false;

  const trimMaterial = new THREE.MeshBasicMaterial({ color: '#b99552', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const frameMaterial = new THREE.MeshBasicMaterial({ color: '#121819', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const photoMaterial = new THREE.MeshBasicMaterial({ map: textures?.photo || null, color: textures ? '#ffffff' : '#d7d1c4', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const creditMaterial = new THREE.MeshBasicMaterial({ map: textures?.credit || null, color: textures ? '#ffffff' : '#171d1f', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#020607', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const accentMaterial = new THREE.MeshBasicMaterial({ color: '#d1aa58', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });

  const frameWidth = 4.5;
  const frameHeight = 5.7;
  const contentWidth = 4.05;
  const photoHeight = 4.68;
  const creditHeight = .42;
  const gap = .14;
  const innerY = (frameHeight - photoHeight - gap - creditHeight) / 2;
  const trim = new THREE.Mesh(new RoundedBoxGeometry(frameWidth + .09, frameHeight + .09, .075, 4, .06), trimMaterial);
  trim.position.z = -.055;
  trim.renderOrder = 1899;
  root.add(trim);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(frameWidth, frameHeight, .12, 4, .07), frameMaterial);
  frame.renderOrder = 1900;
  root.add(frame);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth + .32, frameHeight + .32), shadowMaterial);
  shadow.position.set(.035, -.04, -.11);
  shadow.renderOrder = 1898;
  root.add(shadow);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(contentWidth, photoHeight), photoMaterial);
  photo.position.set(0, frameHeight / 2 - innerY - photoHeight / 2, .068);
  photo.name = 'mesaba-to-titanic-telegram-1912';
  photo.renderOrder = 1901;
  root.add(photo);
  const credit = new THREE.Mesh(new THREE.PlaneGeometry(contentWidth, creditHeight), creditMaterial);
  credit.position.set(0, -frameHeight / 2 + innerY + creditHeight / 2, .069);
  credit.name = 'archive-source-and-rights-credit';
  credit.renderOrder = 1902;
  root.add(credit);
  const accentLeft = new THREE.Mesh(new THREE.PlaneGeometry(.028, 5.2), accentMaterial);
  accentLeft.position.set(-2.13, 0, .047);
  accentLeft.renderOrder = 1903;
  root.add(accentLeft);
  const accentRight = new THREE.Mesh(new THREE.PlaneGeometry(.028, 5.2), accentMaterial);
  accentRight.position.set(2.13, 0, .047);
  accentRight.renderOrder = 1903;
  root.add(accentRight);

  const enterAt = Number.isFinite(params.enterAt) ? params.enterAt : .35;
  const exitAt = Number.isFinite(params.exitAt) ? params.exitAt : 3.6;
  const fadeInDuration = THREE.MathUtils.clamp(Number(params.fadeInDuration) || .42, .08, .7);
  const fadeOutDuration = THREE.MathUtils.clamp(Number(params.fadeOutDuration) || .34, .08, .7);
  const templates = { slide: { x: .2, y: 0, scale: .94, rotate: -.025 }, rise: { x: 0, y: -.2, scale: .94, rotate: .012 }, focus: { x: 0, y: 0, scale: .84, rotate: 0 }, reveal: { x: 0, y: -.06, scale: .9, rotate: -.018 }, document: { x: 0, y: 0, scale: .94, rotate: -.035 }, 'evidence-board': { x: 0, y: -.035, scale: .92, rotate: 0 } };
  const motion = templates[params.template || 'document'] || templates.document;
  root.userData.sample = (time, global, { camera } = {}) => {
    if (!camera) return;
    const fadeIn = THREE.MathUtils.clamp((time - enterAt) / fadeInDuration, 0, 1);
    const fadeOut = THREE.MathUtils.clamp((exitAt + fadeOutDuration - time) / fadeOutDuration, 0, 1);
    const eased = 1 - Math.pow(1 - fadeIn, 3);
    const alpha = eased * fadeOut;
    root.visible = alpha > .002;
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
    const distance = 10;
    const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewWidth = viewHeight * camera.aspect;
    const widthPercent = THREE.MathUtils.clamp(Number(params.frameWidthPercent) || 46, 40, 50) / 100;
    const scale = Math.min(viewWidth * widthPercent / frameWidth, viewHeight * .76 / frameHeight);
    const x = (1 - eased) * viewWidth * motion.x;
    const y = viewHeight * (.02 + motion.y * (1 - eased));
    root.position.copy(camera.position).addScaledVector(forward, distance).addScaledVector(right, x).addScaledVector(up, y);
    root.quaternion.copy(camera.quaternion);
    const held = Math.max(0, time - enterAt - fadeInDuration);
    root.scale.setScalar(scale * (motion.scale + (1 - motion.scale) * eased) * (1 + Math.min(.012, held * .003)));
    root.rotation.z = motion.rotate * (1 - eased) + Math.sin(held * .7) * .0006;
    // The composition clones materials after creation. Update each mesh's
    // mounted material so the card actually appears and fades in the preview.
    for (const object of [trim, frame, shadow, photo, credit, accentLeft, accentRight]) object.material.opacity = alpha;
  };
  root.userData.sample(0, 0, {});
  return root;
}
