#!/usr/bin/env python3
"""Narration: one take per paragraph (never per line - line-by-line clips are what make narration sound robotic).

  python tts.py <filmDir> [--voice am_michael] [--speed 0.92] [--engine kokoro|mac|file] [--only p2] [--list]

Reads <filmDir>/script.json {"voice":..., "speed":..., "paragraphs":[{"id":"p1","text":"..."}]}.
Writes <filmDir>/voice/<id>.wav (48 kHz mono) and voice/voice.json with each paragraph's duration and sentence times,
which become the film's clock. engine=mac uses the Mac's `say`; engine=file measures recordings you put in voice/<id>.wav
(your own voice, or takes saved from Flow's flow_narrate)."""
import argparse, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from common import kokoro_dir, to_48k_mono, load_json, save_json, sentences, script, budget


def trim(a, sr):
    thr = 10 ** (-42 / 20) * float(np.abs(a).max() + 1e-9); i = np.where(np.abs(a) > thr)[0]
    if not len(i): return a
    a = a[max(0, i[0] - int(0.02 * sr)): i[-1] + int(0.06 * sr)].copy(); n = int(0.01 * sr)
    a[:n] *= np.linspace(0, 1, n); a[-n:] *= np.linspace(1, 0, n); return a


def pauses(a, sr, min_gap=0.11):
    """silent stretches (10 ms frames below -38 dB of the peak frame) longer than min_gap, as [start, end] seconds"""
    hop = int(0.01 * sr); fr = len(a) // hop
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) for i in range(fr)])
    sil = rms < (10 ** (-38 / 20)) * (rms.max() + 1e-9); out = []; i = 0
    while i < fr:
        if sil[i]:
            j = i
            while j < fr and sil[j]: j += 1
            if (j - i) * 0.01 >= min_gap and i > 5 and j < fr - 3: out.append([round(i * 0.01, 2), round(j * 0.01, 2)])
            i = j
        else: i += 1
    return out


def sentence_times(text, dur, gaps):
    """map sentences onto the longest pauses (in order); fall back to character proportions"""
    ss = sentences(text)
    if len(ss) == 1: return [{'text': ss[0], 'start': 0.0, 'end': round(dur, 3)}]
    need = len(ss) - 1
    if len(gaps) >= need:
        pick = sorted(sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[:need])
        bounds = [0.0] + [g[1] for g in pick]; ends = [g[0] for g in pick] + [dur]
    else:
        L = np.cumsum([len(s) for s in ss]) / sum(len(s) for s in ss)
        bounds = [0.0] + [round(float(x) * dur, 2) for x in L[:-1]]; ends = bounds[1:] + [dur]
    return [{'text': s, 'start': round(b, 3), 'end': round(e, 3)} for s, b, e in zip(ss, bounds, ends)]


def synth_kokoro(text, voice, speed):
    from kokoro_onnx import Kokoro
    d = kokoro_dir(); global _K
    if '_K' not in globals(): _K = Kokoro(os.path.join(d, 'kokoro-v1.0.onnx'), os.path.join(d, 'voices-v1.0.bin'))
    a, sr = _K.create(text, voice=voice, speed=speed, lang='en-gb' if voice[:1] == 'b' else 'en-us')
    return a.astype(np.float32), sr


