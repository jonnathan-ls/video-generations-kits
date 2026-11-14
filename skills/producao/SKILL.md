---
name: producao
description: Conduzir pelo chat um pedido de vídeo ou uma etapa de produção usando este kit. A LLM executa as ferramentas, mantém os arquivos do projeto e solicita apenas decisões, validações e aprovações humanas.
---

Leia `AGENTS.md` e `kit/docs/fluxo.md`. Esta skill coordena as etapas; não concentra geometria, texto de voz e render num único prompt.
Use `kit/docs/qualidade-audiovisual.md` como contrato transversal: fala natural, cobertura visual, legendas, motion gráfico, referências, revisão e MP4 limpo.

Quando a direção pedir motion graphics, documentos animados, fotos de arquivo ou trechos de filme dentro de cenas, consulte `skills/motion-design/SKILL.md`. Use o contrato HyperFrames e as regras de direitos do skill `$assets`; a referência externa informa craft, não muda a engine nem substitui a direção narrativa.

Confirme o objetivo e o que foi entendido. Diferencie “preparar os recursos” de “produzir o vídeo inteiro”. Não avançar etapas que dependem de escolhas ainda indefinidas. A pessoa não vai executar código: use as ferramentas por conta própria.

O pedido pode começar por sugestões de ideias, um link de referência ou uma narração/áudio. Para áudio, transcreva e confira texto e intenção. Para link, estude a referência e determine o modo pedido: se o criador disser “fiel”, “modelar a estrutura” ou equivalente, preserve a sequência causal, a função dos beats e a função tonal (por exemplo, humor), criando texto e piadas próprios; “original” não significa mudar a ordem. Use três estruturas diferentes para uma ideia sem referência ou quando o criador pedir alternativas. Para ideias, proponha opções antes de produzir. O canal inicia em construção, mas pode explicar outros assuntos pelo mesmo método 3D.

Antes de mostrar qualquer roteiro, aplique a barreira de saída de `skills/direcao/SKILL.md`: conferir a ordem e a função dos beats, revisar a fala integral em português brasileiro coloquial com frases conectadas e, quando houver conceitos, demonstrar mecanismo/solução/efeito antes de nomeá-lo. A validação do criador vem depois desta checagem, nunca no lugar dela. Se um item falhar, corrija o arquivo antes de apresentá-lo.

Em projetos Three.js, antes do primeiro link de storyboard visual ou prévia de composição, aplique o gate de esboço de `AGENTS.md` e `kit/docs/qualidade.md`. Não entregar formas placeholder ou uma página procedural como proposta revisável sem cobertura beat a beat, consulta registrada a exemplo Three.js local, inspeção de todas as cenas e motion no navegador, legibilidade em escala normal/celular e findings resolvidos. Registre o resultado em `kit/projects/<id>/preview-qa.json`. Se o usuário pedir explicitamente para ver um estudo ainda reprovado, marque-o como diagnóstico reprovado, com escopo e falhas, sem apresentá-lo como pronto. Este gate não inicia o render final.

## Cadência

Depois da aprovação da narrativa e do plano de cenas, execute até o próximo bloco/prévia/vídeo sem pedir confirmação a cada etapa. Corrija falhas de QA internamente e volte com o resultado consolidado. Só pare por decisão criativa ausente, autorização, bloqueio técnico real ou risco factual. Relate em poucas linhas o que foi aplicado e o resultado; o criador foca a validação final.

## Cobertura de cenas e prévia

A prévia de um trecho não é teste de conceito de uma cena. A unidade de cobertura é a fala: cada frase ou oração com acontecimento próprio recebe uma cena distinta. Um parágrafo/beat com várias frases não pode virar uma cena única; a referência é de 2 a 5 s por cena. Cada cena declara no mínimo **5 recursos**, sem limite máximo; mais recursos são bem-vindos quando servem ao acontecimento e à leitura.

O QA conta cenas × unidades de fala, inspeciona todas em movimento, cortes, mobile e seek e reprova cena única para gancho multi-frase, ausência de cortes/inserções/efeitos ou menos de 5 recursos. Check técnico do HyperFrames não substitui cobertura editorial. “Provisório” ou “conceitual” não dispensa o gate. Só depois desse passe o `preview-qa.json` pode ir para `ready-for-creator-review`.

Em projetos Wan2GP local, não criar storyboard visual de código nem aplicar gate de cena Three.js. A primeira composição visual é o clipe-prova real gerado pela IA, submetido ao QA profissional descrito abaixo e em `kit/docs/wan2gp-ai.md`.

Crie ou retome a pasta do projeto e seu state.json. Leia somente os arquivos necessários para a etapa atual. Registre decisões e pendências para continuidade entre chats.

## Rota alternativa para vídeo gerado por IA local

