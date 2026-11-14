export const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export function tokenize(text){return [...text.matchAll(/[\p{L}\p{N}]+/gu)].map(m=>({text:m[0],key:normalize(m[0]),start:m.index,end:m.index+m[0].length}));}
// All contiguous 1-, 2-, 3-word windows are checked, without crossing punctuation.
export function analyzeNarrative(text,catalog){
 const tokens=tokenize(text),index=new Map();
 for(const asset of catalog.assets)for(const alias of [asset.id.replaceAll('_',' '),...(asset.aliases||[])]){
   const key=normalize(alias).trim().replace(/\s+/g,' ');if(!index.has(key))index.set(key,new Set());index.get(key).add(asset.id);
 }
 const grams=[];for(let i=0;i<tokens.length;i++)for(let n=1;n<=3&&i+n<=tokens.length;n++){
   const end=i+n-1;if(n>1&&/[^\s]/u.test(text.slice(tokens[end-1].end,tokens[end].start)))break;
   const key=tokens.slice(i,i+n).map(t=>t.key).join(' '),ids=[...(index.get(key)||[])];
   grams.push({text:text.slice(tokens[i].start,tokens[end].end),key,start:tokens[i].start,end:tokens[end].end,tokenStart:i,words:n,assetIds:ids});
 }
 const matches=grams.filter(g=>g.assetIds.length).sort((a,b)=>b.words-a.words||a.start-b.start);
 // Preserve ambiguous matches: the director must choose; never silently guess a meaning.
 const selected=[],covered=new Set();for(const m of matches)if(!Array.from({length:m.words},(_,j)=>m.tokenStart+j).some(i=>covered.has(i))){selected.push(m);for(let j=0;j<m.words;j++)covered.add(m.tokenStart+j);}
 const uncovered=tokens.filter((_,i)=>!covered.has(i));
 return {schemaVersion:1,text,tokens,grams,matches,selected:selected.sort((a,b)=>a.start-b.start),assetIds:[...new Set(selected.flatMap(m=>m.assetIds))],uncovered:uncovered.map(t=>({text:t.text,start:t.start,end:t.end})),requiresSemanticTriage:true};
}
