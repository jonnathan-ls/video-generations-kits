import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const P = ['#bf8e62', '#66847e', '#c6b27e', '#70828b', '#8c5e4d', '#d6cfbb'];
const m = (color, roughness = .76, metalness = .04, emissive = '#000000') => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive === '#000000' ? 0 : .12 });
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { const u = clamp(x); return u * u * (3 - 2 * u); };
const box = (g, size, pos, color, options = {}) => {
  const geometry = options.round ? new RoundedBoxGeometry(...size, 3, Math.min(options.round, size[0] * .15, size[1] * .15, size[2] * .15)) : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, m(color, options.roughness ?? .76, options.metalness ?? .04, options.emissive));
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
};
const sphere = (g, radius, pos, color, options = {}) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), m(color, options.roughness ?? .65, options.metalness ?? .03, options.emissive));
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
};
const cylinder = (g, rt, rb, h, pos, color, options = {}) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), m(color, options.roughness ?? .7, options.metalness ?? .04, options.emissive));
  mesh.position.set(...pos); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
};
const line = (g, pts, color = '#bdd1be', radius = .035) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 7, false), m(color, .42, .08, color));
  mesh.castShadow = false; g.add(mesh); mesh.userData.curve = curve; return mesh;
};
function figure(g, pos, color, scale = 1) {
  const root = new THREE.Group(); root.position.set(...pos); root.scale.setScalar(scale); g.add(root);
  box(root, [.38,.58,.24], [0,.94,0], color, { round:.07, roughness:.72 });
  sphere(root,.145,[0,1.36,0],'#b98d72',{roughness:.72});
  const legs=[];
  for(const x of [-.105,.105]) { const leg=box(root,[.105,.56,.13],[x,.36,.01],'#333d3e',{round:.03}); legs.push(leg); }
  for(const x of [-.245,.245]) box(root,[.09,.48,.12],[x,.98,0],color,{round:.035});
  return {root,legs};
}
function computer(g, pos, variant = 'microcomputer', accent = P[1]) {
  const root = new THREE.Group(); root.position.set(...pos); g.add(root);
  const isKit = /kit|assembled/.test(variant), isWide = /16|wide/.test(variant);
  const width = isWide ? 1.9 : 1.5;
  const body = box(root,[width,.27,.83],[0,.39,.2],isKit?'#c8bea6':'#aaa894',{round:.07,roughness:.62});
  box(root,[width*.75,.84,.18],[0,.93,-.1],'#252e32',{round:.06,roughness:.36,metalness:.12});
  const screen = box(root,[width*.62,.58,.035],[0,.94,.005],accent,{round:.025,roughness:.28,emissive:accent});
  box(root,[width*.8,.07,.36],[0,.55,.63],'#c8bea6',{round:.02,roughness:.76});
  for(let i=0;i<12;i++) box(root,[.06,.018,.05],[-width*.32+(i%6)*width*.128,.60,.53+Math.floor(i/6)*.13],i%5?'#596261':'#ded5c1');
  cylinder(root,.055,.055,.11,[width*.36,.34,.38],'#72756d',{metalness:.18});
  return {root,body,screen};
}
function building(g, x, z, w, d, h, color, windows = true) {
  const group = new THREE.Group(); group.position.set(x,h/2+.04,z); g.add(group);
  const body = box(group,[w,h,d],[0,0,0],color,{round:.045,roughness:.86}); body.userData.body = true;
  box(group,[w+.08,.065,d+.08],[0,h/2+.03,0],'#c6bda7',{round:.025,roughness:.68});
  if(windows) for(let row=0;row<Math.max(1,Math.floor(h/.72));row++) for(let col=0;col<Math.max(1,Math.floor(w/.48));col++) {
    box(group,[.18,.22,.025],[(-w*.32)+col*.43,-h*.32+row*.64,d/2+.025],(row+col)%4===0?'#c7ad76':'#6d938b');
  }
  group.userData.finalHeight=h; return group;
}
function desk(g, x, z, width = 2.3) {
  box(g,[width,.13,1.15],[x,.85,z],'#baa98b',{round:.04,roughness:.72});
  for(const dx of [-width*.42,width*.42]) box(g,[.12,.7,.12],[x+dx,.39,z],'#414d4e',{round:.02});
}
function grid(g, size = 12, count = 14) {
  for(let i=-count/2;i<=count/2;i++) {
    line(g,[[i*size/count,.035,-size/2],[i*size/count,.035,size/2]],'#355350',.007);
    line(g,[[-size/2,.035,i*size/count],[size/2,.035,i*size/count]],'#355350',.007);
  }
}
function city(g, seed=0, heights=[]) {
  grid(g,13,16); const blocks=[];
  for(let i=0;i<10;i++) {
    const col=i%5,row=Math.floor(i/5),x=-5+col*2.5,z=-2.7+row*4.5,h=heights[i]||1.25+((seed+i*3)%5)*.5;
    blocks.push(building(g,x,z,.9+(i%3)*.17,.85,h,P[(i+seed)%P.length],i%2===0));
  }
  line(g,[[-6.1,.09,-.45],[6.1,.09,-.45]],'#9e957d',.23);
  line(g,[[-1.4,.1,-6.1],[-1.4,.1,6.1]],'#9e957d',.2);
  return blocks;
}
function card(g, x, z, color = '#d1c7b2', w = 2.8, h = 1.9) {
  const root = new THREE.Group(); root.position.set(x,2.1,z); g.add(root);
  box(root,[w,h,.12],[0,0,0],'#202a2c',{round:.06,metalness:.18});
  box(root,[w-.18,h-.18,.03],[0,0,.08],color,{roughness:.92});
  box(root,[w-.44,.075,.03],[0,h*.28,.11],'#9c7d53');
  for(let i=0;i<4;i++) box(root,[w*.66-(i%2)*.3,.035,.025],[0,h*.07-i*.21,.11],'#687170');
  return root;
}
function roundedBase(g, w=12, d=10, color='#1c282c') {
  const plinth=box(g,[w,.16,d],[0,.08,0],color,{round:.1,roughness:.66,metalness:.12});
  for(const x of [-w/2+.18,w/2-.18]) for(const z of [-d/2+.18,d/2-.18]) sphere(g,.045,[x,.015,z],'#bca36d',{emissive:'#bca36d',roughness:.3});
  return plinth;
}

