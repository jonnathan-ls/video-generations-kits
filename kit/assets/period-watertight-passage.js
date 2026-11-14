import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {surface} from './period-surface-materials.js';
import {wallFinish} from './period-room-parts.js';
import {mesh,beam,mat} from './maritime-shapes.js';

const smooth=(a,b,t)=>{const u=THREE.MathUtils.clamp((t-a)/(b-a),0,1);return u*u*(3-2*u);};

export function create({variant='limited',params={}}={}){
  const root=new THREE.Group();root.name='period-watertight-passage';
  const iron=surface('iron'),brass=surface('brass'),deck=surface('deck');
  const wall=wallFinish('#99988a'),darkWall=mat('#596267',{metalness:.25,roughness:.72});
  const width=8.2,length=18,height=4.7,back=-9,front=9,doorZ=-1.8;
  // An explicitly framed upper opening supplies the real fluid path in this
  // generic demonstration. It is not a Titanic compartment/deck blueprint.
  const overflowCrest=4.2,overflowTop=4.58;

  const floor=new THREE.Mesh(new THREE.BoxGeometry(width,.22,length),deck);
  floor.name='continuous-lower-deck-floor';floor.position.set(0,0,(front+back)/2);root.add(floor);
  const ceiling=new THREE.Mesh(new THREE.BoxGeometry(width,.22,length),wallFinish('#87877d'));
  ceiling.name='complete-corridor-ceiling';ceiling.position.set(0,height,(front+back)/2);root.add(ceiling);
  for(const side of [-1,1]){
    const shell=new THREE.Mesh(new THREE.BoxGeometry(.20,height,length),wall);
    shell.name='continuous-corridor-wall';shell.position.set(side*4.0,height/2,(front+back)/2);root.add(shell);
    const wainscot=new THREE.Mesh(new RoundedBoxGeometry(.28,1.25,length-.2,2,.07),iron);
    wainscot.name='lower-steel-wall-panel';wainscot.position.set(side*3.88,.84,(front+back)/2);root.add(wainscot);
    for(let z=-8;z<=8;z+=2.7){
      beam(root,[side*3.72,1.48,z],[side*3.72,4.45,z],.065,brass);
      for(const y of [.28,.52,.78,1.02])mesh(root,new THREE.SphereGeometry(.036,8,6),brass,[side*3.70,y,z+.14]);
    }
    for(const y of [1.48,4.34])beam(root,[side*3.72,y,back+.2],[side*3.72,y,front-.2],.035,brass);
    // Steam and water lines are fastened to the walls with visible elbows.
    for(const h of [3.78,4.05]){
      const pipe=mesh(root,new THREE.CylinderGeometry(.055,.055,length-.8,14),brass,[side*3.48,h,(front+back)/2]);
      pipe.rotation.x=Math.PI/2;pipe.name='overhead-service-pipe';
    }
    for(const z of [-6.8,5.4]){
      const valve=new THREE.Group();valve.position.set(side*3.35,2.18,z);root.add(valve);
      mesh(valve,new THREE.CylinderGeometry(.12,.12,.22,18),iron,[0,0,0]).rotation.z=Math.PI/2;
      mesh(valve,new THREE.TorusGeometry(.31,.035,8,28),brass,[0,0,.18]);
      for(let i=0;i<4;i++){const a=i*Math.PI/2;beam(valve,[0,0,.18],[.29*Math.cos(a),.29*Math.sin(a),.18],.025,brass);}
    }
  }
  for(let z=-8.5;z<9;z+=2.25){
    beam(root,[-3.8,4.52,z],[3.8,4.52,z],.08,iron);
    beam(root,[-3.8,.18,z],[3.8,.18,z],.014,brass);
  }

  // The transverse bulkhead closes across the entire corridor; the door and
  // its frame belong to this passage, not to a separate demonstration card.
  const portalSteel=mat('#667277',{metalness:.54,roughness:.48});
  // A watertight door only works when its frame closes the whole passage.
  // Fill the bulkhead around the opening so neither side reads as a doorway
  // open to the ocean or as a detached display panel.
  const transverseWall=wallFinish('#8d8d82');
  for(const side of [-1,1]){
    const wingWidth=(width-3.5)/2;
    const wing=new THREE.Mesh(new THREE.BoxGeometry(wingWidth,height,.22),transverseWall);
    wing.name='continuous-transverse-bulkhead-wing';
    wing.position.set(side*(1.75+wingWidth/2),height/2,doorZ);
    root.add(wing);
  }
  const lintelFill=new THREE.Mesh(new THREE.BoxGeometry(3.5,overflowCrest-3.55,.22),transverseWall);
  lintelFill.name='continuous-transverse-bulkhead-over-door';
  lintelFill.position.set(0,(overflowCrest+3.55)/2,doorZ);
  root.add(lintelFill);
  const upperFill=new THREE.Mesh(new THREE.BoxGeometry(3.5,height-overflowTop,.22),transverseWall);
  upperFill.name='complete-bulkhead-above-overflow-opening';
  upperFill.position.set(0,(height+overflowTop)/2,doorZ);root.add(upperFill);
  for(const side of [-1,1]){
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(.11,overflowTop-overflowCrest,.36),portalSteel);
    jamb.name='overflow-opening-finished-jamb';
    jamb.position.set(side*1.69,(overflowCrest+overflowTop)/2,doorZ);root.add(jamb);
  }
  const crestLip=new THREE.Mesh(new RoundedBoxGeometry(3.45,.07,.55,2,.02),portalSteel);
  crestLip.name='physical-overflow-crest';crestLip.position.set(0,overflowCrest-.035,doorZ);root.add(crestLip);
  beam(root,[-1.74,overflowTop,doorZ+.14],[1.74,overflowTop,doorZ+.14],.035,brass);
  for(const side of [-1,1]){
    const post=new THREE.Mesh(new RoundedBoxGeometry(.34,3.72,.46,2,.07),portalSteel);
    post.name='watertight-door-frame-post';post.position.set(side*1.52,1.91,doorZ);root.add(post);
    for(const y of [.35,.75,1.15,1.55,1.95,2.35,2.75,3.15])mesh(root,new THREE.SphereGeometry(.045,9,7),brass,[side*1.52,y,doorZ+.25]);
  }
  const header=new THREE.Mesh(new RoundedBoxGeometry(3.45,.38,.5,2,.06),portalSteel);
  header.name='watertight-door-header';header.position.set(0,3.75,doorZ);root.add(header);
  const door=new THREE.Mesh(new RoundedBoxGeometry(2.58,3.35,.20,3,.08),mat('#39474c',{metalness:.48,roughness:.5}));
  door.name='vertically-sliding-watertight-door';door.position.set(0,1.82,doorZ+.04);root.add(door);
  for(const y of [.62,1.24,2.4,3.02]){
    beam(root,[-1.20,y,doorZ+.19],[1.20,y,doorZ+.19],.055,portalSteel);
    for(const x of [-1.08,-.72,-.36,.36,.72,1.08])mesh(root,new THREE.SphereGeometry(.035,8,6),brass,[x,y,doorZ+.25]);
  }
  // Handwheel and gearing make the scale and mechanism legible in close shots.
  const wheel=new THREE.Group();wheel.position.set(.78,1.82,doorZ+.19);wheel.name='watertight-door-handwheel';root.add(wheel);
  mesh(wheel,new THREE.TorusGeometry(.39,.055,10,40),brass);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(wheel,[0,0,0],[.35*Math.cos(a),.35*Math.sin(a),0],.028,brass);}
  mesh(wheel,new THREE.CylinderGeometry(.12,.12,.20,20),brass).rotation.x=Math.PI/2;
  const sill=new THREE.Mesh(new RoundedBoxGeometry(3.1,.20,.64,2,.04),portalSteel);
  sill.name='watertight-door-raised-sill';sill.position.set(0,.24,doorZ);root.add(sill);
  const guide=new THREE.Mesh(new RoundedBoxGeometry(3.15,.24,.68,2,.04),portalSteel);
  guide.name='door-track-above-opening';guide.position.set(0,3.98,doorZ);root.add(guide);

  // A second complete bulkhead closes the far end and seats its door in the
  // wall, giving the corridor depth without exposing a hole to the sky.
  const farOpeningCenter=-.72,farOpeningWidth=3.0;
  for(const side of [-1,1]){
    const span=side<0?(width/2+farOpeningCenter-farOpeningWidth/2):(width/2-farOpeningCenter-farOpeningWidth/2);
    const center=side<0?(-width/2+span/2):(farOpeningCenter+farOpeningWidth/2+span/2);
    const panel=new THREE.Mesh(new THREE.BoxGeometry(span,height,.22),transverseWall);
    panel.name='continuous-far-bulkhead-wing';panel.position.set(center,height/2,-8.9);root.add(panel);
  }
  const farLintel=new THREE.Mesh(new THREE.BoxGeometry(farOpeningWidth,height-3.38,.22),transverseWall);
  farLintel.name='continuous-far-bulkhead-over-door';farLintel.position.set(farOpeningCenter,(height+3.38)/2,-8.9);root.add(farLintel);
  const farDoor=new THREE.Mesh(new RoundedBoxGeometry(2.1,3.15,.16,2,.06),mat('#465257',{metalness:.42,roughness:.58}));
  farDoor.name='distant-watertight-door';farDoor.position.set(-.72,1.72,-7.95);root.add(farDoor);
  for(const side of [-1,1])beam(root,[-.72+side*1.18,.12,-7.72],[-.72+side*1.18,3.45,-7.72],.055,brass);
  for(const z of [-6,0,6]){
    const housing=new THREE.Group();housing.position.set(0,4.25,z);root.add(housing);
    mesh(housing,new THREE.CylinderGeometry(.15,.2,.18,18),mat('#705d42',{metalness:.45,roughness:.38}),[0,0,0]);
    mesh(housing,new THREE.SphereGeometry(.16,18,12),new THREE.MeshStandardMaterial({color:'#f3d7a3',emissive:'#ffc776',emissiveIntensity:.92,roughness:.32}),[0,-.05,0]);
    const glow=new THREE.PointLight('#ffd59a',2.1,7,2);glow.position.set(0,-.15,0);housing.add(glow);
  }
  // Floor seams, raised anti-slip strips and drain channels ground the room.
  for(let z=-8.3;z<=8.3;z+=.55){
    beam(root,[-3.7,.125,z],[3.7,.125,z],.009,z%2?brass:iron);
  }
  for(const x of [-2.7,-1.35,0,1.35,2.7]){
    const drain=mesh(root,new THREE.BoxGeometry(.055,.025,length-.7),iron,[x,.135,(front+back)/2]);drain.name='deck-drain-channel';
  }

  const floodMode=params.floodMode||variant;
  const waterMat=()=>new THREE.MeshPhysicalMaterial({color:'#477a88',metalness:.08,roughness:.2,transparent:true,opacity:.82,depthWrite:false,clearcoat:.96,clearcoatRoughness:.12,emissive:'#123640',emissiveIntensity:.32,side:THREE.DoubleSide});
  const makeWater=(name,zCenter,segmentLength)=>{
    const geometry=new THREE.PlaneGeometry(7.55,segmentLength,38,Math.max(24,Math.round(segmentLength*5)));
    geometry.rotateX(-Math.PI/2);
    const surface=new THREE.Mesh(geometry,waterMat());surface.name=name+'-wave-surface';surface.position.set(0,.18,zCenter);surface.visible=false;surface.renderOrder=4;root.add(surface);
    const volume=new THREE.Mesh(new THREE.BoxGeometry(7.5,1,segmentLength),new THREE.MeshPhysicalMaterial({color:'#386b79',roughness:.35,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}));
    volume.name=name+'-water-depth';volume.position.set(0,.18,zCenter);volume.scale.y=.001;volume.visible=false;root.add(volume);
    return {surface,volume,geometry,base:geometry.attributes.position.array.slice(),zCenter};
  };
  const farWater=makeWater('aft-compartment-water',(-8.75+doorZ-.12)/2,doorZ-.12+8.75);
  const nearWater=makeWater('forward-compartment-water',(doorZ+.12+8.6)/2,8.6-doorZ-.12);
  const spillMaterial=new THREE.MeshPhysicalMaterial({color:'#8bd4df',metalness:.02,roughness:.18,transparent:true,opacity:.72,depthWrite:false,clearcoat:.98,clearcoatRoughness:.08,emissive:'#245d6d',emissiveIntensity:.48,side:THREE.DoubleSide});
  const spill=new THREE.Mesh(new THREE.PlaneGeometry(2.55,1.1,28,20),spillMaterial);
  spill.name='water-overtopping-bulkhead';spill.position.set(0,overflowCrest-.55,doorZ+.34);spill.visible=false;spill.renderOrder=5;root.add(spill);
  const crestSheet=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.76,28,8),spillMaterial.clone());
  crestSheet.geometry.rotateX(-Math.PI/2);crestSheet.name='water-crossing-open-crest';
  crestSheet.position.set(0,overflowCrest+.035,doorZ);crestSheet.visible=false;crestSheet.renderOrder=5;root.add(crestSheet);
  const spillStreaks=[];
  for(const [index,x] of [-.92,-.34,.34,.92].entries()){
    const geometry=new THREE.PlaneGeometry(.17,1.35,6,22);
    const streak=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#91dce8',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    streak.name='watertight-overflow-stream';streak.position.set(x,overflowCrest-.675,doorZ+.37);streak.visible=false;streak.renderOrder=6;
    streak.userData={index,base:geometry.attributes.position.array.slice()};root.add(streak);spillStreaks.push(streak);
  }
  const motion=params.doorMotion||'hold',doorStart=Math.max(0,Number(params.doorStart)||0),doorDuration=Math.max(.35,Number(params.doorDuration)||.9);
  const floodStart=Math.max(0,Number(params.floodStart)||0),floodDuration=Math.max(.5,Number(params.floodDuration)||2.4);
  const setWater=(row,t,level)=>{
    const depth=Math.max(0,level-.18);row.surface.visible=depth>.035;row.volume.visible=depth>.035;
    row.surface.position.y=Math.max(.18,level);row.volume.scale.y=Math.max(.001,depth);row.volume.position.y=.18+depth/2;
    const attr=row.geometry.attributes.position;
    for(let i=0;i<attr.count;i++){
      const x=row.base[i*3],z=row.base[i*3+2];
      attr.setY(i,row.base[i*3+1]+.045*Math.sin(x*.82+z*.58+t*1.22)+.024*Math.sin(x*1.73-z*1.06-t*.9));
    }
    attr.needsUpdate=true;row.geometry.computeVertexNormals();
  };
  root.userData.sample=t=>{
    const doorProgress=motion==='close'?smooth(doorStart,doorStart+doorDuration,t):motion==='open'?1-smooth(doorStart,doorStart+doorDuration,t):1;
    door.position.y=motion==='hold'?1.82:THREE.MathUtils.lerp(3.82,1.82,doorProgress);
    if(motion==='lock')wheel.rotation.z=THREE.MathUtils.lerp(0,Math.PI*2,smooth(doorStart,doorStart+doorDuration,t));
    let farLevel=.18,nearLevel=.18,spillProgress=0;
    if(floodMode==='limited'){
      const level=THREE.MathUtils.lerp(.18,1.12,smooth(floodStart,floodStart+floodDuration,t));
      if(params.waterSide==='near')nearLevel=level;else farLevel=level;
    }
    if(floodMode==='overflow'){
      farLevel=THREE.MathUtils.lerp(.18,4.48,smooth(floodStart,floodStart+floodDuration,t));
      nearLevel=THREE.MathUtils.lerp(.18,2.35,smooth(floodStart+.9,floodStart+floodDuration+1.2,t));
      // The spill cannot exist until water reaches the actual open sill.
      spillProgress=smooth(overflowCrest+.01,overflowCrest+.18,farLevel);
    }
    setWater(farWater,t,farLevel);setWater(nearWater,t,nearLevel);
    spill.visible=spillProgress>.02;spill.material.opacity=.72*spillProgress;spill.scale.y=Math.max(.02,spillProgress);
    const spillTop=Math.max(overflowCrest+.025,farLevel-.045);
    spill.position.y=spillTop-(1.1*spill.scale.y)/2;
    crestSheet.visible=spillProgress>.02;crestSheet.material.opacity=.7*spillProgress;
    crestSheet.position.y=spillTop;
    for(const streak of spillStreaks){
      streak.visible=spillProgress>.08;streak.material.opacity=.30*spillProgress;streak.scale.y=.18+.82*spillProgress;
      streak.position.y=spillTop-(1.35*streak.scale.y)/2;
      const p=streak.geometry.attributes.position,{base,index}=streak.userData;
      for(let i=0;i<p.count;i++){
        const x=base[i*3],y=base[i*3+1];
        p.setX(i,x+.052*Math.sin(y*5.8+t*2.1+index));
        p.setZ(i,base[i*3+2]+.034*Math.sin(y*4.6-t*1.7+index*.8));
      }
      p.needsUpdate=true;streak.geometry.computeVertexNormals();
    }
    const p=spill.geometry.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.045*Math.sin(x*2.2+y*3.6+t*2.1));}
    p.needsUpdate=true;spill.geometry.computeVertexNormals();
  };
  root.userData.hydrology={illustrative:true,overflowCrest,overflowTop,path:'framed-upper-opening',doorZ};
  root.userData.sample(0);
  return root;
}
