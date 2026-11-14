#!/usr/bin/env python3
"""Side-by-side picker for Flow variants: labels each image A, B, C, D so the user can answer with a letter.

  python variants.py <out.png> <image> [<image> ...]"""
import sys
from PIL import Image, ImageDraw, ImageFont


def main():
    out, files = sys.argv[1], sys.argv[2:]
    if not files: sys.exit(__doc__)
    ims = [Image.open(f).convert('RGB') for f in files]
    W = 900; ims = [im.resize((W, int(im.height * W / im.width)), Image.LANCZOS) for im in ims]
    cols = 2 if len(ims) > 1 else 1; rows = (len(ims) + cols - 1) // cols; H = max(im.height for im in ims)
    sheet = Image.new('RGB', (cols * W + (cols + 1) * 16, rows * (H + 56) + 16), (40, 40, 40)); d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype('Arial Bold.ttf', 40)
    except Exception:
        try: font = ImageFont.truetype('DejaVuSans-Bold.ttf', 40)
        except Exception: font = ImageFont.load_default()
    for i, im in enumerate(ims):
        x = 16 + (i % cols) * (W + 16); y = 16 + (i // cols) * (H + 56)
        sheet.paste(im, (x, y + 48)); d.text((x + 4, y + 2), chr(65 + i), fill=(255, 210, 90), font=font)
    sheet.save(out); print(out)


if __name__ == '__main__':
    main()
