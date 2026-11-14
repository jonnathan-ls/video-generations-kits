# Pesquisa de qualidade gráfica — História da Rockstar

Data da pesquisa: 08/11/2026. Escopo: viewer Three.js navegável e acabamento de motion graphics. Sem render do vídeo final.

## Auditoria do kit local

A prévia já usava Three.js 0.187.0, `RoundedBoxGeometry`, `RoomEnvironment`/PMREM, `Sky` como referência descartada para dioramas, `OrbitControls` sem auto-rotação/damping, `Sprite`/`CanvasTexture` para cartelas e `TubeGeometry` para rotas. Movimento e câmera são funções de tempo absoluto, compatíveis com seeks fora de ordem. O registro anterior está em `kit/quality/decisions.md` e em `kit/projects/historia-rockstar/preview-qa.json`.

A lacuna: `scene-review.js` ainda fazia render direto com ACES Filmic, SRGB, sombras PCF e exposição. Não havia `EffectComposer`, anti-aliasing para o buffer offscreen ou outro acabamento de pós-processo.

## Referências locais aplicadas

Instalação local confirmada: Three.js 0.187.0. Não há demo HTML de postprocessing empacotada dentro de `node_modules/three/examples`; por isso consultei as implementações JSM que o projeto import map já serve localmente:

- `node_modules/three/examples/jsm/postprocessing/EffectComposer.js`: ordena passes e gerencia buffers; a composição passa a chamar `composer.render()`.
- `node_modules/three/examples/jsm/postprocessing/RenderPass.js`: entrada da cadeia com o beauty pass de cena/câmera.
- `node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js`: seleção de altas luzes por limiar e pirâmide de desfoque; exige tone mapping ativo.
- `node_modules/three/examples/jsm/postprocessing/SMAAPass.js`: suavização espacial em linear-sRGB, antes da transformação de saída.
- `node_modules/three/examples/jsm/postprocessing/OutputPass.js`: converte para o espaço de saída e tone mapping configurados no renderer.
- `node_modules/three/examples/jsm/shaders/VignetteShader.js`: inspecionado e descartado porque os fundos já são escuros e a vinheta reduziria a leitura das bordas.

A ordem implementada é `RenderPass → UnrealBloomPass → SMAAPass → OutputPass`. A primeira configuração do bloom (força `.14`, raio `.16`, limiar `.92`) foi reprovada por lavar a foto e o tampo. A configuração final é força `.035`, raio `.12`, limiar `1.1`, com realce discreto. O renderizador continua em ACES Filmic/SRGB; `composer.render(0)` mantém os passes independentes de tempo e os movimentos continuam amostrados pela função determinística da cena. O composer acompanha o tamanho do stage. Nenhum pacote foi instalado.

## Pesquisa pública de ferramentas/skills

Estrelas conferidas nos repositórios oficiais do GitHub em 08/11/2026; os números mudam.

| Projeto | Estrelas aproximadas | O que é | Aplicabilidade neste viewer |
| --- | ---: | --- | --- |
| [CloudAI-X Three.js Skills](https://github.com/CloudAI-X/threejs-skills) | 4,1 mil | Coleção de skills de Three.js, incluindo `threejs-postprocessing` | É o encaixe mais direto: cobre EffectComposer, bloom, SMAA, color transform e resizing. A documentação consultada mira Three.js r186; o kit usa 0.187.0, então validei cada técnica contra as fontes instaladas locais. A skill foi pesquisada, não instalada. |
| [Remotion Agent Skills](https://github.com/remotion-dev/skills) | 6,6 mil | Skills oficiais para projetos Remotion; `remotion-markup` inclui timing, animação, efeitos e orientação 3D | Fonte útil de princípios: motion dirigido por quadro/tempo, efeito aplicado ao alvo correto e regras específicas de 3D. É voltada a React/Remotion; não foi instalada nem aplicada literalmente. |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | 19,7 mil | Framework/editor TypeScript de motion graphics | Boa referência para organizar tweens, pausas e easing; `smooth(t)` da prévia já usa uma curva cúbica de entrada/saída similar. Não substitui o renderer Three.js e não precisa entrar neste projeto. |
| [Three.js postprocessing do pmndrs](https://github.com/pmndrs/postprocessing) | 3,0 mil | Biblioteca de efeitos em cadeia para Three.js | Alternativa popular para efeitos adicionais. Os passes nativos locais já atendem ao passe atual sem nova dependência. |
| [Remotion](https://github.com/remotion-dev/remotion) | 71,6 mil | Framework React para vídeo programático | Repositório/framework, não uma skill. Útil para produção de vídeo; não introduzimos no viewer porque a entrega desta etapa é a composição navegável no kit. |

Fontes oficiais consultadas: [CloudAI-X `threejs-postprocessing` skill](https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-postprocessing/SKILL.md), [Remotion Agent Skills](https://www.remotion.dev/docs/ai/skills), [skill de 3D do Remotion](https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-markup/3d.md), [guia de tweening do Motion Canvas](https://github.com/motion-canvas/motion-canvas/blob/main/packages/docs/docs/getting-started/tweening.mdx), [manual oficial de pós-processamento Three.js](https://threejs.org/manual/pages/post-processing.html).

## QA do passe

QA concluído: 105 capturas em 1440×900, 170 amostras temporais (incluindo 65 seeks fora de ordem), 13 cenas em 390×844 CSS px, sem erros de navegador ou overflow. As cenas 01, 05 e 11 e a folha de contato foram inspecionadas para verificar foto, cartelas, linhas claras e superfícies. Resultado: o SMAA mantém as arestas limpas e o bloom discreto preserva detalhes; o viewer retorna a `ready-for-creator-review`, sem conceder aprovação estética humana. Evidências em `research/frames/historia-rockstar-preview/quality-pass-20261108/`.
