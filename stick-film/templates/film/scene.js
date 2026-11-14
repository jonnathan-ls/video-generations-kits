// __TITLE__
// Every beat is timed from the locked narration: E.say('p1').t0 / .t1 / .sentences[i].t0 / .pauses[i] (film seconds).
// Reference: reference/engine.md. Poses: reference/poses.md. Check with `sf qa`, then `sf sheet`, before `sf make`.
SF.defineFilm((E) => {
  const hero = E.actor('hero', { x: -600, facing: 1 });
  const p1 = E.say('p1');

  // ---- set -------------------------------------------------------------------------------------------------------
  E.set('hills');
  E.set('ground');

  // ---- action ----------------------------------------------------------------------------------------------------
  hero.walk(0.3, 2.4, -80);                                  // walk in (feet plant themselves; step sounds are automatic)
  hero.pose(p1.sentences[0].t1 - 0.2, p1.t1 + 0.4, 'thinking');
  E.fx('mark', p1.sentences[0].t1, { x: (t) => hero.top(t)[0] + 30, y: (t) => hero.top(t, 40)[1], mark: '?' });

  // ---- camera, sound, music --------------------------------------------------------------------------------------
  E.camera([[0, { x: -300, z: 1.0 }], [2.4, { x: -80, z: 1.08 }]]);
  E.mood(0, 'curious');
  // The film ends 2.5 s after the last spoken line (film.json "tail"). Return a bigger number for a longer silent ending.
  return { duration: E.duration };
});
