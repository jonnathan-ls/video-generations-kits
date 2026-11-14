# Fluxo operado pela LLM

Este documento orienta o agente. O usuário solicita e valida pelo chat; não executa comandos nem edita arquivos técnicos.

## Etapas

Pedido e entendimento → fatos e referências → narrativa → gate de beats, fala e conceitos → validação humana → mapa lexical e interpretação → backlog → planejamento visual beat a beat → consulta a referências locais e baselines → construção de estudo/composição → QA obrigatório da prévia → revisão humana → voz e tempos → composição final → QA profissional do artefato → entrega.

Aplicar em todas as etapas `kit/docs/qualidade-audiovisual.md`: fala brasileira conectada; legenda sincronizada pelo alinhamento e `.srt` para YouTube; títulos de capítulo narrados; cena exclusiva por beat e cobertura visual de datas, cronologia, termos, siglas e impactos; motion graphics centralizados, equilibrados e legíveis; consulta ampla aos exemplos Three.js instalados; ciclo de revisão até zerar P0/P1. Nunca capturar controles, plano visual, marca de prévia ou texto técnico nos pixels do MP4.

O método visual depende do pipeline declarado em `state.json`. Para `wan2gp-ai-video`, substituir a construção Three.js por `kit/docs/wan2gp-ai.md`: manter análise, beats, direção, estilo, prompts, som e revisão profissional; gerar imagem e movimento nos modelos locais Wan2GP; usar código só para editar cortes, sincronizar áudio e codificar a entrega. Nesse ramo, lista/aprovação de assets 3D é não aplicável e não há testes unitários: validação é a inspeção do clipe renderizado, em movimento e com som.

Entrada pelo chat: (1) a LLM sugere ideias e o criador escolhe; (2) um link é estudado para gerar uma narrativa original, com fontes verificadas; se o criador pedir fidelidade estrutural, a adaptação preserva a ordem dos beats e a cadeia causal, mudando sua expressão; (3) áudio ou narração enviados pelo criador são transcritos, quando necessário, e confirmados antes do plano. Para tema sem referência, ou quando o criador pedir alternativas, a direção pode comparar três estruturas. As etapas comuns começam somente depois de entender o pedido. O tema inicial pode ser construção, mas os contratos não dependem desse nicho.

Uma etapa pode ser o objetivo completo da interação. Na fase atual, priorizar a biblioteca e os recursos necessários para vídeos futuros. Não forçar um render completo a cada melhoria de asset.

Antes de mostrar narrativa, a LLM confere o mapa com a referência, lê o texto integral como fala coloquial, revisa sintaxe e conectivos e confere a ordem demonstrar → explicar → nomear para cada conceito. Corrige e atualiza contagem e mapa antes da validação do criador; essa validação não substitui o gate. Ver `skills/direcao/SKILL.md` e `kit/docs/narrativa.md`.

### Gate da prévia visual, inclusive esboço

Qualquer storyboard ou URL de composição é um resultado para o usuário e precisa passar por QA antes de ser chamado de pronto para revisão. O rótulo “conceitual”, “temporário” ou “sem render” não reduz esse padrão. Antes de codificar uma cena Three.js, a LLM consulta exemplos locais instalados e baselines pertinentes, registra caminho, princípio e adaptação em `kit/quality/decisions.md`, e descreve cada beat em `beats.json`/`visualPlan`. Em seguida abre a prévia no navegador, percorre cada cena e motion, verifica quadro normal/celular e corrige P0/P1. Registra evidências, cobertura e findings em `kit/projects/<id>/preview-qa.json`.

Sem inspeção completa, o resultado é `not-verified`; com defeito P0/P1, é `rejected`. Só um preflight completo sem bloqueadores pode ser marcado `ready-for-creator-review`, o que ainda não aprova plano, recursos ou direção estética. Um estudo reprovado só é mostrado como diagnóstico se o criador pedir diagnóstico. O parecer do vídeo final segue o contrato separado de QA profissional e requer o arquivo renderizado.

### Cadência e autonomia

