import * as THREE from 'three';
// A short distant luminous signal, without exposing its emitter.
export function create(){
 const root=new THREE.Group();
 const material=new THREE.ShaderMaterial({uniforms:{intensity:{value:0},phase:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float intensity;uniform float phase;varying vec2 vUv;
 void main(){vec2 p=(vUv-.5)*2.;float core=exp(-pow(p.x/.045,2.)-pow((p.y-.18)/.13,2.));
 float halo=exp(-pow(p.x/.29,2.)-pow((p.y-.18)/.33,2.))*.38;
 float trail=exp(-pow((p.x-sin(p.y*8.+phase)*.018)/.055,2.))*smoothstep(-.65,-.28,p.y)*(1.-smoothstep(.02,.17,p.y))*.24;
 vec3 c=mix(vec3(.20,.76,.32),vec3(.91,1.,.88),min(1.,core*1.5));
 gl_FragColor=vec4(c,(core+halo+trail)*intensity);}`});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(5,6.5),material);plane.name='distant-flare';root.add(plane);
 root.userData.sample=t=>{const rise=THREE.MathUtils.smoothstep(t,.45,1.05),fade=1-THREE.MathUtils.smoothstep(t,1.8,3.4);plane.material.uniforms.intensity.value=rise*fade;plane.material.uniforms.phase.value=t;plane.position.y=-Math.max(0,t-1)*.22;};root.userData.sample(0);return root;
}
