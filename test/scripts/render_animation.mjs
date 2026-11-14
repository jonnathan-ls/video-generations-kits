// Dedicated local media renderer: isolated Chrome profile; no user browser/cookies.
import {chromium} from '../node_modules/playwright-core/index.mjs';
import {spawn} from 'node:child_process';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
const root=new URL('../runs/arco-de-cunhas/',import.meta.url);
const url='http://127.0.0.1:4177/runs/arco-de-cunhas/animation.html';
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'],timeout:60000});
let encoder;
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>window.motion?.ready,{timeout:30000});
 console.log('Renderer loaded',JSON.stringify(await page.evaluate(()=>window.motion.getState())));
 const audio=await page.evaluate(()=>window.motion.audioWav());await writeFile(new URL('mix.wav',root),Buffer.from(audio,'base64'));
 const frame=async t=>Buffer.from(await page.evaluate(t=>{window.motion.renderAt(t);return document.querySelector('#canvas').toDataURL('image/png').split(',')[1];},t),'base64');
 const a=await frame(14.5);await frame(3);const b=await frame(14.5);const hash=x=>createHash('sha256').update(x).digest('hex');if(hash(a)!==hash(b))throw Error('Frame depends on previous timestamp');
 console.log('Deterministic seek verified');
 await mkdir(new URL('frames/',root),{recursive:true});
 for(const t of [2.5,8,14.5,16.5,21,27.5,29.5])await writeFile(new URL(`frames/frame-${String(t).replace('.','_')}.png`,root),await frame(t));
 // Verify audible rendering and functional transport through the same UI callbacks.
 await page.getByRole('button',{name:'Reproduzir',exact:true}).click();await page.waitForTimeout(350);if(!(await page.evaluate(()=>window.motion.getState().playing)))throw Error('Play failed');
 await page.getByRole('button',{name:'Pausar',exact:true}).click();const paused=await page.evaluate(()=>window.motion.getState());await page.waitForTimeout(150);if((await page.evaluate(()=>window.motion.getState().time))!==paused.time)throw Error('Pause drift');
 await page.getByRole('button',{name:'Reiniciar',exact:true}).click();if((await page.evaluate(()=>window.motion.getState().time))!==0)throw Error('Restart failed');
 await page.getByLabel('Música',{exact:true}).uncheck();if((await page.evaluate(()=>window.motion.getState().tracks)).includes('music'))throw Error('Music toggle failed');await page.getByLabel('Música',{exact:true}).check();
 const screenshotState=await frame(14.5);await page.screenshot({path:new URL('preview-proof.jpg',root).pathname,type:'jpeg',quality:90,fullPage:true});
 const output=new URL('arco-de-cunhas-preview.mp4',root).pathname;
 encoder=spawn('/usr/bin/ffmpeg',['-hide_banner','-loglevel','warning','-y','-f','image2pipe','-framerate','30','-i','pipe:0','-i',new URL('mix.wav',root).pathname,'-map','0:v:0','-map','1:a:0','-frames:v','900','-t','30','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});
 let ffmpegLog='';encoder.stderr.on('data',d=>ffmpegLog+=d);const done=once(encoder,'close');let streamError;encoder.stdin.on('error',e=>streamError=e);
 for(let n=0;n<900;n++){
  if(streamError)throw streamError;
  const data=await frame(n/30);if(!encoder.stdin.write(data))await once(encoder.stdin,'drain');
  if(n%90===0)console.log(`Frames ${n}/900 (${(n/30).toFixed(0)}s)`);
 }
 encoder.stdin.end();const [code]=await done;if(code!==0)throw Error(`ffmpeg ${code}: ${ffmpegLog}`);
 if(errors.length)throw Error(errors.join('\n'));
 await writeFile(new URL('render-report.json',root),JSON.stringify({frames:900,fps:30,duration:30,resolution:[1920,1080],deterministicSeek:true,play:true,pause:true,restart:true,musicToggle:true,pageErrors:errors,method:'Isolated Chrome frame evaluation + FFmpeg H.264/AAC MP4; Web Audio offline synthesis',output:'arco-de-cunhas-preview.mp4',proof:'preview-proof.jpg'},null,2)+'\n');
 console.log('MP4 complete',output);
}finally{if(encoder&&encoder.exitCode===null)encoder.kill('SIGTERM');await browser.close();}
