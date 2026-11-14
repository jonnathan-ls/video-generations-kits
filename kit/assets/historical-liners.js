import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {surface} from './period-surface-materials.js';
import {mat,mesh,beam,recipe,box,hull} from './maritime-shapes.js';
import {create as createLifeboat} from './period-lifeboat.js';

// A sectional hull gives the liner a real sheer line, fine bow, fuller midship
// body and squared transom. The band colors echo the period black/red livery.
// Geometry is intentionally baked and deterministic so frame seeking is stable.
function linerHull(length,width,{cutaway=false}={}){
  const stations=[
    [-.500,.015,2.45],[-.482,.25,2.25],[-.445,.48,1.75],[-.390,.68,1.15],
    [-.315,.84,.62],[-.210,.94,.25],[-.060,.99,.06],[.120,1,.02],
    [.285,.96,.12],[.405,.86,.42],[.470,.68,.85],[.500,.48,1.20]
  ];
  // Trace one closed cross-section from the port gunwale, around the keel,
  // and back to starboard. The local Y=0 plane is the waterline.
  const section=[
    [-1,7],[-.96,4.6],[-.92,2.1],[-.86,.9],[-.80,-.35],[-.72,-1.7],
    [-.60,-4.1],[-.44,-6.5],[-.24,-8.05],[0,-8.6],[.24,-8.05],
    [.44,-6.5],[.60,-4.1],[.72,-1.7],[.80,-.35],[.86,.9],[.92,2.1],
    [.96,4.6],[1,7]
  ];
  const upper=cutaway
    ?[new THREE.Color('#34434a'),new THREE.Color('#3d4b50'),new THREE.Color('#2e3c42')]
    :[new THREE.Color('#14202a'),new THREE.Color('#192630'),new THREE.Color('#101a23')];
  const boot=[new THREE.Color('#702a2d'),new THREE.Color('#87373a'),new THREE.Color('#612328')];
  const lower=[new THREE.Color('#8d3736'),new THREE.Color('#76302f'),new THREE.Color('#a04742')];
  const positions=[],colors=[];
  const insideCutawayWindow=(point)=>cutaway
    &&point[0]<-7.8&&point[1]>-4.3&&point[1]<5.0&&point[2]>-12&&point[2]<28;
  const addFace=(a,b,c,band,seed)=>{
    // The explanatory cutaway is a real aperture in the port shell. Leaving
    // the black outer plate in place behind a second model made it read like
    // a loose diagram card pasted over the ship.
    const center=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];
    if(insideCutawayWindow(center))return;
    positions.push(...a,...b,...c);
    let base=band==='upper'?upper[seed%upper.length]:band==='boot'?boot[seed%boot.length]:lower[seed%lower.length];
    colors.push(base.r,base.g,base.b,base.r,base.g,base.b,base.r,base.g,base.b);
  };
  let face=0;
  for(let s=0;s<stations.length-1;s++){
    const [za,wa,sa]=stations[s],[zb,wb,sb]=stations[s+1];
    for(let j=0;j<section.length-1;j++){
      const point=(station,u,y)=>{
        const [zScale,wScale,sheer]=station;
        const rise=THREE.MathUtils.clamp((y+8.6)/8.6,0,1);
        return [u*width*wScale*.5,y+sheer*rise,zScale*length];
      };
      const p0=point(stations[s],...section[j]),p1=point(stations[s],...section[j+1]);
      const p2=point(stations[s+1],...section[j+1]),p3=point(stations[s+1],...section[j]);
      const meanY=(section[j][1]+section[j+1][1])*.5;
      const band=meanY>-.12?'upper':meanY>-.75?'boot':'lower';
      addFace(p0,p1,p3,band,face++);addFace(p1,p2,p3,band,face++);
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.57,metalness:.24,side:THREE.DoubleSide});
  const body=new THREE.Mesh(geometry,material);body.name='shaped-period-liner-hull';
  return body;
}

