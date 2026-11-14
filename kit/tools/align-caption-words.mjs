import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const normalized = text => String(text).normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}]/gu,'');

/** Global positional alignment. Unmatched cues retain estimated timing explicitly. */
export function alignCaptionWords(captions, transcript) {
  const rawSource = (Array.isArray(transcript) ? transcript : transcript.segments?.flatMap(segment=>segment.words||[]) || []);
  const source = rawSource
    .filter(word=>normalized(word.word ?? word.text) && Number.isFinite(word.start) && Number.isFinite(word.end) && (word.end>word.start || (transcript.source==='whisper-forced-alignment' && word.end===word.start)))
    .map(word=>({...word,key:normalized(word.word??word.text)}));
  const target = captions.flatMap((cue, cueIndex)=>String(cue.text).match(/\S+/gu)?.map(text=>({text,key:normalized(text),cueIndex,expected:cue.start+cue.duration/2}))||[]);
  const n=target.length,m=source.length;
  if ((n+1)*(m+1)>150_000_000) throw new Error('Alinhamento excede limite de memória; alinhe por capítulos.');
  const trace=new Uint8Array((n+1)*(m+1));
  let previous=Float64Array.from({length:m+1},(_,j)=>j);
  for(let j=1;j<=m;j++)trace[j]=2;
  for(let i=1;i<=n;i++){
    const next=new Float64Array(m+1);next[0]=i;trace[i*(m+1)]=1;
    for(let j=1;j<=m;j++){
      const same=target[i-1].key===source[j-1].key;
      const match=previous[j-1]+(same?Math.min(.2,Math.abs(target[i-1].expected-source[j-1].start)/100):2.1);
      const missing=previous[j]+1,extra=next[j-1]+1;
      if(match<=missing&&match<=extra){next[j]=match;trace[i*(m+1)+j]=3;}
      else if(missing<=extra){next[j]=missing;trace[i*(m+1)+j]=1;}
      else {next[j]=extra;trace[i*(m+1)+j]=2;}
    }
    previous=next;
  }
  let i=n,j=m;const matches=new Map();
  while(i||j){const direction=trace[i*(m+1)+j];if(direction===3){if(target[i-1].key===source[j-1].key)matches.set(i-1,j-1);i--;j--;}else if(direction===1)i--;else if(direction===2)j--;else break;}
  const grouped=captions.map(()=>[]);
  target.forEach((word,index)=>grouped[word.cueIndex].push({word,source:matches.has(index)?source[matches.get(index)]:null}));
  let alignedCues=0,previousEnd=-Infinity;const issues=[],warnings=[];
  for(const word of rawSource)if(word.flags?.length)warnings.push({reason:'source-word-needs-review',word:word.word??word.text,start:word.start,flags:word.flags});
  if(transcript.audit?.segmentIssues?.length)issues.push({reason:'source-segment-needs-review',segments:transcript.audit.segmentIssues});
  const result=captions.map((cue,index)=>{
    const rows=grouped[index],coverage=rows.filter(row=>row.source).length/Math.max(1,rows.length);
    const words=rows.map(row=>row.source?{text:row.word.text,start:row.source.start,end:row.source.end,...(Number.isFinite(row.source.probability)?{probability:row.source.probability}:{}),...(row.source.flags?.length?{flags:row.source.flags}:{}),...(row.source.end===row.source.start?{zeroDuration:true}:{}),source:transcript.source||'whisper-asr'}:null);
    const valid=rows.length&&coverage===1&&words.every((word,i)=>word.start>=(i?words[i-1].end:previousEnd)-.001);
    if(!valid){issues.push({cue:index,coverage,reason:coverage<1?'unmatched-transcript-words':'overlapping-word-times'});const {words:oldWords,...estimated}=cue;return {...estimated,timingSource:'estimated-grapheme',alignmentCoverage:coverage};}
    alignedCues++;previousEnd=words.at(-1).end;
    return {...cue,start:words[0].start,duration:words.at(-1).end-words[0].start,words,timingSource:transcript.source==='whisper-forced-alignment'?'whisper-forced-alignment':'whisper-word-alignment',alignmentCoverage:1};
  });
  // Never silently introduce overlap between retimed aligned cues and fallback cues.
  for(let index=1;index<result.length;index++)if(result[index].start<result[index-1].start+result[index-1].duration-.001)issues.push({cue:index,reason:'cue-overlap-needs-review'});
  return {captions:result,audit:{source:transcript.source||'whisper-asr',method:transcript.method||'global-positional-dp',note:'Automatic word alignment requires review',sourceWords:m,scriptWords:n,matchedWords:matches.size,wordCoverage:matches.size/Math.max(1,n),alignedCues,estimatedCues:captions.length-alignedCues,issues,warnings,technicalOk:issues.length===0,requiresHumanReview:true,ok:issues.length===0}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [projectFile,transcriptFile,outputFile]=process.argv.slice(2);
  if(!outputFile)throw new Error('Uso: node kit/tools/align-caption-words.mjs projeto.json whisper.json resultado.json');
  const project=JSON.parse(await fs.readFile(projectFile,'utf8')),transcript=JSON.parse(await fs.readFile(transcriptFile,'utf8'));
  const result=alignCaptionWords(project.captions||[],transcript);
  await fs.writeFile(outputFile,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.audit));
}
