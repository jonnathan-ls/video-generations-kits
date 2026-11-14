#!/usr/bin/env python3
"""How long will this script make the film? Estimates before any voice is generated.

  python estimate.py <filmDir>                       # the script in script.json
  python estimate.py --text "..."                    # any text (e.g. one of three script options), one paragraph per line
  options: --voice am_michael --speed 0.92 --duration N (only when the film must hit a fixed length, e.g. a Short)

The script sets the length: film = speech + 0.6 s between paragraphs + a 2.5 s ending, plus any silent beats in the
beat sheet. Rates are measured from Kokoro reads at speed 0.92; voices differ by about 20%, so it is per voice.
`sf samples` and `sf tts` print the measured length afterwards."""
import argparse, json, os, re, sys

RATES = {'am_michael': 2.87, 'bm_george': 2.75, 'af_heart': 3.22, 'bf_emma': 3.20, 'am_adam': 3.29}   # words / s at speed 0.92
DEFAULT_RATE = 3.0


def rate(voice, speed): return RATES.get(voice, DEFAULT_RATE) * (speed / 0.92)
def words(text): return len(re.findall(r"[A-Za-z0-9'’-]+", text))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('film', nargs='?'); ap.add_argument('--text'); ap.add_argument('--duration', type=float)
    ap.add_argument('--voice'); ap.add_argument('--speed', type=float); ap.add_argument('--paragraphs', type=int); ap.add_argument('--tail', type=float, default=2.5); a = ap.parse_args()
    target = a.duration
    if a.text:
        n_par = a.paragraphs or max(1, len([p for p in re.split(r'\n', a.text) if p.strip()]))
        voice, speed, n = a.voice or 'am_michael', a.speed or 0.92, words(a.text)
    elif a.film:
        f = os.path.abspath(a.film); s = json.load(open(os.path.join(f, 'script.json'))); fj = json.load(open(os.path.join(f, 'film.json')))
        if target is None and isinstance(fj.get('duration'), (int, float)): target = fj['duration']
        voice = a.voice or s.get('voice', 'am_michael'); speed = a.speed or s.get('speed', 0.92)
        n = sum(words(p['text']) for p in s['paragraphs']); n_par = len(s['paragraphs'])
    else: sys.exit(__doc__)
    gaps = max(0, n_par - 1) * 0.6
    speech = n / rate(voice, speed); film = speech + gaps + a.tail
    print(f'{n} words, {n_par} paragraph(s): ~{speech:.1f} s of speech in {voice} at {speed} -> film about {film:.0f} s plus any silent beats')
    others = ', '.join(f'{v} {n / rate(v, speed) + gaps + a.tail:.0f} s' for v in RATES if v != voice)
    print(f'same script in other voices: {others}')
    if target:
        if film > target: print(f'fixed length {target:g} s: too long by {film - target:.1f} s -> cut about {round((film - target) * rate(voice, speed))} words')
        else: print(f'fixed length {target:g} s: leaves {target - film:.1f} s for silent action' + (f' (or add about {round((target - film - 2) * rate(voice, speed))} words)' if target - film > 4 else ''))


if __name__ == '__main__':
    main()
