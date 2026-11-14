import fs from 'node:fs/promises';
import path from 'node:path';
import {buildCatalog,ROOT} from '../../tools/build-catalog.mjs';

if(!process.argv.includes('--legacy-diagnostic'))throw new Error('Gerador por categorias aposentado. Use storyboard-compile.mjs com encenação autorada; --legacy-diagnostic salva somente uma comparação histórica.');

const DIR=path.dirname(new URL(import.meta.url).pathname);
const narration=JSON.parse(await fs.readFile(path.join(DIR,'voice.json'),'utf8'));
const script=JSON.parse(await fs.readFile(path.join(DIR,'script.json'),'utf8'));
const catalog=await buildCatalog();
const byId=new Map(catalog.assets.map(asset=>[asset.id,asset]));
const totalDuration=Number(narration.duration);
const scenes=[],captions=[],titleCards=[],fxCues=[];
let sceneNumber=0,lastCategory='',lastFx={};

const plain=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const aliases={
  radio:['radio','telegraf','mensagem','pedido de socorro','sinalizou','operador','silencio no radio','californian'],
  impact:['iceberg','colis','choque','bateu','rompeu','rasgou','avaria'],
  signal:['luz verde','sinal luminoso','sinal de luz','foguete','foguetes','sinalizador','luz no horizonte'],
  icefield:['gelo','ice'],
  flooding:['alag','agua','compartimento','antepara','porão','inund','vazamento','casco'],
  lifeboat:['bote','botes','remo','evacu','embarque','mulher','criança','salva-vidas','abandonar o navio','partiram','partiu','lugares vazios','vazios','afastou','afastam','afasta','lotacao'],
  rescue:['carpathia','resgate','luz verde','foguete','foguetes','flare','socorro','chegada','resgat','recolh','sobreviv'],
  engine:['maquina','caldeira','carvao','mecanico','engenheiro','motor','sala de maquinas','fornalha'],
  dining:['salao','jantar','refeicao','comida','garcom','servico','cozinha','louca'],
  cabin:['camarote','quarto','mala','bilhete','carta','cabine','pertence','passageiro','familia','emigrante'],
  documents:['inquerito','testemunh','relatorio','jornal','imprensa','investig','comissao','depoimento','conclusao','memoria'],
  port:['porto','southampton','inglaterra','nova york','new york','partiu da inglaterra','parte da inglaterra','embarque','cais'],
  voyage:['viagem','travessia','cruzar o atlantico','rota','avanca','avanç','navega','velocidade','milhas','caminho','noite segue','continua avançando'],
  deck:['convés','ponte','vigia','capitao','horizonte','noite','navio','mar','oceano']
};
function hasAny(haystack,words){return words.some(word=>haystack.includes(plain(word)));}
function categoryFor(text,chapter){const t=plain(text);
 if(hasAny(t,aliases.radio))return 'radio';
 if(hasAny(t,aliases.impact))return 'impact';
 if(hasAny(t,aliases.flooding))return 'flooding';
 if(hasAny(t,aliases.lifeboat))return 'lifeboat';
 if(hasAny(t,aliases.signal))return 'signal';
 if(hasAny(t,aliases.icefield))return 'icefield';
 if(hasAny(t,aliases.rescue))return 'rescue';
 if(hasAny(t,aliases.engine))return 'engine';
 if(hasAny(t,aliases.dining))return 'dining';
 if(hasAny(t,aliases.documents))return 'documents';
 if(hasAny(t,aliases.port))return 'port';
 if(hasAny(t,aliases.voyage))return 'voyage';
 if(hasAny(t,aliases.cabin))return 'cabin';
 return chapter===1?'voyage':'deck';
}
function isDay(chapter,text){const t=plain(text);if(/amanhe|pela manha|luz do dia|ao amanhecer|manhã/.test(t))return true;if(chapter===1||chapter>=7)return true;if(chapter===0||chapter>=2)return false;return true;}
function sceneTextClauses(text,duration){
 const clauses=String(text).match(/[^.!?;]+[.!?;]*/g)?.map(s=>s.trim()).filter(Boolean)||[String(text).trim()];
 let parts=[];
 for(const clause of clauses){
  const words=clause.split(/\s+/).filter(Boolean);
  if(words.length>17&&clause.includes(',')){let rest=clause;const chunks=rest.split(/,(?=\s)/).map(x=>x.trim()).filter(Boolean);if(chunks.length>1)parts.push(...chunks.map((x,i)=>x+(i<chunks.length-1?',':'')));else parts.push(clause);}
  else parts.push(clause);
 }
 parts=parts.filter(Boolean);
 while(parts.length>1&&duration/parts.length<1.65){let best=0,bestLen=Infinity;for(let i=0;i<parts.length-1;i++){const n=parts[i].length+parts[i+1].length;if(n<bestLen){best=i;bestLen=n;}}parts.splice(best,2,parts[best]+' '+parts[best+1]);}
 return parts.length?parts:[String(text).trim()];
}
function captionGroups(sentence){
 const words=sentence.trim().split(/\s+/);const groups=[];let current=[];
 for(const word of words){current.push(word);const length=current.join(' ').length;if(current.length>=3&&(length>=22||current.length>=5)){groups.push(current);current=[];}}
 if(current.length){if(groups.length&&current.length<3){groups[groups.length-1]=groups.at(-1).concat(current);}else groups.push(current);}
 return groups.map(g=>g.join(' '));
}
function chooseActor(category,index){
 if(category==='radio'||category==='engine')return 'worker';
 if(category==='dining')return 'steward';
 if(category==='documents')return 'seated';
 if(category==='port'||category==='voyage')return index%2?'passenger':'captain';
 return index%3===0?'captain':index%3===1?'passenger':'worker';
}
function makeUse(id,variant,position,extra={}){
 const def=byId.get(id);if(!def)throw new Error(`Catálogo sem recurso ${id}`);
 const chosen=variant||def.variants?.[0];if(chosen&&!def.variants?.includes(chosen))throw new Error(`Variação inválida ${id}:${chosen}`);
 return {id,variant:chosen,revision:def.revision,...(position?{position}:{}),...extra};
}
function cameraFor(category,index,day,shipPresent=false,text=''){
 let target,from;
 if(['radio','engine','dining','cabin','documents','flooding'].includes(category)){target=[0,1.05,0];from=category==='documents'?[2.9,2.2,3.6]:[5.3,3.6,6.7];}
 else if(category==='lifeboat'){target=[0,.85,0];from=[9.2,5.2,10.8];}
 else if(category==='port'){target=[0,15,0];from=[78,34,170];}
 else if(category==='impact'){target=[0,8,82];from=[54,22,145];}
 else if(category==='signal'){target=[12,4,55];from=[18,8,-5];}
 else if(category==='icefield'){target=[0,7,40];from=[42,15,88];}
 else if(category==='rescue'){target=[0,10,38];from=[36,18,118];}
 else if(category==='deck'&&shipPresent){target=[0,18,0];from=[9,23,13];}
 else if(shipPresent){target=[0,13,90];from=[38,24,170];}
 else{target=[0,3,35];from=[25,11,76];}
 const mode=index%5,angle=((index%9)-4)*.026,zoom=[1.13,.91,1.055,.94,1.02][mode];
 const dx=from[0]-target[0],dz=from[2]-target[2],cos=Math.cos(angle),sin=Math.sin(angle);
 const rotate=(x,z)=>[x*cos-z*sin,z*cos+x*sin];
 const start=rotate(dx*zoom,dz*zoom),finish=rotate(dx*zoom*(mode===0?.88:mode===1?1.08:.94),dz*zoom*(mode===0?.88:mode===1?1.08:.94));
 const direction=plain(text),side=index%2?1:-1,distance=Math.hypot(dx,dz);
 const lateral=mode===2?distance*.075*side:mode===4?distance*.04*side:0;
 const vertical=mode===3?-Math.max(1.5,Math.abs(from[1]-target[1])*.12):mode===4?Math.max(1.2,Math.abs(from[1]-target[1])*.08):0;
 const targetTo=[target[0]+lateral*.34,target[1]+vertical*.18,target[2]+(mode===2?distance*.018*side:((index%7)-3)*.22)];
 if(direction.includes('?'))targetTo[1]+=.28;
 return {from:[target[0]+start[0],target[1]+(from[1]-target[1])*zoom,target[2]+start[1]],to:[target[0]+finish[0]+lateral,target[1]+(from[1]-target[1])*zoom*(mode===3?.93:.955)+vertical,target[2]+finish[1]],target,targetTo,moveDuration:['impact','rescue','lifeboat'].includes(category)?3.1:4.2};
}
function makeScene({label,text,start,duration,index,chapter,role='narration'}){
 const category=categoryFor(text,chapter),day=isDay(chapter,text),interior=['radio','engine','dining','cabin','documents','flooding'].includes(category),assets=[];
 let shipPresent=false,shipTargetId=null,actorId=null,actorVariant=chooseActor(category,index),actorPosition=[0,0,0],actorAction='watch';
 if(interior){
  const room={radio:'radio_bordo_1912',engine:'maquinas_bordo_1912',dining:index%2?'cozinha_bordo_1912':'salao_bordo_1912',cabin:'alojamento_bordo_1912',documents:'alojamento_bordo_1912',flooding:index%2?'corredor_bordo_1912':'maquinas_bordo_1912'}[category];
  assets.push(makeUse(room));assets.push(makeUse('luz_interiores_bordo','padrao',null,{params:{interior:true,day}}));
  actorId='figure';actorPosition=category==='engine'?[.9,0,-.8]:category==='documents'?[0,0,.35]:[.15,0,1.05];
  actorAction=category==='radio'?'operate':category==='engine'?'operate':category==='dining'?'serve':category==='documents'?'reading':category==='flooding'?'walk':'rest';
  if(category==='radio')assets.push(makeUse('mensagem_bordo_1912','papel',[.45,.95,-.75]));
  if(category==='dining')assets.push(makeUse('servico_bordo_1912',index%2?'xicara':'bandeja',[.6,1.02,-.3]));
  if(category==='cabin')assets.push(makeUse('pertences_bordo_1912',['mala','bilhete','carta'][index%3],[.8,0,-.5]));
  if(category==='flooding')assets.push(makeUse('anteparas_bordo_1912','padrao',[-1.1,0,-1.8]));
 }else if(category==='lifeboat'){
  assets.push(makeUse('mar_cinematico',day?'day':'night',[0,-1,0]));assets.push(makeUse('iluminacao_maritima','padrao',null,{params:{day}}));
  assets.push(makeUse('bote_salvamento_1912',index%4===0?'empty':'occupied',[0,0,0]));
  if(hasAny(plain(text),['partiram','partiu','afastou','afastam','afasta']))assets.push(makeUse('afastamento_bote','padrao',null,{target:'bote_salvamento_1912',params:{origin:[0,0,0],delta:[0,0,Math.min(10,2.4*duration)],duration:Math.max(1,duration)}}));
  if(chapter>=5&&index%3===0){assets.push(makeUse('transatlantico_titanic','titanic',[0,0,-52]));shipPresent=true;}
 }else if(category==='port'){
  assets.push(makeUse('porto_maritimo_1912','padrao',[0,0,0]));assets.push(makeUse('iluminacao_maritima','padrao',null,{params:{day:true}}));
  if(index%3!==1){assets.push(makeUse('transatlantico_titanic','titanic',[0,0,0]));shipPresent=true;}
  if(shipPresent&&hasAny(plain(text),['partiu','saiu','afastou','viagem']))assets.push(makeUse('aproximacao_resgate','padrao',null,{target:'transatlantico_titanic',params:{origin:[0,0,0],delta:[0,0,Math.min(20,1.9*duration)],duration:Math.max(1,duration)}}));
  if(index%2===0){actorId='figure';actorPosition=[index%4===0?-4.8:4.8,7,2];actorAction='walk';actorVariant=index%3?'passenger':'worker';}
 }else{
  assets.push(makeUse('mar_cinematico',day?'day':'night',[0,-1,0]));assets.push(makeUse('iluminacao_maritima','padrao',null,{params:{day}}));
  if(category==='impact'){
   assets.push(makeUse('transatlantico_titanic','titanic',[0,0,0]));assets.push(makeUse('gelo_maritimo','iceberg',[0,0,120]));shipPresent=true;shipTargetId='transatlantico_titanic';
   assets.push(makeUse('vapor_bordo_1912','padrao',null,{target:shipTargetId,params:{density:.8}}));
  }else if(category==='rescue'){
   shipTargetId=hasAny(plain(text),['carpathia'])?'navio_carpathia':hasAny(plain(text),['titanic'])?'transatlantico_titanic':index%4===0?'transatlantico_titanic':'navio_carpathia';assets.push(makeUse(shipTargetId,shipTargetId==='transatlantico_titanic'?'titanic':'carpathia',[0,0,0]));shipPresent=true;
   if(index%2===0)assets.push(makeUse('sinalizador_verde','padrao',[15,5,65]));
   if(index%3===0)assets.push(makeUse('bote_salvamento_1912','occupied',[23,0,20]));
   if(shipTargetId==='navio_carpathia'&&hasAny(plain(text),['corria','avanc','muda de rumo','maior velocidade','aproximacao']))assets.push(makeUse('aproximacao_resgate','padrao',null,{target:shipTargetId,params:{origin:[0,0,0],delta:[0,0,Math.min(20,2.5*duration)],duration:Math.max(1,duration)}}));
  }else if(category==='signal'){
   assets.push(makeUse('sinalizador_verde','padrao',[12,4,55],{scale:1.45}));
   if(hasAny(plain(text),['carpathia'])){assets.push(makeUse('navio_carpathia','carpathia',[0,0,0]));shipPresent=true;}
   if(hasAny(plain(text),['bote','botes']))assets.push(makeUse('bote_salvamento_1912','occupied',[0,0,12]));
  }else if(category==='icefield'){
   assets.push(makeUse('gelo_maritimo','field',[0,0,0]));
   if(hasAny(plain(text),['carpathia'])){assets.push(makeUse('navio_carpathia','carpathia',[0,0,-42]));shipPresent=true;assets.push(makeUse('aproximacao_resgate','padrao',null,{target:'navio_carpathia',params:{origin:[0,0,-42],delta:[0,0,Math.min(14,2*duration)],duration:Math.max(1,duration)}}));}
  }else if(category==='flooding'){
   assets.push(makeUse('transatlantico_titanic','titanic',[0,0,0]));assets.push(makeUse('anteparas_bordo_1912','padrao',[0,2,0]));shipPresent=true;
  }else if(category==='voyage'){
   assets.push(makeUse('transatlantico_titanic','titanic',[0,0,0]));shipPresent=true;
   if(index%3!==1){actorId='figure';actorPosition=[index%2?-.8:.8,18,((index%7)-3)*10];actorVariant=index%2?'passenger':'steward';actorAction=index%2?'rest':'walk';}
   assets.push(makeUse('aproximacao_resgate','padrao',null,{target:'transatlantico_titanic',params:{origin:[0,0,0],delta:[0,0,Math.min(18,2.2*duration)],duration:Math.max(1,duration)}}));
   if(duration>3.5&&index%2===0)assets.push(makeUse('vapor_bordo_1912','padrao',null,{target:'transatlantico_titanic',params:{position:[-4,30,-18]}}));
  }else if(category==='deck'){
   if(index%3===0){assets.push(makeUse('ponte_observacao_maritima','padrao',[0,0,0]));actorId='figure';actorPosition=[-.5,0,1.38];actorVariant='captain';}
   else{assets.push(makeUse('transatlantico_titanic','titanic',[0,0,0]));shipPresent=true;actorId=index%4===1?'figure':null;actorPosition=[index%2?-.8:.8,18,0];if(hasAny(plain(text),['pessoas','passageiros','famílias','familias','emigrantes']))assets.push(makeUse('pessoas_maritimas_1912','passengers',[0,18,10],{scale:2.1}));}
  }else{
   if(index%3===0){assets.push(makeUse('gelo_maritimo','field',[0,0,0]));}
   else if(index%3===1){assets.push(makeUse('transatlantico_titanic','titanic',[0,0,0]));shipPresent=true;}
   else{assets.push(makeUse('navio_carpathia','carpathia',[0,0,0]));shipPresent=true;}
  }
 }
 if(actorId){assets.push(makeUse('pessoas_maritimas_1912',actorVariant,actorPosition,{instanceId:actorId,rotation:(index%2?1:-1)*(8+(index%4)*8)}));assets.push(makeUse('acoes_bordo_1912','padrao',null,{target:actorId,params:{action:actorAction,origin:actorPosition,speed:.42,reading:actorAction==='reading',lookOut:index%2===0}}));}
 if(category==='rescue'&&shipTargetId&&index%4===1){assets.push(makeUse('aproximacao_resgate','padrao',null,{target:shipTargetId,params:{origin:[0,0,0],delta:[0,0,6],duration:Math.max(3,duration)}}));}
 if(role==='chapter'&&category!=='port'&&category!=='voyage'&&assets.length<4){assets.push(makeUse('sinalizador_verde','padrao',[12,4,80]));}
 const hasTitanic=assets.some(a=>a.id==='transatlantico_titanic');
 const camera=cameraFor(category,index,day,hasTitanic||shipPresent,text);
 const id=`shot-${String(++sceneNumber).padStart(3,'0')}-${category}`;
 const action=category==='impact'?'A colisão é encenada em corte lateral: iceberg, casco e água separados para manter escala e causa legíveis.':category==='radio'?'O pedido de socorro aparece como trabalho de bordo: operador, equipamento e mensagem, sem diálogo histórico inventado.':category==='lifeboat'?'O quadro muda do convés para a escala humana do bote, com espaço vazio e água visível ao redor.':category==='rescue'?'Navios e botes permanecem separados no horizonte enquanto a luz e o deslocamento organizam a leitura do resgate.':category==='documents'?'A consequência histórica entra por papel, testemunho e registro, não por fala fabricada.':`A narração avança para ${category}; o enquadramento muda de distância e eixo para que a nova cena não repita a anterior.`;
 const shot={id,start,duration,label,assets,camera,explanation:text,action,sourceText:text,sourceChapter:chapter,visualCategory:category};
 scenes.push(shot);
 if(category!==lastCategory){
  if(start>1.2&&['radio','impact','lifeboat','rescue','documents','port'].includes(category))pushFx(start,category==='documents'?'som_bordo_papel':category==='port'?'som_bordo_porto':category==='radio'?'som_bordo_radio':'som_bordo_editorial',category==='impact'?1.1:1.45,category==='impact'?.38:.16);
  lastCategory=category;
 }
 if(category==='engine'&&start-(lastFx.engine??-20)>18){pushFx(start+.35,'som_bordo_maquinas',2.4,.13);lastFx.engine=start;}
 if(category==='radio'&&start-(lastFx.radio??-20)>13){pushFx(start+.25,'som_bordo_radio',2.1,.12);lastFx.radio=start;}
 if(category==='dining'&&start-(lastFx.dining??-20)>21){pushFx(start+.25,'som_bordo_servico',1.6,.11);lastFx.dining=start;}
 if(category==='documents'&&start-(lastFx.paper??-20)>15){pushFx(start+.2,'som_bordo_papel',1.2,.1);lastFx.paper=start;}
 if(role==='chapter')pushFx(start+.08,'som_bordo_editorial',1.5,.22);
 return shot;
}
function pushFx(time,assetId,duration,volume){const def=byId.get(assetId);if(!def?.sound)return;fxCues.push({assetId,revision:def.revision,time:Number(time.toFixed(3)),duration,volume});}
function makeHookScene({label,text,start,duration,assets,camera,action,index}){
 const shot={id:`shot-${String(++sceneNumber).padStart(3,'0')}-hook`,start,duration,label,assets,camera,explanation:text,action,sourceText:text,sourceChapter:0,visualCategory:'hook',sourceParagraph:1,sourceClause:index+1};
 scenes.push(shot);return shot;
}
function addCaptions(text,start,end,globalEnd){
 const groups=captionGroups(text);if(!groups.length)return;
 const weights=groups.map(g=>Math.max(2,g.replace(/[^\p{L}\p{N}]+/gu,'').length));const sum=weights.reduce((a,b)=>a+b,0);let elapsed=0;
 for(let i=0;i<groups.length;i++){
  const t0=start+(end-start)*elapsed/sum;elapsed+=weights[i];const t1=i===groups.length-1?end:start+(end-start)*elapsed/sum;
  const isQuestion=/\?\s*$/.test(groups[i])||(/\?\s*$/.test(text)&&i===groups.length-1);
  const impact=/titanic|carpathia|iceberg|luz verde|duas mil|1\.178|mais de mil|vazio|711|712|californian|socorro|2h40|duas horas|sobreviv/.test(plain(groups[i]));
  captions.push({start:Number(t0.toFixed(4)),duration:Number(Math.max(.27,Math.min(globalEnd-t0,t1-t0)).toFixed(4)),text:groups[i].toLocaleUpperCase('pt-BR'),kind:isQuestion?'question':impact?'impact':'plain'});
 }
}

