#!/usr/bin/env python3
"""Make the feature master locally from the saved voice and reviewed kit Foley."""
import json
import os
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[3]
PROJECT = Path(os.environ.get("TITANIC_AUDIO_PROJECT", str(Path(__file__).resolve().parent)))
project_file = PROJECT / ("source-project.json" if PROJECT.name == "production-v4" else "project.json")
voice_file = (PROJECT / "../production-v3/narration-v4/narration.wav") if PROJECT.name == "production-v4" else (PROJECT / "audio/narration.wav")
voice_file = Path(os.environ.get("TITANIC_NARRATION_FILE", str(voice_file)))
project = json.loads(project_file.read_text())
catalog = json.loads((ROOT / "kit/catalog/registry.json").read_text())
assets = {item["id"]: item for item in catalog["assets"]}


def read_audio(path: Path):
    with wave.open(str(path), "rb") as src:
        channels, rate, width, frames = src.getnchannels(), src.getframerate(), src.getsampwidth(), src.getnframes()
        if width != 2:
            raise ValueError(f"Esperava WAV PCM16 em {path}")
        samples = np.frombuffer(src.readframes(frames), dtype="<i2").astype(np.float32) / 32768.0
        if channels > 1:
            samples = samples.reshape(-1, channels).mean(axis=1)
    return samples, rate


voice, rate = read_audio(voice_file.resolve())
duration = float(project["duration"])
frames_total = int(round(duration * rate))
if abs(len(voice) - frames_total) > rate * 0.12:
    raise ValueError(f"A voz ({len(voice)/rate:.3f}s) e a timeline ({duration:.3f}s) não coincidem")

def resample(samples, source_rate):
    if source_rate == rate:
        return samples
    count = max(1, round(len(samples) * rate / source_rate))
    old = np.arange(len(samples), dtype=np.float64)
    new = np.arange(count, dtype=np.float64) * source_rate / rate
    return np.interp(new, old, samples).astype(np.float32)


def source_for(asset_id):
    definition = assets.get(asset_id)
    if not definition or not definition.get("sound"):
        raise ValueError(f"Som não encontrado no catálogo: {asset_id}")
    return resample(*read_audio(ROOT / "kit/audio/previews" / f"{definition['sound']}.wav"))


