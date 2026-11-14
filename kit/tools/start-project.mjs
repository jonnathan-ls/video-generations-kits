import fs from 'node:fs/promises';import path from 'node:path';import {ROOT} from './build-catalog.mjs';
const [slug,...title]=process.argv.slice(2);if(!/^[a-z0-9][a-z0-9-]{1,63}$/.test(slug||'')||!title.length)throw new Error('A LLM informa um ID simples e o título do projeto.');
const folder=path.join(ROOT,'kit/projects',slug);await fs.mkdir(folder,{recursive:false});
const state={id:slug,title:title.join(' '),mode:'production',stage:'brief',label:'A LLM está confirmando a ideia e as escolhas essenciais.',decisions:{name:null,voice:null},approvals:{narrative:false,resources:false,preview:false}};
for(const [file,data]of Object.entries({'state.json':JSON.stringify(state,null,2)+'\n','brief.md':'# Brief\n\n## Pedido\n\n## Entendimento confirmado\n\n## Referências e fatos\n\n## Próxima validação humana\n','narration.txt':'','beats.json':'[]\n','asset-plan.json':JSON.stringify({narrationHash:null,decisions:[],reviewed:false,unresolved:['Narrativa e recursos ainda não analisados.']},null,2)+'\n'}))await fs.writeFile(path.join(folder,file),data);
console.log(JSON.stringify({projectId:slug,folder,stage:'brief'}));
