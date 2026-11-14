import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const SOURCES = {
  'californian-1912': {file:'californian-1912.jpg',headline:'SS CALIFORNIAN · 15 ABRIL 1912',credit:'LOUIS OGDEN · WIKIMEDIA COMMONS · DOMÍNIO PÚBLICO'},
  'carpathia-officers-may-1912': {file:'carpathia-officers-may-1912.png',headline:'TRIPULAÇÃO DO CARPATHIA · RETRATO POSTERIOR · 29 MAIO 1912',credit:'BAIN COLLECTION · LIBRARY OF CONGRESS · DOMÍNIO PÚBLICO'},
  'titanic-southampton-1912': {
    file: 'titanic-southampton-1912.jpg',
    headline: 'RMS TITANIC · SOUTHAMPTON · ABRIL DE 1912',
    credit: 'FOTÓGRAFO NÃO IDENTIFICADO · WIKIMEDIA COMMONS · DOMÍNIO PÚBLICO'
  },
  'titanic-second-class-deck-1912': {
    file: 'titanic-second-class-boat-deck-1912.jpg',
    headline: 'RMS TITANIC · CONVÉS DE SEGUNDA CLASSE · 11 ABRIL 1912',
    credit: 'THOMAS BARKER · WIKIMEDIA COMMONS · DOMÍNIO PÚBLICO'
  },
  'titanic-grand-dining-saloon-1912': {
    file: 'titanic-grand-dining-saloon-1912.jpg',
    headline: 'RMS TITANIC · GRANDE SALÃO DE JANTAR · 1912',
    credit: 'HENRY NEIL · CHICAGO HOMEWOOD PRESS · DOMÍNIO PÚBLICO'
  },
  'titanic-marconi-wireless-room-1912': {
    file: 'titanic-marconi-wireless-room-1912.jpg',
    headline: 'RMS TITANIC · SALA DE RÁDIO MARCONI · 11 ABRIL 1912',
    credit: 'HAROLD BRIDE NA ESTAÇÃO · WIKIMEDIA COMMONS · CC0'
  },
  'titanic-survivors-kink-family-1912': {
    file: 'titanic-survivors-kink-family-1912.jpg',
    headline: 'FAMÍLIA KINK · 3ª CLASSE · 1912',
    credit: 'MILWAUKEE JOURNAL · 24 ABRIL 1912'
  },
  'titanic-stateroom-b60-1912': {
    file: 'titanic-stateroom-b60-1912.jpg',
    headline: 'CABINE B-60 · TITANIC · 1912',
    credit: 'ROBERT J. WELCH · DOMÍNIO PÚBLICO'
  }
};

const textures = new Map();

export async function prepare() {
  if (textures.size || typeof Image === 'undefined') return;
  for (const [variant, source] of Object.entries(SOURCES)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = new URL(`./media/${source.file}`, import.meta.url).href;
    await image.decode();
    const photo = new THREE.Texture(image);
    photo.colorSpace = THREE.SRGBColorSpace;
    photo.anisotropy = 8;
    photo.needsUpdate = true;

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
    context.font = '700 86px Arial, sans-serif';
    while (context.measureText(source.headline).width > canvas.width - 96 && Number.parseInt(context.font, 10) > 60) {
      context.font = `700 ${Number.parseInt(context.font, 10) - 2}px Arial, sans-serif`;
    }
    context.fillText(source.headline, 48, 88);
    context.fillStyle = '#c6d0d2';
    context.font = '600 60px Arial, sans-serif';
    while (context.measureText(source.credit).width > canvas.width - 96 && Number.parseInt(context.font, 10) > 44) {
      context.font = `600 ${Number.parseInt(context.font, 10) - 2}px Arial, sans-serif`;
    }
    context.fillText(source.credit, 48, 224);
    const credit = new THREE.CanvasTexture(canvas);
    credit.colorSpace = THREE.SRGBColorSpace;
    credit.anisotropy = 8;
    textures.set(variant, { photo, credit, aspect: image.naturalWidth / image.naturalHeight });
  }
}

