import fs from 'node:fs/promises';
import path from 'node:path';
export const reviewKey=(id,variant='')=>`${id}::${variant}`;
export function statusFor(asset,variant,reviews){const row=reviews[reviewKey(asset.id,variant)];return row?.revision===asset.revision?row.status:'pending';}
export class ReviewStore {
 constructor(file){this.file=file;this.queue=Promise.resolve();}
 async read(){try{return JSON.parse(await fs.readFile(this.file,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}}
 save(asset,{variant='',revision,status,note=''}){
   if(revision!==asset.revision)throw Object.assign(new Error('Revisão mudou. Recarregue o catálogo.'),{status:409});
   if(!['approved','changes','pending'].includes(status))throw Object.assign(new Error('Status inválido'),{status:400});
   if(variant&&!asset.variants.includes(variant))throw Object.assign(new Error('Variação inválida'),{status:400});
   if(typeof note!=='string'||note.length>3000)throw Object.assign(new Error('Observação inválida'),{status:400});
   const op=this.queue.then(async()=>{const data=await this.read();data[reviewKey(asset.id,variant)]={status,note,revision,reviewedAt:new Date().toISOString(),reviewer:'usuario-local'};await fs.mkdir(path.dirname(this.file),{recursive:true});const tmp=this.file+'.tmp';await fs.writeFile(tmp,JSON.stringify(data,null,2)+'\n');await fs.rename(tmp,this.file);return data;});
   this.queue=op.catch(()=>{});return op;
 }
}