function addTitanicCutaway(root,params={}){
  const zMin=-12,zMax=28,zCenter=(zMin+zMax)/2;
  const steel=new THREE.MeshStandardMaterial({color:'#778186',metalness:.46,roughness:.58});
  const darkSteel=new THREE.MeshStandardMaterial({color:'#566469',metalness:.3,roughness:.72});
  const frame=new THREE.MeshStandardMaterial({color:'#a6a18e',metalness:.55,roughness:.47});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(3.9,.24,zMax-zMin),steel);
  floor.name='cutaway-compartment-deck';floor.position.set(-7.2,-3.78,zCenter);root.add(floor);
  const upperDeck=new THREE.Mesh(new THREE.BoxGeometry(3.85,.18,zMax-zMin),darkSteel);
  upperDeck.name='cutaway-compartment-overhead';upperDeck.position.set(-7.15,4.88,zCenter);root.add(upperDeck);
  const back=new THREE.Mesh(new THREE.BoxGeometry(.18,8.55,zMax-zMin),darkSteel);
  back.name='cutaway-shadowed-interior';back.position.set(-5.12,.42,zCenter);root.add(back);
  const interiorFill=new THREE.PointLight('#d7edf0',8,27,2);
  interiorFill.name='cutaway-interior-fill';interiorFill.position.set(-9.6,1.7,zCenter);root.add(interiorFill);

  // Bulkheads span the visible interior and meet the decks, so the opening
  // reads as divisions built into the liner rather than loose plates.
  for(const z of [-12,1,14,28]){
    const wall=new THREE.Mesh(new THREE.BoxGeometry(3.8,8.42,.20),steel);
    wall.name='integrated-watertight-bulkhead';wall.position.set(-7.15,.45,z);root.add(wall);
    for(const x of [-8.8,-7.65,-6.5,-5.35]){
      const rivet=new THREE.Mesh(new THREE.SphereGeometry(.052,10,8),frame);
      rivet.position.set(x,3.9,z+.115);rivet.name='bulkhead-rivet';root.add(rivet);
    }
  }
  for(const y of [-1.55,1.25]){
    const beam=new THREE.Mesh(new THREE.BoxGeometry(3.86,.14,zMax-zMin),frame);
    beam.name='compartment-longitudinal-beam';beam.position.set(-7.15,y,zCenter);root.add(beam);
  }

  const sideAtY=y=>{
    const profile=[[-4.1,-8.5],[-1.7,-10.2],[-.35,-11.28],[.9,-12.1],[2.1,-13],[4.6,-13.5]];
    for(let i=0;i<profile.length-1;i++)if(y>=profile[i][0]&&y<=profile[i+1][0]){
      const f=(y-profile[i][0])/(profile[i+1][0]-profile[i][0]);
      return THREE.MathUtils.lerp(profile[i][1],profile[i+1][1],f)-.045;
    }
    return y<profile[0][0]?profile[0][1]-.045:profile.at(-1)[1]-.045;
  };
  const addRim=points=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*4),.16,10,false),frame);
    rail.name='cutaway-shell-rim';root.add(rail);
  };
  for(const z of [zMin,zMax])addRim([-4.1,-1,1.3,3.2,5].map(y=>[sideAtY(y),y,z]));
  for(const y of [-4.1,5]){
    const points=[];for(let i=0;i<=16;i++){const z=THREE.MathUtils.lerp(zMin,zMax,i/16);points.push([sideAtY(y),y,z]);}
    addRim(points);
  }
  // Small raised fasteners follow the cut edge and catch a narrow highlight.
  for(const z of [zMin+1,zMax-1])for(const y of [-3,-1,1,3]){
    const bolt=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),frame);
    bolt.position.set(sideAtY(y)-.1,y,z);bolt.name='cutaway-frame-fastener';root.add(bolt);
  }

  const floodMode=params.floodMode||'dry';
  const floodPatches=[];
  const chambers=[{z:-5,base:-3.35,top:floodMode==='overflow'?.55:floodMode==='limited'?-.3:-3.35},
    {z:7.5,base:-3.35,top:floodMode==='overflow'?-.05:-3.35},
    {z:21,base:-3.35,top:floodMode==='overflow'?-.42:-3.35}];
  for(const chamber of chambers){
    if(chamber.top<=chamber.base+.02)continue;
    const geometry=new THREE.PlaneGeometry(3.0,10.2,30,24);geometry.rotateX(-Math.PI/2);
    const material=new THREE.MeshPhysicalMaterial({color:'#58a9b3',metalness:.08,roughness:.24,clearcoat:.9,clearcoatRoughness:.16,emissive:'#164753',emissiveIntensity:.42,side:THREE.DoubleSide});
    const surface=new THREE.Mesh(geometry,material);surface.name='water-rising-inside-compartment-surface';
    surface.position.set(-8.45,chamber.base,chamber.z);surface.renderOrder=3;root.add(surface);
    const volumeMaterial=new THREE.MeshPhysicalMaterial({color:'#397d8b',metalness:.04,roughness:.32,transparent:true,opacity:.76,depthWrite:false,clearcoat:.72,emissive:'#15414b',emissiveIntensity:.28,side:THREE.DoubleSide});
    const volume=new THREE.Mesh(new THREE.BoxGeometry(3.0,1,10.2),volumeMaterial);volume.name='visible-water-volume-inside-compartment';
    volume.position.set(-8.45,chamber.base,chamber.z);volume.scale.y=.001;root.add(volume);
    floodPatches.push({surface,volume,chamber,basePositions:geometry.attributes.position.array.slice()});
  }
  const start=Math.max(0,Number(params.floodStart)||0),duration=Math.max(.5,Number(params.floodDuration)||2.2);
  root.userData.sample=t=>{
    const progress=THREE.MathUtils.clamp((t-start)/duration,0,1),ease=progress*progress*(3-2*progress);
    for(const {surface,volume,chamber,basePositions}of floodPatches){
      const level=THREE.MathUtils.lerp(chamber.base,chamber.top,ease),height=Math.max(.01,level-chamber.base);
      surface.position.y=level;volume.position.y=chamber.base+height/2;volume.scale.y=height;
      const attr=surface.geometry.attributes.position;
      for(let i=0;i<attr.count;i++){
        const x=basePositions[i*3],z=basePositions[i*3+2];
        attr.setY(i,basePositions[i*3+1]+.035*Math.sin(x*1.7+z*.65+t*1.4)+.018*Math.sin(x*3.2-z*1.1-t));
      }
      attr.needsUpdate=true;surface.geometry.computeVertexNormals();
    }
  };
  root.userData.sample(0);
}

