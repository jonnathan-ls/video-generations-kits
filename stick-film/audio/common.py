"""Paths and helpers shared by the audio scripts."""
import json, os, re, shutil, subprocess

def home():
    h = os.environ.get('STICKFILM_HOME')
    return os.path.abspath(os.path.expanduser(h)) if h else os.path.join(os.path.expanduser('~'), 'StickFilms')

def kokoro_dir():
    for d in (os.environ.get('KOKORO_DIR'), os.path.join(home(), '.tools', 'kokoro')):
        if d and os.path.exists(os.path.join(d, 'kokoro-v1.0.onnx')) and os.path.exists(os.path.join(d, 'voices-v1.0.bin')): return d
    raise SystemExit('Kokoro model files not found. Run scripts/setup.sh --install, or set KOKORO_DIR to the folder holding kokoro-v1.0.onnx and voices-v1.0.bin.')

def ffmpeg():
    f = shutil.which('ffmpeg')
    if not f: raise SystemExit('ffmpeg not found (Mac: brew install ffmpeg).')
    return f

def to_48k_mono(src, dst):
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-i', src, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_f32le', dst], check=True)

def to_mp3(src, dst):
    subprocess.run([ffmpeg(), '-v', 'error', '-y', '-i', src, '-codec:a', 'libmp3lame', '-q:a', '3', dst], check=True)

def load_json(p, default=None):
    if not os.path.exists(p): return default
    with open(p) as f: return json.load(f)

def save_json(p, obj):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w') as f: json.dump(obj, f, indent=1)

def sentences(text):
    parts = re.split(r'(?<=[.!?…])\s+', text.strip())
    return [p for p in parts if p]

def script(film_dir):
    s = load_json(os.path.join(film_dir, 'script.json'))
    if not s or not s.get('paragraphs'): raise SystemExit(f'{film_dir}/script.json needs {{"paragraphs": [{{"id": "p1", "text": "..."}}]}}')
    return s

def budget(speech, n_par, target, n_words, tail=2.5):
    """the film length a narration implies (speech + 0.6 s between paragraphs + the ending tail; silent beats add to it).
    target: a fixed film length to compare against, or None/'auto' when the script sets the length."""
    r = n_words / max(speech, 1e-6); gaps = max(0, n_par - 1) * 0.6; film = speech + gaps + tail
    msg = f'{speech:.1f} s of speech ({r:.2f} words/s) -> film about {film:.0f} s plus any silent beats'
    if isinstance(target, (int, float)):
        if film > target: msg += f'; LONGER than the fixed {target:g} s: cut about {round((film - target) * r)} words, or drop the fixed duration'
        elif film < target - 4: msg += f'; leaves {target - film:.0f} s of the fixed {target:g} s for silent action (or add about {round((target - film - 2) * r)} words)'
        else: msg += f'; fits the fixed {target:g} s'
    return msg
