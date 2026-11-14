# Revisão visual — Titanic

O criador dispensou a validação textual da lista e solicitou inspeção dos recursos diretamente em cena/vídeo. A lista permanece interna, sem aprovação fabricada. Foi usada a exportação --preview, preservando marca permanente e bloqueio da entrega de produção.

Prévia: 52,815 segundos, 1920×1080, 30 fps, nove planos, voz pm_santa a 0,85 escolhida no chat. História A2: atlas → sinal no mar → Carpathia → Titanic → bote com lugares vazios → perguntas → promessa → título → partida.

Inspeção: duas séries de snapshots, incluindo atlas, sinal, ambos os navios, bote e plano diurno. Corrigidos tamanho dos navios no enquadramento, geometria que fechava o bote e tamanho mínimo de texto. O check completo inicial e a repetição focada após correções passaram sem erros de execução, layout ou contraste. Quinze testes do kit passaram após a correção do carregamento de personagens modulares. A verificação técnica dos recursos não concede aprovação humana.

Limites visuais ainda presentes: mar com pouca textura/variação aparente; navios com detalhes simplificados, convés e silhueta a refinar; figuras ainda rígidas e pouco expressivas; atlas esquemático; transição atlas/mar é um corte de aproximação, não metamorfose contínua; entrada cronológica sem cais detalhado. O bote é o plano mais útil para revisar as relações de escala e ocupação; o plano de observação do sinal ainda carece de maior presença humana. São propostas para revisão, não equivalentes ao acabamento do canal de referência.

Avisos mantidos: estrutura de overlays no arquivo raiz gera avisos de organização da timeline; software WebGL relata stalls de leitura durante captura. Não indicam aprovação estética. O mar toca deliberadamente as bordas do quadro. Identificações e título não substituem legendas alinhadas por palavra.

Áudio: voz por parágrafo e pausas do recorte escolhido; silêncio inicial de seis segundos e pausa adicional de três segundos antes da entrada cronológica. Ambiente de mar original, gerado localmente com semente fixa. O som foi conferido tecnicamente, não ouvido pelo agente. A escuta humana continua necessária para pronúncia e naturalidade.

## Arquivo de revisão conferido

render/titanic-pilot-review.mp4: H.264, 1920×1080, 30 fps, 52,833333 s (diferença de arredondamento de um quadro em relação a 52,815 s), áudio AAC 48 kHz estéreo, 12.065.577 bytes. Decodificados e inspecionados quadros de 10, 28 e 49 s. Áudio decodificado com pico de amostras em -2,2 dBFS e média -24 dBFS; não são medições de LUFS ou de pico verdadeiro. Não houve escuta pelo agente.

Organização final das identificações alterada de divs aninhadas para spans; o lint terminou com zero erros e um aviso de densidade da faixa de seis identificações. Nenhuma alteração no conteúdo visual ou nas posições. A prévia HTTP respondeu 200.

## Recuperação da tela branca

Após relato do criador, criado player HTML nativo independente da interface de edição e do WebGL. Rota restrita ao diretório do player, vídeo H.264/AAC local, poster, controles e indicação de erro. Verificado no navegador integrado: metadata de 52,8 s, clique em Reproduzir com áudio mudou para Pausar / Reproduzindo com áudio, e screenshot confirmou imagem do filme. A origem exata da tela branca anterior não foi confirmada. Quinze testes do servidor/kit passaram. Endereço de revisão atualizado para http://127.0.0.1:4174/preview/titanic-pilot/index.html.

## Aplicação da skill revisao-profissional

Skill implementada e roteada em AGENTS.md, produção e render. Gate administrativo conectado aos validadores/exportador. Exportação normal de prévia efetivamente bloqueada por QA reprovado; modo --preview --internal-qa permite somente diagnóstico marcado. Testes do gate cobrem pendências, inspeção parcial, vídeo/voz alterados e ausência de aprovação humana. Suíte: 17 testes passaram.

V1 preservada em qa/iterations/01. Primeira correção R2 foi reprovada por enquadramento do chapéu competindo com o sinal e efeito verde semelhante a uma esfera artificial. R3 suavizou o sinal e deu leitura ao mar; R4 corrigiu a continuidade da fase do efeito entre cortes e identificou os navios. MP4 interno R4: 19,6 s, decodificado e examinado com extração a 10 fps.

Parecer ativo em qa/report.json: REPROVADO. Observador legível e continuidade corrigida não equivalem a aprovação do gancho. Permanecem progressão dramática insuficiente do segundo enquadramento, acabamento genérico, atuação limitada e restante do piloto por revisar. Sem escuta ou inspeção audiovisual contínua, os domínios correspondentes não recebem aprovação. Nenhuma entrega profissional ou decisão humana foi fabricada.
