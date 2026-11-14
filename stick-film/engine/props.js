// Props in the theme's style. Each is drawn in local coordinates around its anchor:
//   hand-held (mug, bulb, book, phone, ball, sign-held): anchor = where the hand grips
//   ground props (rock, box, chair, table, ladder, sign, plant): anchor = bottom center on the ground
// Add a new prop by adding a function here; keep it to a few strokes so it matches the character.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { clamp } = L;
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
  const P = {};

  P.mug = (ctx, TH, o, t) => {
    TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-17, -20); ctx.lineTo(17, -20); ctx.lineTo(15, 18); ctx.quadraticCurveTo(0, 24, -15, 18); ctx.closePath(); }, 'paper', { w: 4 });
    ctx.save(); ctx.beginPath(); ctx.moveTo(-17, -20); ctx.lineTo(17, -20); ctx.lineTo(15, 18); ctx.quadraticCurveTo(0, 24, -15, 18); ctx.closePath(); ctx.clip(); ctx.fillStyle = TH.color('accent'); ctx.fillRect(-20, -4, 40, 9); ctx.restore();
    TH.stroke(ctx, [[16, -12], [31, -10], [30, 0], [29, 10], [15, 9]], 4);
    if (o.steam !== false) for (let i = 0; i < 2; i++) {
      const ph = t * 2.2 + i * 1.7, x0 = -6 + i * 12; ctx.globalAlpha = 0.55 + 0.45 * Math.sin(ph * 0.7);
      TH.stroke(ctx, [[x0, -26], [x0 - 7, -36], [x0 + 6, -46 + Math.sin(ph) * 3], [x0, -56]], 2.6); ctx.globalAlpha = 1;
    }
  };
  P.bulb = (ctx, TH, o, t) => {                       // o.on 0..1 lights it
    const on = clamp(o.on === undefined ? 1 : o.on, 0, 1);
    if (on > 0) { ctx.globalAlpha = on * 0.35; TH.ellipse(ctx, 0, -46, 70, 70, 0, 'glow'); ctx.globalAlpha = 1; }
    TH.shape(ctx, () => { ctx.beginPath(); ctx.arc(0, -46, 30, Math.PI * 0.78, Math.PI * 2.22); ctx.lineTo(11, -8); ctx.lineTo(-11, -8); ctx.closePath(); }, on > 0.5 ? 'glow' : 'paper', { w: 4 });
    TH.stroke(ctx, [[-6, -14], [-4, -36], [0, -44], [4, -36], [6, -14]], 3, { color: on > 0.5 ? 'accentDark' : 'ink' });
    for (let i = 0; i < 3; i++) TH.line(ctx, [-11, -4 + i * 6], [11, -4 + i * 6], 3.4);
    if (on > 0.5) for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; TH.line(ctx, [Math.cos(a) * 46, -46 + Math.sin(a) * 46], [Math.cos(a) * (58 + 8 * on), -46 + Math.sin(a) * (58 + 8 * on)], 3.6, { seed: 30 + i }); }
  };
  P.rock = (ctx, TH, o) => {
    const s = o.size || 28;
    TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-s * 1.1, 0); ctx.quadraticCurveTo(-s, -s * 0.95, -s * 0.1, -s * 0.9); ctx.quadraticCurveTo(s * 0.9, -s * 0.95, s * 1.1, 0); ctx.closePath(); }, 'paper', { w: 4 });
    TH.stroke(ctx, [[-s * 0.4, -s * 0.5], [-s * 0.1, -s * 0.62], [s * 0.2, -s * 0.5]], 2.4);
  };
  P.box = (ctx, TH, o) => {                            // anchor: bottom center. carried boxes: attach to both hands with dy
    const w = o.w || 120, h = o.h || 96;
    TH.shape(ctx, () => rr(ctx, -w / 2, -h, w, h, 4), 'paper', { w: 4.5 });
    TH.line(ctx, [-w / 2, -h * 0.62], [w / 2, -h * 0.62], 3); TH.shape(ctx, () => rr(ctx, -w * 0.12, -h, w * 0.24, h * 0.38, 2), 'accent', { w: 3 });
  };
  P.book = (ctx, TH, o) => {
    TH.shape(ctx, () => rr(ctx, -30, -44, 60, 78, 4), 'accent', { w: 4 });
    TH.shape(ctx, () => rr(ctx, -18, -30, 36, 16, 2), 'paper', { w: 3 });
    TH.line(ctx, [-24, -44], [-24, 34], 3);
  };
  P.phone = (ctx, TH, o) => { TH.shape(ctx, () => rr(ctx, -13, -26, 26, 46, 5), 'ink', { w: 3 }); TH.shape(ctx, () => rr(ctx, -9, -21, 18, 34, 2), o.on ? 'glow' : 'paper', { outline: false }); };
  P.ball = (ctx, TH, o) => { const r = o.r || 24; TH.shape(ctx, () => { ctx.beginPath(); ctx.arc(0, -r * 0.2, r, 0, Math.PI * 2); }, 'accent', { w: 4 }); TH.stroke(ctx, [[-r * 0.9, -r * 0.4], [0, -r * 0.05], [r * 0.9, -r * 0.4]], 3); };
  P.sign = (ctx, TH, o) => {                           // signpost with arrow; o.text optional
    TH.line(ctx, [0, 0], [0, -260], 7);
    TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-90, -250); ctx.lineTo(70, -250); ctx.lineTo(110, -222); ctx.lineTo(70, -194); ctx.lineTo(-90, -194); ctx.closePath(); }, 'accent', { w: 4.5 });
    if (o.text) { ctx.fillStyle = TH.color('ink'); ctx.font = `bold 30px ${o.font || 'sans-serif'}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.text, 0, -222); }
  };
  P.chair = (ctx, TH, o) => {                          // seat at 0.24 of a 420 px character; faces +x
    const s = o.seat || 100;
    TH.shape(ctx, () => rr(ctx, -50, -s - 10, 110, 14, 3), 'paper', { w: 4.5 });
    TH.line(ctx, [-44, -s], [-44, 0], 5); TH.line(ctx, [52, -s], [52, 0], 5); TH.line(ctx, [-48, -s - 8], [-62, -s - 150], 5); TH.line(ctx, [-62, -s - 150], [-40, -s - 150], 5);
  };
  P.table = (ctx, TH, o) => { const w = o.w || 260, h = o.h || 190; TH.shape(ctx, () => rr(ctx, -w / 2, -h, w, 16, 3), 'paper', { w: 4.5 }); TH.line(ctx, [-w / 2 + 20, -h + 14], [-w / 2 + 30, 0], 5); TH.line(ctx, [w / 2 - 20, -h + 14], [w / 2 - 30, 0], 5); };
  P.ladder = (ctx, TH, o) => { const h = o.h || 520; TH.line(ctx, [-50, 0], [-30, -h], 6); TH.line(ctx, [50, 0], [30, -h], 6); for (let i = 1; i < 7; i++) { const y = -h * i / 7, dx = 50 - 20 * i / 7; TH.line(ctx, [-dx, y], [dx, y], i === 3 ? 6 : 4.5, { color: i === 3 ? 'accent' : 'ink' }); } };
  P.plant = (ctx, TH, o) => { TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(-34, -60); ctx.lineTo(34, -60); ctx.lineTo(26, 0); ctx.lineTo(-26, 0); ctx.closePath(); }, 'accent', { w: 4 }); for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.35; TH.stroke(ctx, [[0, -60], [Math.sin(a) * 40, -100], [Math.sin(a) * 70, -150 + Math.abs(i - 2) * 22]], 4); } };
  P.heart = (ctx, TH, o) => { const s = o.size || 1; ctx.scale(s, s); TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-40, -16, -18, -48, 0, -26); ctx.bezierCurveTo(18, -48, 40, -16, 0, 10); ctx.closePath(); }, 'accent', { w: 3.6 }); };

  // o: { x, y, rot (deg), s, flip, alpha }
  function draw(ctx, TH, type, o, t) {
    const fn = P[type]; if (!fn) throw new Error('unknown prop: ' + type);
    ctx.save(); ctx.translate(o.x || 0, o.y || 0); ctx.rotate((o.rot || 0) * Math.PI / 180); const s = o.s === undefined ? 1 : o.s; ctx.scale(s * (o.flip || 1), s);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; fn(ctx, TH, o, t); ctx.restore(); ctx.globalAlpha = 1;
  }
  // grip offsets so a held prop sits in the hand (local px at s = 1)
  const GRIP = { mug: [8, 12], bulb: [0, 28], book: [0, 4], phone: [0, 6], ball: [0, -2], heart: [0, 0] };

  SF.props = { P, draw, GRIP };
})(typeof window !== 'undefined' ? window : globalThis);
