import * as THREE from 'three';

// Camera-facing, compact light source based on Three.js Sprite/SpriteMaterial.
// A generated radial DataTexture keeps the glow local and deterministic: no
// external texture, bloom pass, or continuous animation is needed.
function makeGlowTexture(){
  const size=128;
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=(x+.5-size/2)/(size/2),dy=(y+.5-size/2)/(size/2);
    const r=Math.sqrt(dx*dx+dy*dy);
    const edge=1-THREE.MathUtils.smoothstep(r,.58,1);
    const alpha=Math.max(0,Math.exp(-r*r*5.4)*edge);
    const i=(y*size+x)*4;
    data[i]=255;data[i+1]=255;data[i+2]=255;data[i+3]=Math.round(alpha*255);
  }
  const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
  texture.magFilter=THREE.LinearFilter;
  texture.minFilter=THREE.LinearFilter;
  texture.generateMipmaps=false;
  texture.needsUpdate=true;
  return texture;
}

export function create({params={}}={}){
  const root=new THREE.Group();
  root.name='low-green-lifeboat-light';
  const texture=makeGlowTexture();
  const visibilityScale=THREE.MathUtils.clamp(Number(params.visibilityScale)||1,.6,2.4);
  const layers=[
    {name:'green-light-halo',color:0x27f078,size:1.08,opacity:.38,offset:0},
    {name:'green-light-core',color:0x65ff8e,size:.34,opacity:.82,offset:.055},
    {name:'green-light-hotspot',color:0xeaffed,size:.115,opacity:.96,offset:.09}
  ];
  const sprites=layers.map(layer=>{
    const material=new THREE.SpriteMaterial({
      map:texture,
      color:layer.color,
      transparent:true,
      opacity:0,
      blending:THREE.AdditiveBlending,
      depthTest:true,
      depthWrite:false,
      toneMapped:false,
      sizeAttenuation:true
    });
    const sprite=new THREE.Sprite(material);
    sprite.name=layer.name;
    sprite.position.set(0,.22+layer.offset,layer.offset);
    sprite.scale.setScalar(layer.size*visibilityScale);
    sprite.renderOrder=2;
    root.add(sprite);
    return {sprite,baseOpacity:layer.opacity};
  });

  // A faint physical bounce makes the source belong to the boat when it is
  // close enough to read, while the sprites keep it visible across the sea.
  const bounce=new THREE.PointLight(0x48ff70,0,2.8,2);
  bounce.name='green-light-local-bounce';
  bounce.position.set(0,.18,.12);
  root.add(bounce);

  // The beat owns the read window. Existing callers retain the original
  // 0–.22 s settle and 2.7–3.4 s fade; longer shots can keep the source visible.
  const enterAt=Number.isFinite(params.enterAt)?Math.max(0,params.enterAt):0;
  const fadeIn=Number.isFinite(params.fadeIn)?Math.max(.001,params.fadeIn):.22;
  const hold=Number.isFinite(params.hold)?params.hold:params.holdFor;
  const exitAt=Number.isFinite(params.exitAt)?Math.max(enterAt,params.exitAt)
    :Number.isFinite(hold)?enterAt+fadeIn+Math.max(0,hold):2.7;
  const fadeOut=Number.isFinite(params.fadeOut)?Math.max(.001,params.fadeOut):.7;
  root.userData.signalTiming={enterAt,fadeIn,exitAt,fadeOut};
  root.userData.sample=t=>{
    const reveal=t<enterAt?0:(.9+.1*THREE.MathUtils.smoothstep(t,enterAt,enterAt+fadeIn))
      *(1-THREE.MathUtils.smoothstep(t,exitAt,exitAt+fadeOut));
    // Small, repeatable breathing only; the signal never flashes or streaks.
    const breath=.96+.04*Math.sin(Math.max(0,t)*3.1);
    for(const {sprite,baseOpacity} of sprites)sprite.material.opacity=baseOpacity*reveal*breath;
    bounce.intensity=1.15*reveal*breath;
  };
  root.userData.sample(0);
  return root;
}
