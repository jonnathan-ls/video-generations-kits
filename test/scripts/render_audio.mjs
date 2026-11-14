import {chromium} from '../node_modules/playwright-core/index.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],timeout:60000});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:4177/runs/arco-de-cunhas/animation.html');await page.waitForFunction(()=>window.motion?.ready);const data=await page.evaluate(()=>window.motion.audioWav());await writeFile(new URL('../runs/arco-de-cunhas/mix.wav',import.meta.url),Buffer.from(data,'base64'));console.log('Updated procedural mix');}finally{await browser.close();}
