// Short-lived effects: impact ticks, bursts, sweat drops, puffs, sparkles, ! and ? marks, speed lines, thought bubbles.
// Each effect: { type, t, life, x, y, s, ... } in world px. Draw with the world camera transform already set.
(function (G) {
  const SF = G.SF = G.SF || {};
  const L = SF.lib;
  const { rnd, srnd, easeOut, backOut, clamp } = L;
  const LIFE = { ticks: 0.28, burst: 0.45, sweat: 0.6, puff: 0.6, sparkle: 0.7, mark: 1.2, speed: 0.5, thought: 2.5, hearts: 1.4 };

  function draw(ctx, TH, list, t) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const e of list) {
      const life = e.life || LIFE[e.type] || 0.5, age = t - e.t; if (age < 0 || age > life) continue;
      const u = age / life, a = 1 - u, s = e.s || 1, id = e.id || 1;
      ctx.globalAlpha = Math.min(1, a * 1.6);
      if (e.type === 'ticks') {                      // little impact marks (knocks, landings)
        for (let i = 0; i < 4; i++) { const ang = (e.a0 === undefined ? -1.2 : e.a0) + i * 0.38 + srnd(id, i) * 0.15, r0 = 16 * s * (0.6 + u * 1.1), r1 = r0 + 16 * s * 0.8 * a; TH.line(ctx, [e.x + Math.cos(ang) * r0, e.y + Math.sin(ang) * r0], [e.x + Math.cos(ang) * r1, e.y + Math.sin(ang) * r1], 3.2, { amp: 0 }); }
      } else if (e.type === 'burst') {               // a pop
        for (let i = 0; i < 9; i++) { const ang = i / 9 * Math.PI * 2 + (e.rot || 0), r0 = 40 * s * (0.5 + 0.9 * easeOut(u)), r1 = r0 + 40 * s * 0.55 * (1 - u); TH.line(ctx, [e.x + Math.cos(ang) * r0, e.y + Math.sin(ang) * r0 * 0.8], [e.x + Math.cos(ang) * r1, e.y + Math.sin(ang) * r1 * 0.8], 4, { amp: 0 }); }
      } else if (e.type === 'sweat') {
        const vx = e.vx === undefined ? -90 : e.vx, vy = e.vy === undefined ? -180 : e.vy, x = e.x + vx * age, y = e.y + vy * age + 600 * age * age;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(vy + 1200 * age, vx) - Math.PI / 2);
        TH.shape(ctx, () => { ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(6, 0, 0, 7); ctx.quadraticCurveTo(-6, 0, 0, -9); }, 'paper', { w: 2.6 }); ctx.restore();
      } else if (e.type === 'puff') {                // dust from a landing or a fast start
        for (let i = 0; i < 3; i++) { const r = 18 * s * (0.45 + u * 1.4) * (0.7 + i * 0.22), ox = (rnd(id, i) - 0.5) * 18 * s * (1.4 + u * 1.6) + (e.vx || 0) * age, oy = -u * 18 * s * (0.9 + i * 0.5); ctx.beginPath(); ctx.arc(e.x + ox, e.y + oy - r * 0.5, r, 0, Math.PI * 2); ctx.lineWidth = TH.lw(2.4); ctx.strokeStyle = TH.color('ink'); ctx.stroke(); }
      } else if (e.type === 'sparkle') {
        for (let i = 0; i < 5; i++) { const ang = i / 5 * Math.PI * 2 + srnd(id, i), r = 60 * s * easeOut(u), x = e.x + Math.cos(ang) * r, y = e.y + Math.sin(ang) * r, k = 9 * s * (1 - u); TH.line(ctx, [x - k, y], [x + k, y], 3, { amp: 0, color: 'accent' }); TH.line(ctx, [x, y - k], [x, y + k], 3, { amp: 0, color: 'accent' }); }
      } else if (e.type === 'mark') {                // '!' or '?' popping above a head
        const k = backOut(clamp(u * 5, 0, 1)) * s; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(k, k);
        if (e.mark === '?') TH.stroke(ctx, [[-16, -50], [-10, -66], [8, -68], [16, -54], [4, -40], [0, -26]], 7); else TH.line(ctx, [0, -70], [0, -28], 8, { amp: 0 });
        TH.ellipse(ctx, 0, -8, 6, 6, 0, 'ink'); ctx.restore();
      } else if (e.type === 'speed') {               // motion lines behind a fast mover; e.dir = -1 trails to the left
        for (let i = 0; i < 4; i++) { const y = e.y - 60 * s + i * 40 * s, l = (80 + rnd(id, i) * 70) * s * a, x = e.x + (e.dir || -1) * (30 + i * 12) * s; TH.line(ctx, [x, y], [x + (e.dir || -1) * l, y], 3.4, { amp: 0 }); }
      } else if (e.type === 'thought') {             // bubble with optional prop inside: { prop: 'bulb', head:[x,y] }
        const k = backOut(clamp(age / 0.35, 0, 1)) * (1 - clamp((age - life + 0.3) / 0.3, 0, 1)) * s, cx = e.x, cy = e.y;
        if (e.head) for (let i = 0; i < 3; i++) { const q = i / 3, r = (5 + i * 4) * k; TH.shape(ctx, () => { ctx.beginPath(); ctx.arc(e.head[0] + (cx - e.head[0]) * (0.2 + q * 0.45), e.head[1] + (cy + 70 * s - e.head[1]) * (0.2 + q * 0.45), r, 0, Math.PI * 2); }, 'paper', { w: 3 }); }
        ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
        TH.shape(ctx, () => { ctx.beginPath(); for (let i = 0; i <= 10; i++) { const a0 = i / 10 * Math.PI * 2, r = 92 + 10 * Math.sin(i * 2.7); const x = Math.cos(a0) * r * 1.25, y = Math.sin(a0) * r * 0.85; if (i === 0) ctx.moveTo(x, y); else { const am = (i - 0.5) / 10 * Math.PI * 2; ctx.quadraticCurveTo(Math.cos(am) * (r + 34) * 1.25, Math.sin(am) * (r + 34) * 0.85, x, y); } } ctx.closePath(); }, 'paper', { w: 4 });
        ctx.restore(); ctx.globalAlpha = 1;
        if (e.prop && SF.props) SF.props.draw(ctx, TH, e.prop, Object.assign({ x: cx, y: cy + 40 * k, s: k * (e.propScale || 1.2) }, e.propOpts || {}), t);
      } else if (e.type === 'hearts') {
        for (let i = 0; i < 3; i++) { const y = e.y - 120 * s * u - i * 30 * s, x = e.x + Math.sin(u * 6 + i * 2) * 22 * s + (i - 1) * 34 * s; if (SF.props) SF.props.draw(ctx, TH, 'heart', { x, y, s: 0.7 * s * (1 - u * 0.4) }, t); }
      }
    }
    ctx.globalAlpha = 1;
  }

  SF.fx = { draw, LIFE };
})(typeof window !== 'undefined' ? window : globalThis);