bed = source_for("ambiencia_mar_calmo")
fade = min(round(rate * 0.8), len(bed) // 4)
if fade > 0:
    ramp = np.linspace(0.0, 1.0, fade, dtype=np.float32)
    looped = bed.copy()
    looped[:fade] = bed[:fade] * ramp + bed[-fade:] * (1.0 - ramp)
    bed = looped[:-fade]

cues = project.get("soundDesign", {}).get("cues", [])
ambience_cues = [cue for cue in cues if cue["assetId"] == "ambiencia_mar_calmo"]
one_shots = [cue for cue in cues if cue["assetId"] != "ambiencia_mar_calmo"]
clips = {cue["assetId"]: source_for(cue["assetId"]) for cue in one_shots}
ambience_windows = []
for cue in ambience_cues:
    start = max(0, int(round(float(cue["time"]) * rate)))
    end = min(frames_total, start + int(round(float(cue["duration"]) * rate)))
    if end > start:
        ambience_windows.append((start, end, float(cue["volume"])))
events = []
for cue in one_shots:
    start = max(0, int(round(float(cue["time"]) * rate)))
    samples = clips[cue["assetId"]]
    count = min(len(samples), int(round(float(cue["duration"]) * rate)), frames_total - start)
    if count > 0:
        events.append((start, start + count, samples[:count], float(cue["volume"]), cue["assetId"]))
events.sort(key=lambda row: row[0])

out_path = Path(os.environ.get("TITANIC_MASTER_OUTPUT", str(PROJECT / "audio/master.wav")))
out_path.parent.mkdir(parents=True, exist_ok=True)
chunk_size = rate * 4
event_cursor = 0
active = []
peak_before = 0.0
peak_after = 0.0
with wave.open(str(out_path), "wb") as out:
    out.setnchannels(1)
    out.setsampwidth(2)
    out.setframerate(rate)
    for start in range(0, frames_total, chunk_size):
        end = min(frames_total, start + chunk_size)
        count = end - start
        voice_chunk = np.zeros(count, dtype=np.float32)
        available = max(0, min(count, len(voice) - start))
        if available:
            voice_chunk[:available] = voice[start:start + available]
        mix = voice_chunk.copy()
        positions = np.arange(start, end, dtype=np.int64)
        # The project authors low-gain ambience windows on the soundtrack
        # timeline. Use those exact levels and times; the previous fixed 0.12
        # gain ignored the authored 0.035 cue level and made every scene sound
        # more ocean-heavy than its mix plan.
        ambience_gain = np.zeros(count, dtype=np.float32)
        for ambience_start, ambience_end, volume in ambience_windows:
            left, right = max(start, ambience_start), min(end, ambience_end)
            if right <= left:
                continue
            source_left, source_right = left - ambience_start, right - ambience_start
            n = right - left
            edge = min(round(rate * 0.8), (ambience_end - ambience_start) // 3)
            envelope = np.ones(n, dtype=np.float32)
            if edge:
                ramp_in = np.clip((np.arange(source_left, source_right, dtype=np.float32) + 1) / edge, 0.0, 1.0)
                ramp_out = np.clip((ambience_end - np.arange(left, right, dtype=np.int64)) / edge, 0.0, 1.0).astype(np.float32)
                envelope = np.minimum(ramp_in, ramp_out)
            target = slice(left - start, right - start)
            ambience_gain[target] = np.maximum(ambience_gain[target], envelope * volume)
        mix += bed[positions % len(bed)] * ambience_gain
        while event_cursor < len(events) and events[event_cursor][0] < end:
            active.append(events[event_cursor])
            event_cursor += 1
        active = [event for event in active if event[1] > start]
        for event_start, event_end, samples, volume, _asset_id in active:
            left, right = max(start, event_start), min(end, event_end)
            if right <= left:
                continue
            source_left, source_right = left - event_start, right - event_start
            segment = samples[source_left:source_right]
            n = len(segment)
            edge = min(round(rate * 0.045), n // 3)
            envelope = np.ones(n, dtype=np.float32)
            if edge:
                ramp = np.linspace(0.0, 1.0, edge, dtype=np.float32)
                envelope[:edge] = ramp
                envelope[-edge:] = ramp[::-1]
            mix[left - start:right - start] += segment * envelope * volume
        peak_before = max(peak_before, float(np.max(np.abs(mix))))
        # Soft limiting affects only brief combined peaks and prevents clipping.
        limited = np.tanh(mix * 0.98) / np.tanh(0.98)
        if end == frames_total:
            tail = min(round(rate * 1.4), count)
            limited[-tail:] *= np.linspace(1.0, 0.0, tail, dtype=np.float32)
        peak_after = max(peak_after, float(np.max(np.abs(limited))))
        pcm = np.clip(limited * 32767.0, -32768, 32767).astype("<i2")
        out.writeframesraw(pcm.tobytes())

report = {
    "sourceVoice": os.path.relpath(voice_file.resolve(), PROJECT.resolve()),
    "master": os.path.relpath(out_path.resolve(), PROJECT.resolve()),
    "durationSeconds": frames_total / rate,
    "sampleRate": rate,
    "channels": 1,
    "ambientBed": {"assetId": "ambiencia_mar_calmo", "scheduledCues": len(ambience_windows), "authoredGainRange": [min((cue["volume"] for cue in ambience_cues), default=0.0), max((cue["volume"] for cue in ambience_cues), default=0.0)], "fadeSeconds": 0.8, "seamlessLocalLoop": True},
    "synchronizedFoleyCues": len(events),
    "peakBeforeLimiter": round(peak_before, 4),
    "peakAfterLimiter": round(peak_after, 4),
    "processing": "Local PCM mix; no transcription, remote service, or new voice synthesis.",
}
report_path = Path(os.environ.get("TITANIC_MIX_REPORT_OUTPUT", str(PROJECT / "audio/mix-report.json")))
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(report, ensure_ascii=False, indent=2))
