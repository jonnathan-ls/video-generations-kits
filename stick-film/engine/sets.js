// Camera + reusable set pieces. Every piece draws through the theme, so it follows the film's art style.
// World px: ground at y = 0, y < 0 is up. A set piece is { type, ...options }; any option may be a function of t.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { D2R, clamp, lerp, srnd, rnd, vnoise, easeOut, mix } = L;
  const val = (v, t) => (typeof v === 'function' ? v(t) : v);

  // ---- camera: {cx, z, gy (screen y of the ground line), sx, sy (shake)} --------------------------------------------
  function layer(ctx, D, p) {
    const c = D.cam, z = c.z, rest = D.H * 0.68, gp = rest + (c.gy - rest) * p;
    ctx.setTransform(z, 0, 0, z, D.W / 2 - c.cx * p * z + (c.sx || 0), gp + (c.sy || 0));
  }
  const viewX = (D, p, pad) => { const c = D.cam, h = D.W / 2 / c.z + (pad || 80); return [c.cx * p - h, c.cx * p + h]; };
  const toScreenX = (D, p, x) => D.W / 2 + (x - D.cam.cx * p) * D.cam.z + (D.cam.sx || 0);

  const P = {};
  // ---- ground: line, accent path band, tufts and pebbles --------------------------------------------------------------
  P.ground = (ctx, D, s, t) => {
    const TH = D.TH, st = TH.style; layer(ctx, D, 1);
    const [xmin, xmax] = viewX(D, 1, 60), step = 30, x0 = Math.floor(xmin / step) * step, top = [], bot = [];
    const bandH = val(s.bandHeight, t) || 48;
    for (let x = x0; x <= xmax; x += step) {
      const k = Math.round(x / step);
      top.push([x, srnd(31, k + TH.B * 97) * 1.3 * TH.S.jitter + vnoise(33, x / 160 + TH.B * 3.1) * 2.2 * TH.S.jitter]);
      bot.push([x, bandH + srnd(32, k + TH.B * 71) * 1.6 * TH.S.jitter + vnoise(34, x / 120) * 5]);
    }
    if (st === 'silhouette' || st === 'flat') {            // solid ground below the line
      ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]); for (const q of top) ctx.lineTo(q[0], q[1]);
      ctx.lineTo(xmax, 2000); ctx.lineTo(xmin, 2000); ctx.closePath(); ctx.fillStyle = TH.color('ground'); ctx.fill();
    }
    if (s.band !== false && st !== 'silhouette') {
      ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]); for (const q of top) ctx.lineTo(q[0], q[1]);
      for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
      ctx.closePath(); ctx.fillStyle = TH.color(s.bandColor || 'accent'); ctx.globalAlpha = st === 'sketch' ? 0.6 : 1; ctx.fill(); ctx.globalAlpha = 1;
      TH.stroke(ctx, bot, 3.4, { seed: 9 });
    }
    TH.stroke(ctx, top, 7, { seed: 8 });
    if (s.tufts === false) return;
    const cell = 150, k0 = Math.floor(xmin / cell), k1 = Math.ceil(xmax / cell);
    for (let k = k0; k <= k1; k++) {
      const x = k * cell + rnd(41, k) * cell * 0.8, kind = rnd(42, k);
      if (s.clear && x > s.clear[0] && x < s.clear[1]) continue;
      ctx.save(); ctx.translate(x, 0);
      if (kind < 0.42) {
        for (let b = 0; b < 4; b++) {
          const a = (b - 1.5) * 0.34 + srnd(44, k * 5 + b) * 0.1, len = 20 + rnd(45, k * 5 + b) * 18;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.sin(a) * len * 0.3, -len * 0.6, Math.sin(a) * len, -Math.cos(a) * len);
          ctx.lineWidth = TH.lw(3.4); ctx.strokeStyle = TH.color(b === 1 && rnd(43, k) < 0.4 ? 'accent' : 'ink'); ctx.lineCap = 'round'; ctx.stroke();
        }
      } else if (kind < 0.62 && st !== 'silhouette') {
        for (let b = 0; b < 3; b++) TH.ellipse(ctx, srnd(47, k * 3 + b) * 40, 12 + rnd(48, k * 3 + b) * 24, 3.6 + rnd(49, k * 3 + b) * 2.4, 3, 0, 'ink');
      }
      ctx.restore();
    }
  };

  // ---- hills: two parallax ridges ----------------------------------------------------------------------------------------
  const HILL = [{ p: 0.16, base: -330, a1: 60, l1: 560, f1: 0.4, a2: 26, l2: 230, f2: 1.7, w: 3.2, seed: 21 }, { p: 0.34, base: -168, a1: 42, l1: 380, f1: 2.2, a2: 16, l2: 150, f2: 0.6, w: 3.6, seed: 22 }];
  const hillY = (h, x) => h.base - h.a1 * Math.sin(x / h.l1 + h.f1) - h.a2 * Math.sin(x / h.l2 + h.f2) - 7 * vnoise(h.seed, x / 90);
  P.hills = (ctx, D, s, t) => {
    const TH = D.TH, st = TH.style;
    HILL.forEach((h, li) => {
      layer(ctx, D, h.p);
      const [xmin, xmax] = viewX(D, h.p, 80), x0 = Math.floor(xmin / 26) * 26, pts = [];
      for (let x = x0; x <= xmax; x += 26) pts.push([x + srnd(h.seed + 50, Math.round(x / 26) + TH.B * 101) * 0.9 * TH.S.jitter, hillY(h, x) * (s.scale || 1)]);
      ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0][0], 2000); for (const q of pts) ctx.lineTo(q[0], q[1]); ctx.lineTo(pts[pts.length - 1][0], 2000); ctx.closePath();
      if (st === 'silhouette') { ctx.fillStyle = mix(TH.pal.sky2, TH.pal.ink, li === 0 ? 0.35 : 0.6); ctx.fill(); ctx.restore(); return; }
      if (st === 'flat') { ctx.fillStyle = li === 0 ? mix(TH.pal.paper, TH.pal.hill || TH.pal.accent, 0.7) : mix(TH.pal.paper, TH.pal.ground, 0.75); ctx.fill(); ctx.restore(); TH.stroke(ctx, pts, h.w, { seed: h.seed }); return; }
      ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0); TH.backgroundRaw(ctx); ctx.restore();
      layer(ctx, D, h.p); TH.stroke(ctx, pts, h.w / Math.max(0.6, D.cam.z * 0.6 + 0.4), { seed: h.seed });
    });
  };

  // ---- sun, clouds, birds --------------------------------------------------------------------------------------------------
  P.sun = (ctx, D, s, t) => {
    const TH = D.TH; layer(ctx, D, val(s.p, t) || 0.08);
    const x = val(s.x, t) || 0, y = val(s.y, t) === undefined ? -420 : val(s.y, t), r = val(s.r, t) || 70;
    if (TH.style === 'silhouette') { TH.ellipse(ctx, x, y, r * 2.2, r * 2.2, 0, L.rgba(TH.pal.glow, 0.25)); TH.ellipse(ctx, x, y, r * 1.6, r * 1.6, 0, 'glow'); return; }
    TH.shape(ctx, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }, 'accent', { w: 4 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t * 0.1; TH.line(ctx, [x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3], [x + Math.cos(a) * r * 1.65, y + Math.sin(a) * r * 1.65], 4, { seed: 60 + i }); }
  };
  P.clouds = (ctx, D, s, t) => {
    const TH = D.TH, p = val(s.p, t) || 0.12; layer(ctx, D, p);
    const list = s.list || [[-700, -620, 1], [250, -760, 0.8], [1100, -640, 1.1]];
    for (const [cx0, cy, sc] of list) {
      const cx = cx0 + t * (s.drift === undefined ? 6 : s.drift);
      TH.shape(ctx, () => { ctx.beginPath(); const r = 48 * sc; ctx.moveTo(cx - 2.2 * r, cy); ctx.bezierCurveTo(cx - 2.4 * r, cy - 1.0 * r, cx - 1.2 * r, cy - 1.5 * r, cx - 0.6 * r, cy - 1.0 * r); ctx.bezierCurveTo(cx - 0.2 * r, cy - 2.0 * r, cx + 1.4 * r, cy - 1.8 * r, cx + 1.2 * r, cy - 0.8 * r); ctx.bezierCurveTo(cx + 2.4 * r, cy - 1.0 * r, cx + 2.6 * r, cy, cx + 1.8 * r, cy); ctx.closePath(); }, TH.style === 'silhouette' ? 'sky' : 'paper', { w: 3.4 });
    }
  };
  P.birds = (ctx, D, s, t) => {
    const TH = D.TH; layer(ctx, D, 0.2);
    for (let i = 0; i < (s.n || 3); i++) {
      const x = (s.x || -600) + i * 90 + t * (s.speed || 60), y = (s.y || -640) + Math.sin(t * 2 + i) * 10 + i * 24, fl = Math.sin(t * 9 + i * 1.7) * 9;
      TH.stroke(ctx, [[x - 18, y - fl], [x, y], [x + 18, y - fl]], 3.2, { smooth: false, seed: 70 + i });
    }
  };

  // ---- bare tree (grows on with s.grow 0..1) ------------------------------------------------------------------------------
  let TREE = null;
  function buildTree() {
    const r = L.mulberry(2718), br = [];
    function grow(x, y, ang, len, w, depth, s0, w1f) {
      const a1 = ang + (r() - 0.5) * 22, x1 = x + Math.sin(a1 * D2R) * len, y1 = y - Math.cos(a1 * D2R) * len;
      const nx = -(y1 - y) / len, ny = (x1 - x) / len, off = (r() - 0.5) * len * 0.25, w1 = w * (w1f || 0.66);
      br.push({ x0: x, y0: y, cx: (x + x1) / 2 + nx * off, cy: (y + y1) / 2 + ny * off, x1, y1, w0: w, w1, depth, s0, len });
      if (depth >= 5 || w1 < 2.3) return;
      const n = depth < 2 ? 2 : (r() < 0.3 ? 3 : 2);
      for (let i = 0; i < n; i++) { const sg = n === 2 ? (i === 0 ? -1 : 1) : (i - 1); grow(x1, y1, a1 + sg * (17 + r() * 24) + (r() - 0.5) * 8, len * (0.64 + r() * 0.14), w1, depth + 1, s0 + len); }
    }
    br.push({ x0: 0, y0: 0, cx: 6, cy: -120, x1: -3, y1: -236, w0: 46, w1: 28, depth: 0, s0: 0, len: 240 });
    grow(-3, -236, -33, 150, 25, 1, 240, 0.7); grow(-3, -236, 27, 172, 26, 1, 240, 0.7); grow(-3, -236, -4, 96, 17, 2, 240, 0.68);
    let S = 0; for (const b of br) S = Math.max(S, b.s0 + b.len);
    TREE = { br, S };
  }
  const bq = (b, u) => { const a = (1 - u) * (1 - u), c = 2 * (1 - u) * u, d = u * u; return [a * b.x0 + c * b.cx + d * b.x1, a * b.y0 + c * b.cy + d * b.y1]; };
  P.tree = (ctx, D, s, t) => {
    const TH = D.TH, g = val(s.grow, t) === undefined ? 1 : val(s.grow, t); if (g <= 0) return;
    if (!TREE) buildTree();
    layer(ctx, D, 1); ctx.translate(val(s.x, t) || 0, 0); const sc = val(s.scale, t) || 1; ctx.scale(sc * (s.flip ? -1 : 1), sc);
    const front = Math.min(1, g) * TREE.S * 1.02, ink = TH.color('ink'), fill = TH.style === 'silhouette' ? ink : TH.style === 'flat' ? mix(TH.pal.paper, TH.pal.ink, 0.25) : TH.pal.paper;
    const pieces = [];
    for (const b of TREE.br) {
      const fr = clamp((front - b.s0) / b.len, 0, 1); if (fr <= 0) continue;
      const n = Math.max(3, Math.ceil(b.len * fr / 28)), pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n * fr, q = bq(b, u), h = Math.max(0, -q[1]) / 480; pts.push([q[0] + Math.sin(t * 1.3 + b.depth) * 3.6 * h * h, q[1], lerp(b.w0, b.w1, u)]); }
      pieces.push(pts);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const seg = (pts, wf, col) => { for (let i = 0; i < pts.length - 1; i++) { const w = (pts[i][2] + pts[i + 1][2]) / 2 + wf; if (w <= 0.2) continue; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); } };
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sg * 14, -4); ctx.quadraticCurveTo(sg * 36, 6, sg * 72, 8); ctx.lineWidth = 6; ctx.strokeStyle = ink; ctx.stroke(); }
    for (const p of pieces) seg(p, 0, ink);
    if (TH.style !== 'silhouette') for (const p of pieces) seg(p.map((q) => [q[0], q[1], q[2] >= 10.4 ? q[2] : 0]), -8.8, fill);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  // ---- house front with a working door ----------------------------------------------------------------------------------------
  // s: { x (door center), width, wall (wall height), roof (peak height above wall), windows:[[x,y,w,h]] relative to door center,
  //      chimney:true, door:{ w, h, open: t=>0..1, knock: t=>px shake, glow: t=>0..1 } }
  function rect(ctx, x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); }
  P.house = (ctx, D, s, t) => {
    const TH = D.TH; layer(ctx, D, 1);
    const cx = val(s.x, t) || 0, hw = (s.width || 2300) / 2, x0 = cx - hw - 130, x1 = cx + hw - 130, top = -(s.wall || 700), peakY = top - (s.roof || 450);
    const d = Object.assign({ w: 230, h: 480 }, s.door || {}), dl = cx - d.w / 2, dr = cx + d.w / 2, glow = val(d.glow, t) || 0;
    if (s.chimney !== false) TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(x1 - 360, top - 100); ctx.lineTo(x1 - 360, peakY + 110); ctx.lineTo(x1 - 270, peakY + 110); ctx.lineTo(x1 - 270, top - 40); }, 'paper', { w: 6 });
    TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(x0 - 70, top); ctx.lineTo((x0 + x1) / 2, peakY); ctx.lineTo(x1 + 70, top); ctx.closePath(); }, 'paper', { w: 7 });
    TH.shape(ctx, () => rect(ctx, x0, top, x1 - x0, -top), 'paper', { w: 6 });
    if (TH.style !== 'silhouette') for (let i = 0; i < 26; i++) {               // siding hints
      const x = lerp(x0 + 40, x1 - 80, rnd(7, i)), y = -60 - rnd(8, i) * (-top - 140), l = 40 + rnd(9, i) * 60;
      if (x + l > dl - 30 && x < dr + 30 && y > -d.h - 40) continue;
      if ((s.windows || DEFAULT_WIN).some(([wx, wy, ww, wh]) => x + l > cx + wx - 20 && x < cx + wx + ww + 20 && y > wy - 20 && y < wy + wh + 20)) continue;
      TH.line(ctx, [x, y], [x + l, y], 2.4, { seed: 80 + i });
    }
    for (const [wx, wy, ww, wh] of (s.windows || DEFAULT_WIN)) {
      ctx.globalAlpha = 0.55 + 0.45 * glow; TH.shape(ctx, () => rect(ctx, cx + wx, wy, ww, wh), 'soft', { w: 6 }); ctx.globalAlpha = 1;
      if (TH.style !== 'silhouette') { TH.line(ctx, [cx + wx + ww / 2, wy], [cx + wx + ww / 2, wy + wh], 4.5); TH.line(ctx, [cx + wx, wy + wh / 2], [cx + wx + ww, wy + wh / 2], 4.5); TH.line(ctx, [cx + wx - 16, wy + wh + 4], [cx + wx + ww + 16, wy + wh + 4], 7); }
    }
    // doorway: warm interior, then the swinging panel (hinge on the far edge), then the frame and mat
    const o = clamp(val(d.open, t) || 0, 0, 1), knock = val(d.knock, t) || 0;
    TH.shape(ctx, () => rect(ctx, dl, -d.h, d.w, d.h), 'soft', { outline: false });
    if (o > 0.02 && TH.style !== 'silhouette') { ctx.save(); rect(ctx, dl, -d.h, d.w, d.h); ctx.clip(); ctx.globalAlpha = clamp(o * 2, 0, 1); TH.line(ctx, [dl, -110], [dr, -122], 3.4); ctx.globalAlpha = 1; ctx.restore(); }
    const vis = Math.cos(o * Math.PI * 0.47), fx = dr - d.w * vis + knock, sh = 0.07 * o * d.h * 0.5;
    const q = [[fx, -d.h + sh], [dr, -d.h], [dr, 0], [fx, -sh]];
    TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); }, 'paper', { w: 6.5 });
    if (vis > 0.2 && TH.style !== 'silhouette') {
      const px = (u) => lerp(fx, dr, u), py = (v, u) => lerp(lerp(q[0][1], -d.h, u), lerp(q[3][1], 0, u), v);
      const inset = (u0, u1, v0, v1) => TH.stroke(ctx, [[px(u0), py(v0, u0)], [px(u1), py(v0, u1)], [px(u1), py(v1, u1)], [px(u0), py(v1, u0)], [px(u0), py(v0, u0)]], 3.6, { smooth: false });
      inset(0.14, 0.45, 0.08, 0.42); inset(0.55, 0.86, 0.08, 0.42); inset(0.14, 0.86, 0.55, 0.92);
      const kx = px(0.12), ky = py(0.53, 0.12); TH.shape(ctx, () => { ctx.beginPath(); ctx.arc(kx, ky, 10 * Math.max(0.4, vis), 0, Math.PI * 2); }, 'accent', { w: 3.2 });
    }
    TH.stroke(ctx, [[dl - 16, 0], [dl - 16, -d.h - 16], [dr + 16, -d.h - 16], [dr + 16, 0]], 7, { smooth: false });
    TH.line(ctx, [dl - 34, -d.h - 30], [dr + 34, -d.h - 30], 7);
    TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(dl + 6, 6); ctx.lineTo(dr - 6, 6); ctx.lineTo(dr + 8, 24); ctx.lineTo(dl - 8, 24); ctx.closePath(); }, 'accent', { w: 3.4 });
  };
  const DEFAULT_WIN = [[-1000, -480, 200, 200], [380, -480, 200, 200]];

  // ---- room interior: back wall line, window, picture frame, hanging lamp, rug -------------------------------------------------
  P.room = (ctx, D, s, t) => {
    const TH = D.TH; layer(ctx, D, 1);
    const [xmin, xmax] = viewX(D, 1, 60), wy = -(s.wall || 760);
    if (TH.style === 'flat') { ctx.fillStyle = mix(TH.pal.paper, TH.pal.accent, 0.08); ctx.fillRect(xmin, wy, xmax - xmin, -wy); }
    TH.line(ctx, [xmin, -34], [xmax, -34], 3.2, { seed: 5 });
    if (s.window !== false) { const [x, y, w, h] = s.window || [-520, -560, 260, 240]; TH.shape(ctx, () => rect(ctx, x, y, w, h), 'soft', { w: 6 }); TH.line(ctx, [x + w / 2, y], [x + w / 2, y + h], 4.5); TH.line(ctx, [x, y + h / 2], [x + w, y + h / 2], 4.5); TH.line(ctx, [x - 18, y + h + 6], [x + w + 18, y + h + 6], 7); }
    if (s.frame !== false) { const [x, y, w, h] = s.frame || [260, -600, 170, 130]; TH.shape(ctx, () => rect(ctx, x, y, w, h), 'paper', { w: 5 }); TH.stroke(ctx, [[x + 24, y + h - 26], [x + w * 0.42, y + 40], [x + w * 0.62, y + h * 0.6], [x + w - 22, y + h - 26]], 3.4, { smooth: false }); }
    if (s.lamp !== false) { const lx = (s.lamp && s.lamp.x) || 40; TH.line(ctx, [lx, wy - 400], [lx, -640], 2.6); TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(lx - 46, -580); ctx.quadraticCurveTo(lx, -680, lx + 46, -580); ctx.closePath(); }, 'accent', { w: 3.6 }); }
    if (s.rug) { const [x, w] = s.rug; TH.shape(ctx, () => { ctx.beginPath(); ctx.ellipse(x, 18, w / 2, 16, 0, 0, Math.PI * 2); }, 'soft', { w: 3.4 }); }
  };

  function drawSet(ctx, D, piece, t) { const fn = P[piece.type]; if (!fn) throw new Error('unknown set piece: ' + piece.type); fn(ctx, D, piece, t); ctx.setTransform(1, 0, 0, 1, 0, 0); }

  SF.sets = { P, draw: drawSet, layer, viewX, toScreenX, val };
})(typeof window !== 'undefined' ? window : globalThis);
