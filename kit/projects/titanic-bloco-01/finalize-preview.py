from pathlib import Path
import json,re,subprocess,sys,hashlib
b=Path(__file__).resolve().parent;e=b/'qa/evidence';audio=b/'audio/mix-v10.wav';encoded=b/'audio/mix-v10-normalized.m4a'
def measure(p):
 r=subprocess.run(['ffmpeg','-hide_banner','-i',str(p),'-vn','-af','loudnorm=I=-14:TP=-1.8:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(re.findall(r'\{[^{}]+\}',r.stderr)[-1])
if '--audio-only' in sys.argv:
 m=measure(audio)
 af='loudnorm=I=-14:TP=-1.8:LRA=11:'+':'.join(k+'='+m[v] for k,v in [('measured_I','input_i'),('measured_TP','input_tp'),('measured_LRA','input_lra'),('measured_thresh','input_thresh'),('offset','target_offset')])+':linear=false'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(audio),'-af',af,'-ar','48000','-c:a','aac','-b:a','192k',str(encoded)],check=True)
 normalized=measure(encoded)
 base_filter=af;post_gain=0
 for iteration in range(6):
  error=-14-float(normalized['input_i'])
  if abs(error)<=.18 and float(normalized['input_tp'])<=-1.5:break
  post_gain+=error
  af=base_filter+',volume='+str(round(post_gain,4))+'dB,alimiter=limit=0.7943:level=false:attack=5:release=80:latency=true'
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(audio),'-af',af,'-ar','48000','-c:a','aac','-b:a','192k',str(encoded)],check=True)
  normalized=measure(encoded)
  print('Master trim',iteration+1,normalized['input_i'],normalized['input_tp'],flush=True)
 assert abs(-14-float(normalized['input_i']))<=.2 and float(normalized['input_tp'])<=-1.5,normalized
 (e/'audio-technical-v10.json').write_text(json.dumps(dict(method='Mix canônica de project.json; normalização EBU R128 em duas passagens; medição do AAC codificado. Não constitui escuta.',raw=m,normalized=normalized,filter=af,auditoryReview='not-verified'),indent=2)+'\n')
 print(normalized)
else:
 raw=b/'render/bloco-01-internal-v9-raw.mp4';out=b/'render/bloco-01-internal-v11.mp4'
 span=json.loads((b/'qa/patch-mesmo-navio/span.json').read_text());patch=b/'qa/patch-mesmo-navio/patch.mp4'
 a,z,n=span['startFrame'],span['endFrame'],span['frames']
 pp=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames,width,height,r_frame_rate','-of','json',str(patch)],text=True))['streams'][0]
 assert int(pp['nb_read_frames'])==n and pp['width']==1920 and pp['height']==1080 and pp['r_frame_rate']=='30/1',pp
 officer=json.loads((b/'qa/patch-officer/span.json').read_text());patch2=b/'qa/patch-officer/patch.mp4';d,f,k=officer['startFrame'],officer['endFrame'],officer['frames']
 pp2=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames,width,height,r_frame_rate','-of','json',str(patch2)],text=True))['streams'][0]
 assert int(pp2['nb_read_frames'])==k and pp2['width']==1920 and pp2['height']==1080 and pp2['r_frame_rate']=='30/1',pp2
 vf=f'[0:v]split=3[ba][bb][bc];[ba]trim=end_frame={a},setpts=PTS-STARTPTS[a];[1:v]trim=end_frame={n},setpts=PTS-STARTPTS[b];[bb]trim=start_frame={z}:end_frame={d},setpts=PTS-STARTPTS[c];[2:v]trim=end_frame={k},setpts=PTS-STARTPTS[d];[bc]trim=start_frame={f},setpts=PTS-STARTPTS[e];[a][b][c][d][e]concat=n=5:v=1:a=0[v]'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(raw),'-i',str(patch),'-i',str(patch2),'-i',str(encoded),'-filter_complex',vf,'-map','[v]','-map','3:a:0','-c:v','libx264','-crf','16','-preset','medium','-threads','4','-pix_fmt','yuv420p','-r','30','-c:a','copy','-t','180','-movflags','+faststart',str(out)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True,capture_output=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)],text=True))
 assert abs(float(probe['format']['duration'])-180)<.04 and int(next(x for x in probe['streams'] if x['codec_type']=='video')['nb_frames'])==5400,probe
 (e/'probe-v11.json').write_text(json.dumps(probe,indent=2)+'\n')
 (e/'artifact-v11.json').write_text(json.dumps(dict(path='render/bloco-01-internal-v11.mp4',sha256=hashlib.sha256(out.read_bytes()).hexdigest(),decode='complete-without-errors',audioSource='audio/mix-v10-normalized.m4a',reason='Montagem por quadros: base V9 e substituição integral do plano 8; mix canônica final com rampas e masterização.',replacementSpan=span,officerSpan=officer,officerPatchSha256=hashlib.sha256(patch2.read_bytes()).hexdigest(),baseSha256=hashlib.sha256(raw.read_bytes()).hexdigest(),patchSha256=hashlib.sha256(patch.read_bytes()).hexdigest()),indent=2)+'\n')
 print(out)
