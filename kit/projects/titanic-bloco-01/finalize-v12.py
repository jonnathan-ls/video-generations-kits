from pathlib import Path
import json,subprocess,hashlib
b=Path(__file__).resolve().parent;e=b/'qa/evidence'
patches=json.loads((b/'qa/bridge-v12/spans.json').read_text())
s=json.loads((b/'qa/patch-mesmo-navio/span.json').read_text());s['path']='qa/patch-mesmo-navio/patch.mp4';patches.append(s);patches.sort(key=lambda x:x['startFrame'])
for p in patches:
 v=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames,width,height,r_frame_rate','-of','json',str(b/p['path'])],text=True))['streams'][0]
 assert int(v['nb_read_frames'])==p['frames'] and (v['width'],v['height'],v['r_frame_rate'])==(1920,1080,'30/1'),(p,v)
parts=[];cursor=0
for i,p in enumerate(patches):
 if cursor<p['startFrame']:parts.append(('base',cursor,p['startFrame']))
 parts.append(('patch',i,p['frames']));cursor=p['endFrame']
if cursor<5400:parts.append(('base',cursor,5400))
nb=sum(x[0]=='base' for x in parts);filters=['[0:v]split='+str(nb)+''.join(f'[base{i}]' for i in range(nb))];j=0
for i,(kind,a,z) in enumerate(parts):
 if kind=='base':filters.append(f'[base{j}]trim=start_frame={a}:end_frame={z},setpts=PTS-STARTPTS[v{i}]');j+=1
 else:filters.append(f'[{a+1}:v]trim=end_frame={z},setpts=PTS-STARTPTS[v{i}]')
filters.append(''.join(f'[v{i}]' for i in range(len(parts)))+f'concat=n={len(parts)}:v=1:a=0[out]')
out=b/'render/bloco-01-internal-v12.mp4';base=b/'render/bloco-01-internal-v9-raw.mp4';audio=b/'audio/mix-v10-normalized.m4a';cmd=['ffmpeg','-v','error','-y','-i',str(base)]
for p in patches:cmd+=['-i',str(b/p['path'])]
cmd+=['-i',str(audio),'-filter_complex',';'.join(filters),'-map','[out]','-map',f'{len(patches)+1}:a:0','-c:v','libx264','-crf','16','-preset','veryfast','-threads','4','-pix_fmt','yuv420p','-r','30','-c:a','copy','-t','180','-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True,capture_output=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)],text=True));assert abs(float(probe['format']['duration'])-180)<.04 and int(next(x for x in probe['streams'] if x['codec_type']=='video')['nb_frames'])==5400
(e/'probe-v12.json').write_text(json.dumps(probe,indent=2)+'\n')
for p in patches:p['sha256']=hashlib.sha256((b/p['path']).read_bytes()).hexdigest()
(e/'artifact-v12.json').write_text(json.dumps(dict(path='render/bloco-01-internal-v12.mp4',sha256=hashlib.sha256(out.read_bytes()).hexdigest(),decode='complete-without-errors',audioSource='audio/mix-v10-normalized.m4a',reason='Base V9, plano8 em marcha e cinco faixas de ponte sem interseção da água. Enquadramento do oficial corrigido.',patches=patches),indent=2)+'\n');print(out)
