import json,re,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parent
evidence=root/(sys.argv[1]if len(sys.argv)>1 else 'metadata/evidence.json')
rows=json.loads(evidence.read_text())
for v in rows:
 text=(root/'transcripts'/f"{v['id']}.md").read_text()
 lines=re.findall(r'`\[(.*?) -> (.*?)\]` (.*)',text)
 words=sum(len(re.findall(r'\w+',line[2]))for line in lines)
 v.update(wordCount=words,wordsPerMinute=round(words/v['duration']*60,1),segments=len(lines))
 p=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(root/'videos'/v['platform']/f"{v['id']}.mp4"),'-vn','-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True)
 tail=p.stderr[p.stderr.rfind('Summary:'):]
 match=re.search(r'I:\s*([-\d.]+) LUFS',tail);peak=re.search(r'Peak:\s*([-\d.]+) dBFS',tail)
 v['integratedLUFS']=float(match[1])if match else None
 v['truePeakDBFS']=float(peak[1])if peak else None
evidence.write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for v in rows:print(v['id'],v['wordCount'],v['wordsPerMinute'],v['integratedLUFS'],v['truePeakDBFS'])
