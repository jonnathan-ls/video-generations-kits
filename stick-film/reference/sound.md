# Sound

Everything is local and free: Kokoro for the voice, numpy for music and effects, ffmpeg for loudness. There are no
samples or stock tracks, so there is nothing to license on the music and effects side.

## Voices (Kokoro)

`sf voices` lists them all. The prefix tells the accent and voice: `a` American, `b` British, then `f` female or `m` male
(`am_michael`, `af_heart`, `bm_george`, `bf_emma`...). Other prefixes are other languages. These have been used here:

- `am_michael` at speed 0.92: warm, unhurried US male. It narrates The Door.
- `af_heart`: US female. It narrated the first Wick film.

Always pick from full-script samples (`sf samples`), never from one sentence. Speed 0.88-0.95 suits storytelling; 1.0 sounds
rushed for teaching.

**Licence.** The Kokoro-82M weights are listed as Apache 2.0, which allows commercial use; check the model card before
monetizing. The `kokoro-onnx` package is MIT. espeak-ng (used for pronunciation) is GPL, which matters only if you
redistribute software, not for videos you publish.

## Mood presets (`E.mood(t, name)`)

| Mood | Feel | Built from |
|---|---|---|
| `calm` | settled, open | slow pad, sparse plucks, two-bar chords |
| `curious` | light, questioning | walking plucks, little pad |
| `warm` | resolved, kind | arpeggios, pad, bass, a simple melody |
| `playful` | bouncy | off-beat plucks, bass on 1 and 3 |
| `triumph` | arrival | IV-V-I, bells, fuller pad |
| `sad` | heavy, minor | slow plucks over a minor pad |
| `tense` | dread | low drone with a half-step rub, heartbeat pulse |
| `mystery` | unsettled minor | sparse minor plucks |
| `silence` | nothing | for a beat of pure foley |

Moving into `tense` or `mystery` adds a short riser just before the change. Moving out of `tense`, `sad` or `mystery`
into a major mood adds a bell. The last mood's tonic rings out under the fade. `film.json` `"music": { "key": "D",
"bpm": 84 }` sets the key and pace; `"off": true` turns the score off.

**A hand-written score**: add `score.py` to the film folder:

```python
def compose(S):
    # S.place(signal, t, gain, pan); S.note('F#4') -> Hz; S.pluck(f, dur, vel, bright), S.bell(f, dur, vel),
    # S.bass(f, dur, vel), S.pad([f...], dur, vel, a, r, lp), S.riser(dur, f0, f1, vel); S.duration, S.cues, S.events
    for i, (t, n) in enumerate([(0.5, 'B3'), (1.4, 'D4'), (2.3, 'F#4')]):
        S.place(S.pluck(S.note(n), 1.4, 0.32, 0.7), t, 1.0, -0.15 + 0.1 * i)
    S.place(S.pad([S.note('B2'), S.note('F#3')], 9.6, 0.16, 1.5, 1.2, 1100), 0.3)
```

## Sound events (`E.sfx(type, t, { gain, pan, dur })`)

`step` (automatic for walks and runs), `knock`, `creak` (`dur`), `pop`, `popsmall`, `clink`, `sip`, `doorclose`, `breath`,
`tremble` / `rumble` (`dur`), `scribble` (`dur`), `whoosh` (`dur`), `snap`, `thud`, `land`, `scrape` (`dur`), `cloth`, `squeak`,
`twang`, `ding` (an idea), `sparkle`, `boing`, `paper`, `tick`, `heartbeat`. Unknown types are skipped and reported by
`sf mix`. Add new ones to `FOLEY` in `audio/dsp.py`.

Sync tips: put impact sounds on the contact frame (knock at the moment the hand meets the door), whooshes 0.05-0.1 s
before the move, and leave a beat of silence before a payoff sound. Turn the music half a second after a key word, not
on it: the word stays clear and the music reads as the answer to it.

## Mixing

`sf mix <film>` places the voice on its cues, the foley on its events and the score on its moods. Music and effects duck
under the voice, then it reports:

```
voice margin: median 19.7 dB, worst 8.0 dB at 6.9 s over 18 spoken windows -> tight around 6.9 s ...
```

Aim for **9 dB or more at the worst spoken window**. Fix a tight spot by lowering that event (`E.sfx('ding', t, { gain: 0.3 })`)
or the mood there, or set `film.json` `"mix": { "voice": 1.45, "sfx": 0.62, "music": 0.26, "duck": 0.8 }`. The encoder then
normalizes the whole film to -14 LUFS (`--lufs` to change), with true peaks at or below -1.5 dBTP.

Claude cannot hear. The numbers catch balance problems, not taste. Always ask the user to listen on headphones.
