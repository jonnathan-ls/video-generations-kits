> **Atualização — 08/11/2026:** este relatório descreve a inspeção e a reprovação da primeira versão; foi superado pelo retrabalho documentado em kit/projects/historia-rockstar/preview-qa.json. Evidências atuais: research/frames/historia-rockstar-preview/rework-20261108-final/. A prévia navegável agora está liberada para revisão visual da criadora. Essa atualização não aprova a estética, assets, lista do projeto, áudio ou vídeo renderizado.

# Diagnóstico visual da prévia — História da Rockstar Games

Data: 08/11/2026. **Este documento não é um parecer de QA profissional do vídeo.** Registra uma inspeção de prévia conceitual para revelar falhas antes da construção dos assets.

## Escopo inspecionado

- 13 composições proceduralmente montadas em `preview/scene-review.js` e descritas em `preview/scenes.json`.
- Capturas da aplicação local em 1440 × 900, com a timeline em um ponto intermediário do movimento; ver `research/frames/historia-rockstar-preview/`.
- Inspeção estática de cada captura e revisão visual adicional das correções das cenas 03, 08 e 09.
- Não houve inspeção de toda a animação em movimento normal, voz, efeitos sonoros, enquadramento vertical ou render final. Não há asset registrado para receber QA individual.

## Correções aplicadas à prévia

- **Cena 03 — Lemmings:** o plano contínuo escondia a ponte e fazia o grupo atravessar uma lacuna sem apoio. As plataformas agora terminam nas duas margens, a ponte cobre o vão, a rota coincide com a superfície e o grupo só começa a atravessar depois que a ponte assenta. Evidência: `scene-03.png`.
- **Cena 08 — cidade/faroeste:** massas lisas e brilhantes pareciam objetos infláveis. Foram rebaixadas, encostadas ao solo e tornadas mais ásperas para funcionarem como relevo distante. Evidência: `scene-08.png`.
- **Cena 09 — três perspectivas:** colinas arredondadas ocupavam o primeiro plano e tapavam parte do território. Foram reduzidas e deslocadas para as bordas do mapa. Evidência: `scene-09.png`.

## Pendências bloqueadoras antes de chamar uma cena de pronta

1. **Direção de arte e iluminação — falha do estudo, bloqueadora para produção.** As composições ainda usam blocos e materiais de demonstração, com sombras pesadas e paleta quase uniforme. Não há comparação com baseline aprovado do tipo nem revisão final em escala de celular.
2. **Progressão visual — não verificada como storyboard.** As cenas 04, 06, 09 e 10 repetem a mesma grade e blocos urbanos. Ainda falta provar, no movimento e contra a fala exata, que cada retorno mostra um acontecimento, uma evidência ou uma mudança de estado nova.
3. **Beat e timing — ausentes.** As 13 composições são âncoras de capítulo, não cobertura completa das 143 frases. `beats.json` ainda não descreve cada evento com `beatId`, estado antes/depois, câmera, som e pausa. Os intervalos herdados do vídeo de referência são navegação aproximada; não são tempos de edição.
4. **Mídia de arquivo — pesquisada, não aplicada.** Há duas fotos com licença declarada registradas como requisitos candidatos no backlog atualizado; nenhum vídeo com licença de reutilização foi encontrado nesta busca. Não houve download, integração, crédito em tela ou avaliação de presença/escala.
5. **Movimento — verificação parcial.** Os builders usam `sample(t)` e a interface permite seek, mas esta inspeção não verificou a sequência temporal completa, os quadros de preparação/contato/reação nem seek fora de ordem para os 13 recursos.
6. **Som e entrega — não verificados.** Não há voz, foley, mix nem MP4. Portanto não se pode emitir parecer de áudio, edição ou entrega.

## Aplicação de QA nesta etapa

O que foi feito é um **preflight visual da prévia**, útil para corrigir problemas de composição como os da ponte e das colinas. Isso não é o `qa/report.json` da revisão profissional: o contrato exige o arquivo de vídeo exato, inspeção de movimento, áudio e reprodução. Também não é QA de asset, pois estas formas estão codificadas diretamente na página de estudo e não foram registradas no catálogo/engine.

## Estado

`concept-only / not-ready-for-production`. Para a próxima etapa, a lista atualizada de 28 requisitos aguarda validação do criador. Depois dela, construir os assets pela engine, integrar as fontes locais licenciadas aprovadas, completar os `visualPlan` por beat e fazer revisão técnica e visual de cada recurso. QA do vídeo continua reservado à conversa responsável pelo render.

