#!/usr/bin/env python3
"""Prepare files consumed by the existing stick-film mixer. No voice choice is made here."""
import json,sys,subprocess,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
if len(sys.argv)!=2:raise SystemExit('Uso: python3 kit/tools/audio-bridge.py caminho/project.json')
file=Path(sys.argv[1]).resolve();project=json.loads(file.read_text());audio=project.get('audio',{})
catalog=json.loads((ROOT/'kit/catalog/registry.json').read_text());defs={a['id']:a for a in catalog['assets']}
out=file.parent/'audio-build';(out/'build').mkdir(parents=True,exist_ok=True)
events=[]
for e in audio.get('events',[]):
 a=defs.get(e['assetId'],{})
 if not a.get('sound'):raise SystemExit(f"Som não registrado: {e['assetId']}")
 events.append({'type':a['sound'],'t':e['time'],'dur':e.get('duration',.6),'gain':e.get('volume',.35),'pan':e.get('pan',0)})
cues={}
if audio.get('voice'):
 source=(file.parent/audio['voice']).resolve()
 if not source.is_file():raise SystemExit(f'Voz ausente: {source}')
 (out/'voice').mkdir(exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-ar','48000','-ac','1','-c:a','pcm_f32le',str(out/'voice/narration.wav')],check=True)
 (out/'voice/voice.json').write_text(json.dumps({'paragraphs':{'narration':{'file':'voice/narration.wav'}}},indent=2));cues['narration']=0
elif (out/'voice/voice.json').exists():
 raise SystemExit('O projeto não indica voz, mas o build anterior contém voz. Use outro diretório ou revise o arquivo antes de continuar.')
music=audio.get('music',{'off':True})
(out/'build/sync.json').write_text(json.dumps({'duration':project['duration'],'events':events,'cues':cues,'moods':audio.get('moods',[]),'music':music},indent=2))
(out/'film.json').write_text(json.dumps({'mix':audio.get('mix',{'voice':1.45,'sfx':.62,'music':.26,'duck':.8})},indent=2))
print(json.dumps({'prepared':str(out),'voice':bool(cues),'events':len(events),'mixer':str(ROOT/'stick-film/audio/mix.py')},ensure_ascii=False))