export function createRockstarAsset(id, { variant = 'padrao' } = {}) {
  const root=new THREE.Group(); root.name=`rockstar:${id}:${variant}`; roundedBase(root);
  const animate=[];
  const lift=(obj,delay=0,duration=1.2,from=-.9)=>{const y=obj.position.y;animate.push(t=>{obj.position.y=y+from*(1-ease((t-delay)/duration));});};
  const scaleIn=(obj,delay=0,duration=1.1)=>{const base=obj.scale.clone();animate.push(t=>{const p=.025+.975*ease((t-delay)/duration);obj.scale.set(base.x*p,base.y*p,base.z*p);});};

  if(id==='retro-computers') {
    const unit=computer(root,[0,.15,0],variant,variant==='16-bit'?'#658d91':'#73938b');
    box(root,[2.5,.09,1.3],[0,.17,0],'#c7b798',{round:.04});
    if(/kit|assembled/.test(variant)) {
      const parts=[];for(let i=0;i<8;i++){const part=box(root,[.48,.12,.38],[-3.2+(i%4)*1.1,1.0+(i%2)*.12,-1.1+Math.floor(i/4)*.6],i%2?'#c7bea6':'#777d79',{round:.025});parts.push(part);}
      animate.push(t=>parts.forEach((p,i)=>{const u=ease((t-1.0-i*.08)/2.0);p.position.set(mix(-3.2+(i%4)*1.1, -1.4+(i%3)*.5,u),mix(1.0+(i%2)*.12,.65,u),mix(-1.1+Math.floor(i/4)*.6,.45,u));p.rotation.y=(1-u)*.28;}));
    }
    unit.screen.userData.sample=t=>{unit.screen.material.emissiveIntensity=.02+.14*ease((t-.5)/.8);};
    animate.push(t=>unit.screen.userData.sample(t));
  } else if(id==='programming-club-scene') {
    box(root,[10,.16,7],[0,.12,-.3],'#3b4b4b',{rough:.9});
    for(let i=0;i<4;i++){const x=-3.8+(i%2)*7.5,z=-1.55+Math.floor(i/2)*2.7;desk(root,x,z,2.3);computer(root,[x,.15,z-.28],i===0?'shared-apple':'microcomputer',P[(i+1)%P.length]);}
    const people=[figure(root,[-4.3,.13,2.4],P[0],.74),figure(root,[3.8,.13,2.4],P[2],.74)];
    const demo=line(root,[[-3,.1,-2.8],[-1.2,1.8,-2.8],[0,1.5,-2.8],[1.2,2.0,-2.8],[3,.1,-2.8]],'#d5b86f',.05);
    animate.push(t=>{people.forEach((p,i)=>{p.root.rotation.y=Math.sin(t*1.8+i)*.08;p.root.position.y=.13+.02*Math.sin(t*2+i);});demo.material.emissiveIntensity=.04+.18*ease((t-1)/1.5);});
  } else if(id==='period-computing-light') {
    box(root,[8,.18,6],[0,.15,0],'#3b494a',{round:.06});
    const fixtures=[];
    for(let i=0;i<3;i++){const x=-3+i*3;box(root,[.72,.12,.42],[x,4.9,-1.6],'#b49c70',{round:.045,metalness:.2});const light=new THREE.PointLight(i===1?'#ead9af':'#d9cfac',1.2,8,2);light.position.set(x,4.55,-1.55);root.add(light);fixtures.push(light);}
    animate.push(t=>fixtures.forEach((l,i)=>l.intensity=1.0+.12*Math.sin(t*1.4+i*.7)));
  } else if(id==='retro-computer-material') {
    const variants=[['#bdb49e','#3b4140','#b39160'],['#c7c5b3','#4d7376','#d7cfbd'],['#9f9d8e','#34454a','#82745b']];
    const choice=variant==='crt-glass'?1:variant==='technical-paper'?2:0,colors=variants[choice];
    for(let i=0;i<3;i++){const x=-3.4+i*3.4;box(root,[2.65,.22,2.4],[x,.18,0],'#465457',{round:.07});box(root,[2.3,.15,2.05],[x,.37,0],colors[i],{round:.035,roughness:i===1?.22:.78,metalness:i===1?.14:.02});}
  } else if(id==='history-timeline-overlay') {
    for(let row=0;row<3;row++){
      line(root,[[-5.2,.2,-2.8+row*2.7],[5.2,.2,-2.8+row*2.7]],row===1?'#c6aa68':'#698d83',.035);
      for(let i=0;i<5;i++){const x=-4.4+i*2.2;const node=sphere(root,.16,[x,.38,-2.8+row*2.7],P[(row+i)%P.length],{emissive:P[(row+i)%P.length]});scaleIn(node,.45+i*.26,.75);}
    }
  } else if(id==='dma-upstairs-office') {
    box(root,[8,.18,6],[0,.12,0],'#313d3f',{round:.06});
    box(root,[7,2.2,.35],[0,1.2,-2.3],'#766b58',{round:.03});
    box(root,[7,.16,1.5],[0,.15,-1.5],'#a27c59',{round:.03});
    for(const x of [-2.2,0,2.2]){box(root,[1.25,.9,.035],[x,1.25,-2.08],x===0?'#b38a60':'#5e8580');box(root,[1.25,.88,.035],[x,3.55,-2.08],'#6e8d88');}
    box(root,[7.2,.15,5.5],[0,2.45,0],'#384547',{round:.04});
    for(let i=0;i<3;i++){const x=-2.4+i*2.4;desk(root,x,-.6,2);computer(root,[x,.18,-.8],i===0?'16-bit':'microcomputer',P[(i+1)%P.length]);}
    const staff=[figure(root,[-3.6,.13,1.55],P[0],.8),figure(root,[3.5,.13,1.55],P[2],.8)];
    animate.push(t=>staff.forEach((p,i)=>{p.root.position.y=.13+.02*Math.sin(t*2+i);p.root.rotation.y=.1*Math.sin(t+i);}));
  } else if(id==='anonymous-developer-figure'||id==='three-anonymous-viewpoints') {
    const count=id==='three-anonymous-viewpoints'?3:1;
    for(let i=0;i<count;i++){const p=figure(root,[(i-(count-1)/2)*2.8,.14,0],P[i],1);animate.push(t=>{p.root.position.y=.14+.025*Math.sin(t*2+i);p.root.rotation.y=.12*Math.sin(t*1.1+i);p.legs[0].rotation.z=.12*Math.sin(t*2.4+i);p.legs[1].rotation.z=-p.legs[0].rotation.z;});}
  } else if(id==='platform-porting-animation') {
    const screens=[];
    for(let i=0;i<4;i++){const x=-4.5+i*3;box(root,[2.15,.16,2.4],[x,.18,0],'#415354',{round:.06});const screen=box(root,[1.5,1.2,.08],[x,1.05,-.35],P[i],{round:.06,emissive:P[i]});screens.push({screen,x});for(let k=0;k<3;k++)box(root,[.24,.14,.22],[x-.7+k*.5,.42,.72],k===1?'#c6b27e':'#82958b',{round:.04});}
    const packet=sphere(root,.19,[-4.4,.63,1.45],'#e3d6b4',{emissive:'#e3d6b4'});
    animate.push(t=>{const p=ease(t/6);packet.position.x=mix(-4.4,4.4,p);packet.position.y=.62+.14*Math.sin(t*3);screens.forEach(({screen},i)=>{screen.scale.x=mix(1.4,.9+((i+1)%3)*.28,ease((t-i*.4)/2));});});
  } else if(id==='abstract-agent-route') {
    const path=line(root,[[-5,.2,-1.2],[-3,.2,-1.2],[-1.7,.2,1.1],[0,.2,1.1],[1.4,.2,-1.3],[5,.2,-1.3]],'#d4b76f',.055);
    const obstacle=box(root,[.38,1.05,.4],[1.2,.64,-1.3],'#a75e4e',{round:.04,emissive:'#57261f'});
    const agents=Array.from({length:5},(_,i)=>sphere(root,.16,[-5.0-i*.26,.45,-1.2],i%2?'#e4dcc9':'#91b1a3'));
    const curve=path.userData.curve;animate.push(t=>{const u=ease(t/6);agents.forEach((a,i)=>{const p=curve.getPoint(clamp(u*.82+i*.025));a.position.set(p.x,.42+.035*Math.sin(t*4+i),p.z);});obstacle.material.emissiveIntensity=.08+.16*ease((t-2.7)/.9)*(1-ease((t-4.5)/.8));});
  } else if(id==='platform-scale-overlay') {
    for(let row=0;row<3;row++){
      const count=row===0?5:row===1?9:13;
      for(let i=0;i<count;i++){const x=-5.2+i*(10.4/(count-1)),z=-2.8+row*2.8;const tile=box(root,[.52,.1,.86],[x,.22,z],P[(row+i)%P.length],{round:.03});scaleIn(tile,(i+row*.6)*.12,.8);}
    }
  } else if(id==='abstract-overhead-city') {
    const blocks=city(root,3);const car=box(root,[.75,.28,1.25],[-5,.28,-.45],'#c0835d',{round:.12});
    animate.push(t=>{const u=ease(t/6);car.position.set(-5+10*u,.28,-.45+.45*Math.sin(u*Math.PI*2));blocks.forEach((b,i)=>{const h=b.userData.finalHeight,p=ease((t-.55-i*.08)/1.4);b.scale.y=.02+.98*p;b.position.y=h*p/2+.04;});});
  } else if(id==='overhead-follow-camera') {
    const rail=line(root,[[-4,.55,-3],[-3,.9,-1],[0,2.4,0],[3,3.5,1],[4.3,4.4,3]],'#c5ab70',.06);
    const cameraBody=box(root,[.8,.5,1.1],[-4,.85,-3],'#617d78',{round:.09,metalness:.2});
    const lens=cylinder(root,.25,.32,.28,[-4,.85,-3.58],'#1f3034',{metalness:.3,roughness:.22});lens.rotation.x=Math.PI/2;
    const target=sphere(root,.16,[-3,.26,-1.2],'#c88861',{emissive:'#c88861'});
    const curve=rail.userData.curve;animate.push(t=>{const u=ease(t/7),p=curve.getPoint(u);cameraBody.position.copy(p);lens.position.set(p.x,p.y,p.z-.58);target.position.set(-3+6*u,.26,-1.2+.5*Math.sin(u*Math.PI));});
  } else if(id==='pursuit-feedback-effect') {
    city(root,4);const path=line(root,[[-5.2,.12,0],[-3,.12,0],[-1,.12,1.5],[2.4,.12,1.5],[5,.12,-.4]],'#c7b178',.05);
    const lead=box(root,[.8,.28,1.45],[-5,.25,0],'#c1845c',{round:.1});const chase=box(root,[.78,.28,1.42],[-6,.25,-1.2],'#7e9991',{round:.1});
    const curve=path.userData.curve;animate.push(t=>{const u=ease(t/6),a=curve.getPoint(u),b=curve.getPoint(clamp(u-.14));lead.position.set(a.x,.25,a.z);chase.position.set(b.x-.45,.25,b.z-.45);});
  } else if(id==='topdown-to-street-transition') {
    const blocks=city(root,2,[2,3.6,1.8,2.7,3.2,1.4,2.5,3.9,2.1,3.2]);
    const car=box(root,[.78,.3,1.45],[-5,.3,-.45],'#c48661',{round:.1});
    animate.push(t=>{const p=ease((t-1)/4);blocks.forEach((b,i)=>{const h=b.userData.finalHeight,q=ease((t-1-i*.08)/3.2);b.scale.y=.015+.985*q;b.position.y=h*q/2+.04;});car.position.x=-5+10*ease(t/6);car.position.y=.3;});
  } else if(id==='publisher-developer-relations') {
    const names=[[-4.4,.9,-1.2],[-1.5,1.2,1.25],[1.5,.9,-1.2],[4.4,1.2,1.25]];const nodes=[];
    for(let i=0;i<names.length;i++){const p=names[i];nodes.push(box(root,[1.4,.88,.65],p,P[i],{round:.09}));}
    const links=[];for(let i=0;i<3;i++) links.push(line(root,[names[i],[(names[i][0]+names[i+1][0])/2,.28,(names[i][2]+names[i+1][2])/2],names[i+1]],P[(i+1)%P.length],.035));
    animate.push(t=>{nodes.forEach((n,i)=>n.scale.setScalar(.16+.84*ease((t-.6-i*.38)/.8)));links.forEach((l,i)=>l.material.emissiveIntensity=.02+.18*ease((t-1.4-i*.35)/1));});
  } else if(id==='acquisition-financial-evidence') {
    const cards=[];for(let i=0;i<3;i++){const x=-3.9+i*3.9;cards.push(card(root,x,-.3,i===0?'#d8c9a5':i===1?'#cab58a':'#b8c7ba',2.8,2.2));box(root,[2.7,.08,1.7],[x,.18,-.3],i===0?'#bdad89':i===1?'#a8845b':'#7c9289',{round:.04});}
    animate.push(t=>cards.forEach((c,i)=>{const p=ease((t-.6-i*.65)/.85);c.position.y=1.7+.35*p;c.rotation.y=(1-p)*.13*(i%2?1:-1);}));
  } else if(id==='regional-world-expansion') {
    box(root,[11.5,.22,8.4],[0,.12,0],'#4c706b',{round:.1});line(root,[[-5,.25,-2.2],[-2.5,.25,-.8],[0,.25,.3],[2.7,.25,-.4],[5,.25,1.4]],'#d0bc81',.045);
    const hubs=[];for(let i=0;i<3;i++){const x=-4.1+i*4.1,z=i===1?-1.3:1.35;hubs.push(building(root,x,z,1.5,1.2,2.4,P[i]));hubs.push(building(root,x+1.1,z+.7,.65,.7,1.1,P[i+2]));}
    const hills=[];for(let i=0;i<4;i++){const h=1.2+(i%2);hills.push(cylinder(root,1.2,.78,h,[-4.8+i*3.2,h/2,-3.3],i%2?'#8d765f':'#77654f'));}
    animate.push(t=>hubs.forEach((b,i)=>{const h=b.userData.finalHeight,p=ease((t-.8-i*.25)/1.6);b.scale.y=.025+.975*p;b.position.y=h*p/2+.04;}));
  } else if(id==='portfolio-title-overlay') {
    const tile=[];for(let i=0;i<4;i++){const x=-4.2+(i%2)*8.4,z=-2.0+Math.floor(i/2)*4.0;tile.push(box(root,[3.4,.15,2.5],[x,.18,z],P[i],{round:.07}));
      if(i===0) building(root,x,z,1.1,.8,1.6,'#4c6262');
      else if(i===1){cylinder(root,.9,1.2,.8,[x,.6,z],'#8c674d');}
      else if(i===2){line(root,[[x-1,.2,z],[x-.2,.2,z-.7],[x+.3,.2,z+.6],[x+1,.2,z]],'#d0b572',.05);}
      else sphere(root,.62,[x,.88,z],'#768a8b');
    }
    animate.push(t=>tile.forEach((o,i)=>o.scale.setScalar(.12+.88*ease((t-i*.35)/1))));
  } else if(id==='shared-map-viewpoint-switch') {
    const blocks=city(root,1);const routes=[line(root,[[-4,.2,-3],[-2,.2,-1],[0,.2,0],[1,.2,-2]],'#c2855d',.04),line(root,[[4,.2,3],[2,.2,1],[0,.2,0],[-1,.2,3]],'#8fb59e',.04),line(root,[[-.5,.2,4],[0,.2,2],[2,.2,.2],[4,.2,-2]],'#d2b76f',.04)];
    const markers=[sphere(root,.2,[-4,.6,-3],P[0],{emissive:P[0]}),sphere(root,.2,[4,.6,3],P[1],{emissive:P[1]}),sphere(root,.2,[-.5,.6,4],P[2],{emissive:P[2]})];
    animate.push(t=>{const active=Math.min(2,Math.floor(t/2.5));markers.forEach((m,i)=>m.scale.setScalar(i===active?1.35:.72));routes.forEach((r,i)=>r.material.emissiveIntensity=i===active?.24:.035);blocks.forEach((b,i)=>{const h=b.userData.finalHeight,p=ease((t-.45-i*.07)/1.4);b.scale.y=.02+.98*p;b.position.y=h*p/2+.04;});});
  } else if(id==='persistent-world-updates') {
    const blocks=city(root,4);const modules=[];for(let i=0;i<5;i++)modules.push(box(root,[1.1,.3,1.0],[-4.2+i*2.1,.35,(i%2?2.2:-2.3)],i%2?P[1]:P[2],{round:.08}));
    animate.push(t=>{blocks.forEach((b,i)=>{const h=b.userData.finalHeight,p=ease((t-.2-i*.04)/1.4);b.scale.y=.02+.98*p;b.position.y=h*p/2+.04;});modules.forEach((x,i)=>{const p=ease((t-1.6-i*.78)/.75);x.scale.setScalar(.02+.98*p);x.position.y=.18+.2*p;});});
  } else if(id==='sales-metric-sold-in') {
    const bars=[];for(let i=0;i<6;i++){const height=.65+i*.58;bars.push(box(root,[.9,height,1.0],[-4.2+i*1.65,height/2+.12,0],P[i%P.length],{round:.06}));}
    const divider=box(root,[.1,3.7,.14],[4.9,1.95,0],'#d1c19a');
    animate.push(t=>bars.forEach((b,i)=>{const h=.65+i*.58,p=ease((t-.55-i*.2)/1.0);b.scale.y=.02+.98*p;b.position.y=h*p/2+.12;}));
  } else if(id==='development-material-disclosure') {
    const locked=box(root,[2.6,2.25,.18],[-3.0,2.2,-1],'#344245',{round:.06,metalness:.18});
    const files=[];for(let i=0;i<6;i++)files.push(box(root,[.48,.62,.12],[-4.1+i*.38,2.0+(i%3)*.25,-.65+(i%2)*.3],i%2?'#8c8b7b':'#b0a88f',{round:.025}));
    const publicBoard=box(root,[2.6,2.0,.16],[3.1,2.1,0],'#89715d',{round:.055});
    const arrow=line(root,[[-1.4,.55,-.6],[0,.55,-.6],[1.1,.55,-.2]],'#c68060',.06);
    animate.push(t=>{const p=ease((t-1.4)/2.0);files.forEach((f,i)=>{f.position.x=-4.1+i*.38+7*p;f.position.y=2.0+(i%3)*.25;f.position.z=-.65+(i%2)*.3+p*.9;});locked.material.emissiveIntensity=.07+.16*(1-p);publicBoard.material.emissiveIntensity=.04+.1*p;});
  } else if(id==='work-conditions-evidence') {
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2.0,.075,12,88),m('#c18c62',.34,.22,'#53331f'));ring.rotation.x=Math.PI/2;ring.position.set(-2,1.7,0);root.add(ring);
    const marks=[];for(let i=0;i<12;i++){const a=i*Math.PI/6;marks.push(box(root,[.11,.28,.08],[-2+Math.sin(a)*1.72,1.72,Math.cos(a)*1.72],'#e0d6c1',{round:.02}));}
    const reports=[];for(let i=0;i<5;i++){const x=1.0+(i%3)*1.45,z=-1.8+Math.floor(i/3)*2.2;reports.push(card(root,x,z,i%2?'#c3b18c':'#b7c5b8',1.0,1.7));}
    animate.push(t=>{ring.material.emissiveIntensity=.04+.14*ease((t-.8)/1.2);reports.forEach((c,i)=>{const p=ease((t-2.0-i*.35)/.8);c.position.y=1.55+.18*p;});});
  } else if(id==='closing-choice-scale-transition') {
    const small=line(root,[[-5,.2,-.8],[-3.5,.2,-.8],[-2,.2,-.8]],'#dfc47c',.05);
    const large=line(root,[[-2,.2,-.8],[-.5,.2,-.8],[.8,.2,.6],[2.2,.2,.6],[4.7,.2,-1.6]],'#9ac3ae',.075);
    const agents=Array.from({length:4},(_,i)=>sphere(root,.14,[-5-i*.15,.46,-.8],i%2?'#e1d8c4':'#91b7a4'));
    const blocks=city(root,5);
    animate.push(t=>{const p=ease(t/6);agents.forEach((a,i)=>{const u=clamp(p*.58+i*.035),curve=u<.5?small.userData.curve:large.userData.curve,pos=curve.getPoint(u<.5?u*2:(u-.5)*2);a.position.set(pos.x,.45+.03*Math.sin(t*4+i),pos.z);});blocks.forEach((b,i)=>{const h=b.userData.finalHeight,q=ease((t-3-i*.05)/1.3);b.scale.y=.02+.98*q;b.position.y=h*q/2+.04;});});
  } else if(id==='amiga-photo-evidence-overlay'||id==='dma-location-plaque-photo-overlay'||id==='resource-apple-ii-photo'||id==='resource-zx81-kit-photo') {
    const ratio=id==='resource-zx81-kit-photo'?1.34:id==='resource-apple-ii-photo'?.91:1.29;
    const w=ratio>1?3.55:2.55,h=w/ratio;
    box(root,[w+.35,h+.9,.18],[0,h/2+.4,0],'#b69a60',{round:.085,metalness:.2});
    box(root,[w+.18,h+.72,.17],[0,h/2+.4,.09],'#222d2f',{round:.07,metalness:.12});
    box(root,[w,h,.035],[0,h/2+.68,.2],'#a7a397',{round:.035,roughness:.44});
    box(root,[w*.78,.32,.04],[0,.56,.22],id==='resource-apple-ii-photo'?'#829891':'#b5a385',{round:.02});
    box(root,[w*.65,.045,.035],[0,.29,.23],'#303a3b');
    const foot=box(root,[.55,.28,.45],[0,.14,0],'#596463',{round:.04});
    animate.push(t=>{const p=ease(t/1.2);root.rotation.y=(1-p)*-.18;root.position.y=.1+.12*p+.025*Math.sin(t*1.3);foot.scale.y=.8+.2*p;});
  } else {
    const blocks=city(root,2);animate.push(t=>blocks.forEach((b,i)=>{const h=b.userData.finalHeight,p=ease((t-.4-i*.08)/1.5);b.scale.y=.02+.98*p;b.position.y=h*p/2+.04;}));
  }

  root.userData.sample=(t=0)=>{for(const sample of animate)sample(t);};
  root.userData.sample(0);
  return root;
}

function mix(a,b,t){return a+(b-a)*t;}
