#!/usr/bin/env python3
import json,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parent
summary=[]
platforms=sys.argv[1:] or ['youtube','instagram']
for platform in platforms:
 for video in sorted((ROOT/'videos'/platform).glob('*.mp4')):
  probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(video)]))
  duration=float(probe['format']['duration']);stream=next(s for s in probe['streams'] if s['codec_type']=='video')
  dest=ROOT/'frames'/video.stem;dest.mkdir(parents=True,exist_ok=True)
  times=[round(i*(duration-.15)/17,2) for i in range(18)]
  thumbs=[]
  for i,t in enumerate(times):
   frame=dest/f'{i:02d}-{t:06.2f}.jpg'
   subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1','-vf','scale=216:-1',str(frame)],check=True)
   img=Image.open(frame).convert('RGB');thumbs.append((img,t))
  w=6*216;h=3*(384+28);sheet=Image.new('RGB',(w,h),'#151c24');draw=ImageDraw.Draw(sheet)
  for i,(im,t)in enumerate(thumbs):
   im.thumbnail((216,384));x=(i%6)*216;y=(i//6)*412;sheet.paste(im,(x,y));draw.text((x+8,y+388),f'{t:.2f}s',fill='white')
  sheet.save(dest/'contact.jpg',quality=90)
  # Short motion triplet, separate from evenly spaced evidence.
  for i,t in enumerate([10,10.4,10.8]):
   subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1','-vf','scale=360:-1',str(dest/f'motion-{i}.jpg')],check=True)
  info=json.load(open(video.with_suffix('.info.json')))
  summary.append({'id':video.stem,'platform':platform,'duration':duration,'width':stream['width'],'height':stream['height'],'views':info.get('view_count'),'title':info.get('title'),'url':info.get('webpage_url'),'frames':times,'contactSheet':f'/research/frames/{video.stem}/contact.jpg'})
(ROOT/('metadata/evidence-'+ '-'.join(platforms)+'.json')).write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(f'{len(summary)} vídeos processados')
