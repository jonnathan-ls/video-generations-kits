// General pose library. Each pose maps to a cell on the character kit's pose sheets (feelings + actions) and works for
// any proportions: distances scale with figure height and targets hang off the solved joints.
// A pose function is (rig, t, x, f, o) -> pose with .feet (and .hands where IK was used), so blends keep feet planted.
// t drives idle motion (breathing, tremble, waving); o carries per-pose options (o.amt, o.target, o.knock...).
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { lerp, clamp } = L;

  // shared helpers -----------------------------------------------------------------------------------------------
  function stand(rig, t, x, f, crouch, front, back) {
    const R = rig.R, k = R.k, p = rig.newPose(x, f);
    const br = Math.sin(t * 2.1) * 1.3 * k;
    p.P.y = lerp(R.STAND_Y * 0.997, -0.30 * R.H, crouch || 0) - br;
    p.tau = Math.sin(t * 2.1) * 0.5;
    p.arm = [{ u: 12 + Math.sin(t * 1.7) * 2, f: 14 }, { u: -12, f: -10 }];
    rig.plant(p, x, (front === undefined ? 12 : front) * k, (back === undefined ? 14 : back) * k);
    return p;
  }
  const J = (rig, p) => rig.solve(p);
  // put hand i at an angle from straight up (degrees, + = toward the facing side), `reach` = fraction of arm length.
  // Scales with any proportions, so short-armed, big-headed characters still clear their heads.
  function raise(rig, p, i, ang, reach, bend) {
    const R = rig.R, r = R.ARM * (reach || 0.97);
    let out;
    for (let k = 0; k < 6; k++) {                       // the far hand draws behind the head: swing it out until it clears
      const j = rig.solve(p), a = ang * Math.PI / 180;
      out = rig.reach(p, i, j.sh[0] + Math.sin(a) * r * p.facing, j.sh[1] - Math.cos(a) * r, bend);
      const q = rig.solve(p); if (i === 0 || Math.hypot(q.hand[1][0] - q.Hc[0], q.hand[1][1] - q.Hc[1]) > R.HR * 1.05) break;
      ang += ang >= 0 ? 9 : -9;
    }
    return out;
  }
  const tremble = (t, a) => Math.sin(t * 47) * a + Math.sin(t * 31 + 1) * a * 0.5;

  const P = {};
  // ---- feelings sheet ---------------------------------------------------------------------------------------------
  P.neutral = (rig, t, x, f) => stand(rig, t, x, f);
  P.happy = (rig, t, x, f) => {
    const R = rig.R, H = R.H, b = (0.5 + 0.5 * Math.sin(t * 7)) * 4 * R.k;
    const p = stand(rig, t, x, f, 0.06); p.P.y -= b; rig.plant(p, x, 14 * R.k, 14 * R.k);
    p.tau = -3; p.hd = -8;
    rig.reach(p, 0, x + f * 0.21 * H, -0.50 * H - b); rig.reach(p, 1, x - f * 0.19 * H, -0.51 * H - b);
    return p;
  };
  P.sad = (rig, t, x, f) => {
    const p = stand(rig, t, x, f, 0.1); p.tau = 16; p.hd = 26; p.arm = [{ u: 22, f: 18 }, { u: 10, f: 12 }];
    rig.plant(p, x, 12 * rig.R.k, 14 * rig.R.k); return p;
  };
  P.angry = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = stand(rig, t, x + tremble(t, 0.8 * R.k), f, 0.12, 18, 18); p.tau = 10; p.hd = 4;
    rig.reach(p, 0, x + f * 0.09 * H, -0.40 * H); rig.reach(p, 1, x - f * 0.07 * H, -0.41 * H); return p;
  };
  P.scared = (rig, t, x, f) => {
    const R = rig.R, p = stand(rig, t, x + tremble(t, 1.2 * R.k), f, 0.45, 16, 16); p.tau = 20; p.hd = 8;
    const j = J(rig, p);
    rig.reach(p, 0, j.Hc[0] + f * R.HR * 1.45, j.Hc[1] + R.HR * 0.25); rig.reach(p, 1, j.Hc[0] + f * R.HR * 1.25, j.Hc[1] + R.HR * 0.75);
    return p;
  };
  P.surprised = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = stand(rig, t, x, f, 0.04, 4, 30); p.tau = -10; p.hd = -8;
    raise(rig, p, 0, 62, 0.9); raise(rig, p, 1, -66, 0.9); return p;
  };
  P.thinking = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = stand(rig, t, x, f); p.tau = 2; p.hd = 10;
    const j = J(rig, p);
    rig.reach(p, 0, j.Hc[0] + f * R.HR * 0.55, j.Hc[1] + R.HR * 0.98); rig.reach(p, 1, x + f * 0.06 * H, -0.50 * H); return p;
  };
  P.confused = (rig, t, x, f) => {        // shrug
    const R = rig.R, H = R.H, p = stand(rig, t, x, f); p.hd = -6;
    const j = J(rig, p);
    rig.reach(p, 0, x + f * 0.20 * H, j.N[1] + 0.12 * H); rig.reach(p, 1, x - f * 0.16 * H, j.N[1] + 0.10 * H); return p;
  };
  P.nervous = (rig, t, x, f) => {         // hand-wringing
    const R = rig.R, H = R.H, k = R.k, p = stand(rig, t, x, f); p.hd = 12;
    const c = Math.sin(t * 9) * 4 * k;
    rig.reach(p, 0, x + f * 36 * k + c, -0.51 * H); rig.reach(p, 1, x + f * 26 * k - c, -0.495 * H); return p;
  };
  P.proud = (rig, t, x, f) => {           // hands on hips
    const R = rig.R, H = R.H, p = stand(rig, t, x, f, 0, 20, 20); p.tau = -6; p.hd = -8;
    rig.reach(p, 0, p.P.x + f * 0.045 * H, p.P.y + 0.02 * H); rig.reach(p, 1, p.P.x - f * 0.04 * H, p.P.y + 0.02 * H); return p;
  };
  P.exhausted = (rig, t, x, f) => {
    const p = stand(rig, t, x, f, 0.3, 14, 16); p.tau = 30; p.hd = 28; p.arm = [{ u: 30, f: 28 }, { u: 24, f: 22 }];
    p.P.y += Math.sin(t * 1.4) * 1.5 * rig.R.k; rig.plant(p, x, 14 * rig.R.k, 16 * rig.R.k); return p;
  };
  P.celebrate = (rig, t, x, f) => {       // hop with arms up in a V
    const R = rig.R, H = R.H, ph = (t % 0.62) / 0.62, h = Math.max(0, Math.sin(ph * Math.PI * 2)) * 0.09 * H;
    const p = stand(rig, t, x, f, 0.05); p.P.y -= h; p.hd = -10;
    p.feet = [[x + f * 10 * R.k, -R.FOOT_RY - h * 0.85, 1], [x - f * 12 * R.k, -R.FOOT_RY - h * 0.8, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    raise(rig, p, 0, 46, 0.97); raise(rig, p, 1, -44, 0.97); return p;
  };

  // ---- actions sheet ----------------------------------------------------------------------------------------------
  P.walk = (rig, t, x, f) => {            // a held mid-stride (moving walks use the gait planner)
    const R = rig.R, k = R.k, p = rig.newPose(x, f); p.P.y = R.STAND_Y * 0.965; p.tau = 5;
    rig.plant(p, x, 50 * k, 55 * k); p.arm = [{ u: -20, f: -10 }, { u: 20, f: 30 }]; return p;
  };
  P.run = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = R.STAND_Y * 0.95; p.tau = 16; p.hd = -4;
    p.feet = [[x + f * 0.16 * H, -R.FOOT_RY, 1], [x - f * 0.22 * H, -0.13 * H, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    rig.reach(p, 0, j.N[0] - f * 0.09 * H, j.N[1] + 0.19 * H); rig.reach(p, 1, j.N[0] + f * 0.17 * H, j.N[1] + 0.07 * H); return p;
  };
  P.tiptoe = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = lerp(R.STAND_Y, -0.30 * H, 0.2); p.tau = 12; p.hd = 4;
    p.feet = [[x + f * 0.10 * H, -0.10 * H, 1], [x - f * 0.06 * H, -R.FOOT_RY, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    rig.reach(p, 0, j.N[0] + f * 0.13 * H, j.N[1] + 0.07 * H); rig.reach(p, 1, j.N[0] + f * 0.09 * H, j.N[1] + 0.09 * H); return p;
  };
  P.jump = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = R.STAND_Y - 0.16 * H; p.hd = -6;
    p.feet = [[x + f * 0.07 * H, p.P.y + 0.27 * H, 1], [x - f * 0.09 * H, p.P.y + 0.29 * H, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    raise(rig, p, 0, 44, 0.95); raise(rig, p, 1, -42, 0.95); return p;
  };
  P.sit = (rig, t, x, f) => {             // on the ground, knees up, hand on knee
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = -0.04 * H - Math.sin(t * 2.1) * 0.6 * R.k; p.tau = -4; p.hd = 2;
    p.feet = [[x + f * 0.30 * H, -R.FOOT_RY, 1], [x + f * 0.26 * H, -R.FOOT_RY, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    rig.reach(p, 0, j.knee[0][0] + f * 0.01 * H, j.knee[0][1] - 0.035 * H); rig.reach(p, 1, x - f * 0.10 * H, -R.HAND_RY - 0.01 * H, -1); return p;
  };
  P.sitChair = (rig, t, x, f, o) => {     // seat height o.seat (fraction of H, default 0.24)
    const R = rig.R, H = R.H, seat = (o && o.seat) || 0.24, p = rig.newPose(x, f); p.P.y = -seat * H - Math.sin(t * 2.1) * 0.8 * R.k; p.tau = -2;
    p.feet = [[x + f * 0.19 * H, -R.FOOT_RY, 1], [x + f * 0.15 * H, -R.FOOT_RY, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    rig.reach(p, 0, j.knee[0][0] - f * 0.02 * H, j.knee[0][1] - 0.03 * H); rig.reach(p, 1, j.knee[1][0] - f * 0.05 * H, j.knee[1][1] - 0.025 * H); return p;
  };
  P.lie = (rig, t, x, f) => {             // on its back, head propped, feet toward +f
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = -R.SW * 0.6; p.tau = -88; p.hd = 68 + Math.sin(t * 1.3) * 1.5;
    p.feet = [[x + f * R.LEG * 0.97, -R.FOOT_RY * 0.9, 1], [x + f * R.LEG * 0.93, -R.FOOT_RY * 1.1, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p), hy = -R.HAND_RY - 0.008 * H;
    rig.reach(p, 0, j.sh[0] + f * R.ARM * 0.9, hy - Math.sin(t * 2.1) * 0.6 * R.k); rig.reach(p, 1, j.sh[0] + f * R.ARM * 0.86, hy); return p;
  };
  P.wave = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = stand(rig, t, x, f); p.hd = -4;
    const j = J(rig, p), s = Math.sin(t * 10);
    rig.reach(p, 0, j.Hc[0] + f * (0.25 * H + s * 0.045 * H), j.Hc[1] - 0.10 * H + Math.abs(s) * 0.02 * H); return p;
  };
  P.reachUp = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = stand(rig, t, x, f); p.P.y -= 0.018 * H; p.hd = -22;
    p.feet = [[x + f * 12 * R.k, -R.FOOT_RY - 0.012 * H, 1], [x - f * 14 * R.k, -R.FOOT_RY - 0.012 * H, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    raise(rig, p, 0, 16, 0.99); raise(rig, p, 1, -10, 0.99); return p;
  };
  P.push = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = lerp(R.STAND_Y, -0.30 * H, 0.18); p.tau = 28; p.hd = -14;
    p.feet = [[x + f * 0.09 * H, -R.FOOT_RY, 1], [x - f * 0.33 * H, -R.FOOT_RY, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    const j = J(rig, p);
    rig.reach(p, 0, j.N[0] + f * 0.30 * H, j.N[1] + 0.05 * H); rig.reach(p, 1, j.N[0] + f * 0.28 * H, j.N[1] + 0.09 * H); return p;
  };
  P.pull = (rig, t, x, f) => {
    const R = rig.R, H = R.H, p = rig.newPose(x, f); p.P.y = lerp(R.STAND_Y, -0.30 * H, 0.25); p.tau = -22; p.hd = 8;
    p.feet = [[x + f * 0.30 * H, -R.FOOT_RY, 1], [x - f * 0.05 * H, -R.FOOT_RY, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1]); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1]);
    rig.reach(p, 0, x + f * 0.30 * H, -0.42 * H); rig.reach(p, 1, x + f * 0.25 * H, -0.40 * H); return p;
  };
  P.carry = (rig, t, x, f) => {           // both hands out front at the waist (attach a box prop between them)
    const R = rig.R, H = R.H, p = stand(rig, t, x, f, 0.04, 14, 16); p.tau = -4;
    rig.reach(p, 0, x + f * 0.17 * H, -0.45 * H); rig.reach(p, 1, x + f * 0.15 * H, -0.47 * H); return p;
  };
  P.holdCup = (rig, t, x, f) => {
    const R = rig.R, k = R.k, p = stand(rig, t, x, f), j = J(rig, p);
    rig.reach(p, 0, x + f * 54 * k, j.N[1] + 70 * k); return p;
  };

  // ---- extras that stories ask for a lot --------------------------------------------------------------------------
  P.point = (rig, t, x, f, o) => {        // o.target [x,y] in world, default straight ahead
    const R = rig.R, p = stand(rig, t, x, f), j = J(rig, p);
    const tg = (o && o.target) || [j.sh[0] + f * R.ARM, j.sh[1] - 0.01 * R.H];
    const dx = tg[0] - j.sh[0], dy = tg[1] - j.sh[1], d = Math.hypot(dx, dy) || 1, r = R.ARM * 0.985;
    rig.reach(p, 0, j.sh[0] + dx / d * r, j.sh[1] + dy / d * r); return p;
  };
  P.knock = (rig, t, x, f, o) => {        // o.knock 0..1 = the swing toward the door; o.y = knock height
    const R = rig.R, H = R.H, p = stand(rig, t, x, f), s = (o && o.knock) || 0;
    rig.reach(p, 0, x + f * (0.095 + 0.043 * s) * H, (o && o.y) || -0.624 * H); p.tau = 3; p.hd = 2; return p;
  };
  P.handsOnHead = (rig, t, x, f) => {
    const R = rig.R, p = stand(rig, t, x, f, 0.12); p.tau = 10; p.hd = 6;
    const j = J(rig, p);
    rig.reach(p, 0, j.Hc[0] + f * R.HR * 0.9, j.Hc[1] - R.HR * 0.35, 1); rig.reach(p, 1, j.Hc[0] - f * R.HR * 1.02, j.Hc[1] - R.HR * 0.3, -1); return p;
  };
  P.cower = (rig, t, x, f) => {           // crouched low, hands holding the head (the Door's monster beat)
    const R = rig.R, p = stand(rig, t, x + tremble(t, 1.2 * R.k), f, 0.75, 18, 16); p.tau = 32; p.hd = 34;
    const j = J(rig, p);
    rig.reach(p, 0, j.Hc[0] + f * R.HR * 0.9, j.Hc[1] - R.HR * 0.35, 1); rig.reach(p, 1, j.Hc[0] - f * R.HR * 1.02, j.Hc[1] - R.HR * 0.3, -1); return p;
  };
  P.idea = (rig, t, x, f) => {            // one hand up, the other on the hip
    const R = rig.R, H = R.H, p = stand(rig, t, x, f); p.hd = -6;
    const j = J(rig, p);
    rig.reach(p, 0, j.Hc[0] + f * 0.13 * H, j.Hc[1] - 0.13 * H); rig.reach(p, 1, p.P.x - f * 0.04 * H, p.P.y + 0.02 * H); return p;
  };
  P.sip = (rig, t, x, f) => {
    const R = rig.R, k = R.k, p = stand(rig, t, x, f), j = J(rig, p);
    rig.reach(p, 0, j.Hc[0] + f * 54 * k, j.Hc[1] + 34 * k); p.hd = -4; return p;
  };
  P.lookUp = (rig, t, x, f) => { const p = stand(rig, t, x, f); p.hd = -26; p.tau = -4; return p; };
  P.crouch = (rig, t, x, f, o) => { const p = stand(rig, t, x, f, (o && o.amt) || 0.5, 18, 16); p.tau = 14; return p; };

  // which cells of the kit's pose sheets each pose matches (used by the rig test sheet)
  const SHEETS = {
    feelings: ['neutral', 'happy', 'sad', 'angry', 'scared', 'surprised', 'thinking', 'confused', 'nervous', 'proud', 'exhausted', 'celebrate'],
    actions: ['walk', 'run', 'tiptoe', 'jump', 'sit', 'lie', 'wave', 'reachUp', 'push', 'pull', 'carry', 'holdCup'],
    extras: ['point', 'knock', 'handsOnHead', 'cower', 'idea', 'sip', 'lookUp', 'crouch', 'sitChair'],
  };
  // the face each pose reads best with
  const FACE = { neutral: 'neutral', happy: 'happy', sad: 'sad', angry: 'angry', scared: 'scared', surprised: 'surprised', thinking: 'thinking',
    confused: 'confused', nervous: 'worried', proud: 'proud', exhausted: 'exhausted', celebrate: 'happy', walk: 'neutral', run: 'determined',
    tiptoe: 'sneaky', jump: 'happy', sit: 'calm', sitChair: 'calm', lie: 'calm', wave: 'happy', reachUp: 'curious', push: 'strain', pull: 'strain',
    carry: 'determined', holdCup: 'calm', point: 'determined', knock: 'worried', handsOnHead: 'alarmed', cower: 'strain', idea: 'surprised',
    sip: 'calm', lookUp: 'curious', crouch: 'curious' };

  SF.poses = { P, SHEETS, FACE, stand, tremble };
})(typeof window !== 'undefined' ? window : globalThis);
