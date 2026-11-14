// Gait planner: feet are planted in world space while the pelvis follows a path x(t), so there is no foot sliding.
// plan() lays out footfalls for one walk segment; pose() turns them into a walking (or running) pose at time t.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { clamp, lerp } = L;

  // pathX(t) -> pelvis x. Tc = stride cycle seconds, stance = fraction of the cycle a foot is down.
  function plan(rig, pathX, t0, t1, o) {
    o = o || {};
    const k = rig.R.k, f0 = o.facing || 1, Tc = o.Tc || 0.78, sf = o.stance || 0.58, startFoot = o.startFoot || 0;
    const x0 = pathX(t0), init = o.init || [x0 + 12 * k * f0, x0 - 14 * k * f0];
    const feet = [[], []], first = [t0 + 0.02, t0 + 0.02 + Tc * 0.5];
    const v = (t) => (pathX(t + 0.02) - pathX(t - 0.02)) / 0.04;
    for (let ft = 0; ft < 2; ft++) {
      const fi = ft === startFoot ? 0 : 1;
      feet[ft].push({ tL: -1e9, tU: first[fi], X: init[ft] });
      let tU = first[fi], n = 0;
      while (tU < t1 + 0.6 && n++ < 400) {
        const sw = (1 - sf) * Tc, tL = tU + sw, st = sf * Tc;
        if (tL > t1 + 0.25) break;
        const a = 0.5 * v(tL + st / 2) * st;
        feet[ft].push({ tL, tU: tL + st, X: pathX(tL) + a, a }); tU = tL + st;
      }
    }
    return { feet, t0, t1, Tc, run: !!o.run, lift: o.lift || (o.run ? 0.09 : 0.055), pathX };
  }

  function footAt(rig, g, ft, t) {
    const F = g.feet[ft], H = rig.R.H;
    for (let i = 0; i < F.length; i++) {
      if (t >= F[i].tL && t <= F[i].tU) return { x: F[i].X, lift: 0, planted: true };
      if (i + 1 < F.length && t > F[i].tU && t < F[i + 1].tL) {
        const u = (t - F[i].tU) / (F[i + 1].tL - F[i].tU), e = u * u * (3 - 2 * u), a = Math.abs(F[i + 1].a || 30 * rig.R.k);
        return { x: lerp(F[i].X, F[i + 1].X, e), lift: g.lift * H * clamp(a / (50 * rig.R.k), 0.35, 1.1) * Math.pow(Math.sin(Math.PI * u), 0.8), planted: false };
      }
    }
    return { x: F[F.length - 1].X, lift: 0, planted: true };
  }

  // footfalls (for step sounds): [{t, foot}]
  function steps(g) { const out = []; for (let ft = 0; ft < 2; ft++) for (const s of g.feet[ft]) if (s.tL > g.t0 && s.tL < g.t1 + 0.3) out.push({ t: s.tL, foot: ft }); return out.sort((a, b) => a.t - b.t); }

  function pose(rig, g, facingAt, t) {
    const R = rig.R, k = R.k, LEFF = R.LEG * 0.985, f = facingAt(t), x = g.pathX(t);
    const p = rig.newPose(x, f); p.tau = g.run ? 15 : 5; p.hd = g.run ? -4 : 0;
    let hs = 0;
    for (let s = -2; s <= 2; s++) {                       // pelvis height from the planted feet, smoothed over 0.1 s
      const tt = t + s * 0.025, a = footAt(rig, g, 0, tt), b = footAt(rig, g, 1, tt), px = g.pathX(tt), ff = facingAt(tt);
      let h = LEFF;
      if (a.planted) h = Math.min(h, Math.sqrt(Math.max(1, LEFF * LEFF - (a.x - 10 * k * ff - px) ** 2)));
      if (b.planted) h = Math.min(h, Math.sqrt(Math.max(1, LEFF * LEFF - (b.x - 10 * k * ff - px) ** 2)));
      hs += h;
    }
    p.P.y = -(hs / 5 + R.FOOT_RY) + (g.run ? 0.02 * R.H : 0);
    const A = footAt(rig, g, 0, t), B = footAt(rig, g, 1, t);
    p.feet = [[A.x - 10 * k * f, -R.FOOT_RY - A.lift, 1], [B.x - 10 * k * f, -R.FOOT_RY - B.lift, 1]];
    rig.legIK(p, 0, p.feet[0][0], p.feet[0][1], 1); rig.legIK(p, 1, p.feet[1][0], p.feet[1][1], 1);
    const r0 = clamp((A.x - p.P.x) * f / (70 * k), -1, 1), r1 = clamp((B.x - p.P.x) * f / (70 * k), -1, 1);
    if (g.run) {                                          // bent arms pumping opposite the legs
      p.arm = [{ u: -r0 * 38 - 6, f: -r0 * 38 + 78 }, { u: -r1 * 38 + 6, f: -r1 * 38 + 84 }];
    } else {
      const amp = 20;
      p.arm = [{ u: -r0 * amp - 4, f: -r0 * amp + 10 }, { u: -r1 * amp + 4, f: -r1 * amp + 20 }];
    }
    return p;
  }

  SF.gait = { plan, pose, footAt, steps };
})(typeof window !== 'undefined' ? window : globalThis);
