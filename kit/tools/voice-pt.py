#!/usr/bin/env python3
"""Gera tomadas locais por parágrafo em português com Kokoro, sem escolher voz pelo usuário."""
import argparse
import json
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro


def trim(audio, sr):
    threshold = float(np.max(np.abs(audio))) * 10 ** (-42 / 20)
    active = np.flatnonzero(np.abs(audio) > threshold)
    if not len(active):
        return audio
    return audio[max(0, active[0] - int(.02 * sr)):min(len(audio), active[-1] + int(.06 * sr))]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('text', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--model-dir', type=Path, default=Path(os.environ.get('KOKORO_DIR', Path.home() / 'StickFilms/.tools/kokoro')))
    parser.add_argument('--voices', nargs='+', default=['pf_dora', 'pm_alex', 'pm_santa'])
    parser.add_argument('--speed', type=float, default=1.0)
    args = parser.parse_args()
    if not .5 <= args.speed <= 1.5:
        parser.error('Velocidade fora do intervalo de 0,5 a 1,5.')
    paragraphs = [p.strip().replace('\n', ' ') for p in re.split(r'\n\s*\n', args.text.read_text(encoding='utf-8').strip()) if p.strip()]
    if not paragraphs:
        parser.error('A narração está vazia.')
    model = Kokoro(str(args.model_dir / 'kokoro-v1.0.onnx'), str(args.model_dir / 'voices-v1.0.bin'))
    available = set(model.get_voices())
    if any(voice not in available or not voice.startswith('p') for voice in args.voices):
        parser.error('Escolha apenas vozes portuguesas disponíveis no modelo.')
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = {'language': 'pt-br', 'engine': 'kokoro-onnx', 'approvedVoice': None, 'takes': []}
    for voice in args.voices:
        for index, paragraph in enumerate(paragraphs, 1):
            audio, rate = model.create(paragraph, voice=voice, speed=args.speed, lang='pt-br')
            audio = trim(audio.astype(np.float32), rate)
            name = f'{voice}-p{index}.wav'
            sf.write(args.output / name, audio, rate)
            manifest['takes'].append({'voice': voice, 'paragraph': index, 'text': paragraph, 'file': name, 'sampleRate': rate, 'duration': round(len(audio) / rate, 3)})
    (args.output / 'takes.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == '__main__':
    main()
