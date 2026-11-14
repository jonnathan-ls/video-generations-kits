# Regra global para narrativas de vídeo

Aplicar estas instruções sempre que o usuário pedir roteiro, narrativa, adaptação, modelagem ou análise de referência para vídeo, em qualquer chat ou projeto.

- Se o usuário pedir fidelidade estrutural, preserve a ordem dos beats, a progressão causal, o lugar das falhas, soluções e revelações, o payoff e a função do tom (incluindo humor). Mude redação, piadas, cenas e realização para criar uma obra própria; não mude a ordem por conta própria.
- Antes de mostrar a primeira versão, compare a sequência de beats com a referência e revise o texto integral como fala brasileira coloquial. Corrija concordância, regência, preposições, artigos, pronomes e conectivos. Use orações completas e ligações naturais; não entregue uma sequência de frases telegráficas ou uma explicação formal distante.
- Ao ensinar conceitos, organize cada passagem como fenômeno/limite → ação ou peça → efeito demonstrado → nome e explicação simples do conceito. A demonstração deve vir antes do rótulo (“Isso é...” / “Isso se chama...”). Diferencie o nome do objeto do conceito que ele realiza.
- Esse gate é obrigatório antes da revisão do usuário. A validação humana acontece depois e não substitui a checagem. Se algum item falhar, corrija e confira novamente antes de exibir.
- Em um projeto que tenha `AGENTS.md` e skills de produção/direção, leia os contratos pertinentes e mantenha a instrução global consistente com eles.

## CTA e qualidade de fala

- Todo vídeo narrado do canal inclui, em algum momento, um CTA curto e natural convidando à inscrição no canal e à curtida. O CTA pode ficar no fecho ou num respiro da narrativa; não pode interromper o payoff, não pode soar como anúncio genérico e não pode ser a única função do final.
- É proibido AI slop / conversa de IA: metacomentário de assistente, disclaimers de modelo, “como uma IA”, “enquanto modelo de linguagem”, fórmulas genéricas de texto gerado (“no mundo de hoje”, “é importante ressaltar”, “em suma”, “vamos mergulhar”, “não é apenas X, é Y”), enchimento, listas de tópicos, repetição de conectivos e tom de post/chat. A narração deve soar como uma pessoa contando uma história.
- O CTA e a ausência de AI slop são checados no gate da narrativa, antes da validação humana.
- **Pausas fazem parte da fala.** Deixe 0,25–0,45 s entre frases e 0,8–1,2 s entre parágrafos/capítulos. Em peça longa, use TTS a 0,95–1,05× e insira silêncio entre blocos; não emende 15 minutos sem respiro. Em peça curta, 1,0–1,1×; se precisar de 1,15× para caber, corte texto. Narração corrida sem pausa é P1.

## Cobertura de cenas, densidade e prévia

