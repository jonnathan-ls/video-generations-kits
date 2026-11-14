#!/usr/bin/env python3
"""Extract 4 fps contact sheets for the highest-view reference in each studied account.

Each contact-sheet row is one second and contains four frames at 0.25 s intervals.
The source MP4s were collected earlier; this script performs no network access.
"""
from __future__ import annotations

import json
import math
import statistics
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research/frames/top-per-channel-4fps"
SOURCES = [
    {
        "account": "youtube-initial",
        "title": "Cristo Redentor: função de cada peça",
        "video_id": "SMljncnq2UI",
        "file": "research/videos/youtube/SMljncnq2UI.mp4",
        "views_at_collection": "3.856",
        "views_note": "Contagem do download; os três Shorts públicos disponíveis foram analisados.",
    },
    {
        "account": "instagram-initial",
        "title": "Por que o mofo do rodapé sempre volta?",
        "video_id": "DfPlrwRuSLj",
        "file": "research/videos/instagram/DfPlrwRuSLj.mp4",
        "views_at_collection": "3,3 milhões",
        "views_note": "Contagem arredondada exibida na grade; perfil percorrido em 28 publicações.",
    },
    {
        "account": "ricks-clips",
        "title": "The Ancient Jar That Warned an Empire",
        "video_id": "VS1Z_Q-Klt8",
        "file": "research/videos/ricks/VS1Z_Q-Klt8.mp4",
        "views_at_collection": "31,57 milhões",
        "views_note": "Ordenação por view_count da amostra pública de 147 Shorts.",
    },
    {
        "account": "hiddenhome-3d",
        "title": "Piscina construída no quintal",
        "video_id": "DekXZZwh99N",
        "file": "research/videos/hiddenhome/DekXZZwh99N.mp4",
        "views_at_collection": "28 milhões",
        "views_note": "Maior contagem abreviada na grade pública de 95 Reels.",
    },
]

FPS = 4
CELL_W, CELL_H = 270, 480
COLS, ROWS = 4, 5
PER_PAGE = COLS * ROWS
GAP, HEADER_H = 4, 38
PAGE_W = COLS * CELL_W + (COLS + 1) * GAP
PAGE_H = HEADER_H + ROWS * CELL_H + (ROWS + 1) * GAP
OUT.mkdir(parents=True, exist_ok=True)

try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
    STAMP_FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 17)
except OSError:
    FONT = ImageFont.load_default()
    STAMP_FONT = ImageFont.load_default()


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, math.ceil(p * len(ordered)) - 1)]


manifest = {
    "method": "ffmpeg fps=4; each contact-sheet row contains 4 frames spaced 0.25 seconds apart",
    "sample_fps": FPS,
    "frame_interval_seconds": 1 / FPS,
    "contact_sheet_seconds": COLS * ROWS / FPS,
    "sheet_layout": f"{COLS} columns x {ROWS} rows; one second per row",
    "frame_change_metric": "mean absolute grayscale pixel difference between successive 4 fps frames, downscaled to 90x160; indicates image change, not tracked object motion or retention",
    "videos": [],
}

for source in SOURCES:
    video = ROOT / source["file"]
    if not video.is_file():
        raise FileNotFoundError(video)
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate",
            "-show_entries", "format=duration", "-of", "json", str(video),
        ],
        check=True, capture_output=True, text=True,
    )
    probe_data = json.loads(probe.stdout)
    stream = probe_data["streams"][0]
    duration = float(probe_data["format"]["duration"])
    out_dir = OUT / source["video_id"]
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix=f"ob-{source['video_id']}-") as temp_name:
        temp = Path(temp_name)
        subprocess.run(
            [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
                "-vf", f"fps={FPS},scale={CELL_W}:{CELL_H}:force_original_aspect_ratio=decrease,pad={CELL_W}:{CELL_H}:(ow-iw)/2:(oh-ih)/2:color=black",
                "-q:v", "3", str(temp / "%04d.jpg"),
            ],
            check=True,
        )
        frames = sorted(temp.glob("*.jpg"))
        differences: list[float] = []
        previous = None
        for frame_path in frames:
            with Image.open(frame_path) as im:
                gray = im.convert("L").resize((90, 160), Image.Resampling.BILINEAR)
                if previous is not None:
                    diff = ImageChops.difference(gray, previous)
                    differences.append(sum(diff.getdata()) / (90 * 160 * 255))
                previous = gray.copy()

        sheet_files = []
        for page_index, offset in enumerate(range(0, len(frames), PER_PAGE)):
            chunk = frames[offset:offset + PER_PAGE]
            first_time = offset / FPS
            last_time = min(duration, (offset + len(chunk)) / FPS)
            canvas = Image.new("RGB", (PAGE_W, PAGE_H), (18, 26, 29))
            draw = ImageDraw.Draw(canvas)
            draw.text(
                (GAP, 8),
                f"{source['video_id']} | {first_time:05.2f}s–{last_time:05.2f}s | 4 quadros/s",
                font=FONT,
                fill=(242, 245, 246),
            )
            for local_index, frame_path in enumerate(chunk):
                global_index = offset + local_index
                row, col = divmod(local_index, COLS)
                x = GAP + col * (CELL_W + GAP)
                y = HEADER_H + GAP + row * (CELL_H + GAP)
                with Image.open(frame_path) as im:
                    frame = im.convert("RGB")
                    canvas.paste(frame, (x, y))
                stamp = f"{global_index / FPS:05.2f}s"
                box = draw.textbbox((x + 6, y + 5), stamp, font=STAMP_FONT)
                draw.rounded_rectangle(
                    (box[0] - 4, box[1] - 2, box[2] + 4, box[3] + 2),
                    radius=3,
                    fill=(0, 0, 0),
                )
                draw.text((x + 6, y + 5), stamp, font=STAMP_FONT, fill=(255, 255, 255))
            name = f"{page_index + 1:02d}-{first_time:05.2f}-{last_time:05.2f}.jpg"
            target = out_dir / name
            canvas.save(target, quality=88, optimize=True)
            sheet_files.append(str(target.relative_to(ROOT)))

    metric = {
        **source,
        "source_file": source["file"],
        "duration_seconds": round(duration, 3),
        "resolution": [stream["width"], stream["height"]],
        "source_fps": stream["r_frame_rate"],
        "sample_count": len(frames),
        "sheet_files": sheet_files,
        "frame_change": {
            "mean": round(statistics.fmean(differences), 4) if differences else 0.0,
            "median": round(statistics.median(differences), 4) if differences else 0.0,
            "p90": round(percentile(differences, 0.90), 4),
            "below_0_01_fraction": round(sum(v < 0.01 for v in differences) / len(differences), 4) if differences else 0.0,
            "above_0_15_fraction": round(sum(v > 0.15 for v in differences) / len(differences), 4) if differences else 0.0,
        },
    }
    manifest["videos"].append(metric)
    print(f"{source['video_id']}: {len(frames)} frames, {len(sheet_files)} sheets, {duration:.2f}s")


(OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
print(f"Manifest: {OUT / 'manifest.json'}")
