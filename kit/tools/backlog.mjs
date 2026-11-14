import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {RESOURCE_KINDS} from '../engine/resources.js';
export const textHash=text=>createHash('sha256').update(text).digest('hex').slice(0,16);
export class BacklogStore{
 constructor(file){this.file=file;this.queue=Promise.resolve();}
 async read(){try{return JSON.parse(await fs.readFile(this.file,'utf8'));}catch(e){if(e.code==='ENOENT')return {schemaVersion:1,items:[]};throw e;}}
 async upsert(items){const op=this.queue.then(async()=>{const data=await this.read();for(const item of items){const index=data.items.findIndex(i=>i.id===item.id);const previous=data.items[index];if(previous&&(JSON.stringify(previous.evidence)!==JSON.stringify(item.evidence)||previous.specification!==item.specification||previous.kind!==item.kind)&&previous.assetId)throw new Error('Requisito alterado após implementação; use uma nova revisão do requisito.');const merged={...previous,...item,stage:previous?.stage||item.stage||'queued',assetId:previous?.assetId||item.assetId||null,createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(index<0)data.items.push(merged);else data.items[index]=merged;}
 await this.write(data);return data;});this.queue=op.catch(()=>{});return op;}
 async link(id,assetId){const op=this.queue.then(async()=>{const data=await this.read(),item=data.items.find(i=>i.id===id);if(!item)throw new Error('Requisito não encontrado no backlog.');item.assetId=assetId;item.stage='review';item.updatedAt=new Date().toISOString();await this.write(data);return data;});this.queue=op.catch(()=>{});return op;}
 async write(data){await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file+'.tmp',JSON.stringify(data,null,2)+'\n');await fs.rename(this.file+'.tmp',this.file);}
}
export function planBacklog({projectId,narration,plan,catalog}){
 if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(projectId))throw new Error('ID de projeto inválido.');
 if(plan.narrationHash!==textHash(narration))throw new Error('A narrativa mudou; revisar o plano semântico.');
 if(!Array.isArray(plan.decisions))throw new Error('Plano sem decisões semânticas.');
 const covered=new Set(),items=[],ids=new Set();
 for(const d of plan.decisions){
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(d.id)||ids.has(d.id))throw new Error('Decisões precisam de IDs únicos e estáveis.');ids.add(d.id);
  if(!['reuse','create','ignore'].includes(d.action)||typeof d.reason!=='string'||!d.reason.trim())throw new Error('Toda decisão precisa de ação e justificativa.');
  if(!Number.isInteger(d.start)||!Number.isInteger(d.end)||d.start<0||d.end<=d.start||narration.slice(d.start,d.end)!==d.phrase)throw new Error(`Evidência inválida em ${d.id}.`);
  for(let i=d.start;i<d.end;i++)covered.add(i);
  if(d.action==='ignore')continue;
  if(!RESOURCE_KINDS.includes(d.kind))throw new Error(`Tipo não reconhecido em ${d.id}.`);
  if(d.action==='reuse'){if(!catalog.assets.some(a=>a.id===d.assetId&&a.kind===d.kind))throw new Error(`Reutilização inexistente ou tipo incorreto: ${d.assetId}`);continue;}
  if(!d.label||!d.specification)throw new Error(`Definir nome e especificação do recurso: ${d.id}`);
  items.push({id:`${projectId}:${d.id}`,projectId,kind:d.kind,label:d.label,specification:d.specification,evidence:[{phrase:d.phrase,start:d.start,end:d.end}],baselineIds:d.baselineIds||[],dependsOn:d.dependsOn||[],stage:'queued',assetId:null});
 }
 for(const match of narration.matchAll(/[\p{L}\p{N}]+/gu))for(let i=match.index;i<match.index+match[0].length;i++)if(!covered.has(i))throw new Error(`Palavra sem triagem semântica: ${match[0]} (${match.index}).`);
 return items;
}
