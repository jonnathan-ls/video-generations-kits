"""Procedural score from the film's mood timeline (E.mood(t, name) in scene.js, or "moods" in sync.json).
Each mood is a small recipe: chord progression, pattern, pad, bass, bells. Mood changes re-start the bar on the exact
moment, so musical shifts land on story beats. For a hand-written score, put score.py in the film folder (see compose())."""
import numpy as np
from dsp import SR, hz, pluck, bell, bass, pad, riser, f_heartbeat

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
MAJ = {'I': (0, 'maj'), 'ii': (2, 'min'), 'iii': (4, 'min'), 'IV': (5, 'maj'), 'V': (7, 'maj'), 'vi': (9, 'min')}
MIN = {'i': (0, 'min'), 'bII': (1, 'maj'), 'III': (3, 'maj'), 'iv': (5, 'min'), 'v': (7, 'min'), 'VI': (8, 'maj'), 'VII': (10, 'maj')}
TRIAD = {'maj': (0, 4, 7), 'min': (0, 3, 7)}

MOODS = {
    'calm':    dict(chords=['I', 'IV', 'I', 'V'], bars=2, pattern='sparse', pad=0.20, bass=0.25, bright=0.6, vel=0.26),
    'curious': dict(chords=['I', 'IV', 'vi', 'V'], bars=1, pattern='walk', pad=0.08, bass=0.30, bright=0.9, vel=0.24, short=True),
    'warm':    dict(chords=['I', 'V', 'vi', 'IV'], bars=1, pattern='arp', pad=0.24, bass=0.34, bright=0.8, vel=0.22, melody=True),
    'playful': dict(chords=['I', 'vi', 'IV', 'V'], bars=1, pattern='bounce', pad=0.06, bass=0.45, bright=1.1, vel=0.26, short=True),
    'triumph': dict(chords=['IV', 'V', 'I', 'I'], bars=1, pattern='arp', pad=0.30, bass=0.42, bright=1.0, vel=0.26, bells=0.30, melody=True),
    'sad':     dict(chords=['i', 'VI', 'III', 'VII'], bars=2, pattern='sparse', pad=0.22, bass=0.22, bright=0.5, vel=0.24, minor=True),
    'tense':   dict(chords=['i', 'i', 'bII', 'i'], bars=1, pattern='pulse', pad=0.26, bass=0.50, bright=0.4, vel=0.18, minor=True, drone=True),
    'mystery': dict(chords=['i', 'iv', 'VI', 'v'], bars=2, pattern='sparse', pad=0.20, bass=0.20, bright=0.6, vel=0.22, minor=True),
    'silence': dict(chords=[], bars=1, pattern='none'),
}


