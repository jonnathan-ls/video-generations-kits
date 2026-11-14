from pathlib import Path
import torch,whisper,json,time
B=Path(__file__).resolve().parent;torch.set_num_threads(4);device='cuda' if torch.cuda.is_available() else 'cpu';print('DEVICE',device,flush=True)
m=whisper.load_model('/home/jonnathan/scripts/extract-transcripts/models/small.pt',device=device)
r=m.transcribe(str(B/'audio/narration.wav'),language='pt',fp16=device=='cuda',word_timestamps=True,condition_on_previous_text=False,verbose=False,initial_prompt='Titanic, Carpathia, Californian, Rostron, Boxhall, Lillian Bentham, Cecil Fitzpatrick, Harold Lowe, Jack Phillips, Harold Bride, Harold Cottam, Thomas Andrews. CQD, SOS. Abril de mil novecentos e doze. Atlântico, Nova York.')
(B/'qa/evidence/whisper-word-timing.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print('ALIGN_COMPLETE',flush=True)