Depois que narrativa, plano de cenas e recursos estão aprovados, a LLM executa até o próximo artefato de entrega (bloco, prévia ou vídeo) sem pedir confirmação a cada cena ou correção. Só interrompe por decisão criativa ausente, autorização, bloqueio técnico real ou risco factual. Falha de QA é corrigida internamente e reinspecionada; não vira pergunta. Relate o aplicado e o resultado em poucas linhas; o criador valida o vídeo final, não cada microetapa.

### Cobertura de cenas e densidade de recursos

A unidade de cobertura é a fala, não o parágrafo. Cada frase ou oração com acontecimento próprio recebe uma cena distinta; um beat/parágrafo com várias frases não pode virar uma cena única. A referência de edição é de 2 a 5 segundos por cena; um plano mais longo só passa com justificativa explícita e QA de cobertura.

Cada cena declara no mínimo **5 recursos** — objeto/cenário, personagem/ação, câmera, luz, overlay/efeito, transição, som, material, animação. **Não existe limite máximo**: quanto mais recursos úteis, melhor, desde que cada um sirva ao acontecimento, à leitura, à causalidade ou ao contato, e não seja decoração. O `project.json` de projeto novo declara `qualityPolicy.minAssetsPerScene: 5`; não há `maxAssetsPerScene`.

Cada cena declara também seu `world`/set. No máximo 2 cenas consecutivas no mesmo mundo; trocar câmera/ângulo não cria mundo novo. A abertura de 14 cenas usa pelo menos 4 mundos distintos. Superfícies coplanares, transparências empilhadas e cartões sobrepostos precisam ser separados ou tornar-se opacos; asset que pisca é P1. O `project.json` declara `qualityPolicy.maxConsecutiveSameWorld: 2` e `minDistinctWorlds: 4`.

Prévia de trecho não é teste de conceito de uma cena. A prévia usa a mesma granularidade, os mesmos recursos e o mesmo QA da versão final. “Provisório” descreve o estado do asset; não dispensa cobertura, cortes, inserções, efeitos ou transições. Se o criador pedir “primeiros segundos”, isso define o recorte, não a quantidade de cenas.

O QA de prévia conta cenas × unidades de fala, inspeciona todas em movimento, cortes, mobile e seek, e reprova se a contagem não fechar. O check técnico do HyperFrames não substitui a cobertura editorial. O `preview-qa.json` registra a contagem, as cenas cobertas, os cortes e as evidências; sem isso, o estado é `rejected` ou `not-verified`, nunca `ready-for-creator-review`.

**Regressões conhecidas que reprovam de imediato:**

- uma cena única cobrindo um gancho com várias frases;
- interpretar “primeiros segundos” como dispensa de uma sequência de cenas;
- asset composto que engole a direção e a variedade de cenas;
- não usar `beats.json`/`visualPlan` como contrato de composição;
- pular o plano lexical/recursos e registrar um único requisito para o trecho;
- usar o check técnico como se fosse QA editorial;
- marcar `ready-for-creator-review` sem contar cenas × falas e sem inspecionar cortes;
- não registrar no `preview-qa.json` a contagem de cenas, a cobertura e os cortes;
- aceitar “provisório”, “conceitual” ou “preview curto” como dispensa de cobertura;
- não comparar a granularidade com o benchmark local (Titanic: 47 cenas em 180 s; 298 em 22,4 min);
- ausência de cortes, inserções, efeitos, transições ou mudança de estado por frase;
- uma cena com menos de 5 assets visuais;
- o mesmo set/mundo em quase todas as cenas, com apenas câmera, luz ou cartão diferentes;
- transparências empilhadas, superfícies coplanares ou cartões sobrepostos que piscam;
- priorizar a URL rápida sobre o gate de produção.

## Arquivos por projeto