function addHullSheer(root,length,width){
  // Fine, muted shell strakes follow the hull stations. The earlier thick
  // pale rail read as a hard graphic stroke against the dark hull.
  const rail=mat('#69716f',{metalness:.22,roughness:.62});
  const stations=[[-.44,.48],[-.39,.68],[-.315,.84],[-.21,.94],[-.06,.99],[.12,1],[.285,.96],[.405,.86],[.47,.68]];
  for(const side of [-1,1]){
    const points=stations.map(([z,w])=>new THREE.Vector3(side*width*w*.435,1.04+Math.max(0,-z)*1.5,z*length));
    const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),96,.045,6,false),rail);
    line.name=`hull-sheer-strake-${side}`;root.add(line);
  }
}

function addFineHullFilets(root,length,width){
  // Narrow, station-following highlights give the painted shell a soft edge
  // and some scale without turning it into a bright, ruler-straight stripe.
  const stations=[[-.48,.25,2.45],[-.445,.48,1.75],[-.390,.68,1.15],[-.315,.84,.62],[-.210,.94,.25],[-.060,.99,.06],[.120,1,.02],[.285,.96,.12],[.405,.86,.42],[.470,.68,.85],[.500,.48,1.20]];
  const finish=mat('#877856',{metalness:.30,roughness:.58});
  const makeLine=(side,baseY,sectionX,radius,name)=>{
    const points=stations.map(([z,w,sheer])=>new THREE.Vector3(
      side*width*w*sectionX,
      baseY+sheer,
      z*length
    ));
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
    const line=new THREE.Mesh(new THREE.TubeGeometry(curve,128,radius,6,false),finish);
    line.name=`${name}-${side}`;root.add(line);
  };
  for(const side of [-1,1]){
    // A fine gunwale inlay follows the raised sheer; the lower trim stays
    // quiet so the black/red hull bands remain readable in night lighting.
    makeLine(side,6.55,.49,.026,'upper-hull-filet');
    makeLine(side,4.65,.48,.018,'upper-shell-seam');
  }
}

function roundRecipeBoxes(group){
  for(const part of group.children){
    if(!part.isMesh||part.geometry.type!=='BoxGeometry')continue;
    const {width,height,depth}=part.geometry.parameters;
    const edge=Math.min(width,height,depth);
    const radius=Math.min(.14,Math.max(.018,edge*.12));
    part.geometry.dispose();
    part.geometry=new RoundedBoxGeometry(width,height,depth,2,radius);
  }
}

function maritimeIvory(){
  const material=surface('stone').clone();
  material.color.set('#d2cdbf');
  material.roughness=.84;
  material.bumpScale=.00105;
  material.clearcoat=0;
  material.name='matte-maritime-ivory';
  return material;
}

