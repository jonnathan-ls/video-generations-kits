#!/usr/bin/env python3
"""Force-align exact recorded paragraph text. Does not synthesize or invent timestamps."""
import argparse,json,re,time,unicodedata,hashlib
from pathlib import Path
import torch,whisper
from whisper.timing import find_alignment,merge_punctuations
from whisper.tokenizer import get_tokenizer

def key(text):
    return ''.join(c for c in unicodedata.normalize('NFD',text).lower() if c.isalnum())

def main():
    parser=argparse.ArgumentParser();parser.add_argument('voice');parser.add_argument('output');parser.add_argument('--model',default='/home/jonnathan/scripts/extract-transcripts/models/small.pt');args=parser.parse_args()
    voice_file=Path(args.voice).resolve();out=Path(args.output).resolve();cache=out.parent/'forced-alignment-parts';cache.mkdir(parents=True,exist_ok=True)
    voice=json.loads(voice_file.read_text());torch.set_num_threads(4)
    if not torch.cuda.is_available():raise RuntimeError('CUDA requerida para este alinhamento; sem fallback silencioso CPU.')
    model=whisper.load_model(args.model,device='cuda');tokenizer=get_tokenizer(model.is_multilingual,language='pt',task='transcribe')
    results=[];segments=[s for s in voice['segments'] if s.get('kind')=='narration' or (s.get('kind')=='chapter' and s.get('source'))];began=time.time()
    for index,segment in enumerate(segments):
        source=voice_file.parent/segment['source'];source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
        part=cache/f'{index:04d}.json'
        if part.exists():
            saved=json.loads(part.read_text())
            if saved.get('alignerVersion')==3 and saved.get('sourceSha256')==source_hash and saved.get('text')==segment['text'] and saved.get('source')==segment['source'] and saved.get('start')==segment['start']:results.append(saved);continue
        source=voice_file.parent/segment['source'];audio=whisper.load_audio(str(source));frames=(len(audio)+whisper.audio.HOP_LENGTH-1)//whisper.audio.HOP_LENGTH
        if frames>whisper.audio.N_FRAMES:raise RuntimeError(f'Tomada acima de 30s requer segmentação explícita: {source}')
        mel=whisper.log_mel_spectrogram(whisper.pad_or_trim(audio),n_mels=model.dims.n_mels).to(model.device)
        alignment=find_alignment(model,tokenizer,tokenizer.encode(' '+segment['text'].strip()),mel,frames)
        zero_count=lambda rows:sum(bool(key(row.word)) and row.end<=row.start for row in rows)
        selected_filter=7
        if zero_count(alignment):
            for width in (3,1):
                alternative=find_alignment(model,tokenizer,tokenizer.encode(' '+segment['text'].strip()),mel,frames,medfilt_width=width)
                if zero_count(alternative)<zero_count(alignment):alignment=alternative;selected_filter=width
                if not zero_count(alignment):break
        merge_punctuations(alignment,'\"\'“¿([{-','\"\'.。,，!！?？:：”)]}、')
        raw=[row for row in alignment if key(row.word)]
        text_words=re.findall(r'\S+',segment['text']);text_words=[w for w in text_words if key(w)]
        issues=[];words=[]
        if ''.join(key(w) for w in text_words)!=''.join(key(row.word) for row in raw):issues.append('token-text-mismatch')
        else:
            offsets=[];cursor=0
            for row in raw:
                length=len(key(row.word));offsets.append((cursor,cursor+length,row));cursor+=length
            cursor=0
            for word in text_words:
                end_cursor=cursor+len(key(word));items=[row for a,b,row in offsets if b>cursor and a<end_cursor]
                shared=any(a<cursor or b>end_cursor for a,b,row in offsets if b>cursor and a<end_cursor)
                begin=float(items[0].start);end=float(items[-1].end);probability=min(float(row.probability) for row in items)
                flags=[]
                if shared:flags.append('shared-token-span')
                if end<=begin:flags.append('zero-duration')
                if probability<.15:flags.append('low-probability')
                if end>len(audio)/whisper.audio.SAMPLE_RATE+.025:flags.append('outside-recording')
                words.append({'word':word,'start':round(segment['start']+begin,6),'end':round(segment['start']+end,6),'probability':probability,'flags':flags,'status':'not-verified' if flags else 'aligned-automatic'})
                cursor=end_cursor
        saved={**segment,'alignerVersion':3,'sourceSha256':source_hash,'medianFilterWidth':selected_filter,'words':words,'issues':issues,'method':'whisper-cross-attention-dtw-exact-text','status':'not-verified' if issues or any(w['flags'] for w in words) else 'aligned-automatic'}
        part.write_text(json.dumps(saved,ensure_ascii=False,indent=2)+'\n');results.append(saved)
        print(json.dumps({'completed':index+1,'total':len(segments),'seconds':round(time.time()-began,1),'issues':issues,'flaggedWords':sum(bool(w['flags']) for w in words)}),flush=True)
    flags=[{'segment':i,'word':w['word'],'start':w['start'],'flags':w['flags']} for i,s in enumerate(results) for w in s['words'] if w['flags']]
    output={'source':'whisper-forced-alignment','method':'whisper-cross-attention-dtw-exact-text','model':args.model,'device':str(model.device),'status':'not-verified' if flags or any(s['issues'] for s in results) else 'aligned-automatic','note':'Automatic forced alignment to known recorded text; probabilities and flagged spans require professional review. No timestamp was synthesized to fill a zero-duration word.','segments':results,'audit':{'segments':len(results),'words':sum(len(s['words']) for s in results),'flaggedWords':flags,'segmentIssues':[{'index':i,'issues':s['issues']} for i,s in enumerate(results) if s['issues']]}}
    out.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'output':str(out),'status':output['status'],'words':output['audit']['words'],'flagged':len(flags)}),flush=True)
if __name__=='__main__':main()
