import * as THREE from 'three';
import { create as boat } from './period-lifeboat.js';

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => value * value * (3 - 2 * value);

function pointOnRoute(start, end, control, u) {
  if (!control) return start.clone().lerp(end, u);
  const oneMinus = 1 - u;
  return start.clone().multiplyScalar(oneMinus * oneMinus)
    .addScaledVector(control, 2 * oneMinus * u)
    .addScaledVector(end, u * u);
}

function routeTangent(start, end, control, u) {
  if (!control) return end.clone().sub(start);
  return control.clone().sub(start).multiplyScalar(2 * (1 - u))
    .add(end.clone().sub(control).multiplyScalar(2 * u));
}

export function create() {
  return boat();
}

export function apply({ target }, time, params = {}) {
  const origin = params.origin || [0, 0, 0];
  const delta = params.delta || [0, 0, 15];
  const duration = Number.isFinite(params.duration) && params.duration > 0 ? params.duration : 8;
  const progress = clamp01((Number.isFinite(time) ? time : 0) / duration);
  const u = smooth(progress);
  const start = new THREE.Vector3().fromArray(origin);
  const end = start.clone().add(new THREE.Vector3().fromArray(delta));
  const control = Array.isArray(params.control) && params.control.length === 3
    ? new THREE.Vector3().fromArray(params.control)
    : null;

  target.position.copy(pointOnRoute(start, end, control, u));

  if (params.alignHeading !== false) {
    const tangent = routeTangent(start, end, control, u);
    if (tangent.lengthSq() > 1e-8) {
      const desiredYaw = Math.atan2(tangent.x, tangent.z) + (params.headingOffset || 0);
      if (target.userData.maritimeInitialYaw === undefined) {
        target.userData.maritimeInitialYaw = Number.isFinite(params.initialYaw)
          ? params.initialYaw
          : target.rotation.y;
      }
      const initialYaw = target.userData.maritimeInitialYaw;
      let yawDelta = THREE.MathUtils.euclideanModulo(desiredYaw - initialYaw + Math.PI, Math.PI * 2) - Math.PI;
      if (!Number.isFinite(yawDelta)) yawDelta = 0;
      const turnIn = smooth(clamp01(progress / 0.16));
      target.rotation.y = initialYaw + yawDelta * turnIn;
    }
  }
}