- A unidade de cobertura é a fala: cada frase ou oração com acontecimento próprio recebe uma cena distinta. Um parágrafo ou beat com várias frases não pode virar uma cena única.
- Referência de edição: 2 a 5 segundos por cena. Projeto novo declara `qualityPolicy.maxSceneSeconds: 8`; um plano mais longo só passa com justificativa explícita e QA de cobertura; duração longa não substitui cenas.
- **Exceção motion 2D longo:** em peças de 10–20 min, 6–12 s por cena com pelo menos dois sub-beats; acima de 12 s só com justificativa e QA. No curta 2D, continua 2–5 s.
- Cada cena declara no mínimo **5 recursos** (objeto/cenário, personagem/ação, câmera, luz, overlay/efeito, transição, som etc.). **Não existe limite máximo**: mais recursos são bem-vindos quando cada um serve ao acontecimento, à leitura ou à causalidade, não como decoração.
- Prévia de trecho não é teste de conceito de uma cena. A prévia usa a mesma granularidade, os mesmos recursos e o mesmo QA da versão final. “Provisório” descreve o estado do asset, não dispensa cobertura.
- O QA conta cenas × unidades de fala e inspeciona todas em movimento, cortes, mobile e seek. Check técnico do HyperFrames não substitui cobertura editorial.
- Falhas que reprovam: cena única para gancho multi-frase; asset composto engolindo a direção; pular plano lexical/recursos na rota 3D; marcar `ready-for-creator-review` por check técnico; aceitar “provisório” como dispensa; ausência de cortes, inserções, efeitos ou transições. Na rota 2D, o benchmark é a peça curta aprovada e o contact sheet; não se exige plano lexical nem comparação com o Titanic.
- Se o criador pedir “primeiros segundos”, isso define o recorte, não a granularidade: o trecho continua sendo uma sequência de cenas.
- **Variedade de mundo:** cada cena declara seu `world`/set. No máximo 2 cenas consecutivas no mesmo mundo; trocar câmera, luz, zoom ou cartão não cria mundo novo. A abertura de 14 cenas tem pelo menos 4 mundos distintos. Reuso do mesmo set só passa com ação física e composição realmente distintas. Em longa 2D, um capítulo pode manter o mundo por várias cenas; varie composição, evento e escala dentro dele.
- **Flicker e sobreposição:** superfícies coplanares, transparências empilhadas, cartões sobrepostos e assets no mesmo plano reprovam. Separar geometria, usar opacos ou `polygonOffset`, e reinspecionar em movimento. Um asset que pisca é P1.

## Cadência de execução

- **Pedido fechado não vira processo aberto.** Se o criador pedir “gere um vídeo de X”, com duração/formato definidos, execute até o MP4; não ofereça três narrativas, não abra catálogo 3D, não peça aprovação por cena. Use a rota mais leve que entrega a ideia (`kit/docs/motion-2d.md` para mapa/documento/tipografia).
- Depois que narrativa, plano de cenas e recursos estão aprovados, execute até o próximo artefato de entrega (bloco, prévia ou vídeo). Não peça confirmação a cada cena, bloco ou correção interna.
- Interrompa apenas por decisão criativa ainda ausente, autorização que falte, bloqueio técnico real ou risco factual. Se um bloco falhar no QA, corrija e repita dentro do fluxo; não devolva a escolha ao criador.
- Relate o que foi aplicado e o resultado em poucas linhas. O foco do criador é a validação do vídeo final, não a aprovação de cada microetapa.
- Se o criador pedir um recorte (“primeiros segundos”), entregue o recorte com a mesma qualidade e siga para o restante quando o fluxo permitir; não transforme o recorte em uma sequência de pausas.

O contrato compartilhado `kit/docs/qualidade-audiovisual.md` é obrigatório junto das skills da etapa: fala brasileira integralmente conectada e revisada em ortografia, concordância, regência e pontuação; legenda alinhada ao áudio e `.srt` para YouTube; capítulos narrados; uma cena visualmente distinta por beat/unidade de fala, com várias cenas por beat quando a fala tiver várias frases; cobertura de datas, cronologia, termos, siglas e palavras de impacto; motion graphics centralizados e legíveis; consulta ampla e registrada aos exemplos Three.js; luz e movimento motivados por fontes plausíveis e pelo contexto histórico/astronômico (incluindo fase lunar e horizonte); revisão em loop; nenhum texto técnico ou interface nos pixels do MP4.

## Rota de produção: motion graphics 2D

Quando a peça for um vídeo fechado de mapas, documentos, tipografia, dados, arquivo ou colagem animada, leia `kit/docs/motion-2d.md` e siga essa rota. A imagem vem de HTML/CSS/SVG/Canvas 2D no HyperFrames, não de geometria 3D.