def compose(place, duration, moods, music=None, cues=None, events=None):
    """place(sig, t0, gain, pan) writes into the music bus."""
    music = music or {}
    if not moods: moods = [[0, music.get('preset', 'warm')]]
    root = 48 + NOTE.get(str(music.get('key', 'D')).strip(), 2)            # key root around C3..B3
    beat = 60.0 / float(music.get('bpm', 84)); bar = beat * 4
    rnd = np.random.default_rng(int(music.get('seed', 7)))
    segs = [(float(t), name) for t, name in moods] + [(duration, None)]
    for (t0, name), (t1, _) in zip(segs, segs[1:]):
        m = MOODS.get(name)
        if m is None: print(f'score: unknown mood "{name}", using warm. Known: {", ".join(MOODS)}'); m = MOODS['warm']
        if not m['chords']: continue
        table = MIN if m.get('minor') else MAJ
        t, k = t0, 0
        while t < t1 - 0.2:
            span = min(bar * m['bars'], t1 - t)
            off, q = table[m['chords'][k % len(m['chords'])]]; tri = [root + off + i for i in TRIAD[q]]
            if m.get('pad'):
                place(pad([hz(n - 12) for n in tri] if not m.get('drone') else [hz(root - 24), hz(root - 17), hz(root - 12 + (1 if k % 4 == 2 else 0))], span + 0.6, m['pad'], a=min(0.8, span * 0.4), r=0.9, lp=1100 if m.get('minor') else 1900), t, 1.0, 0.0)
            if m.get('bass'):
                place(bass(hz(tri[0] - 24), 0.7 if not m.get('short') else 0.35, m['bass']), t, 1.0, 0.0)
                if m['pattern'] in ('bounce', 'arp') and span > beat * 2.2: place(bass(hz(tri[0] - 24), 0.4, m['bass'] * 0.7), t + beat * 2, 1.0, 0.0)
            _pattern(place, m, tri, t, span, beat, rnd)
            if m.get('bells') and k % 2 == 0: place(bell(hz(tri[2] + 24), 2.0, m['bells']), t, 1.0, 0.2)
            if m.get('melody'): _melody(place, m, tri, t, span, beat, rnd)
            t += span; k += 1
        # transitions into the next mood
        nxt = next((n for tt, n in segs if tt > t0 and n), None)
        if nxt in ('tense', 'mystery') and t1 - 1.3 > t0: place(riser(1.2, 180, 520, 0.08, 7.0), t1 - 1.25, 1.0, 0.0)
        if nxt in ('warm', 'triumph', 'calm', 'playful') and name in ('tense', 'sad', 'mystery'):
            place(bell(hz(root + 24 + 7), 2.4, 0.30), t1, 1.0, 0.15); place(bell(hz(root + 36), 2.4, 0.22), t1 + 0.5, 1.0, -0.15)
    # a final chord that rings into the fade
    last = segs[-2][1]
    if last and MOODS.get(last, {}).get('chords'):
        m = MOODS[last]; table = MIN if m.get('minor') else MAJ; off, q = table[m['chords'][0]]
        tri = [root + off + i for i in TRIAD[q]]
        te = max(0, duration - 2.4)
        place(pad([hz(n - 12) for n in tri] + [hz(tri[0])], 2.4, 0.22, a=0.3, r=1.6), te, 1.0, 0.0); place(bell(hz(tri[0] + 24), 2.2, 0.2), te, 1.0, 0.0)


def _pattern(place, m, tri, t, span, beat, rnd):
    up = [n + 12 for n in tri] + [tri[0] + 24]
    v, br, p = m.get('vel', 0.24), m.get('bright', 0.8), m['pattern']
    if p == 'arp':
        for i, idx in enumerate([0, 1, 2, 1, 0, 1, 2, 3] * 4):
            tn = t + i * beat / 2
            if tn >= t + span - 0.05: break
            place(pluck(hz(up[idx]), 1.1, v * (1.0 if i % 4 == 0 else 0.7), br), tn, 1.0, -0.15 if i % 2 else 0.15)
    elif p == 'sparse':
        for i in range(int(span / (beat * 2)) + 1):
            tn = t + i * beat * 2
            if tn >= t + span - 0.05: break
            place(pluck(hz(up[int(rnd.integers(0, 3))]), 1.6, v, br), tn, 1.0, float(rnd.uniform(-0.2, 0.2)))
    elif p == 'walk':
        for i in range(int(span / beat) + 1):
            tn = t + i * beat
            if tn >= t + span - 0.05: break
            place(pluck(hz(up[i % 4]), 0.5, v * (1.0 if i % 4 == 0 else 0.75), br), tn, 1.0, 0.1)
    elif p == 'bounce':
        for i in range(int(span / (beat / 2)) + 1):
            tn = t + i * beat / 2
            if tn >= t + span - 0.05: break
            if i % 2: place(pluck(hz(up[(i // 2) % 3]), 0.28, v, br), tn, 1.0, 0.2 if i % 4 == 1 else -0.2)
    elif p == 'pulse':
        for i in range(int(span / beat) + 1):
            tn = t + i * beat
            if tn >= t + span - 0.05: break
            place(f_heartbeat() * 0.9, tn, 1.0, 0.0)


def _melody(place, m, tri, t, span, beat, rnd):
    tones = [tri[0] + 24, tri[1] + 24, tri[2] + 24, tri[1] + 24 + 2]
    for tb in (0.0, 1.5, 2.0, 3.0):
        tn = t + tb * beat
        if tn >= t + span - 0.1 or rnd.random() < 0.25: continue
        place(pluck(hz(tones[int(rnd.integers(0, len(tones)))]), 1.3, m.get('vel', 0.22) * 0.9, 1.1), tn, 1.0, 0.05)
