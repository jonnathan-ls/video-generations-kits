// The Idea: Wick walks in stuck on a problem, an idea arrives on the words "an idea", he celebrates and runs off.
SF.defineFilm((E) => {
  const hero = E.actor('hero', { x: -620, facing: 1 });
  const line1 = E.say('p1'), line2 = E.say('p2');
  const idea = line2.pauses.length ? line2.pauses[0][1] : line2.t0 + 1.2;   // "...out of nowhere, | an idea."

  E.set('hills');
  E.set('ground');
  E.set('tree', { x: 560, scale: 0.9 });

  // "Wick had a problem he couldn't solve." walk in; "He'd been circling it for days." think
  hero.walk(0.3, 2.6, -40);
  hero.pose(line1.sentences[1].t0 - 0.2, idea - 0.15, 'thinking');
  E.fx('thought', line1.sentences[1].t0, { x: 170, y: -640, head: (t) => hero.top(t), life: 2.2, s: 0.7 });
  E.fx('mark', line1.sentences[1].t0 + 0.15, { x: 170, y: -600, mark: '?', life: 1.9 });
  hero.pose(line2.t0, idea - 0.15, 'lookUp', { blend: 0.25 });

  // "an idea." the bulb lands on the words
  hero.pose(idea, idea + 0.9, 'idea', { blend: 0.18 });
  E.prop('bulb', { x: (t) => hero.top(t)[0], y: (t) => hero.top(t, 50)[1], t0: idea, t1: idea + 2.2, pop: true, on: (t) => E.L.sstep(E.L.seg(t, idea + 0.05, idea + 0.25)) });
  E.fx('sparkle', idea + 0.1, { x: -40, y: -560, s: 1.4 });
  E.sfx('ding', idea + 0.04, { gain: 0.3 });
  E.shake(idea + 0.04, 3);
  hero.smile(idea + 0.1, 11, 0.9);

  // celebrate, then run off to try it
  hero.pose(idea + 1.1, idea + 2.6, 'celebrate', { blend: 0.2 });
  E.sfx('whoosh', idea + 2.85);
  hero.run(idea + 2.9, idea + 5.6, 2300);
  E.fx('speed', idea + 3.5, { x: (t) => hero.xAt(t) - 120, y: -250, dir: -1, s: 1.2 });

  E.camera([[0, { x: -300, z: 1.0 }], [2.6, { x: -40, z: 1.0 }], [line2.t0, { x: -30, z: 1.06 }], [idea + 0.3, { x: -20, z: 1.14 }], [idea + 2.6, { x: 0, z: 1.05 }], [idea + 5.2, { x: 700, z: 0.9 }]]);
  E.mood(0, 'curious'); E.mood(idea + 0.7, 'warm');           // turn the music just after the word, not on it
  return { duration: 13 };
});
