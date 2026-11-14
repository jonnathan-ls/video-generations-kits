#!/usr/bin/env python3
"""Voice samples: the whole script in several voices, so the pick is made on the real words, not a demo sentence.

  python samples.py <filmDir> [--voices am_michael,af_heart,bm_george] [--speed 0.92]

Writes <filmDir>/voice/samples/<voice>.wav and .mp3 (each paragraph read in one pass, 0.6 s apart)."""
import argparse, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from common import to_mp3, script, budget, load_json
from tts import synth_kokoro, synth_mac, trim

DEFAULT = ['am_michael', 'af_heart', 'bm_george']


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--voices'); ap.add_argument('--speed', type=float, default=None)
    ap.add_argument('--engine', default='kokoro', choices=['kokoro', 'mac']); a = ap.parse_args()
    film = os.path.abspath(a.film); S = script(film); speed = a.speed or S.get('speed', 0.92)
    voices = a.voices.split(',') if a.voices else DEFAULT
    od = os.path.join(film, 'voice', 'samples'); os.makedirs(od, exist_ok=True)
    fj = load_json(os.path.join(film, 'film.json'), {}) or {}; dur = fj.get('duration')
    n_words = sum(len(p['text'].split()) for p in S['paragraphs'])
    for v in voices:
        parts = []; speech = 0.0
        for p in S['paragraphs']:
            y, sr = synth_kokoro(p['text'], v, speed) if a.engine == 'kokoro' else synth_mac(p['text'], v, speed)
            y = trim(y, sr); speech += len(y) / sr
            parts += [y, np.zeros(int(0.6 * sr), np.float32)]
        y = np.concatenate(parts); wav = os.path.join(od, f'{v}.wav'); sf.write(wav, y, sr)
        try: to_mp3(wav, wav[:-4] + '.mp3')
        except Exception as e: print('mp3 skipped:', e)
        print(f'{v}: {wav[:-4]}.mp3  timing: {budget(speech, len(S["paragraphs"]), dur, n_words, fj.get("tail", 2.5))}')


if __name__ == '__main__':
    main()