Se o projeto usar `wan2gp-ai-video`/`wan2gp-local-ai-video`, siga `kit/docs/wan2gp-ai.md` além deste contrato. Preserve as etapas de referência, direção, estilo, som e QA profissional, mas substitua a construção de cenas e o catálogo Three.js por prompts e parâmetros Wan2GP por plano. Não pedir validação de lista de assets 3D. Use a fila nativa local, fixe modelo/pesos/configuração/seed e comece por um clipe-prova de uma ação principal. A primeira validação visual acontece no clipe renderizado. Não iniciar lotes completos antes de a prova passar no QA; não gerar imagens por código. Montagem por código fica limitada a cortes, sincronização de som e codificação.

Para vídeo IA local, não criar nem executar testes unitários: eles não validam textura temporal, ação, continuidade, enquadramento ou som do artefato. A verificação obrigatória é a revisão profissional do clipe real, com inspeção a 10 fps, reprodução em movimento e escuta do mix. Um dry-run de fila comprova apenas formato/configuração, nunca qualidade estética.

Acione direção para narrativa, assets para mapa e backlog, qualidade para construção e inspeção, áudio para voz e contatos e render para composição. Mostre ao usuário o resultado concreto da etapa, com a próxima validação necessária. O usuário pode validar e aprovar pela aplicação ou por uma resposta explícita no chat. Ao registrar uma decisão recebida no chat, use a API/ReviewStore e anote o canal e a revisão; não infira aprovação de silêncio, elogio genérico ou existência do asset. Cada recurso e variação tem decisão própria. A validação da lista do projeto é separada das aprovações dos assets e precisa ser renovada quando o plano ou a narração mudar.

Antes de um render integral, exija uma prova curta na mesma máquina com `--browser-gpu --gpu --no-low-memory-mode`. Em notebooks NVIDIA Optimus/PRIME, inclua `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia` na prova e no render integral. Confirme no log o probe `hardware` com renderer WebGL NVIDIA/RTX, ausência de erro WebGL, quadro real renderizado e NVENC quando solicitado; o resumo `beginframe capture · hardware gpu` sozinho é insuficiente. `--low-memory-mode` força screenshots; não usar em máquina acima de 8 GB sem necessidade medida. Se a captura cair para software/SwiftShader ou screenshot, ou abrir WebGL numa GPU errada, diagnostique driver, PRIME e disponibilidade da GPU antes de continuar; render por software só com escolha explícita do criador após informar prazo e carga térmica. A prova de `nvidia-smi` sem confirmação do caminho de captura não libera o render integral.

## Entregar a tela certa para revisão

Quando a próxima etapa depender do criador, abra e forneça o link direto para a tela do projeto, em vez de pedir que ele encontre a etapa na biblioteca. `studio/index.html?project=<id>` abre a lista de recursos daquele projeto; confira no navegador que o projeto e a etapa exibidos são os esperados. Para uma prévia de vídeo, forneça o URL local realmente testado, com os controles de reprodução, tempo e cenas visíveis.

Peça uma decisão concreta por etapa: confirmar a lista, aprovar ou pedir mudanças em recursos específicos, ou aprovar a prévia completa. Se o celular dificultar o uso dos controles, aceite a resposta explícita no chat e registre-a no canal correto; não dependa de um botão como único caminho. Mantenha o próximo passo em `state.json` e não transforme uma validação de lista em aprovação dos assets ou do vídeo.

Não iniciar um filme completo só porque uma narrativa foi estudada. O estudo rail-demo é uma demonstração de biblioteca e backlog, não um roteiro de publicação aprovado.

## Barreira de revisão profissional do vídeo

Aplicar `skills/revisao-profissional/SKILL.md` antes de apresentar como pronto um vídeo ou uma prévia que já tenha sido renderizada. Reprovação retorna à correção e ao render interno. O player diagnóstico pode usar `--preview --internal-qa`, controles, plano visual e marca na página HTML. Capturas MP4 internas e entregáveis usam composição limpa: nunca gravar a marca, controles, texto do plano ou notas técnicas nos quadros. QA e proveniência permanecem no recibo/player, fora da imagem. Uma captura interna não é entrega aprovada. Para storyboard ou estudo conceitual sem render, aplicar o gate de pré-visualização descrito acima, sem iniciar render final.

## Edição e produção por blocos

Quando o criador pedir partes de duração definida, registrar o limite de cada bloco e se ele inclui a abertura. Preservar roteiro e perguntas do longa, mas produzir e revisar um bloco por vez. Duração de 3 minutos pertence ao projeto que a pediu, não é regra de todos os vídeos. Medir com a voz escolhida; ajustar encenação ou texto sem acelerar a fala só para caber.

