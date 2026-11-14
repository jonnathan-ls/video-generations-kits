#!/usr/bin/env python3
"""Encode: frames + mix -> MP4 (H.264, yuv420p, bt709) with two-pass loudness normalisation.

  python encode.py <filmDir> [--lufs -14] [--out path.mp4] [--silent] [--crf 16]

-14 LUFS suits YouTube (it turns louder uploads down and never turns quiet ones up); use -16 for podcasts/Apple."""
import argparse, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import ffmpeg, load_json


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('film'); ap.add_argument('--lufs', type=float, default=-14.0); ap.add_argument('--out'); ap.add_argument('--silent', action='store_true'); ap.add_argument('--crf', type=int, default=16); ap.add_argument('--frames')
    a = ap.parse_args(); film = os.path.abspath(a.film); fj = load_json(os.path.join(film, 'film.json'), {})
    fps = fj.get('fps', 30); frames = a.frames or os.path.join(film, 'build', 'frames'); mix = os.path.join(film, 'build', 'mix.wav')
    n = len([f for f in os.listdir(frames) if f.endswith('.png')]) if os.path.isdir(frames) else 0
    if not n: raise SystemExit('no frames: run `sf frames <film>` first')
    slug = os.path.basename(film); out = a.out or os.path.join(film, 'out', f'{slug}.mp4'); os.makedirs(os.path.dirname(out), exist_ok=True)
    vid = ['-framerate', str(fps), '-i', os.path.join(frames, 'f_%05d.png')]
    venc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart']
    if a.silent or not os.path.exists(mix):
        if not a.silent: print('no build/mix.wav: encoding silent video')
        subprocess.run([ffmpeg(), '-v', 'error', '-y', *vid, *venc, out], check=True)
    else:
        # pass 1: measure
        r = subprocess.run([ffmpeg(), '-hide_banner', '-nostats', '-i', mix, '-af', f'loudnorm=I={a.lufs}:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
        m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
        ln = (f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
              f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        subprocess.run([ffmpeg(), '-v', 'error', '-y', *vid, '-i', mix, '-af', ln + ',aresample=48000', *venc, '-c:a', 'aac', '-b:a', '256k', '-shortest', out], check=True)
        r = subprocess.run([ffmpeg(), '-hide_banner', '-nostats', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
        I = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
        print(f'loudness: {I[-1] if I else "?"} LUFS integrated (target {a.lufs})')
    p = subprocess.run([ffmpeg().replace('ffmpeg', 'ffprobe'), '-v', 'error', '-show_entries', 'format=duration,size', '-of', 'json', out], capture_output=True, text=True)
    try: d = json.loads(p.stdout)['format']; print(f'wrote {out}: {float(d["duration"]):.2f} s, {int(d["size"]) / 1e6:.1f} MB, {n} frames')
    except Exception: print('wrote', out)


if __name__ == '__main__':
    main()
