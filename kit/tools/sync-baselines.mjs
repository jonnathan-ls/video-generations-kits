import fs from 'node:fs/promises';import path from 'node:path';import {buildCatalog,ROOT} from './build-catalog.mjs';import {ReviewStore,statusFor} from './reviews.mjs';
const catalog=await buildCatalog(),reviews=await new ReviewStore(path.join(ROOT,'kit/catalog/reviews.json')).read();const baselines=[];
for(const a of catalog.assets)for(const variant of a.variants.length?a.variants:[''])if(statusFor(a,variant,reviews)==='approved')baselines.push({id:a.id,variant,revision:a.revision,kind:a.kind,description:a.description,reviewNote:reviews[`${a.id}::${variant}`].note});
await fs.writeFile(path.join(ROOT,'kit/quality/baselines.json'),JSON.stringify({schemaVersion:1,baselines},null,2)+'\n');console.log(`${baselines.length} referências aprovadas disponíveis para a LLM.`);
