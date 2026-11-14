// Draws one frame of a compiled film: background, sets, custom layers, props, actors (with held props), effects, text, fade.
(function (G) {
  const SF = G.SF = G.SF || {};

  function create(film) {
    const TH = SF.theme.create(film.style, film.palette, film.W, film.H);
    const back = film.sets.filter((s) => !s.front), front = film.sets.filter((s) => s.front);
    function D(S) {
      const d = { TH, W: film.W, H: film.H, cam: S.cam, t: S.t, L: SF.lib, S };
      d.layer = (ctx, p) => SF.sets.layer(ctx, d, p === undefined ? 1 : p);
      d.actor = (id) => S.actors.find((a) => a.id === id);
      return d;
    }
    function drawActor(ctx, d, a) {
      ctx.save();
      if (a.clip) {                                        // hide everything past x (e.g. stepping behind a door jamb)
        d.layer(ctx, 1); ctx.beginPath();
        if (a.clip.side > 0) ctx.rect(-1e5, -1e5, 1e5 + a.clip.x, 2e5); else ctx.rect(a.clip.x, -1e5, 1e5, 2e5);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clip();
      }
      d.layer(ctx, 1);
      const between = (c) => { for (const h of a.held) if (h.o.between) SF.props.draw(c, TH, h.type, h.o, d.t); };
      if (film.look.shadows && a.J) {                     // a soft contact shadow that shrinks and fades as the feet leave the ground
        const J = a.J, R = a.A.R, x = (J.ankle[0][0] + J.ankle[1][0]) / 2, hgt = Math.max(0, -Math.max(J.ankle[0][1], J.ankle[1][1]) - R.FOOT_RY);
        const k = Math.max(0, 1 - hgt / (R.H * 0.9));
        ctx.save(); ctx.globalAlpha = 0.16 * (0.35 + 0.65 * k); TH.ellipse(ctx, x + R.H * 0.015, 2, R.H * (0.10 + 0.08 * k), R.H * (0.018 + 0.012 * k), 0, TH.pal.ink); ctx.restore();
      }
      SF.character.draw(ctx, TH, a.A, a.pose, a.face, { tails: a.tails, cape: a.cape, flutter: a.flutter, reveal: a.reveal, seed: a.A.seed, between, J: a.J, lag: a.lag, look: film.look });
      for (const h of a.held) if (!h.o.between) { d.layer(ctx, 1); SF.props.draw(ctx, TH, h.type, h.o, d.t); }
      ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // look.blur: motion blur. Each frame is the average of N sub-frames spread over the shutter (default half a frame).
    let acc = null, actx = null;
    function render(ctx, t) {
      const N = Math.round(film.look.blur || 0);
      if (N < 2 || typeof document === 'undefined') return renderOne(ctx, t);
      const sh = (film.look.shutter || 0.5) / film.fps, W = ctx.canvas.width, H = ctx.canvas.height;
      if (!acc || acc.width !== W || acc.height !== H) { acc = document.createElement('canvas'); acc.width = W; acc.height = H; actx = acc.getContext('2d'); }
      for (let k = 0; k < N; k++) {
        renderOne(ctx, t + (k / (N - 1) - 0.5) * sh);
        actx.globalAlpha = 1 / (k + 1); actx.drawImage(ctx.canvas, 0, 0);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
    }
    function renderOne(ctx, t) {
      const S = film.frame(t), d = D(S);
      TH.frame(t);
      TH.background(ctx);
      for (const s of back) SF.sets.draw(ctx, d, s, t);
      for (const l of film.layers) if (l.z === 'back') { ctx.save(); l.fn(ctx, S, d); ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
      for (const p of S.props) if (!p.front) { d.layer(ctx, p.p === undefined ? 1 : p.p); SF.props.draw(ctx, TH, p.type, p, t); }
      for (const l of film.layers) if (l.z === 'mid') { ctx.save(); l.fn(ctx, S, d); ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
      for (const a of S.actors) drawActor(ctx, d, a);
      for (const p of S.props) if (p.front) { d.layer(ctx, p.p === undefined ? 1 : p.p); SF.props.draw(ctx, TH, p.type, p, t); }
      for (const s of front) SF.sets.draw(ctx, d, s, t);
      for (const l of film.layers) if (l.z === 'front') { ctx.save(); l.fn(ctx, S, d); ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
      d.layer(ctx, 1); SF.fx.draw(ctx, TH, S.fx, t); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const x of S.texts) drawText(ctx, TH, x, t, film);
      if (S.fade > 0.001) { ctx.globalAlpha = S.fade; TH.background(ctx); ctx.globalAlpha = 1; }
      return S;
    }
    return { render, TH };
  }

  // screen-space label: x, y as fractions of the frame (default centered, upper third)
  function drawText(ctx, TH, x, t, film) {
    const a = Math.min(1, (t - x.t0) / 0.25, (x.t1 - t) / 0.25), size = (x.size || 72) * (film.H / 1080);
    ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = TH.color(x.color || 'ink'); ctx.textAlign = x.align || 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${x.weight || 700} ${size}px ${x.font || "'Patrick Hand', 'Comic Neue', 'Chalkboard SE', 'Marker Felt', sans-serif"}`;
    ctx.fillText(x.str, (x.x === undefined ? 0.5 : x.x) * film.W, (x.y === undefined ? 0.2 : x.y) * film.H); ctx.globalAlpha = 1;
  }

  SF.compose = { create };
})(typeof window !== 'undefined' ? window : globalThis);
