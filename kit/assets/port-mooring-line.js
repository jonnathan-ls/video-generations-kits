import * as THREE from 'three';

const smooth = (t, a, b) => THREE.MathUtils.smoothstep(t, a, b);
const point = (value, fallback) => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
  ? new THREE.Vector3(...value)
  : new THREE.Vector3(...fallback);

// A small illustrative hawser for an Edwardian quay. Geometry is rebuilt from
// the requested local time, so seeking backward or sampling out of order is safe.
export function create({ variant = 'single', params = {} } = {}) {
  const root = new THREE.Group();
  root.name = `port-mooring-line-${variant}`;
  const material = new THREE.MeshStandardMaterial({
    color: '#b9a37c', roughness: .94, metalness: .015,
  });
  const hiddenGeometry = new THREE.BufferGeometry();
  const mesh = new THREE.Mesh(hiddenGeometry, material);
  mesh.name = 'twisted-natural-fibre-hawser';
  mesh.castShadow = true;
  root.add(mesh);

  const dock = point(params.dockAnchor, [-2, 2.2, 0]);
  const shipStart = point(params.shipAnchorStart, [4, 2.5, 0]);
  const shipEnd = point(params.shipAnchorEnd, [5, 2.5, 0]);
  const moveEnd = Number.isFinite(params.shipMoveEnd) ? params.shipMoveEnd : 4.9;
  const releaseStart = Number.isFinite(params.releaseStart) ? params.releaseStart : 2.1;
  const releaseEnd = Number.isFinite(params.releaseEnd) ? params.releaseEnd : 2.85;
  const disappearAt = Number.isFinite(params.disappearAt) ? params.disappearAt : 3.35;
  const wrapRadius = THREE.MathUtils.clamp(Number(params.wrapRadius) || .56, .42, .72);
  const wrapHeight = THREE.MathUtils.clamp(Number(params.wrapHeight) || .12, .06, .22);
  const radius = THREE.MathUtils.clamp(Number(params.radius) || .075, .035, .14);

  root.userData.sample = (time = 0) => {
    const t = Math.max(0, Number(time) || 0);
    const movingShip = shipStart.clone().lerp(shipEnd, smooth(t, 0, moveEnd));
    const release = smooth(t, releaseStart, releaseEnd);
    if (t >= disappearAt || release >= .998) {
      if (mesh.geometry !== hiddenGeometry) mesh.geometry.dispose();
      mesh.geometry = hiddenGeometry;
      mesh.visible = false;
      return;
    }

    // The quay end travels around the capstan head before the hawser leaves;
    // its radius and height collapse as the line is eased free.
    const wrapCenter = dock.clone().lerp(movingShip, release);
    const wrapScale = 1 - release;
    const loop = [];
    const firstAngle = Math.PI / 8;
    const lastAngle = Math.PI * 2 - firstAngle;
    for (let index = 0; index <= 14; index += 1) {
      const angle = THREE.MathUtils.lerp(firstAngle, lastAngle, index / 14);
      loop.push(new THREE.Vector3(
        wrapCenter.x + Math.cos(angle) * wrapRadius * wrapScale,
        wrapCenter.y + wrapHeight * wrapScale,
        wrapCenter.z + Math.sin(angle) * wrapRadius * wrapScale,
      ));
    }

    const sag = THREE.MathUtils.lerp(1.05, .24, smooth(t, .25, 1.9));
    const shipControl = movingShip.clone().lerp(loop[0], .34);
    const dockControl = movingShip.clone().lerp(loop[0], .67);
    shipControl.y -= sag * .82;
    dockControl.y -= sag;
    const path = new THREE.CatmullRomCurve3(
      [movingShip, shipControl, dockControl, ...loop],
      false,
      'centripetal',
    );
    const next = new THREE.TubeGeometry(path, 48, radius, 8, false);
    if (mesh.geometry !== hiddenGeometry) mesh.geometry.dispose();
    mesh.geometry = next;
    mesh.visible = true;
    material.opacity = 1 - release;
    material.transparent = release > .01;
    material.depthWrite = release <= .01;
  };

  root.userData.sample(0);
  return root;
}
