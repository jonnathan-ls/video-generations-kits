import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {surface} from './period-surface-materials.js';
import {mesh,beam} from './maritime-shapes.js';

let chartMap,dialMap;
export async function prepare(){
 if(chartMap||typeof document==='undefined')return;
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1024;const c=canvas.getContext('2d');c.fillStyle='#e3d4b4';c.fillRect(0,0,1536,1024);
 for(let i=0;i<12000;i++){const x=(i*137.507)%1536,y=(i*73.831)%1024;c.fillStyle=`rgba(82,62,40,${.015+(i%7)*.004})`;c.fillRect(x,y,1+(i%3),1);}
 c.strokeStyle='#928c73';c.lineWidth=1;for(let x=70;x<1500;x+=90){c.beginPath();c.moveTo(x,45);c.lineTo(x,980);c.stroke();}for(let y=70;y<1000;y+=90){c.beginPath();c.moveTo(45,y);c.lineTo(1490,y);c.stroke();}
 c.fillStyle='#b3ab85';c.strokeStyle='#77775f';c.lineWidth=3;
 for(const points of [[[110,100],[390,150],[330,290],[455,400],[350,560],[170,720],[100,920]],[[1310,100],[1190,180],[1290,290],[1180,420],[1350,610],[1450,920],[1500,100]]]){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();}
 c.fillStyle='#434b49';c.font='600 31px Georgia';c.fillText('ATLÂNTICO NORTE',520,170);c.font='23px Georgia';c.fillText('NOVA YORK',205,625);c.fillText('INGLATERRA',1190,325);c.font='18px sans-serif';c.fillText('ROTA ILUSTRATIVA • SEM ESCALA',510,945);
 c.setLineDash([12,12]);c.strokeStyle='#b45332';c.lineWidth=5;c.beginPath();c.moveTo(1200,380);c.bezierCurveTo(850,340,620,470,350,570);c.stroke();
 chartMap=new THREE.CanvasTexture(canvas);chartMap.colorSpace=THREE.SRGBColorSpace;chartMap.anisotropy=8;
 const face=document.createElement('canvas');face.width=face.height=1024;const f=face.getContext('2d');f.fillStyle='#ede4ce';f.fillRect(0,0,1024,1024);f.translate(512,512);f.strokeStyle='#323937';for(let i=0;i<60;i++){const a=i*Math.PI/30;f.lineWidth=i%5?3:8;f.beginPath();f.moveTo(Math.sin(a)*(i%5?433:410),-Math.cos(a)*(i%5?433:410));f.lineTo(Math.sin(a)*463,-Math.cos(a)*463);f.stroke();}f.font='54px Georgia';f.textAlign='center';f.textBaseline='middle';f.fillStyle='#303b3e';for(let i=1;i<=12;i++)f.fillText(String(i),Math.sin(i*Math.PI/6)*355,-Math.cos(i*Math.PI/6)*355);f.font='21px Georgia';f.fillText('CRONÔMETRO',0,-135);dialMap=new THREE.CanvasTexture(face);dialMap.colorSpace=THREE.SRGBColorSpace;dialMap.anisotropy=8;
}
function box(r,name,size,pos,material){return mesh(r,new RoundedBoxGeometry(...size,2,.012),material,pos,name);}
function table(r){const wood=surface('wood');box(r,'desk-top',[2.7,.14,1.9],[0,.92,0],wood);for(const x of [-1.1,1.1])for(const z of [-.75,.75])box(r,'desk-leg',[.12,.85,.12],[x,.42,z],wood);}
export function create({variant='route-chart',params={}}={}){
 const root=new THREE.Group(),brass=surface('brass'),iron=surface('iron');if(params.table!==false)table(root);
 if(variant==='route-chart'){
  const paper=mesh(root,new THREE.PlaneGeometry(2.3,1.6),new THREE.MeshStandardMaterial({color:chartMap?'#ffffff':'#ddcfaa',map:chartMap||null,roughness:.88}),[0,1.002,0],'route-chart');paper.rotation.x=-Math.PI/2;
  const marker=mesh(root,new THREE.SphereGeometry(.028,20,12),new THREE.MeshStandardMaterial({color:'#d38c42',emissive:'#bd5f25',emissiveIntensity:.5,metalness:.5,roughness:.4}),[.65,1.04,-.19],'route-marker');
  const ruler=box(root,'ruler',[1.3,.025,.055],[-.18,1.03,.65],brass);ruler.rotation.y=-.08;
  for(let i=0;i<30;i++)box(root,'ruler-tick',[.007,.002,i%5?.02:.04],[-.8+i*.04,1.045,.65],iron);
  const compass=new THREE.Group();compass.position.set(-.95,1.035,-.67);compass.rotation.x=-Math.PI/2;root.add(compass);mesh(compass,new THREE.CylinderGeometry(.12,.12,.04,48),brass).rotation.x=Math.PI/2;const needle=box(compass,'compass-needle',[.014,.17,.008],[0,0,.028],iron);needle.rotation.z=.28;
  const dividers=new THREE.Group();dividers.name='dividers';dividers.position.set(.86,1.04,.42);root.add(dividers);for(const side of [-1,1])beam(dividers,[0,0,0],[side*.12,.01,.42],.009,brass);
 }else if(variant==='chronometer'){
  mesh(root,new THREE.CylinderGeometry(.52,.54,.15,64),brass,[0,1.1,0],'clock-case');const face=mesh(root,new THREE.CircleGeometry(.48,64),new THREE.MeshStandardMaterial({color:dialMap?'#ffffff':'#ede4ce',map:dialMap||null,roughness:.62}),[0,1.18,0]);face.rotation.x=-Math.PI/2;
  for(const [name,length,width,angle]of [['hour-hand',.26,.025,(params.hour??11)*Math.PI/6],['minute-hand',.38,.015,(params.minute??40)*Math.PI/30]]){const hand=new THREE.Group();hand.name=name;hand.position.set(0,1.194,0);hand.rotation.y=angle;root.add(hand);box(hand,'clock-hand',[width,.006,length],[0,0,-length/2+.035],iron);}mesh(root,new THREE.SphereGeometry(.035,16,10),brass,[0,1.208,0]);
  const second=new THREE.Group();second.name='second-hand';second.position.set(0,1.203,0);root.add(second);box(second,'seconds-hand',[.007,.004,.41],[0,0,-.17],new THREE.MeshStandardMaterial({color:'#a84e35',roughness:.5}));root.userData.sample=t=>{second.rotation.y=(params.second??12)*Math.PI/30+t*Math.PI/30;};root.userData.sample(0);
 }else{
  box(root,'telegraph-base',[.65,.08,.5],[0,1.03,0],brass);beam(root,[0,1.05,0],[0,1.72,0],.075,brass);const dial=mesh(root,new THREE.CylinderGeometry(.38,.38,.1,64),brass,[0,1.72,0],'telegraph-dial');dial.rotation.x=Math.PI/2;
  const face=mesh(root,new THREE.CircleGeometry(.33,64),new THREE.MeshStandardMaterial({color:'#e7ddc3',roughness:.55}),[0,1.72,.058]);for(let i=0;i<13;i++){const a=(i-6)*.21;box(root,'engine-order-mark',[.012,.05,.004],[Math.sin(a)*.285,1.72+Math.cos(a)*.285,.065],iron).rotation.z=-a;}
  const handle=new THREE.Group();handle.name='telegraph-handle';handle.position.set(0,1.72,.12);root.add(handle);beam(handle,[0,0,0],[0,.43,0],.018,brass);box(handle,'hand-grip',[.22,.05,.06],[0,.43,0],surface('wood'));mesh(root,new THREE.SphereGeometry(.045,20,12),brass,[0,1.72,.14]);
 }
 return root;
}
