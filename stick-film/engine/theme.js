// Art styles. A theme turns roles ("ink", "paper", "accent", "soft", "glow") into colors and gives every drawing call the
// same primitives (stroke, line, shape, ellipse, ring) so characters, sets and props all change look together.
// Styles: line (marker on paper, like Wick), silhouette (solid shapes against a sky), sketch (pencil), flat (clean color).
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { lerp, srnd, rnd, vnoise, mix, rgba } = L;

  const STYLES = {
    line:       { lw: 1.0, jitter: 1.0, boilFps: 10, passes: 1 },
    silhouette: { lw: 1.5, jitter: 0.5, boilFps: 10, passes: 1 },
    sketch:     { lw: 0.62, jitter: 2.0, boilFps: 8, passes: 2 },
    flat:       { lw: 0.9, jitter: 0.0, boilFps: 0, passes: 1 },
  };
  const DEFAULT_PAL = {
    line:       { ink: '#050403', paper: '#f1ede1', accent: '#d29e23' },
    silhouette: { ink: '#16120f', paper: '#f3d9a4', accent: '#e0892f', sky1: '#f6e3b8', sky2: '#eaa25a' },
    sketch:     { ink: '#2b2a2e', paper: '#f7f5ef', accent: '#d9534f' },
    flat:       { ink: '#1d2230', paper: '#f2efe6', accent: '#ef6f4c', body: '#3a6ea5', head: '#fbe3c8', ground: '#cfe0bf', hill: '#bcd9e2' },
  };

  function create(style, palette, W, H) {
    style = STYLES[style] ? style : 'line';
    const S = STYLES[style];
    const pal = Object.assign({}, DEFAULT_PAL[style], palette || {});
    pal.accentDark = pal.accentDark || mix(pal.accent, pal.ink, 0.25);
    pal.soft = pal.soft || mix(pal.accent, pal.paper, 0.62);       // warm windows, light fills
    pal.glow = pal.glow || mix(pal.accent, '#ffffff', 0.35);
    pal.shade = pal.shade || mix(pal.paper, pal.ink, 0.12);
    pal.body = pal.body || pal.ink; pal.head = pal.head || pal.paper;
    pal.sky1 = pal.sky1 || pal.paper; pal.sky2 = pal.sky2 || mix(pal.paper, pal.accent, 0.5);
    pal.ground = pal.ground || (style === 'flat' ? mix(pal.paper, pal.ink, 0.18) : pal.ink);

    const TH = { style, S, pal, W, H, B: 0, t: 0 };
    TH.frame = (t) => { TH.t = t; TH.B = S.boilFps ? Math.floor(t * S.boilFps) : 0; };
    TH.color = (role) => {
      if (!role) return pal.ink;
      if (role[0] === '#' || role.startsWith('rgb')) return role;
      if (style === 'silhouette') return role === 'glow' || role === 'accent' || role === 'soft' ? pal[role] : role === 'sky' ? pal.sky1 : pal.ink;
      return pal[role] || pal.ink;
    };
    TH.lw = (w) => w * S.lw;
    const jit = (seed, i, amp) => [srnd(seed * 13 + TH.B * 7, i * 2) * amp * S.jitter, srnd(seed * 13 + TH.B * 7, i * 2 + 1) * amp * S.jitter];
    TH.jit = jit;

    // ---- primitives ----------------------------------------------------------------------------------------------
    function pathSmooth(ctx, pts, closed) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      if (pts.length < 3) { for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed) ctx.closePath(); return; }
      for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]); if (closed) ctx.closePath();
    }
    // a stroke through points. o: {color, seed, smooth (default true), raw (no style width), alpha, cap}
    TH.stroke = (ctx, pts, w, o) => {
      if (!pts || pts.length < 2) return;
      o = o || {};
      const col = TH.color(o.color || 'ink'), width = o.raw ? w : TH.lw(w);
      ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
      for (let pass = 0; pass < S.passes; pass++) {
        let q = pts;
        if (style === 'sketch') {
          const amp = 1.4 + pass * 1.0, sd = (o.seed || 1) + pass * 17 + TH.B * 3, fr = pts.length > 12 ? 0.16 : 0.6;   // smooth wobble, not fuzz
          q = pts.map((p, i) => [p[0] + vnoise(sd, i * fr) * amp, p[1] + vnoise(sd + 5, i * fr) * amp]);
          if (pass === 1 && q.length >= 2) {             // pencil overshoot at the ends
            const a = q[0], b = q[1], c = q[q.length - 1], d = q[q.length - 2];
            const ext = (p, r, s) => { const dx = p[0] - r[0], dy = p[1] - r[1], l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * s, p[1] + dy / l * s]; };
            q = [ext(a, b, 3 + rnd(sd, 1) * 4), ...q.slice(1, -1), ext(c, d, 3 + rnd(sd, 2) * 4)];
          }
          ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (pass ? 0.55 : 0.9);
        } else if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
        if (o.smooth === false) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]); if (o.closed) ctx.closePath(); }
        else pathSmooth(ctx, q, o.closed);
        ctx.lineWidth = pass ? width * 0.7 : width; ctx.strokeStyle = col; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    // straight-ish line from a to b with a slight hand-drawn wobble
    TH.line = (ctx, a, b, w, o) => {
      o = o || {};
      const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 70)), pts = [], seed = o.seed || 3;
      for (let i = 0; i <= n; i++) { const u = i / n, j = (i === 0 || i === n) ? [0, 0] : jit(seed, i, o.amp === undefined ? 1 : o.amp); pts.push([lerp(a[0], b[0], u) + j[0], lerp(a[1], b[1], u) + j[1]]); }
      TH.stroke(ctx, pts, w, o);
    };
    // closed shape: build(ctx) makes the path; fill by role, then outline (silhouette fills solid and skips the outline)
    TH.shape = (ctx, build, role, o) => {
      o = o || {};
      build(ctx);
      const fill = TH.color(role || 'paper');
      if (role !== 'none') {
        if (style === 'sketch' && role !== 'paper') { ctx.fillStyle = pal.paper; ctx.fill(); ctx.globalAlpha = 0.6; }
        ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1;
      }
      if (o.outline === false || (style === 'silhouette' && role !== 'glow' && role !== 'accent' && role !== 'soft' && role !== 'none')) return;
      ctx.lineWidth = TH.lw(o.w || 4); ctx.strokeStyle = TH.color(o.line || 'ink'); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (style === 'sketch') { ctx.globalAlpha = 0.85; ctx.stroke(); ctx.save(); ctx.translate(1.4, -1.1); ctx.globalAlpha = 0.45; ctx.lineWidth *= 0.7; ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1; }
      else ctx.stroke();
    };
    TH.ellipse = (ctx, x, y, rx, ry, rot, col) => {
      ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); ctx.fillStyle = TH.color(col || 'ink'); ctx.fill();
    };
    // wobbly circle outline, a0..a1 radians (supports draw-on); spiral makes the end overlap like a hand-drawn loop
    TH.ring = (ctx, cx, cy, r, w, o) => {
      o = o || {};
      const a0 = o.a0 === undefined ? -Math.PI * 0.62 : o.a0, span = (o.a1 === undefined ? a0 + Math.PI * 2 * 1.04 : o.a1) - a0;
      const n = Math.max(6, Math.ceil(Math.abs(span) / (Math.PI * 2) * 56)), pts = [], seed = o.seed || 7, amp = (o.amp === undefined ? 0.45 : o.amp) * S.jitter;
      for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + span * u, rr = r + (o.spiral ? o.spiral * u : 0) + vnoise(seed + TH.B * 31, i * 0.35) * amp; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      TH.stroke(ctx, pts, w, { color: o.color, raw: o.raw, seed });
    };

    // ---- backgrounds ---------------------------------------------------------------------------------------------
    let tex = null;
    function grain(g, n, dark, light) {
      for (let i = 0; i < n; i++) {
        const x = rnd(11, i) * W, y = rnd(12, i) * H, l = 3 + rnd(13, i) * 9, a = rnd(14, i) * Math.PI;
        g.strokeStyle = rnd(15, i) < 0.5 ? dark : light; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    }
    function mottle(g, alpha) {
      const lo = document.createElement('canvas'); lo.width = 96; lo.height = 54; const lg = lo.getContext('2d'), img = lg.createImageData(96, 54);
      for (let i = 0; i < 96 * 54; i++) { const v = 128 + srnd(7, i) * 40; img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
      lg.putImageData(img, 0, 0); g.globalAlpha = alpha; g.globalCompositeOperation = 'multiply'; g.drawImage(lo, 0, 0, W, H); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    function vignette(g, a) { const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.62); vg.addColorStop(0, 'rgba(120,100,60,0)'); vg.addColorStop(1, `rgba(120,100,60,${a})`); g.fillStyle = vg; g.fillRect(0, 0, W, H); }
    function build() {
      const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
      if (style === 'silhouette') {
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pal.sky1); gr.addColorStop(0.72, pal.sky2); gr.addColorStop(1, mix(pal.sky2, pal.ink, 0.15));
        g.fillStyle = gr; g.fillRect(0, 0, W, H); mottle(g, 0.03); vignette(g, 0.16);
      } else {
        g.fillStyle = pal.paper; g.fillRect(0, 0, W, H);
        if (style === 'line') { mottle(g, 0.035); grain(g, 9000, 'rgba(120,105,80,0.035)', 'rgba(255,255,255,0.05)'); vignette(g, 0.10); }
        if (style === 'sketch') { mottle(g, 0.02); grain(g, 14000, 'rgba(60,60,70,0.03)', 'rgba(255,255,255,0.06)'); vignette(g, 0.06); }
        if (style === 'flat') { grain(g, 3000, 'rgba(0,0,0,0.012)', 'rgba(255,255,255,0.03)'); }
      }
      tex = c;
    }
    TH.background = (ctx) => { if (!tex) build(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tex, 0, 0); };
    TH.backgroundRaw = (ctx) => { if (!tex) build(); ctx.drawImage(tex, 0, 0); };   // under the current clip/transform reset by caller
    return TH;
  }

  SF.theme = { create, STYLES, DEFAULT_PAL };
})(typeof window !== 'undefined' ? window : globalThis);