export function create({ variant = 'titanic-southampton-1912', params = {} } = {}) {
  const sourceTextures = textures.get(variant);
  const photoWidth = 4.8;
  const photoHeight = photoWidth / (sourceTextures?.aspect || (5.16 / 2.62));
  const frameWidth = 5.3;
  const frameHeight = photoHeight + 1.07;
  const root = new THREE.Group();
  root.name = `archive-photo-${variant}-motion-inset`;
  root.visible = false;

  const trimMaterial = new THREE.MeshBasicMaterial({ color: '#b99552', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const frameMaterial = new THREE.MeshBasicMaterial({ color: '#121819', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const photoMaterial = new THREE.MeshBasicMaterial({ map: sourceTextures?.photo || null, color: sourceTextures ? '#ffffff' : '#d7d1c4', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const creditMaterial = new THREE.MeshBasicMaterial({ map: sourceTextures?.credit || null, color: sourceTextures ? '#ffffff' : '#171d1f', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#020607', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  // Preserve the actual photograph's aspect ratio. The former fixed 1.97:1
  // plane visibly stretched 4:3 archive photographs and made faces/cabins
  // look wrong. Keep the credit strip inside the same restrained frame.
  // A narrow brass reveal, dark matte mount, and equal inner margins make the
  // archive evidence read as a deliberate editorial card rather than a loose
  // thumbnail. RoundedBoxGeometry supplies controlled corner highlights.
  const trim = new THREE.Mesh(new RoundedBoxGeometry(frameWidth + .09, frameHeight + .09, .075, 4, .06), trimMaterial);
  trim.position.z = -.055;
  trim.renderOrder = 1899;
  root.add(trim);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(frameWidth, frameHeight, .12, 4, .07), frameMaterial);
  frame.renderOrder = 1900;
  root.add(frame);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth + .32, frameHeight + .32), shadowMaterial);
  shadow.position.set(.035, -.04, -.11);
  shadow.renderOrder = 1899;
  root.add(shadow);
  const creditHeight = .44;
  const gap = .13;
  const innerY = (frameHeight - photoHeight - gap - creditHeight) / 2;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth, photoHeight), photoMaterial);
  photo.position.set(0, frameHeight / 2 - innerY - photoHeight / 2, .068);
  photo.name = 'historical-photograph';
  photo.renderOrder = 1901;
  root.add(photo);
  const credit = new THREE.Mesh(new THREE.PlaneGeometry(photoWidth, creditHeight), creditMaterial);
  credit.position.set(0, -frameHeight / 2 + innerY + creditHeight / 2, .069);
  credit.name = 'archive-photo-credit';
  credit.renderOrder = 1902;
  root.add(credit);

  const enterAt = Number.isFinite(params.enterAt) ? params.enterAt : .2;
  const exitAt = Number.isFinite(params.exitAt) ? params.exitAt : 3.9;
  const fadeInDuration = THREE.MathUtils.clamp(Number(params.fadeInDuration) || .42, .08, .7);
  const fadeOutDuration = THREE.MathUtils.clamp(Number(params.fadeOutDuration) || .34, .08, .7);
  const template = params.template || 'slide';
  const templates = {
    slide: { x: .24, y: 0, scale: .94, rotate: -.025 },
    rise: { x: 0, y: -.20, scale: .94, rotate: .012 },
    focus: { x: 0, y: 0, scale: .84, rotate: 0 },
    reveal: { x: 0, y: -.06, scale: .90, rotate: -.018 },
    document: { x: 0, y: 0, scale: .94, rotate: -.035 },
    'evidence-board': { x: 0, y: -.035, scale: .92, rotate: 0 }
  };
  const motion = templates[template] || templates.slide;
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
    const distance = 12.2;
    const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewWidth = viewHeight * camera.aspect;
    const widthPercent = THREE.MathUtils.clamp(Number(params.frameWidthPercent) || 48, 44, 52) / 100;
    const scale = Math.min(viewWidth * widthPercent / frameWidth, viewHeight * .70 / frameHeight);
    const x = (1 - eased) * viewWidth * motion.x;
    const y = viewHeight * (.02 + motion.y * (1 - eased));
    root.position.copy(camera.position).addScaledVector(forward, distance).addScaledVector(right, x).addScaledVector(up, y);
    root.quaternion.copy(camera.quaternion);
    const held = Math.max(0, time - enterAt - fadeInDuration);
    const push = 1 + Math.min(.012, held * .003);
    root.scale.setScalar(scale * (motion.scale + (1 - motion.scale) * eased) * push);
    root.rotation.z = motion.rotate * (1 - eased) + Math.sin(held * .7) * .0006;
    const photoZoom = 1 + Math.min(.012, held * .003);
    photo.scale.set(photoZoom, photoZoom, 1);
    for (const object of [trim, frame, shadow, photo, credit]) object.material.opacity = alpha;
  };
  root.userData.sample(0, 0, {});
  return root;
}