Antes de construir, cada beat precisa explicitar o acontecimento visível, a mudança de informação, recursos de primeiro plano/contexto, atuação, revelação de câmera, transição e intenção sonora. Mais elementos não se resumem a decorar: objetos devem participar de uma ação e movimentos precisam conduzir atenção. A biblioteca serve à ideia. Para uma referência rica em edição, não reduzir a execução a planos gerais com deriva de câmera e voz sobre ambiente.

Em cada ciclo de qualidade, comece pela imagem reprovada: identifique cena, asset e falha visível; consulte primeiro exemplos locais pertinentes do Three.js e assets próximos do kit; compare-os visualmente e só então escolha a alteração. Se o elemento nasceu do zero, prefira corrigir o módulo reutilizável e as cenas que realmente o usam, em vez de remendar apenas o quadro. Delegue domínios independentes com ownership de arquivos claro; o integrador renderiza, revisa em movimento, encaminha bloqueios ao responsável e repete até corrigir as causas. Preserve assets aprovados que não mudaram e deixe as novas revisões pendentes da validação humana.

Fotos e filmes de referência precisam ter função narrativa e presença legível: preparar a entrada, permanecer durante a leitura e sair ligada ao beat, sem piscar como decoração. Dê destaque proporcional à importância da evidência, com enquadramento, crédito, movimento ou anotação integrados ao espaço e sem encobrir a ação principal, a legenda ou outro objeto essencial. Reveja em tamanho normal e celular. Uma foto/filmagem pode ocupar um painel relevante dentro da cena 3D; não substituir a cena inteira automaticamente. A duração permitida vem da licença e do contexto, nunca de um limite universal de segundos.

Não gerar a encenação classificando cláusulas da narração por palavras-chave e preenchendo cada categoria com uma receita fixa de assets. Cada plano deve nascer do beat específico e descrever um evento visível e sua transformação; uma frase diferente sobre o mesmo tema não constitui plano novo.

Antes de exportar, cada cena deve ter `visualPlan` com `beatId`, `attentionTarget`, `visualQuestion`, `visibleEvent`, `stateBefore`, `stateAfter`, `cameraReveal` e `soundIntent`. A validação compara encenação, arranjo dos assets e ação física, ignorando mudanças cosméticas de câmera/texto. Um mesmo objeto pode protagonizar outro acontecimento; repetição do mesmo evento/composição exige `returnVisit` com `priorSceneId`, função (`orientation`, `clue`, `state-change` ou `payoff`) e `visibleDelta`. O QA profissional confere a progressão no filme inteiro e reprova retornos sem função demonstrável. Manter desenho sonoro ao longo das cenas, com ambientes em perspectiva, contatos e pontuação editorial coerente com a linguagem escolhida; não declarar o padrão cumprido pela simples contagem de efeitos.

Quando houver trabalho paralelo, usar `kit/tools/scene-jobs.mjs` e `kit/docs/agentes-producao.md`. Cada produtor recebe IDs e arquivos exclusivos; só o integrador compila a timeline principal. O revisor compara o evento renderizado com a frase exata, registra bloqueadores e não fabrica aprovação humana. Conservar as partes válidas por hash, corrigir somente pacotes afetados e revisar também suas junções. Uma descrição detalhada no storyboard continua pendente até existir na imagem renderizada.

## Escopo integral e ciclo obrigatório

O pedido vigente define o término. Quando for um vídeo completo, blocos de três minutos são unidades internas de produção e correção, nunca o limite da entrega. Mantenha duração total, cenas previstas/construídas/inspecionadas e montagem completa no estado do projeto e na aplicação. Não termine numa amostra porque o primeiro bloco melhorou; integre os demais, revise suas junções e preserve a cadeia causal até o payoff. Limite de bloco só reduz escopo quando o criador pedir isso explicitamente.

O ciclo é obrigatório em cada unidade e na montagem: observar em movimento → comparar com fala e referência → registrar defeito concreto → corrigir recurso/cena/timing → observar novamente, incluindo regressões e cortes vizinhos. Não passe um defeito adiante só porque o script executou. A qualidade inclui entorno e continuidade: superfície de água legível, horizonte/céu coerentes com tempo e fatos, luz motivada e preenchimento para leitura, interiores fechados, contato físico, elementos que participem do acontecimento. Mais elementos só contam quando melhoram o entendimento e o foco. Salve melhorias reutilizáveis no recurso e mantenha nova revisão pendente, sem criar aprovação humana.

Na prévia completa, permita mutar voz e/ou mix, escolher legenda por palavra ou frase e ajustar aparência. Preferências de revisão não alteram silenciosamente a captura. Para narração própria, a legenda deve continuar sincronizada ao relógio da voz de referência mesmo mutada. Inspecione áudio/captions em trechos distantes e após seek; relógios independentes e deriva acumulada são bloqueadores. Registre pedidos de câmera/luz/correção pelo ID da cena e instante local/global, separados de reviews e aprovações.
