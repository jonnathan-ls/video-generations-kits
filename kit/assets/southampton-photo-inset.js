import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let photoTexture;
let creditTexture;

export async function prepare() {
  if (photoTexture || typeof Image === 'undefined') return;
  const image = new Image();
  image.decoding = 'async';
  image.src = new URL('./media/titanic-southampton-1912.jpg', import.meta.url).href;
  await image.decode();
  photoTexture = new THREE.Texture(image);
  photoTexture.colorSpace = THREE.SRGBColorSpace;
  photoTexture.anisotropy = 8;
  photoTexture.needsUpdate = true;

  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 290;
  const context = canvas.getContext('2d');
  context.fillStyle = '#101719';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#d1aa58';
  context.fillRect(0, 0, 12, canvas.height);
  context.textBaseline = 'middle';
  context.fillStyle = '#f4ead4';
  context.font = '700 66px Arial, sans-serif';
  context.fillText('RMS TITANIC · SOUTHAMPTON · ABRIL DE 1912', 48, 88);
  context.fillStyle = '#c6d0d2';
  context.font = '600 40px Arial, sans-serif';
  context.fillText('FOTÓGRAFO NÃO IDENTIFICADO · WIKIMEDIA COMMONS · DOMÍNIO PÚBLICO', 48, 224);
  creditTexture = new THREE.CanvasTexture(canvas);
  creditTexture.colorSpace = THREE.SRGBColorSpace;
  creditTexture.anisotropy = 8;
}

export function create({ params = {} } = {}) {
  const root = new THREE.Group();
  root.name = 'southampton-archive-photo-motion-inset';
  root.visible = false;

  const frameMaterial = new THREE.MeshBasicMaterial({ color: '#121819', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const photoMaterial = new THREE.MeshBasicMaterial({ map: photoTexture || null, color: photoTexture ? '#ffffff' : '#d7d1c4', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const creditMaterial = new THREE.MeshBasicMaterial({ map: creditTexture || null, color: creditTexture ? '#ffffff' : '#171d1f', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#020607', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const frameWidth = 5.5;
  const frameHeight = 4.12;
  const frame = new THREE.Mesh(new RoundedBoxGeometry(frameWidth, frameHeight, .12, 3, .055), frameMaterial);
  frame.renderOrder = 1900;
  root.add(frame);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.78, 4.4), shadowMaterial);
  shadow.position.set(.08, -.1, -.09);
  shadow.renderOrder = 1899;
  root.add(shadow);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(5.16, 3.38), photoMaterial);
  photo.position.set(0, .29, .068);
  photo.name = 'southampton-historic-photograph';
  photo.renderOrder = 1901;
  root.add(photo);
  const credit = new THREE.Mesh(new THREE.PlaneGeometry(5.16, .48), creditMaterial);
  credit.position.set(0, -1.53, .071);
  credit.name = 'southampton-photo-credit';
  credit.renderOrder = 1902;
  root.add(credit);

  const enterAt = Number.isFinite(params.enterAt) ? params.enterAt : .2;
  const exitAt = Number.isFinite(params.exitAt) ? params.exitAt : 3.9;
  root.userData.sample = (time, global, { camera } = {}) => {
    if (!camera) return;
    const fadeIn = THREE.MathUtils.clamp((time - enterAt) / .34, 0, 1);
    const fadeOut = THREE.MathUtils.clamp((exitAt + .28 - time) / .28, 0, 1);
    const eased = 1 - Math.pow(1 - fadeIn, 3);
    const alpha = eased * fadeOut;
    root.visible = alpha > .002;
    const forward = camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
    const distance = 12.2;
    const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewWidth = viewHeight * camera.aspect;
    const widthPercent = THREE.MathUtils.clamp(Number(params.frameWidthPercent) || 49, 42, 50) / 100;
    const scale = viewWidth * widthPercent / frameWidth;
    const x = viewWidth / 2 - frameWidth * scale / 2 - .48 + (1 - eased) * .52;
    const y = viewHeight / 2 - frameHeight * scale / 2 - .46;
    root.position.copy(camera.position).addScaledVector(forward, distance).addScaledVector(right, x).addScaledVector(up, y);
    root.quaternion.copy(camera.quaternion);
    const held = Math.max(0, time - enterAt - .34);
    const push = 1 + Math.min(.035, held * .011);
    root.scale.setScalar(scale * (.94 + .06 * eased) * push);
    root.rotation.z = (1 - eased) * -.022 + Math.sin(held * 1.1) * .001;
    for (const object of [frame, shadow, photo, credit]) object.material.opacity = alpha;
  };
  root.userData.sample(0, 0, {});
  return root;
}