function addCarpathiaBoardingLadder(root,width){
  // Illustrative ship-to-lifeboat access for this rescue scene, not a claim
  // that the precise historical Carpathia arrangement is documented here.
  const side=1,zCenter=-4.0,top=6.55,bottom=1.85,steps=16;
  const rope=mat('#c4b799',{roughness:.92}),tread=surface('wood');
  const surfaceAt=(y)=>{
    const profile=[[7,1],[4.6,.96],[2.1,.92],[.9,.86],[-.35,.8],[-1.7,.72]];
    for(let i=0;i<profile.length-1;i++)if(y<=profile[i][0]&&y>=profile[i+1][0]){
      const f=(profile[i][0]-y)/(profile[i][0]-profile[i+1][0]);
      return THREE.MathUtils.lerp(profile[i][1],profile[i+1][1],f)*width*.5;
    }
    return width*.47;
  };
  const ladderX=(y)=>{
    const lowerReach=THREE.MathUtils.clamp((top-y)/(top-bottom),0,1)*.52;
    return side*(surfaceAt(y)+.16+lowerReach);
  };
  const railOffsets=[-.45,.45];
  for(const dz of railOffsets){
    const points=[];
    for(let i=0;i<=12;i++){
      const f=i/12,y=THREE.MathUtils.lerp(top+.25,bottom-.04,f);
      points.push(new THREE.Vector3(ladderX(y),y,zCenter+dz));
    }
    const rail=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),36,.034,6,false),rope);
    rail.name=`carpathia-boarding-rope-${dz}`;rail.castShadow=true;root.add(rail);
  }
  for(let i=0;i<steps;i++){
    const y=THREE.MathUtils.lerp(top,bottom,i/(steps-1)),x=ladderX(y);
    const rung=new THREE.Mesh(new RoundedBoxGeometry(.31,.085,.94,1,.025),tread);
    rung.position.set(x,y,zCenter);rung.name=`carpathia-boarding-step-${i+1}`;rung.castShadow=rung.receiveShadow=true;root.add(rung);
    for(const dz of railOffsets){
      const lash=new THREE.Mesh(new THREE.SphereGeometry(.052,8,6),rope);
      lash.position.set(x,y,zCenter+dz);lash.scale.set(1,.75,1);lash.castShadow=true;root.add(lash);
    }
  }
  // Two short ties hold the head of the ladder over the side rail.
  for(const dz of railOffsets){
    const anchorX=side*(surfaceAt(top)+.02),headX=ladderX(top+.25);
    const stay=beam(root,[anchorX,top+.42,zCenter+dz],[headX,top+.25,zCenter+dz],.045,rope);stay.castShadow=true;
    const cleat=new THREE.Mesh(new RoundedBoxGeometry(.22,.09,.16,1,.025),mat('#78684f',{roughness:.72}));
    cleat.position.set(anchorX,top+.46,zCenter+dz);cleat.name=`carpathia-ladder-cleat-${dz}`;cleat.castShadow=cleat.receiveShadow=true;root.add(cleat);
  }
}

