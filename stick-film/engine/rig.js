// Skeleton for any stick character. Proportions come from character.json ("body"), as fractions of figure height.
// Angles: 0 = straight down, + = toward the way the character faces. World px, ground y = 0, y < 0 is up.
// Legs bend with +1 (knee forward), arms with -1 (elbow down and back). Pure math, so node and the browser share it.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { D2R, lerp, ik2, angLerp } = L;

  // Wick's proportions, measured from his Flow model sheet. Every field can be overridden per character.
  const DEFAULT_BODY = {
    height: 420,          // world px from sole to head top, roughly
    head: 0.152,          // head outer radius
    torso: 0.29,
    thigh: 0.18, shin: 0.18,
    upperArm: 0.165, foreArm: 0.165,
    line: 0.0205,         // stroke weight of the body line
    hand: [0.031, 0.040], // hand ellipse radii (across, along the forearm)
    foot: [0.060, 0.022], // foot ellipse radii
    shoulderDrop: 0.03,   // shoulders sit this far below the neck
    neck: 0.0,            // extra gap between torso top and head
  };

  function create(spec) {
    const b = Object.assign({}, DEFAULT_BODY, (spec && spec.body) || {});
    const H = b.height;
    const R = {
      H, k: H / 420,
      SW: b.line * H, HR: b.head * H, TORSO: b.torso * H,
      THIGH: b.thigh * H, SHIN: b.shin * H, UARM: b.upperArm * H, FARM: b.foreArm * H,
      HAND_RX: b.hand[0] * H, HAND_RY: b.hand[1] * H, FOOT_RX: b.foot[0] * H, FOOT_RY: b.foot[1] * H,
      SHD: b.shoulderDrop * H, NECK: b.neck * H,
    };
    R.LEG = R.THIGH + R.SHIN;
    R.ARM = R.UARM + R.FARM;
    R.STAND_Y = -(R.LEG * 0.998 + R.FOOT_RY);   // pelvis height when standing straight

    const dir = (a, f) => [Math.sin(a * D2R) * f, Math.cos(a * D2R)];
    const neckOf = (P, tau, f) => [P.x + f * Math.sin(tau * D2R) * R.TORSO, P.y - Math.cos(tau * D2R) * R.TORSO];
    const shoulderOf = (N, tau, f) => [N[0] - f * Math.sin(tau * D2R) * R.SHD, N[1] + Math.cos(tau * D2R) * R.SHD];

    // pose: {P:{x,y}, tau (torso lean), hd (head tilt), facing (+1 right / -1 left), arm:[{u,f}x2], leg:[{u,f}x2]}
    // index 0 = near limb (drawn in front), 1 = far limb.
    function solve(p) {
      const f = p.facing || 1;
      const N = neckOf(p.P, p.tau, f);
      const ha = p.tau + (p.hd || 0);
      const hr = R.HR * 0.97 + R.NECK;
      const Hc = [N[0] + f * Math.sin(ha * D2R) * hr, N[1] - Math.cos(ha * D2R) * hr];
      const sh = shoulderOf(N, p.tau, f);
      const J = { P: [p.P.x, p.P.y], N, Hc, sh, headAng: ha * f, f, elbow: [], hand: [], knee: [], ankle: [] };
      for (let i = 0; i < 2; i++) {
        const a = p.arm[i], d1 = dir(a.u, f), d2 = dir(a.f, f);
        const e = [sh[0] + d1[0] * R.UARM, sh[1] + d1[1] * R.UARM];
        J.elbow.push(e); J.hand.push([e[0] + d2[0] * R.FARM, e[1] + d2[1] * R.FARM]);
        const g = p.leg[i], e1 = dir(g.u, f), e2 = dir(g.f, f);
        const k = [p.P.x + e1[0] * R.THIGH, p.P.y + e1[1] * R.THIGH];
        J.knee.push(k); J.ankle.push([k[0] + e2[0] * R.SHIN, k[1] + e2[1] * R.SHIN]);
      }
      return J;
    }

    // IK writes angles into the pose. Targets are world coordinates of the wrist / ankle.
    function armIK(p, i, tx, ty, bend) {
      const f = p.facing || 1, N = neckOf(p.P, p.tau, f), s = shoulderOf(N, p.tau, f);
      const r = ik2(s[0], s[1], s[0] + (tx - s[0]) * f, ty, R.UARM, R.FARM, bend === undefined ? -1 : bend);
      p.arm[i] = { u: r.a1, f: r.a2 }; return r;
    }
    function legIK(p, i, tx, ty, bend) {
      const f = p.facing || 1;
      const r = ik2(p.P.x, p.P.y, p.P.x + (tx - p.P.x) * f, ty, R.THIGH, R.SHIN, bend === undefined ? 1 : bend);
      p.leg[i] = { u: r.a1, f: r.a2 }; return r;
    }
    function newPose(x, f) {
      return { P: { x: x || 0, y: R.STAND_Y }, tau: 0, hd: 0, facing: f || 1,
        arm: [{ u: 5, f: 8 }, { u: -5, f: -4 }], leg: [{ u: 2, f: 0 }, { u: -2, f: 0 }] };
    }
    function clonePose(p) {
      const q = { P: { x: p.P.x, y: p.P.y }, tau: p.tau, hd: p.hd, facing: p.facing,
        arm: p.arm.map((a) => ({ u: a.u, f: a.f })), leg: p.leg.map((a) => ({ u: a.u, f: a.f })) };
      if (p.feet) q.feet = p.feet.map((a) => a && a.slice());
      if (p.hands) q.hands = p.hands.map((a) => a && a.slice());
      return q;
    }
    // Blend two poses. Feet declared on both poses are blended in world space and re-solved by IK, so planted feet
    // stay planted and knees keep pointing forward. Hands declared on both poses travel in straight lines the same way.
    function blendPose(a, b, w) {
      if (w <= 0) return a; if (w >= 1) return b;
      const out = { P: { x: lerp(a.P.x, b.P.x, w), y: lerp(a.P.y, b.P.y, w) }, tau: lerp(a.tau, b.tau, w), hd: lerp(a.hd || 0, b.hd || 0, w), facing: w < 0.5 ? a.facing : b.facing,
        arm: a.arm.map((q, i) => ({ u: angLerp(q.u, b.arm[i].u, w), f: angLerp(q.f, b.arm[i].f, w) })),
        leg: a.leg.map((q, i) => ({ u: angLerp(q.u, b.leg[i].u, w), f: angLerp(q.f, b.leg[i].f, w) })) };
      if (a.feet && b.feet && a.facing === b.facing) {
        out.feet = [0, 1].map((i) => a.feet[i] && b.feet[i] ? [lerp(a.feet[i][0], b.feet[i][0], w), lerp(a.feet[i][1], b.feet[i][1], w), b.feet[i][2] || 1] : null);
        out.feet.forEach((ft, i) => { if (ft) legIK(out, i, ft[0], ft[1], ft[2]); });
      }
      if (a.hands && b.hands && a.facing === b.facing) {
        out.hands = [0, 1].map((i) => a.hands[i] && b.hands[i] ? [lerp(a.hands[i][0], b.hands[i][0], w), lerp(a.hands[i][1], b.hands[i][1], w), w < 0.5 ? a.hands[i][2] : b.hands[i][2]] : null);
        out.hands.forEach((h, i) => { if (h) armIK(out, i, h[0], h[1], h[2]); });
      }
      return out;
    }
    // Plant both feet on the ground around x (front foot forward, back foot behind), solving the legs.
    function plant(p, x, front, back, bend) {
      const f = p.facing;
      p.feet = [[x + front * f, -R.FOOT_RY, bend || 1], [x - back * f, -R.FOOT_RY, bend || 1]];
      legIK(p, 0, p.feet[0][0], p.feet[0][1], p.feet[0][2]); legIK(p, 1, p.feet[1][0], p.feet[1][1], p.feet[1][2]);
      return p;
    }
    function reach(p, i, x, y, bend) { p.hands = p.hands || [null, null]; p.hands[i] = [x, y, bend === undefined ? -1 : bend]; return armIK(p, i, x, y, bend === undefined ? -1 : bend); }

    return { R, H, spec: spec || {}, dir, neckOf, solve, armIK, legIK, reach, plant, newPose, clonePose, blendPose };
  }

  SF.rig = { create, DEFAULT_BODY };
})(typeof window !== 'undefined' ? window : globalThis);