for(let i=0;i<script.length;i++){
 const entry=script[i],timing=narration.segments[i];if(!timing)throw new Error(`Falta timing para o parágrafo ${i}`);
 if(entry.kind==='chapter'){
  const next=script.slice(i+1).find(x=>x.kind==='narration')?.text||'';
  const title=entry.text;
  const backdrop=makeScene({label:`Pausa de capítulo — ${title}`,text:next||title,start:timing.start,duration:timing.end-timing.start,index:i,chapter:entry.chapter,role:'chapter'});
  titleCards.push({start:timing.start,duration:timing.end-timing.start,chapter:entry.chapter,title:title.toLocaleUpperCase('pt-BR'),eyebrow:`CAPÍTULO ${String(entry.chapter).padStart(2,'0')}`});
  continue;
 }
 const text=entry.text,duration=timing.end-timing.start,clauses=sceneTextClauses(text,duration);
 if(i===0){
  const holdEnd=Math.max(timing.end,narration.segments[i+1]?.start??timing.end);
  const openingDuration=holdEnd-timing.start;
  const observer=()=>makeUse('pessoas_maritimas_1912','captain',[.78,0,1.38],{instanceId:'observer'});
  const orient=offset=>makeUse('orientacao_observador','padrao',null,{target:'observer',timeOffset:offset,params:{fromYaw:-.25,turn:.5,start:.4,duration:1.7}});
  const ocean=()=>makeUse('atlantico_noturno','padrao');
  const light=params=>makeUse('iluminacao_maritima','padrao',null,{params:{keyPosition:[4,6,6],fill:.72,key:1.55,...params}});
  const openingAssets=[ocean(),light({}),makeUse('ponte_observacao_maritima','padrao'),observer(),orient(0)];
  const opening=[
   {label:'O vigia percebe a luz',start:timing.start,duration:1.65,assets:[...openingAssets,makeUse('sinalizador_verde','padrao',[12,4,55],{scale:3.15,timeOffset:.05})],camera:{from:[.35,1.8,-3.2],to:[.20,1.8,-2.4],target:[12,2.3,55],targetTo:[12,2.3,55],moveDuration:1.35},action:'Plano sobre o ombro: o oficial e o sinal aparecem juntos desde o primeiro instante; a luz cresce sem revelar quem a lançou.'},
   {label:'O sinal corta a escuridão',start:timing.start+1.65,duration:1.2,assets:[ocean(),light({}),makeUse('sinalizador_verde','padrao',[12,4,55],{scale:2.45,timeOffset:.65})],camera:{from:[12,4,40],to:[12,4,43],target:[12,4,55],targetTo:[12,4.1,55],moveDuration:1.0},action:'Insert do sinal: o núcleo, o halo e a trilha ficam legíveis contra o horizonte; a câmera aproxima enquanto a luz se dissipa.'},
   {label:'A reação do oficial',start:timing.start+2.85,duration:1.55,assets:openingAssets.map(a=>a.id==='orientacao_observador'?orient(4.75):a),camera:{from:[3.08,1.94,2.72],to:[1.78,1.82,2.42],target:[.78,1.56,1.38],targetTo:[.80,1.62,1.38],moveDuration:1.25},action:'Volta ao rosto: a cabeça e os ombros viram-se para o sinal; atuação ilustrativa, sem fala ou gesto atribuído como testemunho literal.'},
   {label:'A resposta do Carpathia',start:timing.start+4.4,duration:Math.max(.1,openingDuration-4.4),assets:[ocean(),light({}),makeUse('gelo_maritimo','field',[0,0,0]),makeUse('navio_carpathia','carpathia',[0,0,0]),makeUse('aproximacao_resgate','padrao',null,{target:'navio_carpathia',params:{origin:[0,0,0],delta:[0,0,14],duration:Math.max(1,openingDuration-4.4)}}),makeUse('vapor_bordo_1912','padrao',null,{target:'navio_carpathia',params:{position:[-4,24,-18]}})],camera:{from:[36,18,118],to:[28,16,100],target:[0,10,35],targetTo:[0,10,35],moveDuration:2.4},action:'A escala se abre para o Carpathia em movimento entre blocos de gelo; o corte transforma o sinal em deslocamento de resgate.'}
  ];
  opening.forEach((beat,index)=>makeHookScene({label:beat.label,text:entry.text,start:beat.start,duration:beat.duration,assets:beat.assets,camera:beat.camera,action:beat.action,index}));
  pushFx(timing.start+.35,'som_bordo_editorial',1.1,.13);pushFx(timing.start+1.68,'som_bordo_editorial',1.1,.19);pushFx(timing.start+4.48,'som_bordo_editorial',1.5,.17);
  addCaptions(entry.text,timing.start,timing.end,timing.end);
  continue;
 }
 const weights=clauses.map(c=>Math.max(1,c.replace(/[^\p{L}\p{N}]+/gu,'').length));const total=weights.reduce((a,b)=>a+b,0);let used=0;
 for(let j=0;j<clauses.length;j++){
  const localStart=timing.start+duration*used/total;used+=weights[j];const localEnd=j===clauses.length-1?timing.end:timing.start+duration*used/total;
  const tail=j===clauses.length-1?Math.max(0,(narration.segments[i+1]?.start??totalDuration)-timing.end):0;
  const shotDuration=localEnd-localStart+tail;
  const shot=makeScene({label:`${String(i+1).padStart(3,'0')}.${String(j+1).padStart(2,'0')} · ${clauses[j].slice(0,64)}`,text:clauses[j],start:localStart,duration:shotDuration,index:i*4+j,chapter:entry.chapter});
  addCaptions(clauses[j],localStart,localEnd,localEnd);
  shot.sourceParagraph=i+1;shot.sourceClause=j+1;
 }
}
for(let at=0;at<totalDuration;at+=22)pushFx(at,'ambiencia_mar_calmo',Math.min(24,totalDuration-at),.035);
const finalSpokenEnd=[...narration.segments].reverse().find(segment=>segment.kind==='narration')?.end??totalDuration-3.55;
const endCardStart=Math.max(0,Math.min(totalDuration-.5,finalSpokenEnd));
titleCards.push({start:endCardStart,duration:Math.max(.5,totalDuration-endCardStart),chapter:10,eyebrow:'DOCUMENTOS HISTÓRICOS',title:'INQUÉRITOS BRITÂNICO E AMERICANO · 1912',subtitle:'Reconstrução baseada em registros da época.'});
scenes.sort((a,b)=>a.start-b.start);captions.sort((a,b)=>a.start-b.start);titleCards.sort((a,b)=>a.start-b.start);fxCues.sort((a,b)=>a.time-b.time);

