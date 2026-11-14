import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const IMAGE_URL = new URL('../../preview/historia-rockstar/media/david-jones-2003.jpg', import.meta.url);
let loaded = null;

export async function prepare() {
  if (loaded || typeof Image === 'undefined' || typeof document === 'undefined') return;

  const image = new Image();
  image.decoding = 'async';
  image.src = IMAGE_URL.href;
  await image.decode();

  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = 1050;
  photoCanvas.height = 1000;
  const photoContext = photoCanvas.getContext('2d');
  const targetAspect = photoCanvas.width / photoCanvas.height;
  const cropWidth = image.naturalHeight * targetAspect;
  const cropX = Math.max(0, (image.naturalWidth - cropWidth) / 2);
  photoContext.drawImage(image, cropX, 0, cropWidth, image.naturalHeight, 0, 0, photoCanvas.width, photoCanvas.height);
  const photograph = new THREE.CanvasTexture(photoCanvas);
  photograph.colorSpace = THREE.SRGBColorSpace;
  photograph.anisotropy = 8;
  photograph.needsUpdate = true;

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1000;
  const context = canvas.getContext('2d');
  context.fillStyle = '#11191b';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#c5a866';
  context.fillRect(0, 0, 18, canvas.height);
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  context.fillStyle = '#f2ead9';
  context.font = '700 120px Arial, sans-serif';
  context.fillText('DAVID JONES', 66, 145);
  context.font = '700 104px Arial, sans-serif';
  context.fillText('2003', 66, 272);
  context.fillStyle = '#bd9c59';
  context.fillRect(66, 360, 190, 9);
  context.fillStyle = '#d1c8b6';
  context.font = '600 88px Arial, sans-serif';
  context.fillText('FOTO · JON JORDAN', 66, 495);
  context.font = '600 86px Arial, sans-serif';
  context.fillText('CC BY 2.0', 66, 600);
  context.fillStyle = '#aeb9b6';
  context.font = '500 70px Arial, sans-serif';
  context.fillText('RETRATO POSTERIOR', 66, 795);
  context.fillText('NÃO É DA CAMPANHA', 66, 890);
  const credit = new THREE.CanvasTexture(canvas);
  credit.colorSpace = THREE.SRGBColorSpace;
  credit.anisotropy = 8;
  credit.needsUpdate = true;
  loaded = { photograph, credit };
}

export function create() {
  const frameWidth = 6.8;
  const frameHeight = 3.35;
  const photoWidth = 3.0;
  const infoWidth = 3.4;
  const contentHeight = 2.85;
  const gap = 0.15;
  const photoX = -(photoWidth + gap + infoWidth) / 2 + photoWidth / 2;
  const infoX = (photoWidth + gap + infoWidth) / 2 - infoWidth / 2;
  const root = new THREE.Group();
  root.name = 'rockstar:david-jones-public-portrait-2003';

  const trim = new THREE.Mesh(
    new RoundedBoxGeometry(frameWidth + 0.1, frameHeight + 0.1, 0.1, 4, 0.045),
    new THREE.MeshStandardMaterial({ color: '#b29a69', roughness: 0.46, metalness: 0.3, depthTest: false, depthWrite: false })
  );
  trim.position.z = -0.08;
  trim.renderOrder = 1898;
  trim.castShadow = trim.receiveShadow = true;
  root.add(trim);

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(frameWidth, frameHeight, 0.16, 4, 0.055),
    new THREE.MeshStandardMaterial({ color: '#1b2426', roughness: 0.76, metalness: 0.06, depthTest: false, depthWrite: false })
  );
  frame.renderOrder = 1900;
  frame.castShadow = frame.receiveShadow = true;
  root.add(frame);

  const photoMat = new THREE.MeshBasicMaterial({
    color: loaded ? '#ffffff' : '#89908b',
    map: loaded?.photograph || null,
    side: THREE.DoubleSide,
    toneMapped: false,
    depthTest: false,
    depthWrite: false
  });
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth, contentHeight), photoMat);
  photo.name = 'david-jones-2003-photograph';
  photo.position.set(photoX, 0, 0.091);
  photo.renderOrder = 1901;
  root.add(photo);

  const creditMat = new THREE.MeshBasicMaterial({
    color: loaded ? '#ffffff' : '#252e30',
    map: loaded?.credit || null,
    toneMapped: false,
    depthTest: false,
    depthWrite: false
  });
  const credit = new THREE.Mesh(new THREE.PlaneGeometry(infoWidth, contentHeight), creditMat);
  credit.name = 'portrait-date-author-license-and-context';
  credit.position.set(infoX, 0, 0.092);
  credit.renderOrder = 1902;
  root.add(credit);

  root.userData.sample = (time = 0) => {
    const p = THREE.MathUtils.clamp(time / 1.1, 0, 1);
    const eased = p * p * (3 - 2 * p);
    root.position.y = 0.09 * (1 - eased);
    root.rotation.y = -0.035 * (1 - eased);
    root.scale.setScalar(0.96 + 0.04 * eased);
  };
  root.userData.sample(0);
  return root;
}
