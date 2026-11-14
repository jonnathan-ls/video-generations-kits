import {project,registry} from './project.js';
import {mountComposition} from './source/kit/engine/composition.js';
window.__hf=window.__hf||{};window.__hf.buildReady=window.__hf.buildReady||{};
window.__hf.buildReady['scene']=(async()=>{
 const player=await mountComposition({canvas:document.getElementById('scene'),project,registry,loadCustom:name=>import('./source/kit/assets/'+name)});
 const renderAt=time=>{const t=Math.min(project.duration,Math.max(0,Number(time)||0));player.renderAt(t);const label=document.getElementById("ship-label-text");label.style.opacity=t>=8.411&&t<19.6?"1":"0";label.textContent=t<15.739?"CARPATHIA · RESGATE":"TITANIC";for(const [index,caption] of (project.captions||[]).entries()){const element=document.getElementById('caption-'+String(index+1).padStart(3,'0')+'-text');if(element){const visible=t>=caption.start&&t<caption.start+caption.duration;element.style.visibility=visible?'visible':'hidden';element.classList.toggle('question-active',visible&&caption.text.trim().endsWith('?'));}}};
 const clock={t:0};const tl=gsap.timeline({paused:true}).to(clock,{t:project.duration,duration:project.duration,ease:'none',onUpdate:()=>renderAt(clock.t)});
 for(const [index,caption] of (project.captions||[]).entries()){
  const element=document.getElementById('caption-'+String(index+1).padStart(3,'0')+'-text');
  tl.set(element,{visibility:'visible'},caption.start);
  tl.set(element,{visibility:'hidden'},caption.start+caption.duration);
 }
 window.addEventListener('hf-seek',e=>tl.time(e.detail.time));
 window.__timelines=window.__timelines||{};window.__timelines['root']=tl;tl.time(0);renderAt(0);
 const preview={player,renderAt,tl};window.__hf.preview=preview;return preview;
})().catch(error=>{const status=document.getElementById('preview-status');if(status)status.textContent='Erro ao montar: '+error.message;throw error;});