export function create({variant='titanic',params={}}={}){
  const passengerDeck=variant==='titanic-passenger-deck',cutaway=variant==='titanic-cutaway',titanic=variant==='titanic'||passengerDeck||cutaway,L=titanic?269.1:170,W=titanic?28.2:19.5,root=new THREE.Group();root.name=variant;
  root.add(linerHull(L,W,{cutaway}));addHullSheer(root,L,W);addFineHullFilets(root,L,W);
  const levels=titanic?[
    {width:.86,length:.76,y:9.0,z:-.025},
    {width:.80,length:.68,y:12.1,z:-.027},
    {width:.74,length:.59,y:15.2,z:-.012}
  ]:[
    {width:.80,length:.70,y:8.8,z:-.02},
    {width:.72,length:.56,y:11.8,z:-.02},
    {width:.64,length:.39,y:14.8,z:-.01}
  ];
  const parts=[box('main-deck',[W*.91,.65,L*.79],[0,7.1,-L*.012],'#aa9272')];
  for(let i=0;i<levels.length;i++){
    const level=levels[i];
    parts.push(box(`superstructure-${i}`,[W*level.width,2.65,L*level.length],[0,level.y,level.z],'#d5d2c7'));
    parts.push(box(`promenade-overhang-${i}`,[W*(level.width+.055),.22,L*(level.length+.035)],[0,level.y+1.43,level.z],'#c9c6bb'));
  }
  parts.push(box('bridge-wing',[W*1.20,.25,L*.055],[0,16.65,L*.29],'#a69373'));
  parts.push(box('bridge',[W*.90,3.0,L*.045],[0,17.0,L*.29],'#dad7ca'));
  parts.push(box('boat-deck',[W*.92,.28,L*.64],[0,17.0,-L*.018],'#aa9272'));
  const decks=recipe('liner-decks',parts);
  roundRecipeBoxes(decks);
  const deckFinish=surface('deck'),ivoryFinish=maritimeIvory();
  for(const m of decks.children){
    if(['boat-deck','main-deck'].includes(m.name)){
      m.material=deckFinish;
      const uv=m.geometry.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*12,uv.getY(i)*50);
      uv.needsUpdate=true;
    } else if(m.name.startsWith('promenade-overhang-')){
      // The horizontal faces stay timber; the rounded exposed fascia reads as
      // painted trim and avoids a single dark, ruler-straight deckline.
      m.material=[ivoryFinish,ivoryFinish,deckFinish,deckFinish,ivoryFinish,ivoryFinish];
      const uv=m.geometry.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*4,uv.getY(i)*16);
      uv.needsUpdate=true;
    } else if(m.name.startsWith('superstructure-')||m.name==='bridge') m.material=ivoryFinish;
  }
  root.add(decks);
  const rail=mat('#c0beb2'),black=mat('#171c21'),funnel=mat(titanic?'#bd8c4f':'#91483c');
  for(let i=0;i<(titanic?4:1);i++){
    const z=titanic?L*(.24-i*.16):-L*.02;
    const f=mesh(root,new THREE.CylinderGeometry(titanic?3:2.7,titanic?3.15:2.9,14,24),funnel,[0,24,z]);f.rotation.x=-.07;
    mesh(root,new THREE.CylinderGeometry(titanic?3.04:2.74,titanic?3.04:2.74,3.8,24),black,[0,30,z]);
  }
  for(const z of (titanic?[-L*.34,L*.38]:[-L*.38,-L*.2,L*.25,L*.4])){
    beam(root,[0,7,z],[0,titanic?41:31,z],.23,mat('#9c7b50'));
    beam(root,[0,(titanic?35:27),z],[-W*.37,8,z+10],.035,rail);
    beam(root,[0,(titanic?35:27),z],[W*.37,8,z-10],.035,rail);
  }
  for(const side of [-1,1]){
    for(let i=0;i<3;i++)beam(root,[side*W*.45,17.7+i*.28,-L*.31],[side*W*.45,17.7+i*.28,L*.32],.055,rail);
    for(let j=0;j<19;j++)beam(root,[side*W*.45,17.6,-L*.31+j*L*.035],[side*W*.45,18.35,-L*.31+j*L*.035],.04,rail);
  }
  // Small inset dark panes, four restrained frame bars and a sill read as
  // windows in the wall instead of luminous gold stickers.
  const paneMat=mat('#35464a',{emissive:'#ad8250',emissiveIntensity:.035,roughness:.38,metalness:.12});
  const frameMat=mat('#aaa18d',{roughness:.72,metalness:.08});
  const paneGeo=new RoundedBoxGeometry(.016,.32,.40,1,.018);
  const horizontalGeo=new RoundedBoxGeometry(.035,.045,.56,1,.018);
  const verticalGeo=new RoundedBoxGeometry(.035,.38,.045,1,.018);
  const panes=new THREE.InstancedMesh(paneGeo,paneMat,240);
  const windowRails=new THREE.InstancedMesh(horizontalGeo,frameMat,480);
  const windowJambs=new THREE.InstancedMesh(verticalGeo,frameMat,480);
  const dummy=new THREE.Object3D();let k=0,railIndex=0,jambIndex=0;
  for(const side of [-1,1])for(let level=0;level<3;level++)for(let i=0;i<40;i++){
    const widthFactor=levels[level].width;
    const wallX=W*widthFactor/2,z=-L*levels[level].length*.37+i*L*levels[level].length*.019;
    dummy.position.set(side*(wallX+.006),levels[level].y,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();panes.setMatrixAt(k++,dummy.matrix);
    for(const dy of [-.205,.205]){
      dummy.position.set(side*(wallX+.025),levels[level].y+dy,z);dummy.updateMatrix();windowRails.setMatrixAt(railIndex++,dummy.matrix);
    }
    for(const dz of [-.247,.247]){
      dummy.position.set(side*(wallX+.025),levels[level].y,z+dz);dummy.updateMatrix();windowJambs.setMatrixAt(jambIndex++,dummy.matrix);
    }
  }
  root.add(panes,windowRails,windowJambs);
  // Framed, inset portholes break up the hull and read at close costado angles.
  const portholeMetal=mat('#8f7851',{metalness:.48,roughness:.38});
  const portFrames=new THREE.InstancedMesh(new THREE.TorusGeometry(.30,.045,5,12),portholeMetal,100);
  const ports=new THREE.InstancedMesh(new THREE.SphereGeometry(.21,8,6),mat('#181d21'),100);k=0;
  for(const side of [-1,1])for(let i=0;i<50;i++){
    const z=-L*.35+i*L*.014;
    dummy.position.set(side*W*.455,4.7,z);dummy.rotation.set(0,side*Math.PI/2,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
    portFrames.setMatrixAt(k,dummy.matrix);
    dummy.position.x-=side*.035;dummy.scale.set(1,1,.18);dummy.updateMatrix();ports.setMatrixAt(k,dummy.matrix);k++;
  }
  root.add(portFrames,ports);
  if(!titanic)addCarpathiaBoardingLadder(root,W);
  // Practical deck fixtures separate people, rails and deck edges in night shots.
  if(titanic){for(const side of [-1,1])for(const z of [-38.5,-1.5,17.2,54.6]){
    const x=side*W*.44;beam(root,[x,17.14,z],[x,19.2,z],.025,rail);
    mesh(root,new THREE.CylinderGeometry(.09,.09,.22,12),new THREE.MeshStandardMaterial({color:'#f1ddad',emissive:'#ffc475',emissiveIntensity:1.1,roughness:.35}),[x,19.3,z]);
    mesh(root,new THREE.ConeGeometry(.14,.09,16),black,[x,19.46,z]);
    const light=new THREE.PointLight('#ffd3a0',2.8,5,2);light.position.set(x,19.3,z);root.add(light);
  }}
  // Lifeboats, davits and ventilators give the boat deck scale and period cues.
  if(titanic){const davits=mat('#a9b2b0',{metalness:.42,roughness:.38}),cable=mat('#c2c4bb',{metalness:.28,roughness:.5});for(const side of [-1,1])for(let i=0;i<8;i++){
    const z=-67+i*18.7,x=side*W*.47,outboard=side*W*.57;
    const boat=passengerDeck&&side===1&&i===3?createLifeboat({variant:'empty'}):hull(8.5,2.5,.85,-.4,'#b0a18b',true);
    if(passengerDeck&&side===1&&i===3)boat.scale.set(.94,.7,.94);
    boat.position.set(x,18.55,z);root.add(boat);
    // Each boat now has a readable arched radial davit, outboard head and
    // paired falls. The silhouette is visible against the ocean in wide shots.
    for(const dz of [-2.75,2.75]){
      beam(root,[side*W*.36,17.15,z+dz],[side*W*.39,18.75,z+dz],.10,davits);
      beam(root,[side*W*.39,18.75,z+dz],[side*W*.51,20.85,z+dz],.105,davits);
      beam(root,[side*W*.51,20.85,z+dz],[outboard,20.9,z+dz],.095,davits);
      beam(root,[outboard,20.9,z+dz],[side*W*.54,20.1,z+dz],.075,davits);
      beam(root,[side*W*.54,20.1,z+dz],[x+side*1.05,19.25,z+dz],.027,cable);
      beam(root,[side*W*.54,20.1,z+dz],[x-side*1.05,19.25,z+dz],.027,cable);
      beam(root,[x+side*1.05,19.25,z+dz],[x+side*1.05,18.9,z+dz],.035,davits);
      beam(root,[x-side*1.05,19.25,z+dz],[x-side*1.05,18.9,z+dz],.035,davits);
    }
  }}
  for(let i=0;i<(titanic?10:6);i++){
    const z=-L*.27+i*L*.055;mesh(root,new THREE.CylinderGeometry(.6,.6,2.5,12),mat('#b5aa8e'),[W*.18,18.6,z]);
    const vent=mesh(root,new THREE.SphereGeometry(.9,12,8),mat('#b5aa8e'),[W*.18,19.8,z]);vent.scale.set(1,.7,1);
  }
  for(const z of [-L*.41,L*.42])root.add(recipe('raised-deck',[
    box('raised-forecastle',[W*.65,1.2,L*.08],[0,7.9,z],'#cfcbc0'),
    box('raised-deck-top',[W*.66,.18,L*.081],[0,8.6,z],'#aa9272')
  ]));
  root.userData.sample=()=>{};
  if(cutaway)addTitanicCutaway(root,params);
  return root;
}
