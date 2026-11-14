// Math, noise, keyframe and 2-bone IK helpers. Shared by the film model (node) and the renderer (browser).
(function (G) {
  const SF = G.SF = G.SF || {};
  const D2R = Math.PI / 180;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const sstep5 = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const easeOut = (t) => { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  const easeIn = (t) => { t = clamp(t, 0, 1); return t * t * t; };
  const easeIO = sstep;
  const backOut = (t) => { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);          // 0..1 progress of t within [a,b]

  // deterministic hash noise -------------------------------------------------
  function hash(n) { n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); n ^= n >>> 15; return (n >>> 0) / 4294967296; }
  function rnd(seed, i) { return hash((seed * 374761393 + i * 668265263) | 0); }          // [0,1)
  function srnd(seed, i) { return rnd(seed, i) * 2 - 1; }                                    // [-1,1)
  function vnoise(seed, x) {                                                                 // smooth 1-D value noise [-1,1]
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(srnd(seed, i), srnd(seed, i + 1), u);
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // keyframe track: kf([[t,v],[t,v],...], t, easeFn)
  function kf(keys, t, ease) {
    if (t <= keys[0][0]) return keys[0][1];
    const n = keys.length;
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    for (let i = 0; i < n - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t >= a[0] && t <= b[0]) {
        const u = (t - a[0]) / (b[0] - a[0]);
        return lerp(a[1], b[1], (ease || sstep)(u));
      }
    }
    return keys[n - 1][1];
  }

  // 2-bone IK in screen coords. Angles: 0 = straight down, + = toward +x. bend = +1 -> joint bulges toward +x side (forward)
  function ik2(rx, ry, tx, ty, l1, l2, bend) {
    let dx = tx - rx, dy = ty - ry, d = Math.hypot(dx, dy);
    const maxd = (l1 + l2) * 0.9995, mind = Math.abs(l1 - l2) + 1e-3;
    let reach = true;
    if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; reach = false; }
    if (d < mind) { d = mind; }
    const base = Math.atan2(dx, dy);                       // angle of root->target (0=down)
    const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
    const a = Math.acos(cosA);                             // angle at root between l1 and root->target
    const a1 = base + bend * a;                            // upper segment angle (bend +1: joint toward +x)
    const kx = rx + Math.sin(a1) * l1, ky = ry + Math.cos(a1) * l1;
    const a2 = Math.atan2(rx + dx - kx, ry + dy - ky);     // lower segment angle (toward target)
    return { a1: a1 / D2R, a2: a2 / D2R, reach, kx, ky };
  }

  function angLerp(a, b, t) { let d = ((b - a + 540) % 360) - 180; return a + d * t; }

  // keyframes of objects: kfo([[t,{a,b}],...], t) interpolates every numeric field
  function kfo(keys, t, ease) {
    const out = {}, names = Object.keys(keys[0][1]);
    for (const n of names) out[n] = kf(keys.map((k) => [k[0], k[1][n] === undefined ? keys[0][1][n] : k[1][n]]), t, ease);
    return out;
  }
  // 0 -> 1 -> 0 window with smooth edges: in over [a, a+fi], out over [b-fo, b]
  function win(t, a, b, fi, fo) { fi = fi === undefined ? 0.25 : fi; fo = fo === undefined ? fi : fo; return sstep(seg(t, a, a + Math.max(1e-4, fi))) * (1 - sstep(seg(t, b - Math.max(1e-4, fo), b))); }
  function hex(c) { c = c.replace('#', ''); if (c.length === 3) c = c.split('').map((x) => x + x).join(''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, u) { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join(''); }
  function rgba(c, a) { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }

  SF.lib = { D2R, clamp, lerp, sstep, sstep5, easeOut, easeIn, easeIO, backOut, seg, hash, rnd, srnd, vnoise, mulberry, kf, kfo, win, ik2, angLerp, hex, mix, rgba };
})(typeof window !== 'undefined' ? window : globalThis);