- Não abra catálogo 3D, não exija aprovação por asset, não rode plano lexical/backlog e não peça prova de GPU para composição DOM/SVG sem WebGL.
- Voz primeiro: gere a narração com pausas, meça e alinhe as palavras. A timeline nasce da fala, não de uma grade fixa.
- Cada cena narrativa declara 5+ recursos; inserts de 1–2 s podem ter 3+ com justificativa. Não há teto.
- Renderize um draft de 10–30 s assim que a primeira cena existir e inspecione frames reais. O MP4 é a prévia; não crie uma prévia separada para uma peça 2D.
- **GPU em render longo:** antes de capturar mais de 60 s, faça a prova com `--browser-gpu --gpu --no-low-memory-mode` e as variáveis PRIME quando houver Optimus. O sandbox de arquivos pode esconder `/dev/nvidia*`; execute o processo de render com acesso ao dispositivo e confirme `hardware gpu`/renderer NVIDIA. Se o probe cair em software, pare e reporte; não inicie o master em CPU por conta própria. Prova curta de QA (até 30 s) pode usar CPU com autorização explícita.
- Entregue MP4 + `.srt` + capa + créditos + `qa/report.json`. O `preview-qa.json` e as aprovações por recurso são da rota 3D.

## Rota de produção: vídeo com IA local

Quando `state.json` indicar `wan2gp-ai-video`/`wan2gp-local-ai-video`, a imagem em movimento deve vir de modelos locais pela fila nativa do Wan2GP. Não construir cenas, quadros, objetos ou texturas com JavaScript/Three.js. Three.js e suas referências só entram quando a direção realmente pedir uma cena 3D feita em código. Edição pode usar código apenas para cortes, ordem/duração, sincronização de áudio e codificação do arquivo final.

- Analisar a referência a 10 fps para mapear beats, ações, cortes, mudanças de estado e ritmo. Usar esse material para direção; não o enviar ao modelo como imagem, vídeo ou áudio salvo instrução explícita em contrário.
- Escrever a direção por beats, uma bíblia de estilo, prompts positivos/negativos por plano, parâmetros, seeds, hashes dos modelos e plano de áudio. Priorizar uma ação principal por clipe curto; âncoras visuais, se necessárias, também devem ser geradas por IA local.
- Para I2V sem um modelo local de imagem, a âncora pode ser um frame extraído de um clipe curto gerado pelo próprio Wan2GP: preserve o MP4 de origem, escolha o frame por inspeção, registre timestamp e hashes, e não pinte, complete ou redesenhe pixels por código.
- Confirmar estaticamente que os pesos e configurações nativos existem e cabem no disco/VRAM. Enfileirar pela integração Wan2GP local e preservar recibos e configurações; não declarar geração concluída por causa de um dry-run.
- Gerar primeiro um clipe-prova curto. A revisão estética do criador é do clipe gerado, nunca de catálogo de assets 3D. O parecer profissional verifica frames a 10 fps e movimento em preparação, contato, reação e resultado, consistência temporal da textura, identidade do cenário, ação, enquadramento 9:16 e áudio realmente alinhado.
- Corrigir prompt, parâmetros ou plano e gerar de novo até eliminar P0/P1. Só então expandir para os demais planos e montar o vídeo completo. O QA da montagem inspeciona cortes, continuidade, mix e duração integral.
- Para esta rota, não criar nem executar testes unitários: eles não avaliam a qualidade do vídeo gerado. O gate obrigatório é a inspeção audiovisual real descrita acima; nunca substituir esse QA por testes automatizados ou por um dry-run.

# Kit de vídeo — operação pela LLM

O usuário trabalha pelo chat e faz validações e aprovações. **Nunca transfira a ele comandos de terminal, edição de JSON, instalação, execução de scripts ou recuperação do servidor.** Execute você mesmo as tarefas autorizadas e mostre resultados revisáveis. Pergunte somente por escolhas criativas, dúvidas reais ou autorização que esteja de fato faltando.

O conteúdo começa com obras, construção e interiores e pode se expandir a outros temas explicados por mecanismos, camadas e cenas 3D. Os nomes técnicos de arquivos e skills são genéricos. Preserve nomes de objetos e referências de origem quando forem semanticamente necessários.

