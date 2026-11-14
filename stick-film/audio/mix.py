#!/usr/bin/env python3
"""Soundtrack: narration on its cues + foley from the animation's events + score from the mood timeline, mixed with
the music and effects ducking under the voice.

  python mix.py <filmDir>          (run `sf events <film>` first; the sf wrapper does it for you)

Inputs: build/sync.json (events, cues, moods, music), voice/voice.json + voice/<id>.wav, optional score.py in the film folder
(define compose(S) to write your own score; S has place(), note(), pluck/bell/bass/pad/riser, duration, cues, moods, events).
Mix levels: film.json "mix": {"voice": 1.45, "sfx": 0.62, "music": 0.26, "duck": 0.8}. Writes build/mix.wav + stems and
prints the voice margin (aim for 9 dB or more: the voice clearly above music and effects)."""
import importlib.util, json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
import dsp
from dsp import SR, FOLEY, reverb, spec_filter
from common import load_json
import score as auto_score


def main():
    film = os.path.abspath(sys.argv[1]); sync = load_json(os.path.join(film, 'build', 'sync.json'))
    if not sync: raise SystemExit('build/sync.json missing: run `sf events <film>` first')
    fj = load_json(os.path.join(film, 'film.json'), {}); lv = dict(voice=1.45, sfx=0.62, music=0.26, duck=0.80); lv.update(fj.get('mix', {}))
    DUR = float(sync['duration']); N = int(SR * DUR); cues = sync.get('cues') or {}
    bus = {k: np.zeros((2, N)) for k in ('voice', 'sfx', 'music')}
    rng = np.random.default_rng(5)

    def place(name, sig, t0, gain=1.0, pan=0.0):
        i0 = int(round(t0 * SR))
        if i0 >= N or i0 + len(sig) <= 0: return
        a = max(0, -i0); b = min(len(sig), N - i0); s = np.asarray(sig[a:b]) * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        bus[name][0, i0 + a:i0 + b] += s * l; bus[name][1, i0 + a:i0 + b] += s * r

    # ---- voice
    voice = load_json(os.path.join(film, 'voice', 'voice.json'))
    if voice:
        for pid, p in voice['paragraphs'].items():
            if pid not in cues: print(f'note: paragraph "{pid}" has no cue in film.json, not placed'); continue
            y, sr = sf.read(os.path.join(film, p['file']))
            if sr != SR: raise SystemExit(f'{p["file"]} is {sr} Hz; rerun tts.py')
            place('voice', y.astype(np.float64), float(cues[pid]))
    else: print('no voice/voice.json: mixing without narration')

    # ---- foley
    unknown = {}
    for e in sync['events']:
        f = FOLEY.get(e['type'])
        if not f: unknown[e['type']] = unknown.get(e['type'], 0) + 1; continue
        build, gain, pan = f
        pan = float(rng.uniform(-0.15, 0.15)) if pan == 'rand' else (e.get('pan', pan))
        place('sfx', build(e), e['t'], gain * e.get('gain', 1.0), pan)
    if unknown: print('skipped unknown sound events (add them to audio/dsp.py FOLEY):', unknown)
    place('sfx', spec_filter(rng.standard_normal(N), 120, 2500) * 0.004, 0)                     # room tone

    # ---- music
    custom = os.path.join(film, 'score.py')
    mplace = lambda sig, t0, gain=1.0, pan=0.0: place('music', sig, t0, gain, pan)
    music = sync.get('music') or {}
    if music.get('off'): pass
    elif os.path.exists(custom):
        spec = importlib.util.spec_from_file_location('film_score', custom); mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
        S = dict(place=mplace, note=lambda n: dsp.hz(12 * (int(n[-1]) + 1) + auto_score.NOTE[n[:-1]]), pluck=dsp.pluck, bell=dsp.bell, bass=dsp.bass, pad=dsp.pad, riser=dsp.riser,
                 hz=dsp.hz, duration=DUR, cues=cues, moods=sync.get('moods'), events=sync['events'], music=music, SR=SR)
        mod.compose(type('S', (), S)); print('score: film score.py')
    else:
        auto_score.compose(mplace, DUR, sync.get('moods') or [], music, cues, sync['events']); print('score: moods', [m[1] for m in (sync.get('moods') or [])] or [music.get('preset', 'warm')])

    # ---- mix with ducking under the voice
    vo = bus['voice'][0] + bus['voice'][1]
    k = int(SR * 0.07); env = np.convolve(np.abs(vo), np.ones(k) / k, mode='same'); env /= env.max() + 1e-9
    vc = np.convolve(np.clip(env * 3.0, 0, 1), np.ones(int(SR * 0.14)) / int(SR * 0.14), mode='same')
    duck_m = 1.0 - lv['duck'] * vc; duck_s = 1.0 - 0.5 * vc
    music_b = reverb(bus['music'], 0.30, 1.6) * duck_m[None, :] * lv['music']
    sfx_b = reverb(bus['sfx'], 0.12, 0.7) * duck_s[None, :] * lv['sfx']
    voice_b = bus['voice'] * lv['voice']
    mix = voice_b + sfx_b + music_b
    fo = np.ones(N); nf = int(0.5 * SR); fo[-nf:] = np.cos(np.linspace(0, np.pi / 2, nf)) ** 2; fo[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    mix *= fo; pk = np.max(np.abs(mix)) + 1e-9; g = 0.89 / pk; mix *= g
    out = os.path.join(film, 'build'); os.makedirs(out, exist_ok=True)
    sf.write(os.path.join(out, 'mix.wav'), mix.T.astype(np.float32), SR, subtype='FLOAT')
    for name, b in (('voice', voice_b), ('sfx', sfx_b), ('music', music_b)): sf.write(os.path.join(out, f'stem_{name}.wav'), (b * g).T.astype(np.float32), SR, subtype='FLOAT')

    # ---- voice margin: voice level vs everything else while someone is speaking
    if voice:
        hop = int(0.3 * SR); rows = []
        V = (voice_b[0] + voice_b[1]) * g; B = (sfx_b[0] + sfx_b[1] + music_b[0] + music_b[1]) * g
        for i in range(0, N - hop, hop):
            rows.append((i / SR, np.sqrt(np.mean(V[i:i + hop] ** 2)), np.sqrt(np.mean(B[i:i + hop] ** 2))))
        vmed = np.median([r[1] for r in rows if r[1] > 1e-4] or [0])
        spoken = [(t, 20 * np.log10(v / (b + 1e-6))) for t, v, b in rows if v > 0.4 * vmed]   # windows with real speech in them
        if spoken:
            med = float(np.median([m for _, m in spoken])); worst_t, worst = min(spoken, key=lambda r: r[1])
            verdict = 'good' if worst >= 9 else f'tight around {worst_t:.1f} s: lower the sound there (event "gain") or raise "voice" in film.json "mix"'
            print(f'voice margin: median {med:.1f} dB, worst {worst:.1f} dB at {worst_t:.1f} s over {len(spoken)} spoken windows -> {verdict}')
    print(f'wrote {out}/mix.wav ({DUR:.1f} s); events {len(sync["events"])}')


if __name__ == '__main__':
    main()