const plan=JSON.parse(await fs.readFile(path.join(DIR,'asset-plan.json'),'utf8'));
const project={schemaVersion:1,id:'titanic-completo',title:'Titanic — a noite do naufrágio e do resgate',width:1920,height:1080,fps:24,duration:totalDuration,renderLook:'cinematic-pbr',assetPlan:{reviewed:false,unresolved:['Revisão visual em cena; recursos recém-compostos permanecem sem aprovação humana.']},voice:{id:narration.voice,approved:true,source:'audio/master.wav',timingSource:'voice.json · timing por parágrafo da síntese, com grupos de legenda distribuídos pela duração fonética estimada; sem ASR de palavras'},audio:{voice:'audio/master.wav',events:[]},soundDesign:{method:'mix local, voz original + ambiência oceânica em janelas de baixo ganho + Foley pontual sincronizado a ações e viradas; sem música de biblioteca.',cues:fxCues,source:'audio/master.wav'},scenes,captions,titleCards,fonts:[{family:'DejaVu Sans Condensed',source:'fonts/DejaVuSansCondensed-Bold.ttf',weight:'700 900'},{family:'DejaVu Sans',source:'fonts/DejaVuSans.ttf',weight:'400 600'}],captionStyle:{y:900,fontSize:66,fontWeight:900,maxWidth:1460,fontFamily:'DejaVu Sans Condensed, Arial, sans-serif'},qaSources:['build-film.mjs','build-film-audio.py','kit/engine/composition.js','kit/tools/export-hyperframes.mjs','voice.json','narration.txt','asset-plan.json']};
if(plan.narrationHash!==narration.narrationHash&&plan.narrationHash!==undefined)console.warn('A impressão digital do plano léxico é registrada separadamente da síntese.');
await fs.writeFile(path.join(DIR,'project-legacy-diagnostic.json'),JSON.stringify(project,null,2)+'\n');
console.log(JSON.stringify({duration:totalDuration,scenes:scenes.length,captions:captions.length,titleCards:titleCards.length,fxCues:fxCues.length,categories:[...new Set(scenes.map(x=>x.visualCategory))]},null,2));
