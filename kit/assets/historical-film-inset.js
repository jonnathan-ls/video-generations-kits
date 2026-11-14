import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

let filmAtlas;
const atlasSpec = { frameWidth: 600, frameHeight: 450, columns: 6, rows: 9, fps: 12, count: 54 };

export async function prepare() {
  if (filmAtlas || typeof Image === 'undefined') return;
  const image = new Image();
  image.decoding = 'async';
  image.src = new URL('./media/titanic-belfast-film-atlas.jpg', import.meta.url).href;
  await image.decode();
  filmAtlas = image;
}

function makeCreditTexture(params) {
  if (typeof document === 'undefined') {
    const texture = new THREE.DataTexture(new Uint8Array([17, 23, 25, 255]), 1, 1, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111719';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#d1aa58';
  ctx.fillRect(0, 0, 12, canvas.height);
  ctx.fillStyle = '#f4ead4';
  ctx.font = '700 72px Arial, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(params.title || 'TITANIC · BELFAST · 2 ABRIL 1912', 52, 103);
  ctx.fillStyle = '#c6d0d2';
  ctx.font = '600 43px Arial, sans-serif';
  ctx.fillText(params.credit || 'FILMAGEM HISTÓRICA · BRITISH PATHÉ · 1912', 52, 239);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function create({ params = {} } = {}) {
  const root = new THREE.Group();
  root.name = 'historical-film-motion-inset';
  root.visible = false;

  const trimMaterial = new THREE.MeshBasicMaterial({ color: '#b99552', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const frameMaterial = new THREE.MeshBasicMaterial({ color: '#121819', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const filmCanvas = typeof document === 'undefined' ? null : document.createElement('canvas');
  if (filmCanvas) {
    filmCanvas.width = atlasSpec.frameWidth;
    filmCanvas.height = atlasSpec.frameHeight;
  }
  const filmContext = filmCanvas?.getContext('2d', { alpha: false }) || null;
  if (filmContext) {
    filmContext.fillStyle = '#111';
    filmContext.fillRect(0, 0, filmCanvas.width, filmCanvas.height);
  }
  const filmTexture = filmCanvas
    ? new THREE.CanvasTexture(filmCanvas)
    : new THREE.DataTexture(new Uint8Array([17, 17, 17, 255]), 1, 1, THREE.RGBAFormat);
  filmTexture.colorSpace = THREE.SRGBColorSpace;
  filmTexture.needsUpdate = true;
  filmTexture.anisotropy = 8;
  const filmMaterial = new THREE.MeshBasicMaterial({ map: filmTexture, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const creditTexture = makeCreditTexture(params);
  const creditMaterial = new THREE.MeshBasicMaterial({ map: creditTexture, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#020607', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });

  const frameWidth = 5.3;
  const frameHeight = 4.7;
  const filmWidth = 4.8;
  const filmHeight = 3.6;
  const creditHeight = .44;
  const gap = .13;
  const innerY = (frameHeight - filmHeight - gap - creditHeight) / 2;
  const trim = new THREE.Mesh(new RoundedBoxGeometry(frameWidth + .09, frameHeight + .09, .075, 4, .06), trimMaterial);
  trim.position.z = -.055;
  trim.renderOrder = 1898;
  root.add(trim);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(frameWidth, frameHeight, .12, 4, .07), frameMaterial);
  frame.renderOrder = 1900;
  root.add(frame);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth + .32, frameHeight + .32), shadowMaterial);
  shadow.position.set(.035, -.04, -.11);
  shadow.renderOrder = 1897;
  root.add(shadow);
  const film = new THREE.Mesh(new THREE.PlaneGeometry(filmWidth, filmHeight), filmMaterial);
  film.position.set(0, frameHeight / 2 - innerY - filmHeight / 2, .068);
  film.name = 'historical-film-frame';
  film.renderOrder = 1901;
  root.add(film);
  const credit = new THREE.Mesh(new THREE.PlaneGeometry(filmWidth, creditHeight), creditMaterial);
  credit.position.set(0, -frameHeight / 2 + innerY + creditHeight / 2, .071);
  credit.name = 'historical-film-credit';
  credit.renderOrder = 1902;
  root.add(credit);

  const enterAt = Number.isFinite(params.enterAt) ? params.enterAt : .45;
  const exitAt = Number.isFinite(params.exitAt) ? params.exitAt : 5.05;
  const fadeInDuration = THREE.MathUtils.clamp(Number(params.fadeInDuration) || .42, .08, .7);
  const fadeOutDuration = THREE.MathUtils.clamp(Number(params.fadeOutDuration) || .34, .08, .7);
  const templates = { slide: { x: .24, y: 0, scale: .94, rotate: -.025 }, rise: { x: 0, y: -.2, scale: .94, rotate: .012 }, focus: { x: 0, y: 0, scale: .84, rotate: 0 }, reveal: { x: 0, y: -.06, scale: .9, rotate: -.018 }, document: { x: 0, y: 0, scale: .94, rotate: -.035 }, 'evidence-board': { x: 0, y: -.035, scale: .92, rotate: 0 } };
  const motion = templates[params.template || 'slide'] || templates.slide;
  let lastFrame = -1;

  root.userData.sample = (time, global, { camera } = {}) => {
    if (!camera) return;
    const active = time >= enterAt && time <= exitAt;
    const fadeIn = THREE.MathUtils.clamp((time - enterAt) / fadeInDuration, 0, 1);
    const fadeOut = THREE.MathUtils.clamp((exitAt + fadeOutDuration - time) / fadeOutDuration, 0, 1);
    const easedIn = 1 - Math.pow(1 - fadeIn, 3);
    const alpha = active ? easedIn * fadeOut : 0;
    root.visible = alpha > .002;

    if (active && filmAtlas && filmContext) {
      const frameIndex = THREE.MathUtils.clamp(Math.floor((time - enterAt) * atlasSpec.fps), 0, atlasSpec.count - 1);
      if (frameIndex !== lastFrame) {
        const column = frameIndex % atlasSpec.columns;
        const row = Math.floor(frameIndex / atlasSpec.columns);
        filmContext.drawImage(filmAtlas,
          column * atlasSpec.frameWidth, row * atlasSpec.frameHeight,
          atlasSpec.frameWidth, atlasSpec.frameHeight,
          0, 0, filmCanvas.width, filmCanvas.height);
        filmTexture.needsUpdate = true;
        lastFrame = frameIndex;
      }
    }

    const forward = camera.getWorldDirection(new THREE.Vector3());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
    const distance = 12.6;
    const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewWidth = viewHeight * camera.aspect;
    const frameWidthPercent = THREE.MathUtils.clamp(Number(params.frameWidthPercent) || 48, 44, 52);
    const scale = Math.min(viewWidth * frameWidthPercent / 100 / frameWidth, viewHeight * .70 / frameHeight);
    const x = (1 - easedIn) * viewWidth * motion.x;
    const y = viewHeight * (.02 + motion.y * (1 - easedIn));
    root.position.copy(camera.position).addScaledVector(forward, distance).addScaledVector(right, x).addScaledVector(up, y);
    root.quaternion.copy(camera.quaternion);
    const settle = Math.max(0, time - enterAt - fadeInDuration);
    root.scale.setScalar(scale * (motion.scale + (1 - motion.scale) * easedIn) * (1 + Math.min(.012, settle * .003)));
    root.rotation.z = motion.rotate * (1 - easedIn) + Math.sin(settle * .7) * .0006;
    root.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      for (const material of materials) material.opacity = alpha;
    });
  };
  root.userData.sample(0, 0, {});
  return root;
}