## Roteamento

- `skills/producao/SKILL.md`: recebe o pedido e conduz uma etapa por vez.
- `skills/direcao/SKILL.md`: narrativa causal, contexto e beats.
- `skills/assets/SKILL.md`: análise de palavras/grupos, triagem semântica e backlog de QUALQUER recurso.
- `skills/qualidade/SKILL.md`: engine de construção, referências aprovadas, inspeção e melhoria.
- `skills/revisao-profissional/SKILL.md`: barreira de direção, animação, FX, som e entrega; reprovar e corrigir antes de apresentar como pronto.
- `skills/audio/SKILL.md`: voz, alinhamento, foley e mixagem.
- `skills/render/SKILL.md`: composição determinística, HyperFrames e entrega.
- `skills/referencias/SKILL.md`: coleta e análise com evidências.

Leia somente os contratos da etapa atual. Não carregar a biblioteca inteira nem criar prompts monolíticos. Os módulos, catálogos e manifestos são insumos da LLM, que também os edita quando a melhoria exigir.

## Gate obrigatório para esboços e prévias visuais

“Esboço”, “procedural”, “conceitual” e “sem render final” descrevem o escopo; não dispensam qualidade nem revisão antes de mostrar uma composição como pronta para avaliação. Em projetos Three.js, o gate se aplica desde o primeiro storyboard visual ou URL de prévia. Em projetos Wan2GP local, não criar storyboard visual de código: o clipe-prova real gerado pela IA é a primeira composição sujeita à revisão estética e passa pelo QA profissional. Em motion 2D, o gate é o draft renderizado e os frames inspecionados; não há catálogo de assets a aprovar.

- Vincular cada cena ao beat e à fala exata que ela serve. O `visualPlan` deve explicar alvo de atenção, pergunta visual, evento, estado antes/depois, revelação de câmera e intenção sonora. Âncoras de capítulo, durações herdadas de uma referência ou uma descrição de cena não substituem a cobertura dos beats.
- Em produções com cenas Three.js, pesquisar no kit instalado e comparar todos os exemplos diretamente pertinentes a cada mecanismo usado — câmera, luz, materiais, água/atmosfera, geometria, partículas, pós-processamento e movimento. Consultar também o asset local mais próximo. Registrar em `kit/quality/decisions.md` os caminhos exatos, princípios observados, limites e adaptações à engine; não parar na primeira referência quando a cena combina mecanismos. Se não houver exemplo equivalente, consultar a implementação local mais próxima e registrar a limitação; sem essa consulta e anotação, a prévia não passa no gate. Essa consulta não se aplica à rota de geração visual por IA local.
- Consultar baselines aprovados pertinentes; separar falta de baseline de aprovação estética. Usar mídia pública contextual quando a história se beneficiar dela, depois de conferir fonte, licença, crédito e legibilidade. Quando o contexto pedir movimento, demonstrá-lo na cena em vez de deixá-lo só na descrição.
- Inspecionar no navegador todas as cenas e o movimento nos momentos de preparação, ação, contato, reação e resultado; também conferir busca temporal fora de ordem, escala normal e celular/9:16 quando aplicável. Capturas estáticas ajudam a localizar defeitos, mas não passam o QA de motion.
- Reprovar plano/encenação reciclados: trocar apenas ângulo, luz, zoom, cor, pose ou letreiro não cria cena diferente. Reusar asset só passa quando a história exige outro acontecimento, com estado e composição distintos de forma perceptível. Datas, horários, cronologia, siglas, termos e palavras de impacto exigem elementos visuais próprios dentro da ação.
- Cards de foto, filme, texto ou documento ficam centralizados, com padding visual equilibrado nos quatro lados, moldura/material e hierarquia de destaque; em movimento, precisam ter escala e tempo suficientes para perceber e ler, sem colidir com legenda ou encenação. Capítulos são narrados. UI, plano de cena e marca técnica ficam no player e nos metadados, nunca no vídeo.
- Registrar `kit/projects/<id>/preview-qa.json` com escopo, cenas cobertas, referências consultadas, evidências e findings concretos. Corrigir e repetir a inspeção enquanto houver P0/P1. `ready-for-creator-review` só é permitido depois do gate completo; caso contrário o estado é `rejected` ou `not-verified`. Só entregar uma prévia reprovada como diagnóstico quando a pessoa pedir esse diagnóstico explicitamente.
- Este gate avalia narrativa visual e prévia; não aprova a lista do projeto, assets, narrativa ou vídeo final. O QA profissional do vídeo continua exigindo o artefato renderizado e os domínios definidos em `skills/revisao-profissional/SKILL.md`. Ele não autoriza renderizar quando a demanda estiver limitada a pesquisa, narrativa ou assets.