- `state.json`: etapa, decisões, aprovações e próxima ação.
- `brief.md`: pedido, entendimento confirmado, limites e fontes.
- `narration.txt`: narrativa em estudo ou aprovada.
- `lexical.json`: todas as janelas de 1, 2 e 3 palavras, com offsets.
- `asset-plan.json`: decisão semântica por ocorrência, com tipo, ação, evidência e razão.
- `beats.json`: relação fala → pergunta visual/alvo de atenção → causa → ação e câmera/efeitos → pausa de leitura → estado seguinte → contato sonoro.
- `project.json`: cena composta de IDs, variantes, revisões, tempos, `qualityPolicy.minAssetsPerScene: 5`, `maxSceneSeconds: 8` (ajustável com justificativa) e nenhum teto de assets (`maxAssetsPerScene` ausente).
- `review.md`: retorno humano e ajustes necessários.

A LLM cria esses arquivos progressivamente. Não preencher aprovações ausentes como se estivessem concedidas. Cada alteração da narrativa exige revisar seu hash e o plano de recursos.

## Tipos de recurso

Objetos e personagens são apenas parte do inventário. Cenário e composição espacial, material, animação, efeito, transição, som, câmera, luz e overlay têm contratos próprios e podem gerar requisitos independentes. Palavras de ligação podem ser ignoradas com justificativa; ações e relações não podem ser descartadas automaticamente.

## Catálogo e backlog

O catálogo contém implementações. O backlog contém necessidades. Um requisito pode estar na fila antes de existir código. Quando implementado, recebe assetId e passa para revisão; sua aprovação deriva das decisões atuais por variante. Um asset não é aprovado só porque já veio num kit.

Na aplicação ou pelo chat, **Recursos do vídeo** reúne reutilizações e criações do plano atual. A validação humana da lista registra seu vínculo com a narração e as decisões; mudança no plano invalida a validação. Uma confirmação explícita no chat pode ser persistida pelo fluxo `projectPlanReview`, com a impressão digital atual, sem editar `plan-review.json` diretamente. A lista aprova as necessidades, não as peças individuais. O exportador final também exige as aprovações de cada recurso e impede uso de recurso fora da lista. Prévia técnica continua identificada como tal.

Quando solicitar uma decisão, entregue o link direto à etapa do projeto (`studio/index.html?project=<id>`) e confira a tela antes de enviá-lo. Para revisar o vídeo, abra o URL local da prévia e deixe a pessoa navegar por reprodução, tempo ou cena. A resposta explícita no chat também vale, inclusive quando o celular dificulta usar os controles da aplicação. Registre no `state.json` uma única próxima decisão clara.

Recursos existentes aprovados continuam reutilizáveis ao adicionar outros. Uma alteração na implementação ou dependência daquele recurso muda sua revisão. As decisões ficam em disco e nunca são inferidas pelo agente.

## Loop de revisão profissional

Composição e render interno → `skills/revisao-profissional/SKILL.md` → correção dos P0/P1 → novo render e revisão de regressões. Repetir durante o trabalho ativo até cumprir os critérios; não alegar continuidade em segundo plano inexistente. Escuta ou inspeção que não ocorreu fica não verificada e não libera parecer audiovisual completo. Só uma versão liberada pelo QA vai à revisão visual do criador; isso não substitui suas escolhas. Uma inspeção bruta explicitamente solicitada pode ser apresentada como diagnóstico reprovado, nunca como entrega aprovada. Revisão dos recursos em cena é aceita quando o criador dispensa lista textual.

## Pedido de longa e produção granular

Uma divisão em blocos é estratégia interna, não cancelamento do longa solicitado. O progresso separa storyboard executável, construção, inspeção em movimento e vídeo capturado. O ciclo observar → corrigir → reinspecionar aplica-se a todas as cenas, às junções e à montagem completa; a entrega não para ao melhorar uma amostra. Alterações de voz exigem realinhamento e revisão dos tempos dependentes. O player acompanha o relógio da voz e permite mutá-la para gravação própria, escolher modos de legenda e registrar correções de câmera/luz por cena e instante, sem transformar solicitações em aprovações. Three.js é a prévia interativa e a direção de cena; HyperFrames é a composição temporal/captura do mesmo estado dirigido. Nenhuma dessas ferramentas substitui inspeção audiovisual do artefato final.
