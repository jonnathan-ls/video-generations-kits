from pathlib import Path
import json,re,sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
B=Path(__file__).resolve().parent;R=B.parents[2];parts=json.loads((B/'script.json').read_text());old=json.loads((B.parent/'titanic-bloco-01/voice.json').read_text());cache={x['text']:R/x['source'] for x in old['segments']};model=None;rows=[];audio=[];cursor=0;sr=24000
for i,x in enumerate(parts):
 if x['kind']=='chapter':
  gap=4.6 if x['chapter']>1 else 4.2;audio.append(np.zeros(round(gap*sr),dtype=np.float32));rows.append(dict(**x,start=cursor,end=cursor+gap));cursor+=gap;continue
 file=B/f'audio/take-{i:03d}.wav'
 if not file.exists():
  if x['text'] in cache and cache[x['text']].exists():a,rate=sf.read(cache[x['text']],dtype='float32')
  else:
   if model is None:model=Kokoro('/home/jonnathan/StickFilms/.tools/kokoro/kokoro-v1.0.onnx','/home/jonnathan/StickFilms/.tools/kokoro/voices-v1.0.bin')
   a,rate=model.create(x['text'],voice='pm_santa',speed=.85,lang='pt-br');a=a.astype(np.float32);active=np.flatnonzero(np.abs(a)>max(1e-8,float(np.max(np.abs(a)))*10**(-42/20)));a=a[max(0,active[0]-round(.02*rate)):min(len(a),active[-1]+round(.08*rate))] if len(active) else a
  assert rate==sr;sf.write(file,a,sr)
 a,rate=sf.read(file,dtype='float32');assert rate==sr;start=cursor;audio.append(a);cursor+=len(a)/sr;rows.append(dict(**x,index=i,start=round(start,6),end=round(cursor,6),source=str(file.relative_to(B))))
 gap=.75 if x['text'].endswith('?') else .55;audio.append(np.zeros(round(gap*sr),dtype=np.float32));cursor+=gap
 print(i,round(cursor,2),x['text'][:45],flush=True)
# final hold makes the last line land; duration aligns to full frame.
tail=3.0;duration=np.ceil((cursor+tail)*30)/30;audio.append(np.zeros(round((duration-cursor)*sr),dtype=np.float32));joined=np.concatenate(audio);joined=np.pad(joined,(0,max(0,round(duration*sr)-len(joined))))[:round(duration*sr)];sf.write(B/'audio/narration.wav',joined,sr)
(B/'voice.json').write_text(json.dumps(dict(voice='pm_santa',speed=.85,sampleRate=sr,duration=duration,segments=rows,auditoryInspection='not-verified'),ensure_ascii=False,indent=2)+'\n');print('VOICE_COMPLETE',duration,flush=True)
