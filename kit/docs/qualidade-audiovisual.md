# Direção e revisão audiovisual

Este contrato compartilhado vale para storyboard, prévia, render por blocos e longa montado. As skills da etapa o aplicam junto de seus contratos específicos.

### Ramo de imagem e vídeo gerados por IA local

Quando o pipeline do projeto for Wan2GP local, aplicar o protocolo detalhado em `kit/docs/wan2gp-ai.md`. Beats, estilo, intenção sonora, ritmo e revisão profissional continuam obrigatórios. O conteúdo visual vem de modelos locais: não desenhar quadros com Three.js, HTML, CSS, SVG ou canvas e não pedir aprovação de lista de assets 3D. A consulta a exemplos Three.js só é pertinente se uma cena visual em código fizer parte do pedido.

Fixar no plano por clipe o modelo/pesos, parâmetros nativos, seed, prompts, duração e resolução. Iniciar com uma ação principal curta; avaliar o MP4 real a 10 fps e em playback a velocidade normal, conferindo trama em todos os materiais, estabilidade temporal, ação/contato, identidade, câmera, cortes, leitura em celular e som alinhado ao gesto visível. Corrigir prompts ou geração e repetir a inspeção até zerar P0/P1; estender o mesmo gate às junções e montagem completa. Um prompt, seed, recibo de fila ou dry-run não prova qualidade.

Neste ramo não são necessários testes unitários: não os criar, executar ou exigir para avaliar o vídeo. A inspeção audiovisual do artefato gerado permanece obrigatória e não pode ser substituída por automação.

## Fala, áudio e legenda

- Revise a narração integral em voz alta como português brasileiro: frases completas, referentes claros, ortografia, concordância, regência, artigos, pronomes, preposições, conjunções e pontuação que conduza a respiração. Ligue orações quando a causalidade ou a ideia continuar; não deixe conectivos soltos por uma pausa de síntese. Faça a revisão antes de gravar e novamente sobre a transcrição alinhada; corrija também grafia de nomes, datas e termos antes de gerar legendas.
- Inclua um CTA curto e natural convidando à inscrição no canal e à curtida. Ele pode ficar no fecho ou num respiro da narrativa, mas não interrompe o payoff, não soa como anúncio genérico e não é a única função do final.
- Reprove AI slop / conversa de IA: metacomentário de assistente, disclaimers de modelo, “como uma IA”, “enquanto modelo de linguagem”, fórmulas genéricas (“no mundo de hoje”, “é importante ressaltar”, “em suma”, “vamos mergulhar”, “não é apenas X, é Y”), enchimento, listas de tópicos e tom de post/chat. A narração deve soar como uma pessoa contando uma história.
- A legenda embutida usa o texto aprovado e os tempos do alinhamento acústico. Reprove deriva, palavras adiantadas/atrasadas e relógios independentes da voz. Exporte também `.srt` com pontuação e caixa naturais, pronto para upload no YouTube; ele complementa a legenda embutida.
- Narre títulos de capítulos dentro do intervalo do cartão, com pausa para leitura. Mixagem mantém voz inteligível, ambiente em perspectiva e efeitos motivados por contato, movimento ou transição; contar efeitos sem função/audibilidade não satisfaz o critério.
- Quando alterar roteiro, locução, sincronismo ou som, confira o master final: voz, música/ambiência e foley/FX continuam equilibrados e casados com o acontecimento. Preserve o mixer quando ele já funciona; não diga que a mixagem foi revisada se apenas trocou a voz ou recompilou o áudio.

## Direção e completude da cena

