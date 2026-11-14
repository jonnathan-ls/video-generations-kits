---
name: render
description: Compor assets 3D aprovados em cenas determinísticas e exportar para HyperFrames, com câmera, corte, ações e áudio sincronizados. Use quando a narrativa e os recursos já foram mapeados; bloqueia produção com assets sem aprovação.
---

Leia `kit/docs/render.md`. Confirme o asset-plan, a voz alinhada e as revisões humanas antes da composição. Siga `kit/docs/qualidade-audiovisual.md` para composição final, motion gráfico e arquivos de legenda.

Você é a LLM operadora do kit. Execute as ferramentas e edite os arquivos; não peça ao usuário para executar comandos. Ele valida e aprova pelo chat e pela aplicação.

Referencie assets por ID, variante e revisão no project.json. Cada cena deriva de um beat e preenche `visualPlan` com alvo de atenção, pergunta visual, evento, estados antes/depois, revelação de câmera e intenção sonora. Não converter palavras-chave em uma categoria visual fixa para preencher cenas. Mostre a ação específica que a narração descreve; rotação de câmera não substitui processo. Preserve escala e orientação entre planos. Cenas são dados; a geometria reside nos módulos reutilizáveis.

Componha a partir dos beats aprovados: mantenha um alvo visual principal por momento, sincronize a entrada/saída dos efeitos à explicação e reserve pausas curtas para ler cada revelação. Faça cortes quando muda a pergunta, a evidência ou o estado, sem impor cadência fixa. Cada cena declara no mínimo **5 recursos** (objeto/cenário, personagem/ação, câmera, luz, overlay/efeito, transição, som, material, animação), **sem teto máximo**; mais recursos são bem-vindos quando servem ao acontecimento. Uma cena não pode cobrir um parágrafo/gancho com várias frases; conte cenas × unidades de fala. Confira que câmera, legendas e efeitos não cubram nem disputem o mecanismo no quadro vertical. Se um alvo, composição ou evento retornar, declare `returnVisit` ligado à cena anterior, sua função narrativa e a diferença visível; zoom, cor e ângulo sozinhos não liberam o retorno. `npm run validar` é o bloqueio de estrutura antes da exportação.

Em motion 2D, não espere a peça inteira: renderize um draft de 10–30 s assim que a primeira cena existir, inspecione frames reais e só então expanda. O arquivo final é o MP4; não crie uma prévia separada para uma peça 2D.

Rode `npm run validar -- projeto.json`, corrija falhas e exporte com `node kit/tools/export-hyperframes.mjs projeto.json`. O modo --preview serve para revisar recursos pendentes e deve manter sua marca visual. Nunca remover o bloqueio de produção para economizar tempo.

## Produção e correção incremental

Para longas e revisões locais, leia `kit/docs/render-incremental.md`. Compile o storyboard com `kit/tools/storyboard-compile.mjs`: ele recusa texto/tempo divergente, câmera ausente, recurso inexistente e cena apenas descrita. `--diagnostic` conserva os gaps e só serve à inspeção interna. O gerador antigo por categorias do Titanic foi aposentado e não escreve mais o projeto de produção.

Use `render-segments.mjs plan/status/export/render/assemble` em pacotes delimitados por cortes, sem quebrar uma ação ao meio. Blocos de três minutos organizam a revisão; pacotes menores organizam captura/cache. `--quantize` audita arredondamento dos cortes ao frame, conservando tempo do áudio, onsets das legendas e fase local das ações. Um ajuste invalida os pacotes dependentes; uma mudança do runtime compartilhado invalida todos. Narração e mixagem ficam fora da captura visual e entram na montagem final.

O cache distingue diagnóstico marcado de delivery. Nunca reutilizar diagnóstico como entrega limpa. `--delivery` exige plano, recursos e QA da origem válidos; cada fatia comprova vínculo exato com a origem. A montagem registra checksum e ainda precisa da inspeção profissional do arquivo montado. Antes/depois de cada captura, conferir dependências e logs de aceleração. A fila GPU é única na máquina; agentes podem trabalhar em tarefas independentes enquanto ela captura, sem alterar dependências do pacote ativo.

