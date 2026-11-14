// Cloth tails (scarf ends, capes): Verlet chains pinned to a knot, simulated once over the whole film at 120 Hz so every
// render worker gets identical results. Tails collide with the head and are kept off the face above the knot.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { D2R, clamp } = L;

  // anchorAt(t) -> { x, y, Hc:[x,y], HR, f } ; tails: [{ len, a, off }] (a = rest angle below horizontal, degrees;
  // off = [dx, dy] from the anchor, dx toward the facing side, so several edges of one cloth can hang from different points)
  function simulate(duration, anchorAt, tails, o) {
    o = o || {};
    const dt = 1 / 120, N = o.points || 5, steps = Math.ceil(duration / dt) + 1;
    const stiff = o.stiff || 38, damp = o.damp || 5.8, grav = o.gravity === undefined ? 160 : o.gravity, wind = o.wind === undefined ? 30 : o.wind;
    const out = tails.map(() => new Float32Array(steps * N * 2));
    let state = null;
    for (let s = 0; s < steps; s++) {
      const t = s * dt, K = anchorAt(t), f = K.f;
      const pinX = (tl) => K.x + (tl.off ? tl.off[0] * f : 0), pinY = (tl) => K.y + (tl.off ? tl.off[1] : 0);
      if (!state) state = tails.map((tl) => {
        const pts = [], prev = [];
        for (let j = 0; j < N; j++) { const q = [pinX(tl) - f * Math.cos(tl.a * D2R) * tl.len * j / (N - 1), pinY(tl) + Math.sin(tl.a * D2R) * tl.len * j / (N - 1)]; pts.push(q); prev.push(q.slice()); }
        return { pts, prev };
      });
      for (let ti = 0; ti < tails.length; ti++) {
        const tl = tails[ti], st = state[ti], sg = tl.len / (N - 1), X0 = pinX(tl), Y0 = pinY(tl);
        st.pts[0] = [X0, Y0];
        for (let j = 1; j < N; j++) {
          const q = st.pts[j], pr = st.prev[j], vx = (q[0] - pr[0]) / dt, vy = (q[1] - pr[1]) / dt;
          const rest = [X0 - f * Math.cos(tl.a * D2R) * sg * j, Y0 + Math.sin(tl.a * D2R) * sg * j], wx = -wind * f, wy = -4;
          const ax = stiff * (rest[0] - q[0]) - damp * (vx - wx), ay = stiff * (rest[1] - q[1]) + grav - damp * (vy - wy);
          st.prev[j] = [q[0], q[1]]; st.pts[j] = [q[0] + (q[0] - pr[0]) * 0.972 + ax * dt * dt, q[1] + (q[1] - pr[1]) * 0.972 + ay * dt * dt];
        }
        for (let it = 0; it < 3; it++) for (let j = 1; j < N; j++) {
          const a = st.pts[j - 1], b = st.pts[j], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-6;
          st.pts[j] = [a[0] + dx / d * sg, a[1] + dy / d * sg];
          if (K.Hc) {
            const hx = st.pts[j][0] - K.Hc[0], hy = st.pts[j][1] - K.Hc[1], hr = Math.hypot(hx, hy), lim = K.HR + 4;
            if (hr < lim) st.pts[j] = [K.Hc[0] + hx / (hr || 1) * lim, K.Hc[1] + hy / (hr || 1) * lim];
          }
          if (st.pts[j][1] < K.y + 6) {                     // above the knot, never in front of the face
            if (f > 0 && st.pts[j][0] > K.x + 6) st.pts[j][0] = K.x + 6;
            if (f < 0 && st.pts[j][0] < K.x - 6) st.pts[j][0] = K.x - 6;
          }
          if (st.pts[j][1] > -2) st.pts[j][1] = -2;           // never through the ground
        }
        for (let j = 0; j < N; j++) { out[ti][(s * N + j) * 2] = st.pts[j][0]; out[ti][(s * N + j) * 2 + 1] = st.pts[j][1]; }
      }
    }
    return function at(t) {
      const s = clamp(Math.round(t / dt), 0, steps - 1);
      return out.map((d) => { const ch = []; for (let j = 0; j < N; j++) ch.push([d[(s * N + j) * 2], d[(s * N + j) * 2 + 1]]); return ch; });
    };
  }

  SF.cloth = { simulate };
})(typeof window !== 'undefined' ? window : globalThis);
