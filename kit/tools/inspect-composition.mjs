import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';import path from 'node:path';
const [url,projectFile,output]=process.argv.slice(2);if(!output)throw Error('url project.json output');
const project=JSON.parse(await fs.readFile(projectFile,'utf8'));await fs.mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=gl','--enable-gpu','--autoplay-policy=no-user-gesture-required'],userDataDir:path.join('/tmp','titanic-visual-qa-'+process.pid)});
const page=await browser.newPage();await page.setViewport({width:960,height:650});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(url,{waitUntil:'networkidle0',timeout:120000});await page.waitForFunction(()=>window.__hf?.reviewControls,{timeout:120000});
await page.addStyleTag({content:'#scene-plan,#review-tools,#preview-stamp{display:none!important}'});
const gpu=await page.evaluate(()=>{const r=window.__hf.preview.player.renderer;r.setSize(960,540,false);const gl=r.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});console.log(JSON.stringify({gpu,scenes:project.scenes.length}));
const records=[];for(const [i,scene]of project.scenes.entries()){
 const item={id:scene.id,start:scene.start,duration:scene.duration,frames:[],errors:[]};
 for(const [name,u]of [['preparation',.03],['action',.5],['result',.96]]){
  const t=scene.start+scene.duration*u;try{await page.evaluate(time=>window.__hf.reviewControls.seekTo(time),t);await page.evaluate(()=>new Promise(requestAnimationFrame));const filename=path.join(output,`${String(i).padStart(3,'0')}-${name}.jpg`);await (await page.$('#root')).screenshot({path:filename,type:'jpeg',quality:78});item.frames.push({name,time:t,path:filename});}catch(e){item.errors.push(e.message);}
 }
 records.push(item);if(i%12===0){await fs.writeFile(path.join(output,'coverage.json'),JSON.stringify({status:'not-verified',kind:'static-checkpoints-not-motion-pass',gpu,errors,records},null,2));console.log(JSON.stringify({completed:i+1,total:project.scenes.length,id:scene.id,errors:item.errors}));}
}await fs.writeFile(path.join(output,'coverage.json'),JSON.stringify({status:'not-verified',kind:'static-checkpoints-not-motion-pass',gpu,errors,records},null,2));await browser.close();console.log('CHECKPOINTS_COMPLETE');