- Ligue cada trecho de fala ao acontecimento visual exato. Faça inventário semântico de palavras e relações relevantes, não só substantivos. Inclua objetos, personagens, cenário e entorno coerentes com época, ação, luz e ambiente. Datas, horários, sequência, duração, nomes, siglas e palavras de impacto ganham recurso cenográfico ou gráfico próprio; menção falada ou placa solta não cobre a necessidade visual.
- Cada cena tem evento, estado anterior e posterior e composição reconhecível. Não recicle plano, arranjo, evento ou animação dentro do vídeo. Reusar assets é permitido quando a encenação apresenta outra ação em composição e intenção realmente distintas; trocar ângulo, cor, zoom, pose ou letreiro não cria cena nova.
- A unidade de cobertura é a fala: cada frase ou oração com acontecimento próprio recebe uma cena distinta. Um parágrafo/beat com várias frases não pode virar uma cena única. Referência de edição: 2 a 5 s por cena; plano mais longo só com justificativa e QA.
- Cada cena declara no mínimo **5 recursos** (objeto/cenário, personagem/ação, câmera, luz, overlay/efeito, transição, som, material, animação). **Não há limite máximo**; mais recursos são bem-vindos quando cada um serve ao acontecimento, à leitura ou à causalidade, não como decoração.
- Prévia de trecho usa a mesma granularidade, os mesmos recursos e o mesmo QA da versão final. “Provisório” não dispensa cobertura. O QA conta cenas × unidades de fala e reprova cena única para gancho multi-frase, ausência de cortes/inserções/efeitos ou menos de 5 recursos.
- O check técnico do HyperFrames não substitui a cobertura editorial. `ready-for-creator-review` exige todas as cenas inspecionadas em movimento, cortes, mobile e seek.
- Planeje preparação, execução/contato, reação e resultado. Motive cortes, zooms, deslocamentos, parallax, luz, brilho e FX pela fala. Preserve pausas de leitura, textura, escala, contraste e geografia espacial. O entorno completa o ambiente sem substituir a ação nem virar decoração aleatória.
- Valide as fontes de luz no tempo e lugar da história. Em narrativa histórica, confira céu, fase lunar e horizonte antes de desenhar sol ou lua; não acrescente um disco celeste para “dar vida” quando ele não seria visível. Use fontes presentes na cena — estrelas, vigias, lanternas, sinalizadores, luz de navio e reflexos na água — para compor a noite com riqueza e precisão.
- Para datas e cronologia, mostre relações temporais visualmente — linha do tempo, relógio, rota, marcador ou mudança de estado — e dê tempo de leitura. Siglas e termos recebem destaque animado e explicação simples junto da evidência, sem disputa entre tela e fala. Reserve pelo menos 4 s para termos/siglas e amplie para 6–7 s quando houver explicação ou leitura densa; mantenha o centro estável durante a leitura. Cartão genérico não substitui a cena.
- Números históricos, horas, datas, intervalos e nomes de navio precisam estar ligados ao referente e à ação corretos. Em histórias com mais de um navio, personagem ou lugar, nomeie visualmente cada um quando mudar o referente; confirme a relação em fonte histórica primária ou institucional antes de gravar a conclusão.

## Motion graphics, evidências e referências

- Integre documentos, fotos e filmes ao mundo 3D como evidência narrativa. Painéis de destaque ficam centralizados e com padding interno equilibrado nos quatro lados, moldura/material bem acabados, luz, profundidade e hierarquia tipográfica clara; não os reduza a caixas simples na borda ou miniaturas. Use escala reconhecível em celular e mantenha a evidência estável para leitura: referência de produção de ao menos 3 s totais e 2 s estáveis, ampliando para 4–7 s para rosto, texto ou detalhe. Reserve a faixa de legenda e inspecione sobreposições no vídeo renderizado.
- Varie o template conforme a função: documento que se abre, fotografia em moldura, recorte ampliado, mapa com rota, detalhe ou comparação. Entrada, ação, pausa e saída formam um gesto motivado. Evidência não substitui a encenação 3D automaticamente; créditos, licenças e permissões permanecem documentados.
- Antes de criar ou corrigir uma cena Three.js, busque e compare todos os exemplos instalados que sejam pertinentes aos mecanismos usados (câmera, luz, materiais, água/atmosfera, geometria, partículas, pós-processamento e motion) e consulte o asset local mais próximo. Anote caminhos, princípios, limites e adaptações em `kit/quality/decisions.md`. Reuse e combine princípios compatíveis com a engine; não copie cenas inteiras nem trate exemplo como aprovação visual. Se a cena reúne mecanismos diferentes, não pare na primeira referência encontrada.

## Revisão e entrega

- Inspecione cada cena em movimento durante preparação, ação, contato, reação e resultado, em escala normal e celular; reveja cortes e montagem integral. Contact sheet, script ou render tecnicamente válido não prova qualidade estética, clareza factual, naturalidade ou sincronia.
- Loop obrigatório: observar → localizar finding com cena/tempo → corrigir causa reutilizável e/ou encenação → renderizar o necessário → observar de novo, incluindo regressões e junções. Nenhum P0/P1 aberto segue para o criador.
- Interface, controles, plano visual, notas internas, marcas técnicas e texto de diagnóstico pertencem ao player ou a metadados; jamais entram nos pixels do MP4 assistível/entregável. O estado de QA fica fora do quadro.
- O revisor bloqueia plano ou evento repetido, falta de objetos/contexto, fundo incompleto, motion gráfico ilegível, fala/legenda dessincronizadas, termos ou datas sem tratamento, capítulo sem narração, FX sem propósito e referentes/fatos ambíguos. Se algo não foi visto ou escutado integralmente, marque `not-verified`, sem declarar aprovação.