## Invariantes

- Consultar cada palavra e grupo contíguo de uma a três palavras. Depois fazer triagem semântica de todas as palavras e relações. **Na rota motion 2D, a shot list com 5+ recursos substitui o plano lexical**; palavras funcionais não geram catálogo.
- Aceitar pedido a partir de sugestão de ideia, link, áudio ou narração. Para links, investigar a referência e criar narrativa original; quando o criador pedir adaptação fiel, preservar a ordem dos beats, a progressão causal, a função das revelações e o papel do tom (como humor ou suspense), mudando redação, piadas, encenação, personagens, ambiente, design visual e som. Não copiar piadas específicas nem confundir originalidade com reordenar a narrativa. Para áudio, transcrever e conferir o entendimento antes da modelagem. O usuário interage pelo chat.
- Uma lacuna pode ser objeto, personagem, cenário, animação, efeito, transição, som, material, câmera, iluminação ou elemento gráfico. Não reduzir a análise a substantivos.
- Registrar o backlog antes de implementar na rota 3D. Na rota motion 2D, registrar a shot list e o design system; não há catálogo/aprovação de assets.
- Construir novos recursos pela engine e pelos contratos do tipo. As receitas não substituem a interpretação da LLM nem produzem um vídeo a partir de um parágrafo.
- Usar referências humanas aprovadas como padrão de qualidade. A qualidade técnica automatizada complementa a inspeção visual, sem conceder aprovação estética.
- Não aprovar recursos em nome do usuário, clicar em seus botões, editar reviews.json para fabricar uma aprovação ou apagar suas decisões. A migração técnica documentada preserva decisões existentes, sem criar decisões novas.
- Na rota de código/3D, a validação da lista por projeto é decisão separada da aprovação de cada asset e é invalidada quando o plano ou a narração muda. Na rota Wan2GP, catálogo e aprovação de assets 3D são não aplicáveis; a revisão acontece sobre o clipe gerado.
- Revisões são por recurso e dependências de implementação; adicionar um recurso não invalida os demais. Mudar o código do próprio recurso exige nova revisão.
- Voz, nome e prévia final dependem das escolhas do usuário. Uma etapa de assets pode ser concluída sem render de vídeo final.
- RicksClips é referência de narrativa/encenação. Seu visual híbrido não muda o foco 3D deste projeto. As histórias não são fontes técnicas automaticamente confiáveis.
- Usar a biblioteca Three.js como referência e componentes revisados; não subir seu servidor de exemplos nem importar scripts do editor na aplicação.
- A aplicação deve ficar em loopback, com arquivos permitidos e recursos locais. Não usar cookies ou enviar dados a serviços sem autorização apropriada.

## Ferramentas da LLM

A LLM usa os scripts documentados em `kit/docs/operacao.md` e inspeciona os resultados audiovisuais no navegador/player. Por solicitação do criador, o projeto não mantém nem executa testes unitários; a qualidade de vídeos IA é julgada no artefato gerado, com o QA profissional. Todos os comandos são executados pelo agente. O usuário recebe links, prévias e explicações curtas.
