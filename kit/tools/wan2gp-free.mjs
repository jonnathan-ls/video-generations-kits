import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {localPath} from '../integrations/wan2gp/adapter.mjs';
import {shots,assembleComparison} from '../integrations/wan2gp/comparison.mjs';

const directory='kit/projects/arco-alvenaria-wan2gp-livre';
const actions=[
  'A front close view of the crown of an unfinished semicircular arch. One red trapezoid keystone is suspended above the central gap. It slowly lowers into the gap, touches the two neighboring wedges and stops flush with them. The other bricks do not move. The camera holds still so the insertion is clearly visible.',
  'An intact semicircular brick arch stands on two massive stone piers. The right pier slowly moves outward once. A narrow gap opens between two wedges near that support and the arch begins to sag. Make the physical separation readable. Show the entire arch and both supports in one shot, not a huge explosion.',
  'A complete semicircular brick arch stands stable on two thick stone piers. The camera slowly circles through a small angle, revealing the empty space under the arch and the wedge-shaped bricks touching each other. Keep the arch stable, with visible contact between the stones and the workbench.',
  'Extreme close view tracking along the curved ring of a brick arch. Red tapered wedge bricks press against one another along their radial faces. Begin at the central keystone, then move down the curve to the stone pier. Closely fitted edges and physical contact are the main subject.',
  'Macro cinematic view of pale mortar joints between rough red wedge bricks in a masonry arch. A single bead of fresh mortar fills a narrow joint between two touching wedges. The camera slowly slides past the joint, revealing rough clay and fine lime mortar texture.',
  'A half-built brick arch rests on a curved wooden centering frame in a masonry workshop. Thick wooden legs carry the curved timber ribs and touch the workbench. Wedge bricks lie only on the top curve, with a clearly unfinished central gap. Slowly reveal the wooden support underneath.',
  'A curved wooden centering frame supports the red wedge bricks of a half-built arch. One final keystone lowers into the central gap and completes the ring. All wood remains in contact beneath the bricks, and the two thick stone piers remain planted on the workbench.',
  'The brick arch is complete and stable on its two stone piers. The curved wooden centering frame beneath it lowers slightly, clearing the underside of the arch, then slides forward out of the opening. The masonry stays still after the support leaves. Show one clear removal action.',
  'Begin with a close view of the central keystone of a completed arch. Slowly pull back to reveal its neighboring wedge bricks and the entire ring reaching both stone piers. The keystone belongs to the connected ring; every brick remains touching its neighbor.',
  'A completed red brick arch rests on two solid stone piers. The camera tracks down a pier to its wide solid foundation and the workbench below, then reveals the unobstructed empty space beneath the arch. End on a stable frontal view of the whole arch, resting firmly on both supports.'
];
const style='Cinematic 3D educational animation, physically coherent red wedge brick masonry and pale stone supports on a stone workbench in a bright stonemason workshop. Warm daylight through high windows, softly blurred hand tools in the background, realistic rough clay, wood grain and fine mortar, clear silhouettes. One main action per shot. ';
const negative='captions, subtitles, text, logo, watermark, written labels, unreadable letters, extra arches, melted bricks, floating blocks, disconnected supports, explosions, morphing buildings, flicker, camera shake';
try {
  const action=process.argv[2];
  if(action==='prepare'){
    const narration=await fs.readFile(localPath(`${directory}/narration.txt`));
    const plan={schemaVersion:1,id:'arco-alvenaria-wan2gp-livre',title:'Arco de alvenaria — geração independente por narrativa',
      duration:41.576,sourceVideo:'kit/projects/arco-alvenaria/render/video.mp4',
      sourceNarrationSha256:createHash('sha256').update(narration).digest('hex'),
      sourceVideoUsage:'Somente áudio e painel de comparação na montagem; nunca entrada da geração.',
      originalVisualsAllowedAsInput:false,approval:{plan:'pending',newClips:'pending',finalPreview:'pending'},
      generation:{model:'t2v_nexus_1.3B',mode:'text-to-video',width:432,height:768,fps:16,steps:6,
        note:'Teste do modelo leve instalado. Cenário e encenação novos, sem guia visual do original. Não representa todos os modelos do Wan2GP.'},
      shots:shots.map(([id,start,end],i)=>({id,start,end,duration:end-start,frames:4*Math.ceil((end-start)*16/4)+1,
        prompt:style+actions[i],negativePrompt:negative,seed:79137+i,review:'pending',generated:false,requiredFile:`wan2gp-output/${id}.mp4`}))};
    const queue=plan.shots.map(s=>({model_type:plan.generation.model,prompt:s.prompt,negative_prompt:negative,
      resolution:'432x768',video_length:s.frames,num_inference_steps:6,guidance_scale:1,flow_shift:5,
      seed:s.seed,repeat_generation:1,image_mode:0,output_filename:s.id}));
    // A lista permitida é deliberadamente textual: nenhum campo de mídia da
    // origem pode entrar na geração independente.
    for(const t of queue)for(const key of Object.keys(t))
      if(/guide|image_refs|image_start|video_source|denoising_strength/.test(key))throw new Error('Guia visual proibido neste teste.');
    await fs.writeFile(localPath(`${directory}/generation-plan.json`),JSON.stringify(plan,null,2)+'\n');
    await fs.writeFile(localPath(`${directory}/generation/video.json`),JSON.stringify(queue,null,2)+'\n');
    await fs.writeFile(localPath(`${directory}/generation/hook.json`),JSON.stringify(queue[0],null,2)+'\n');
    console.log('Dez pedidos preparados, somente texto, 432×768.');
  }else if(action==='assemble-internal')console.log(JSON.stringify(await assembleComparison({directory,label:'WAN2GP LIVRE',stamp:'EXPERIMENTO WAN2GP LIVRE - QA PENDENTE'}),null,2));
  else throw new Error('Uso interno: wan2gp-free.mjs prepare | assemble-internal');
}catch(error){console.error(error.message);process.exitCode=1;}
