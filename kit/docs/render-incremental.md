# Render incremental por pacotes de cenas

A direção continua responsável pelo storyboard específico de cada frase/beat. A segmentação não cria direção nem torna as cenas diferentes: organiza artefatos independentes depois de as cenas serem dirigidas. Os pacotes respeitam os cortes existentes; uma cena nunca é dividida no meio para satisfazer um número arbitrário.

`kit/tools/segment-plan.mjs` fornece `planSegments`, `createSegmentProject` e `segmentDependencies`. `kit/tools/render-segments.mjs` fornece `planProject`, `exportSegmentProjects`, `renderPlan`, `assemblePlan` e a CLI. O alvo padrão é 20 segundos por pacote, com grupos de revisão de aproximadamente três minutos. Os inícios/finais são frames inteiros e todas as cenas devem cobrir a duração sem lacunas. Projetos antigos com cortes fracionários exigem `--quantize`: gera cópia técnica sem editar a origem, com relatório por corte (`sourceTime`, `frameTime`, `deltaSeconds`, no máximo meio frame). Narração e palavras não mudam. `sourceLocalOffset`/`sourceDuration` conservam a fase de animação e o engine deve respeitá-los. Use o mesmo `--quantize` em plan, export, render, status e assemble. A resolução é do projeto.

Operação pela LLM, dentro do repositório:

```sh
node kit/tools/render-segments.mjs plan kit/projects/PROJETO/project.json
node kit/tools/render-segments.mjs export kit/projects/PROJETO/project.json
node kit/tools/render-segments.mjs render kit/projects/PROJETO/project.json --cli /CAMINHO/LOCAL/hyperframes/dist/cli.js --only shotpack-CENA_INICIAL-CENA_FINAL
node kit/tools/render-segments.mjs status kit/projects/PROJETO/project.json
node kit/tools/render-segments.mjs assemble kit/projects/PROJETO/project.json --audio kit/projects/PROJETO/audio/master.wav --output kit/projects/PROJETO/render/diagnostico.mp4
```

`plan` e `status` não acionam GPU. `export` grava subprojetos, manifesto e dependências sem capturar frames. A instalação local do CLI deve ser informada explicitamente; não há instalação ou troca de versão automática. `--target-seconds` altera o tamanho alvo e `--cache-root` permite separar caches. `render --only` corrige apenas os pacotes selecionados. Uma fila usa lock global por usuário e só executa um processo de GPU por vez; ao encontrar outra fila viva, recusa iniciar concorrência. Lock abandonado por processo inexistente é recuperado automaticamente.

## Cache e invalidação

Cada pacote tem hash do seu projeto visual local (cenas, overlays, legendas, look), definições e arquivos dos assets utilizados, importações locais transitivas desses módulos, engine comum, exportador, ferramentas de segmentação, configuração de dependências e fontes. Assets customizados não usados não invalidam o pacote. O legado compartilha implementação monolítica: mudanças nessa implementação invalidam os pacotes que usam assets legados. O catálogo global e suas revisões amplas não entram no hash.

`def.files` permite declarar arquivos locais de textura ou mídia lidos por um asset além dos imports JS. Recursos carregados dinamicamente precisam declarar esses arquivos: a resolução de uma URL escrita no código não deve depender de recurso externo ou mutável. Alterar código comum invalida todos os dependentes. Alterar apenas mixagem/narração não pede novo render 3D, desde que o timing, as legendas e a encenação permaneçam os mesmos. Alterar timing/global clock pode invalidar pacotes posteriores; essa invalidação conservadora preserva efeitos que usam tempo global.

Cada artefato fica em `.render-segments/HASH/` com projeto, dependências, export HyperFrames, log, vídeo e recibo. Um recibo só é gravado depois de validar GPU, resolução e quantidade de frames. `status` verifica o hash do MP4, além do recibo. Render abortado não produz recibo válido e não destrói o vídeo anterior. O cache não representa aprovação estética ou humana.

## Tempo, áudio e legendas

As cenas inteiras são deslocadas para zero; sua duração, câmera e ações locais são preservadas. `timelineOffset` mantém a posição global para efeitos que usam esse relógio. O engine deve somá-lo ao tempo global entregue aos recursos. Legendas e títulos são recortados na janela do pacote, com `sourceDuration` e `timeOffset` para continuar a animação quando cruzam um corte. Palavras alinhadas de cada cue são preservadas integralmente e rebased, inclusive com tempos negativos quando iniciaram antes do pacote, para progresso de letra fiel. O runtime de captions deve usar esses campos.

Os pacotes são propositalmente sem áudio. A faixa master completa é aplicada na montagem, evitando reiniciar efeitos, perder reverberação ou introduzir cortes na narração. `--audio` deve apontar a mixagem pronta com voz, FX e ambiência; passar voz isolada não inclui FX separados. Legendas continuam embutidas no render visual. Um ajuste apenas de áudio pede nova montagem, não nova captura 3D.

## Montagem e aprovação

`assemble` usa concat demuxer e `-c:v copy` em clips de mesmo codec, resolução, fps, perfil e base de tempo. Não há reconstrução 3D nem recodificação de imagem nessa montagem. A faixa master é codificada uma vez em AAC, aparada/preenchida à duração do filme. Contagem de frames total é conferida no MP4 final. Dissolvências que cruzem pacotes exigem incluir ambas as cenas num mesmo pacote ou uma etapa de composição específica; não inventar dissolvência durante concat.

Há dois modos isolados por hash: `internal-qa` (captura limpa, sem interface ou marca dentro do MP4; QA permanece no recibo/player) e `delivery` (`--delivery`). A página diagnóstica `--preview --internal-qa` pode exibir controles e plano visual, mas não serve como superfície de captura de vídeo. Delivery só planeja/renderiza/monta depois de validar o projeto mestre, plano humano de assets e QA profissional integral vigente. O exportador recebe `--segment-origin mestre.json`: compara o subprojeto com a faixa canônica exata da origem (quantização explícita, captions rebased, fontes remapeadas e bytes idênticos). Uma cena editada, faixa adulterada ou fingerprint da origem desatualizado bloqueia. Não basta declarar a origem na linha de comando.

Cache interno e limpo nunca se misturam. A montagem limpa exige recibos delivery íntegros e configuração compatível. Recibos continuam registrando `approved:false`: o QA interno autoriza construir o render limpo, mas **não aprova automaticamente esse novo arquivo**. O recibo final identifica o hash SHA-256 do MP4, fingerprint de prontidão da origem e `finalArtifactQa: pending`. A revisão profissional deve assistir e auditar o arquivo limpo antes da entrega efetiva. Um QA antigo da origem não aprova um subprojeto modificado.

O log do render é gravado durante o processamento, inclusive antes de uma falha. SIGINT/SIGTERM são propagados ao grupo de processos do render; após cinco segundos há escalonamento para SIGKILL, e o lock é liberado em `finally`. IDs inexistentes em `--only` falham antes de exportar. Produtores paralelos podem trabalhar em arquivos de cenas distintos; um integrador único monta a timeline e a fila serializa a GPU.
