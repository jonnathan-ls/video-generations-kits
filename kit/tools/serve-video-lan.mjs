import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {localPath} from '../integrations/wan2gp/adapter.mjs';

// Compartilhamento somente dos vídeos de comparação solicitados. Não expõe o Studio,
// arquivos arbitrários, APIs de aprovação, dependências ou a árvore do projeto.
const host=process.argv[2]||'127.0.0.1',port=Number(process.argv[3]||4180);
if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)||host.split('.').some(n=>Number(n)>255)||!Number.isInteger(port)||port<1||port>65535)
  throw new Error('Endereço IPv4 ou porta inválida.');
const base='kit/projects/arco-alvenaria-wan2gp';
const files=new Map([
  ['/',[`${base}/mobile-player/index.html`,'text/html; charset=utf-8']],
  ['/livre/',[`${base}/mobile-player/livre.html`,'text/html; charset=utf-8']],
  ['/livre-comparacao.mp4',['kit/projects/arco-alvenaria-wan2gp-livre/render/comparison-internal.mp4','video/mp4']],
  ['/livre-short.mp4',['kit/projects/arco-alvenaria-wan2gp-livre/render/wan2gp-internal.mp4','video/mp4']],
  ['/livre-poster.jpg',[`${base}/mobile-player/livre-poster.jpg`,'image/jpeg']],
  ['/player.css',[`${base}/mobile-player/player.css`,'text/css; charset=utf-8']],
  ['/player.js',[`${base}/mobile-player/player.js`,'text/javascript; charset=utf-8']],
  ['/poster.jpg',[`${base}/mobile-player/poster.jpg`,'image/jpeg']],
  ['/comparacao.mp4',[`${base}/render/comparison-internal.mp4`,'video/mp4']],
  ['/short.mp4',[`${base}/render/wan2gp-internal.mp4`,'video/mp4']],
]);
const server=http.createServer(async(req,res)=>{
  try {
    if(req.headers.host!==`${host}:${port}`) {res.writeHead(403).end();return;}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
    const entry=files.get(new URL(req.url,`http://${host}:${port}`).pathname);
    if(!entry){res.writeHead(404).end();return;}
    const [name,type]=entry,file=localPath(name),stat=await fs.stat(file);
    const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
      'Content-Security-Policy':"default-src 'self'; media-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      if(!match[1])start=Math.max(0,stat.size-Number(match[2]));
      else {start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),end);}
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    res.writeHead(status,{...headers,'Content-Length':end-start+1});
    if(req.method==='HEAD')res.end();
    else {const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);}
  } catch(error){if(!res.headersSent)res.writeHead(error.code==='ENOENT'?404:500).end();else res.destroy();}
});
server.listen(port,host,()=>console.log(`Vídeos · http://${host}:${port}/`));