Para movimento de objetos/partes, use `scene.motion`: alvo real, parte nomeada, propriedade e keyframes locais com preparação, ação e pausa. A amostragem responde a busca fora de ordem e não acumula transformações. Dinamismo vem da ação narrada; 3–5 segundos por frase é referência de edição deste projeto, não temporizador para cortes aleatórios.

Legenda deste projeto usa `captionStyle.reveal: progressive-word`, completando a frase nos onsets reais de cada palavra. Não chamar distribuição uniforme de alinhamento acústico. Conservar métricas e alertas de confiança; tempos tecnicamente válidos não concedem aprovação auditiva.

Aplique a skill HyperFrames disponível no ambiente para check, snapshots e preview. Busque transições genéricas no catálogo antes de criar outra. Todo estado é função do tempo e responde a hf-seek. Não adicionar temporizadores ou buscar mídia remota durante render.

Abra quadros do começo, contato, corte e resultado de cada unidade explicativa. Mostre a timeline editável antes do render final. Renderize mediante pedido do arquivo ou aprovação da prévia. Valide vídeo decodificado e áudio final, não só o HTML.

## Pré-requisito de aceleração para render longo

Composições **DOM/SVG 2D sem WebGL** não exigem prova de GPU. Para elas, o draft pode ser capturado por screenshot/beginframe em software; registre o modo no QA e não bloqueie a entrega por “software gpu”. A prova GPU-first abaixo vale para cenas Three.js/WebGL.

O fluxo local é GPU-first. Antes de uma captura integral, faça uma prova representativa de 10–30 s com `hyperframes render --browser-gpu --gpu --no-low-memory-mode` e confirme BeginFrame. Em notebooks NVIDIA Optimus/PRIME, passe ao processo de prova e ao render integral `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia`; o OpenGL do desktop pode estar na iGPU enquanto o render precisa da RTX. A prova só vale quando o log diz `browserGpuMode probe → hardware` e nomeia NVIDIA/RTX como renderer WebGL, não há erro ao criar contexto WebGL, um quadro extraído mostra a cena real e a codificação NVENC foi confirmada quando solicitada. A linha-resumo `hardware gpu`, `--browser-gpu` forçado ou `nvidia-smi` isoladamente não provam que a composição está acelerada. Use os mesmos argumentos e variáveis no render integral. `--gpu` seleciona codificação de hardware quando disponível; `--browser-gpu` acelera a composição no Chrome. `--low-memory-mode` força screenshot e desativa BeginFrame; só usar quando a memória exigir, após explicar o impacto no prazo.

Não iniciar uma captura longa se a prova reportar `software gpu`/SwiftShader, se o caminho for `screenshot capture`, se houver erro de WebGL, se o renderer não for a GPU esperada, se o comando pedir `--no-browser-gpu` ou se `PRODUCER_BROWSER_GPU_MODE=software` estiver definido. Diagnostique primeiro o driver, PRIME, o dispositivo e a exposição de GPU ao processo. Se a GPU não puder ser disponibilizada, explique o tempo e a carga térmica esperados e peça uma decisão explícita antes de trocar para render por software. Só use o modo por software quando o usuário o escolher ou para provas curtas de QA; não faça fallback silencioso.

Se `hyperframes check` encerrar com erro de processo, leia o relatório JSON salvo antes de interromper o lote. Só classificar como falha operacional recuperável quando os únicos erros forem `check_runtime_failure`/`check_cleanup_failure` explicitamente causados por “Browser process did not exit after forced shutdown” e todos os demais domínios não tiverem erros. Registre o aviso e continue exigindo prova independente no render: WebGL/NVIDIA, captura BeginFrame, NVENC, dimensões e contagem de quadros. Qualquer erro real de página, composição, timing ou asset continua bloqueando o pacote; não converter o relatório todo em aprovação.

## Barreira de revisão profissional

Antes de apresentar uma prévia como pronta para revisão ou entregar vídeo, aplicar `skills/revisao-profissional/SKILL.md`. Reprovação retorna à correção e render interno. Player diagnóstico pode usar `--preview --internal-qa`, controles e plano visual; capturas MP4 internas ou entregáveis usam composição limpa, sem UI, texto técnico ou plano visual gravados. O estado de QA fica nos recibos e no player. A passagem do QA é separada das decisões humanas e não elimina as aprovações existentes. Respeitar revisão visual em cena quando o criador dispensar lista textual.
