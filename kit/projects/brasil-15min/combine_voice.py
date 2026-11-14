import json, shutil
from pathlib import Path
import soundfile as sf
P=Path('/home/jonnathan/projects/obra-cortada/kit/projects/brasil-15min')
out=P/'audio/takes-final'; out.mkdir(parents=True,exist_ok=True)
segs=json.load(open(P/'segments.json'))
takes=[]
for i in range(1,59):
    if i<=24: src=P/'audio/takes-090'/f'pm_santa-p{i}.wav'
    elif i<=33: src=P/'audio/par-1'/f'pm_santa-p{i}.wav'
    elif i<=41: src=P/'audio/par-2'/f'pm_santa-p{i}.wav'
    elif i<=50: src=P/'audio/par-3'/f'pm_santa-p{i}.wav'
    else: src=P/'audio/par-4'/f'pm_santa-p{i}.wav'
    if not src.exists(): raise SystemExit(f'missing {src}')
    dst=out/src.name; shutil.copyfile(src,dst)
    info=sf.info(dst); takes.append({'voice':'pm_santa','paragraph':i,'text':segs[i-1]['text'],'file':dst.name,'sampleRate':info.samplerate,'duration':round(info.duration,3)})
json.dump({'language':'pt-br','engine':'kokoro','takes':takes},open(out/'takes.json','w'),ensure_ascii=False,indent=2)
print('takes',len(takes),'total',round(sum(t['duration'] for t in takes),2))
