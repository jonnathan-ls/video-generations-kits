---
name: revisao-profissional
description: Revisar e corrigir vídeos de animação antes de apresentar prévias ou entregar arquivos, com barreiras de direção, gancho, movimento, arte, FX, voz, som e reprodução. Reprova por evidências e mantém ciclo de correção sem substituir a decisão criativa do usuário.
---

Em **motion 2D**, o parecer usa o MP4 final e o `qa/report.json`: inspecione frames, cortes, legendas, pausas e áudio; não exija assets 3D, `preview-qa.json` nem aprovação por recurso. O restante dos critérios de direção, cobertura e reprodução continua.

Leia `references/criterios.md` e, para narrativa com edição densa ou produção por blocos, `references/edicao-narrativa.md`. Leia o brief, as referências efetivamente inspecionadas e as decisões do projeto. O usuário pode escolher revisão dos recursos diretamente em cena; não exigir lista textual que ele dispensou.
Aplicar também `kit/docs/qualidade-audiovisual.md`; bloquear plano repetido, cobertura visual incompleta, fala desconectada, legenda fora de sincronia, capítulo sem narração ou motion gráfico sem leitura suficiente.

## Escopo e evidência antes do parecer

Este contrato é para vídeo ou prévia já renderizada, com o artefato exato disponível. Storyboard, página de estudo Three.js e prévia conceitual sem render usam o gate anterior de `AGENTS.md`, `kit/docs/qualidade.md` e `skills/qualidade/SKILL.md`; não declarar esses estudos como QA profissional de vídeo. A ausência do render não impede QA da narrativa visual, mas impede o parecer profissional de montagem, áudio e reprodução.

1. Preserve a versão e identifique projeto, revisões dos assets, áudio, montagem e arquivo renderizado. Não revise só código ou intenção escrita.
2. Inspecione o gancho em movimento normal e em sequências a 10 fps; os primeiros segundos são uma revisão própria. Compare mudanças de situação e recompensa visual com a referência, não só duração, cores ou quantidade de cortes.
3. Revise todo o vídeo em movimento, seus cortes e ações críticas; confira preparação, ação, contato, reação e resultado em escala normal e celular. Contact sheets não substituem movimento. Sem fala, verifique a situação; com fala, o que a imagem acrescenta. Faça um passe de repetição integral: nenhum plano/encenação é reciclado; recorrências narrativamente necessárias têm ação, estado, composição e evidência imediatamente distintos. Variação de câmera, zoom, cor, legenda ou pose pequena reprova como repetição. Conte cenas × unidades de fala: cada frase/oração com acontecimento próprio precisa de cena distinta; cena única para um parágrafo/gancho multi-frase é P1. Confira também que cada cena declara ao menos 5 recursos (sem teto máximo) e que a prévia de trecho usa a mesma granularidade da versão final.
4. Em cada foto/filmagem de arquivo, confira se a fonte e o crédito são legíveis, se o material permanece tempo suficiente para ser percebido e se ocupa área suficiente para identificar o detalhe relevante em tela de celular. Confira entrada, movimento, anotações e saída sincronizados ao beat, integração com o espaço 3D e hierarquia sem colisão com a ação/legendas. Reprove evidência que surge por uma fração de segundo sem intenção clara, fica reduzida a miniatura ou não ajuda a narrativa; um link ou duração curta por si só não prova autorização de uso.
   Para cada card, confira centralização e padding equilibrado nos quatro lados, acabamento de destaque, leitura do conteúdo e zona livre para a legenda. Datas, horas, siglas, termos e números centrais devem ter evidência/motion próprios e tempo legível; capítulos precisam de título narrado. Verifique em fonte histórica confiável os referentes e as relações entre pessoas, navios e acontecimentos.
5. Faça a revisão auditiva real de voz, FX, ambiente e música e da mixagem completa. Se não tiver capacidade de ouvir, marque `not-verified`, não aprove o domínio e não transfira essa lacuna para um rodapé de uma entrega dita aprovada. Uma voz escolhida não aprova todas as tomadas, FX ou mixagem.
6. Verifique o MP4 decodificado e o player de destino, não só o HTML. O MP4 assistível não contém interface, plano visual, notas ou marca técnica; mantenha isso no player/recibo. Confirme `.srt`, fala dos títulos de capítulo e leitura/sincronia. Localhost não demonstra acesso por celular remoto. Não publicar externamente sem autorização pertinente.

