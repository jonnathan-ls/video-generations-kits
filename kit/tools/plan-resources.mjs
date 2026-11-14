import fs from 'node:fs/promises';import path from 'node:path';
import {buildCatalog,ROOT} from './build-catalog.mjs';import {BacklogStore,planBacklog} from './backlog.mjs';
const directory=path.resolve(process.argv[2]||'');if(!process.argv[2])throw new Error('A LLM informa a pasta do projeto.');
const narration=await fs.readFile(path.join(directory,'narration.txt'),'utf8'),plan=JSON.parse(await fs.readFile(path.join(directory,'asset-plan.json'),'utf8'));
const projectId=path.basename(directory),catalog=await buildCatalog(),items=planBacklog({projectId,narration,plan,catalog});
await new BacklogStore(path.join(ROOT,'kit/catalog/backlog.json')).upsert(items);console.log(JSON.stringify({projectId,requirements:items.length,stage:'awaiting-resource-build'},null,2));