## Aditivo — decisão da criadora e estado do gate

Em 08/11/2026, a criadora reprovou a prévia por qualidade visual e apontou que não houve consulta às referências locais de Three.js. A auditoria confirmou que não há registro Three.js específico deste estudo em `kit/quality/decisions.md` e que `beats.json` está vazio. Portanto, o preflight acima não libera a prévia para revisão: seu estado passa a `rejected`, aguardando retrabalho interno.

O novo contrato em `AGENTS.md`, `kit/docs/qualidade.md` e `skills/qualidade/SKILL.md` exige QA desde o storyboard conceitual, consulta e registro dos exemplos locais antes da implementação, inspeção de motion em todas as cenas e correção dos P0/P1 antes da entrega de um link pronto para avaliação. O registro desta reprovação está em `kit/projects/historia-rockstar/preview-qa.json`. Nenhuma aprovação de recurso, plano ou vídeo foi criada; não houve renderização.


## Reteste da revisão atual — 08/11/2026

A primeira versão continua documentada acima como histórico. O retrabalho preservou a narrativa A aprovada e refez as composições para cobrir os 29 beats em ordem. O registro atual em kit/projects/historia-rockstar/preview-qa.json acompanha os fingerprints, referências locais Three.js, findings resolvidos e evidências.

O navegador foi amostrado em 105 timestamps únicos, incluindo entrada/meio/saída de cada beat; depois foram validados 65 seeks fora de ordem (8, 0, 6, 2, 4 s em cada cena). Em 390×844 px, as 13 cenas abriram sem overflow horizontal. Os logs do navegador e os seeks ficaram sem erro. A captura de contato das 13 cenas está em research/frames/historia-rockstar-preview/rework-20261108-final/contact-sheet-scenes-t4.jpg.

O passe visual encontrou e corrigiu a baixa separação de luz/preenchimento e o tamanho dos rótulos na cronologia de 1998. A linha financeira mantém £1 nominal, £3.251.703 em empréstimo e cerca de US$12,3 milhões em passivos em categorias separadas; nenhuma soma indevida foi mostrada. As duas fotografias candidatas foram integradas como painéis com movimento e limites documentais explícitos. Nenhum vídeo com licença reutilizável foi encontrado, então o viewer não usa gameplay, trailer ou vazamento.

A revisão interna desta prévia não constitui aprovação estética humana nem QA do vídeo final. A direção 3D é uma proposta original sem baseline Rockstar aprovado; as fotos seguem candidatas e aguardam validação do plano e aprovação individual. Não houve áudio ou render final.


## Reteste da expansão de produção — 09/11/2026

A expansão cobre 143 frases da narração em ordem, com 13 cartões de capítulo narrados; os 8 s do player são janelas de estudo de movimento, não a duração da edição. O alvo segue 20–23 min e fecha após a escolha da voz e leitura integral.

Na segunda inspeção visual das últimas 20 tomadas (124–143), encontrei e corrigi a deformação dos rótulos pelo sampler e um quadro terminal vazio no take 143 sob o pós-processamento completo. As capturas finais mostram a correção de proporção, o arco de arquivo/anúncio, o debate trabalhista e o payoff da foto Amiga. A consulta local de Three.js e as adaptações estão registradas em `kit/quality/decisions.md`.

O lote final foi amostrado em `0`, `1,45`, `3,25`, `5,35` e `8 s`. Os seeks fora de ordem no Amiga (take 137) e na pergunta final (take 143) retornaram o mesmo quadro ao voltar a 5,35 s. A visualização em 390 × 844 px não teve overflow horizontal; a amostra 9:16 cobriu só os takes 124, 137 e 143. Evidências: `research/frames/historia-rockstar-production-preview/2026-11-09/final-compositions/`, `final-compositions-v2/` e `mobile/contact-mobile.jpg`.

**Estado: `not-verified`.** O patch de motion é compartilhado pelo viewer e, portanto, as 123 cenas anteriores ainda precisam do passe completo; a reprodução contínua, 9:16 para todo o lote, revisão de cada recurso, aprovação da lista e aprovação individual dos quatro candidatos fotográficos também continuam pendentes. Não houve sincronismo acústico nem SRT, pois a voz não foi escolhida. Não houve render final.
