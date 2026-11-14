import * as THREE from 'three';
import {ParametricGeometry} from 'three/addons/geometries/ParametricGeometry.js';
import {surface} from './period-surface-materials.js';
import {person} from './period-person-rig.js';

// Pre-composed contact garment for period-person-rig.js. Both standing and
// seated rig variants keep local shoulders near1.40; translate/scale/rotate
// this object exactly like its wearer. It is not a general cloth simulator.
export function create({variant='blanket',params={}}={}){
  const root=new THREE.Group();root.name='body-wrapped-rescue-'+variant;
  const blanket=variant!=='coat',seated=params.seated===true;
  // Optional integrated wearer is useful when a blanket covers both arms.
  // Keeping its arms underneath the cloth avoids hands intersecting a solid
  // drape. Omit withWearer when fitting a separately staged character.
  const wearer=params.withWearer===true?person({seated,hat:false,pose:'rest',color:'#4e5759'}):null;
  if(wearer){
    wearer.name='wrapped-person';root.add(wearer);
    if(blanket)for(const limb of wearer.userData.rig.arms)limb.arm.visible=false;
    root.userData.rig=wearer.userData.rig;
    root.userData.character=wearer.userData.character;
  }
  const shoulder=Number.isFinite(params.shoulderHeight)?params.shoulderHeight:1.43;
  const width=Number.isFinite(params.shoulderWidth)?params.shoulderWidth:.70;
  const collar=shoulder+.075,bottom=seated?.69:(blanket?.58:.68);
  const wool=surface('cloth');wool.color.set(params.color||(blanket?'#8b7b65':'#514b43'));
  wool.roughness=.94;wool.sheen=.3;wool.sheenColor.set('#c3b59e');wool.sheenRoughness=.9;wool.side=THREE.DoubleSide;
  const edgeMaterial=wool.clone();edgeMaterial.color.multiplyScalar(.71);
  const smooth=(a,b,t)=>THREE.MathUtils.smoothstep(t,a,b);
  const wrapEnabled=!blanket&&Number.isFinite(params.wrapAt);
  const wrapAt=wrapEnabled?Math.max(0,params.wrapAt):0;
  const wrapDuration=THREE.MathUtils.clamp(Number(params.wrapDuration)||2.2,1.6,3);
  const wrapProgress=t=>smooth(wrapAt+wrapDuration*.32,wrapAt+wrapDuration*.78,t);
  const point=(u,v,inner=false,wrap=null)=>{
    // A small overlap at the chest closes the blanket. A coat keeps an open
    // front with thick lapels, while its back and both shoulders stay full.
    let a=blanket?THREE.MathUtils.lerp(-.09,Math.PI*2+.09,u):THREE.MathUtils.lerp(.30,Math.PI*2-.30,u);
    if(wrap!==null&&!blanket){
      // Only the free chest panels sweep around the outside of the torso.
      // At collar/shoulder height the deformation is exactly zero; the back
      // is fixed too. The cloth never translates through the wearer.
      const edgeAngle=THREE.MathUtils.lerp(1.02,.025,wrap),anchored=smooth(.12,.30,v);
      if(a<Math.PI/2)a+=(edgeAngle-.30)*((Math.PI/2-a)/(Math.PI/2-.30))**2*anchored;
      else if(a>Math.PI*1.5)a-=(edgeAngle-.30)*((a-Math.PI*1.5)/(Math.PI/2-.30))**2*anchored;
    }
    // Spread immediately below the neck: the rig shoulder caps are at
    // y~1.43, so a slow cone would expose/clip both shoulders.
    const shoulderSpread=smooth(0,.075,v),taper=smooth(.22,1,v);
    const rx=THREE.MathUtils.lerp(.105,width/2+.035,shoulderSpread)-.035*taper;
    const rz=THREE.MathUtils.lerp(.105,.245,shoulderSpread)+.035*taper;
    const front=Math.max(0,Math.cos(a));
    const lap=seated&&blanket?(.19*smooth(.13,.40,v)+.24*smooth(.45,1,v))*front*front:0;
    const fold=(.020*Math.sin(a*9+v*3)+.008*Math.sin(a*19-v*5))*smooth(.08,.45,v);
    const thickness=inner?-.009:0;
    const x=(rx+fold+thickness)*Math.sin(a);
    const shoulderSag=.055*Math.sin(a)**2*shoulderSpread*(1-smooth(.10,.35,v));
    const y=THREE.MathUtils.lerp(collar,bottom,v)-shoulderSag-.022*Math.cos(a*7)*v;
    const z=(rz+fold+thickness)*Math.cos(a)+lap;
    return new THREE.Vector3(x,y,z);
  };
  const outer=new THREE.Mesh(new ParametricGeometry((u,v,p)=>p.copy(point(u,v)),64,36),wool);
  outer.name='continuous-shoulder-back-and-front-drape';outer.castShadow=true;outer.receiveShadow=true;root.add(outer);
  const lining=new THREE.Mesh(new ParametricGeometry((u,v,p)=>p.copy(point(u,v,true)),64,36),edgeMaterial);
  lining.name='thick-wool-inner-lining';lining.castShadow=true;root.add(lining);
  const tube=(name,points,radius)=>{
    const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(32,points.length*2),radius,6,false),edgeMaterial);
    m.name=name;m.castShadow=true;root.add(m);return m;
  };
  const movingEdges=[];
  for(const [name,v]of[['neck-opening-bound-edge',0],['weighted-draped-hem',1]]){
    const points=Array.from({length:89},(_,i)=>point(i/88,v));
    const edge=tube(name,points,blanket?.009:.014);
    if(v>0)movingEdges.push({mesh:edge,points:wrap=>Array.from({length:89},(_,i)=>point(i/88,v,false,wrap))});
  }
  for(const u of[0,1]){
    const edge=tube('overlapping-front-thick-edge',Array.from({length:43},(_,i)=>point(u,i/42)),blanket?.012:.022);
    movingEdges.push({mesh:edge,points:wrap=>Array.from({length:43},(_,i)=>point(u,i/42,false,wrap))});
  }
  if(!blanket){
    // Rolled collar sits around the neck rather than covering the face.
    const points=Array.from({length:53},(_,i)=>{const a=.36+i/52*(Math.PI*2-.72);return new THREE.Vector3(.13*Math.sin(a),shoulder+.065,.14*Math.cos(a));});
    tube('rolled-thick-coat-collar',points,.028);
  }
  root.userData.fit={wearerOrigin:'same as period person root',shoulderHeight:shoulder,neckClearance:.105,seated,frontLapExtent:seated&&blanket?.70:.29,withWearer:!!wearer,limits:'Designed for resting pose. For a separately staged blanket wearer, keep both arms under the drape. Raised arms, walking and large torso rotations require re-fit or parenting to upper-body with origin compensation.'};
  if(wrapEnabled)root.userData.wrap={
    start:wrapAt,duration:wrapDuration,
    phases:{prepare:[wrapAt,wrapAt+wrapDuration*.18],handsApproach:[wrapAt+wrapDuration*.18,wrapAt+wrapDuration*.38],closing:[wrapAt+wrapDuration*.32,wrapAt+wrapDuration*.78],hold:[wrapAt+wrapDuration*.78,wrapAt+wrapDuration]},
    handAnchorsAt:t=>({left:point(1,.46,false,wrapProgress(t)).toArray(),right:point(0,.46,false,wrapProgress(t)).toArray()}),
    anchor:'neck, shoulder cap and rear panel remain fixed in wearer-local space'
  };
  // Only sub-millimetre breathing of the hem; the anchored shoulder surface
  // remains stable and deterministic when frames are sampled out of order.
  const base=outer.geometry.attributes.position.array.slice(),innerBase=lining.geometry.attributes.position.array.slice();
  let lastWrap=NaN;
  root.userData.sample=time=>{
    const t=Number.isFinite(time)?time:0;
    wearer?.userData.sample?.(t);
    const wrap=wrapEnabled?wrapProgress(t):null;
    for(const [mesh,original]of[[outer,base],[lining,innerBase]]){
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const q=wrapEnabled?point((i%65)/64,Math.floor(i/65)/36,mesh===lining,wrap):null;
        const x=q?.x??original[i*3],y=q?.y??original[i*3+1],z=q?.z??original[i*3+2];
        const weight=THREE.MathUtils.clamp((shoulder-y)/.8,0,1);
        p.setXYZ(i,x,y,z+.0015*weight*Math.sin(t*.8+x*3));
      }
      p.needsUpdate=true;mesh.geometry.computeVertexNormals();
    }
    if(wrapEnabled&&wrap!==lastWrap){
      // Bound edges follow the same material points as the panels. Rebuild
      // only during changing wrap state, never leave an old floating seam.
      for(const row of movingEdges){
        const old=row.mesh.geometry,{tubularSegments,radius,radialSegments}=old.parameters;
        row.mesh.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(row.points(wrap)),tubularSegments,radius,radialSegments,false);
        old.dispose();
      }
      lastWrap=wrap;
    }
  };
  root.userData.sample(0);return root;
}