## Parecer e ciclo

Registre `qa/report.json` com sourceFingerprint, artifact (path/sha256), scope, checks, findings e evidence. Cada finding tem id, domínio, trecho, severidade, observação concreta, consequência, correção e critério de aceite verificável. Referencie arquivos de evidência existentes. Não usar notas médias ou aprovação por existência de efeitos/testes.

- P0: quebra entendimento, gancho, causalidade ou reprodução.
- P1: enfraquece materialmente intenção, movimento, arte ou som; inclui cena única cobrindo um parágrafo/gancho com várias frases, ausência de cortes/inserções/efeitos por frase e cena com menos de 5 recursos declarados.
- P2: refinamento; só pode permanecer com justificativa específica.
- `rejected`: há P0/P1 aberto ou inspeção com falha.
- `not-verified`: uma inspeção obrigatória não pôde ser feita.
- `ready-for-creator-review`: todos os domínios obrigatórios passaram, evidências atuais e nenhum P0/P1 aberto. Não concede aprovação humana.

Enquanto houver reprovação, corrija a causa, renderize internamente, compare antes/depois e repita a revisão do trecho e suas transições. Se duas tentativas preservarem o mesmo problema, replaneje a encenação antes de mais polimento. Não limite artificialmente o ciclo a duas tentativas nem declare sucesso por falta de tempo. Custos externos e novas escolhas criativas seguem as autorizações reais.

Para defeito visual, use o quadro/trecho real como entrada do ciclo. Em vídeo Wan2GP local, compare com os beats, a bíblia de estilo e qualquer âncora aprovada do próprio projeto; corrija prompt, âncora, parâmetros ou modelo na fila nativa, gere o clipe novamente e confira textura temporal, ação e contato no MP4. Não procure exemplos Three.js para corrigir quadros gerados por IA. Em produção Three.js, compare uma referência local pertinente e o asset mais próximo do kit; corrija o recurso compartilhado ou a montagem e renderize somente pacotes afetados e suas junções. Em ambos os ramos, a revisão seguinte compara o resultado visual real com o critério explícito, nunca só com o roteiro ou uma checagem técnica.

Na produção incremental, registre findings pelo ID estável de cena/pacote e tempos local/global. Confira o plano renderizado sem legenda e com a fala exata: o evento, objetos e atuação precisam sustentar a frase. Encaminhe a correção somente aos pacotes dependentes e às junções afetadas. QA de um pacote não libera o longa: a montagem completa ainda precisa de revisão de ritmo, recorrência, continuidade e áudio. Recibos de cache, layout executável e `technicalOk` do alinhamento não são pareceres estéticos.

O gancho precisa passar antes de expandir a produção. Pode renderizar o restante internamente para diagnosticar, mas não ampliá-lo como solução para uma abertura reprovada. Regressões incluem continuidade, geometria compartilhada e som. Mudanças invalidam o parecer da versão anterior.

Use `node kit/tools/qa-gate.mjs <project.json> --artifact <video-exato-da-entrega>` para conferir vínculo e barreira administrativa. O domínio `visual-progression` precisa de evidência de revisão do filme inteiro, com retornos repetidos resolvidos ou justificados e diferenças visíveis identificadas. O domínio `coverage` precisa da contagem de cenas × unidades de fala, da lista de cenas cobertas e da confirmação de no mínimo 5 recursos por cena, sem teto. O script NÃO julga beleza, emoção, naturalidade ou veracidade da inspeção. Nunca preencher `pass` para fazê-lo aceitar. Registre os limites reais.

Prévia interna: `export-hyperframes.mjs ... --preview --internal-qa`. Não apresentar como aprovação ou entrega profissional. Para prévia externa de revisão e exportação final, o gate de QA é obrigatório, além dos controles humanos já existentes. Uma inspeção parcial explicitamente solicitada pode ser mostrada como diagnóstico reprovado, com escopo claro; não contorna a entrega final.

Trabalhe durante a sessão ativa; não prometa um loop em segundo plano inexistente. Se faltar uma capacidade indispensável, preserve a reprovação, conclua trabalho independente e explique o bloqueio concreto. Não marque asset aprovado em nome do usuário.