def synth_mac(text, voice, speed):
    with tempfile.TemporaryDirectory() as td:
        aiff = os.path.join(td, 'x.aiff'); rate = int(175 * speed)
        subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', aiff, text], check=True)
        wav = os.path.join(td, 'x.wav'); to_48k_mono(aiff, wav); a, sr = sf.read(wav)
    return a.astype(np.float32), sr


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--voice'); ap.add_argument('--speed', type=float)
    ap.add_argument('--engine', default=None, choices=['kokoro', 'mac', 'file']); ap.add_argument('--only'); ap.add_argument('--list', action='store_true')
    a = ap.parse_args()
    if a.list:
        from kokoro_onnx import Kokoro
        d = kokoro_dir(); print(' '.join(sorted(Kokoro(os.path.join(d, 'kokoro-v1.0.onnx'), os.path.join(d, 'voices-v1.0.bin')).get_voices()))); return
    film = os.path.abspath(a.film); S = script(film)
    engine = a.engine or S.get('engine', 'kokoro'); voice = a.voice or S.get('voice', 'am_michael' if engine == 'kokoro' else 'Daniel'); speed = a.speed or S.get('speed', 0.92)
    vdir = os.path.join(film, 'voice'); os.makedirs(vdir, exist_ok=True)
    old = load_json(os.path.join(vdir, 'voice.json'), {}) or {}
    out = {'engine': engine, 'voice': voice, 'speed': speed, 'paragraphs': old.get('paragraphs', {}) if a.only else {}}
    for p in S['paragraphs']:
        pid, text = p['id'], p['text'].strip()
        if a.only and pid != a.only: continue
        wav = os.path.join(vdir, f'{pid}.wav')
        if engine == 'file':
            if not os.path.exists(wav): raise SystemExit(f'missing {wav}: record or save the take for "{pid}" there first')
            tmp = wav + '.48k.wav'; to_48k_mono(wav, tmp); y, sr = sf.read(tmp); os.remove(tmp)
        else:
            y, sr = synth_kokoro(text, voice, speed) if engine == 'kokoro' else synth_mac(text, voice, speed)
        y = trim(y, sr)
        if sr != 48000:
            tmp = wav + '.raw.wav'; sf.write(tmp, y, sr); to_48k_mono(tmp, wav); os.remove(tmp); y, sr = sf.read(wav)
        else: sf.write(wav, y, sr, subtype='FLOAT')
        dur = len(y) / sr; gaps = pauses(y, sr)
        out['paragraphs'][pid] = {'text': text, 'file': f'voice/{pid}.wav', 'dur': round(dur, 3), 'pauses': gaps, 'sentences': sentence_times(text, dur, gaps)}
        print(f'{pid}: {dur:5.2f} s  {len(text.split())} words  {text[:70]}')
    save_json(os.path.join(vdir, 'voice.json'), out)
    total = sum(v['dur'] for v in out['paragraphs'].values()); words = sum(len(v['text'].split()) for v in out['paragraphs'].values())
    print(f'voice {voice} ({engine}, speed {speed}): {total:.2f} s of speech, {words} words -> {vdir}/voice.json')
    fj0 = load_json(os.path.join(film, 'film.json'), {}) or {}
    if not a.only: print('timing:', budget(total, len(out['paragraphs']), fj0.get('duration'), words, fj0.get('tail', 2.5)))
    # suggested cues: start at 0.5 s, 0.6 s between paragraphs (edit to leave room for action beats)
    film_json = load_json(os.path.join(film, 'film.json'), {}); t = 0.5; sug = {}
    for p in S['paragraphs']:
        if p['id'] in out['paragraphs']: sug[p['id']] = round(t, 2); t += out['paragraphs'][p['id']]['dur'] + 0.6
    save_json(os.path.join(vdir, 'cues.suggested.json'), sug)
    if not film_json.get('cues'): print('no "cues" in film.json yet; suggested (back to back):', sug)
    else:
        cues = film_json['cues']; ids = sorted(cues, key=lambda k: cues[k])
        for i, k in enumerate(ids):
            if k not in out['paragraphs']: continue
            end = cues[k] + out['paragraphs'][k]['dur']
            if i + 1 < len(ids) and end > cues[ids[i + 1]] - 0.15: print(f'WARNING: "{k}" now ends at {end:.2f} s, past the next cue "{ids[i + 1]}" at {cues[ids[i + 1]]} s')
        if isinstance(film_json.get('duration'), (int, float)) and t - 0.6 > film_json['duration']: print(f'WARNING: speech runs to {t - 0.6:.1f} s, longer than the fixed film length ({film_json["duration"]} s)')


if __name__ == '__main__':
    main()
