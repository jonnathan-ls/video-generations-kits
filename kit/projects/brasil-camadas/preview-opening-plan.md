# Abertura — plano de 14 cenas

**Estado:** plano corretivo. A prévia anterior (uma cena de 36,9 s) foi reprovada e não serve como entrega. Este documento substitui o recorte de abertura.
**Escopo:** primeiros 36,9 s do vídeo, com a voz de teste `pm_santa` a 0,9. Os tempos serão refeitos com a voz escolhida e o alinhamento por palavra.
**Referência de granularidade:** o Titanic tem 47 cenas em 180 s (mediana de 3,9 s) e 298 cenas em 22,4 min. A abertura de 36,9 s deve ter 14 cenas, não uma.

## O erro

A prévia anterior usou **uma cena única de 36,9 s**, um único asset composto e um único movimento de câmera/camada. Ela não cobriu as frases do gancho com acontecimentos visuais distintos, não teve cortes, inserções, efeitos ou transições, e foi marcada como `ready-for-creator-review` sem o QA cena a cena. O protocolo exige o contrário: cada beat/frase com acontecimento visível, composição e estado próprios; o preview gate precisa percorrer todas as cenas em movimento.

A causa não foi o protocolo. Foi a execução: interpretei “prévia dos primeiros segundos” como um teste de conceito de uma cena, priorizei a URL rápida e pulei o planejamento beat a beat, o plano lexical/recursos e a inspeção de cobertura. O `beats.json` já tinha 35 tomadas direcionais, inclusive 3 para o beat 1; eu não as usei como contrato de composição.

## Política de recursos

**Não existe limite máximo de recursos por cena.** O mínimo é **5 assets visuais** (objeto, cenário, personagem, overlay, efeito, transição, material ou luz declarada como asset); câmera, movimento e som entram além disso e também contam na densidade de produção. Quanto mais recursos úteis, melhor, desde que cada um sirva ao acontecimento, à leitura, à causalidade ou ao contato. A lista abaixo é o mínimo operacional de cada cena; a construção pode acrescentar quantos recursos o acontecimento pedir.

O `project.json` da abertura declara `qualityPolicy.minAssetsPerScene: 5`, `qualityPolicy.maxSceneSeconds: 8` e não existe `maxAssetsPerScene`. O validador de produção reprova cena com menos de 5 assets visuais e cena acima de 8 s; a duração máxima pode ser ajustada com justificativa no projeto, mas não serve para transformar um parágrafo em cena única.

## Tempos da voz de teste

| Frase | Janela |
|---|---|
| “Mais da metade da população brasileira se declara preta ou parda.” | 0,10–4,38 |
| “Mesmo assim, um trabalhador branco ganha, em média, quase 70% mais por hora do que um trabalhador negro.” | 4,39–11,41 |
| “O Brasil foi o último país independente das Américas a abolir a escravidão, em 1888” | 11,42–17,27 |
| “e a lei não trouxe indenização para quem foi libertado, nem distribuição de terra, nem política de integração.” | 17,28–24,30 |
| “Como um dos países mais diversos do mundo se tornou também um dos mais desiguais?” | 24,31–30,16 |
| “A resposta não começa em 1888.” | 30,17–32,50 |
| “Começa antes de 1500.” | 32,51–34,07 |
| “As camadas do Brasil.” | 34,36–36,09 |

Os tempos são estimados pela duração proporcional da tomada; a versão final usará alinhamento acústico por palavra.

## Cenas

**Leitura da tabela:** a coluna `Assets` é a base de cada cena; a lista mínima de **5 assets visuais** por cena está na seção “Densidade mínima por cena”. Não há teto: a construção pode acrescentar quantos recursos o acontecimento pedir.

| # | Janela | Fala | Evento visível | Câmera | Efeito / transição | Som | Assets (base; ver densidade) | Estado antes → depois |
|---|---|---|---|---|---|---|---|---|
| 1 | 0,0–1,4 | “Mais da metade…” | Sala escura; a lâmpada acende; a pilha de mapas aparece em silhueta; a poeira se move no feixe. | Plano fechado na lâmpada → pequeno recuo para a mesa. | Acendimento da lâmpada; entrada de poeira; corte seco para o selo. | Clique da lâmpada; ambiente baixo. | `brasil_atlas_abertura`; `iluminação` da cena; `som_impacto` leve. | Escuro → mesa iluminada. |
| 2 | 1,4–4,38 | “…se declara preta ou parda.” | Um carimbo de latão desce e bate na camada de papel; a tinta “55,5%” se espalha; a fibra do papel aparece. | Macro do carimbo → contra-plano do papel; câmera parada no impacto. | Impacto do carimbo; tinta se espalhando; corte. | Thud + papel; sem whoosh. | `brasil_atlas_abertura`; `abertura_selo_55`; `som_impacto`; `bordo_papel`. | Papel limpo → número carimbado. |
| 3 | 4,39–6,4 | “Mesmo assim, um trabalhador branco ganha…” | Corte para uma folha de pagamento/razão sobre a mesa: duas fichas de papel, uma de cada lado; a mão coloca a ficha “branco” no topo. | Plano superior, corte seco; câmera desce um pouco. | Entrada das fichas; sombra da mão; corte. | Papel; mesa. | `abertura_folha_pagamento`; `brasil_atlas_abertura`; `bordo_papel`. | Duas fichas fora de ordem → ficha “branco” no topo. |
| 4 | 6,4–8,2 | “…quase 70% mais por hora do que um trabalhador negro.” | Uma barra de latão/moeda cresce entre as fichas até 70%; a linha de tinta marca a diferença; a ficha “negro” fica na base. | Macro da barra → lateral das duas fichas. | Crescimento da barra; linha de tinta; corte. | Clique de metal; tinta. | `abertura_folha_pagamento`; `abertura_barra_70`; `som_encaixe`/`clink`. | Barra zero → barra a 70%. |
| 5 | 8,2–11,41 | “O Brasil foi o último país independente…” | Volta à mesa; a mão puxa a camada de papel de 1888; a camada se desloca e revela a pilha; um selo “1888” aparece na borda. | Plano médio da mesa; acompanha a camada com um pequeno travelling. | Deslizamento da camada; poeira; corte. | Papel; whoosh curto; carimbo. | `brasil_atlas_abertura`; `abertura_selo_1888`; `som_movimento`; `som_impacto`. | Pilha fechada → camada de 1888 fora do lugar. |
| 6 | 11,41–14,2 | “…a abolir a escravidão, em 1888” | Macro do selo “1888” e de um documento sobre a mesa; o carimbo cai; a tinta marca o ano; o mapa ao fundo fica desfocado. | Macro do documento; foco raso; câmera parada. | Impacto; tinta; profundidade de campo. | Thud; papel. | `abertura_lei_1888`; `abertura_selo_1888`; `som_impacto`. | Documento em branco → ano carimbado. |
| 7 | 14,2–17,27 | “e a lei não trouxe indenização… nem distribuição de terra, nem política de integração.” | O documento se abre; três áreas ficam vazias (indenização, terra, integração); a mão passa por elas e não encontra nada; as bordas queimam/escurecem. | Plano topo do documento; pequeno push-in em cada vazio. | Abertura do documento; áreas vazias escurecem; corte. | Papel; fósforo/queimado seco; silêncio na palavra “indenização”. | `abertura_lei_1888`; `abertura_vazios_lei`; `bordo_papel`. | Documento fechado → três vazios visíveis. |
| 8 | 17,27–20,3 | “O Brasil foi o último…” / transição | A camada de 1888 cai na pilha; as camadas se acomodam; a câmera sobe e mostra a pilha inteira; a luz muda. | Contra-plongée da pilha; câmera sobe. | Queda da camada; acomodação; corte. | Papel caindo; thud. | `brasil_atlas_abertura`; `abertura_transicao_camada`; `som_impacto`. | Camada fora → camada encaixada; pilha visível. |
| 9 | 20,3–24,3 | “Como um dos países mais diversos…” | Split visual: de um lado, o mapa em muitas cores/territórios; do outro, uma camada escura de renda cobre o mapa; a câmera orbita. | Orbita lenta em torno da pilha; corte para o mapa. | Sobreposição da camada de renda; revelação. | Pulso baixo; tinta. | `brasil_atlas_abertura`; `abertura_mapa_diversidade`; `abertura_camada_renda`. | Mapa diverso → mapa cortado pela renda. |
| 10 | 24,3–27,0 | “…se tornou também um dos mais desiguais?” | A pilha cresce/titubeia; a câmera recua; a pergunta fica no ar; um pequeno “?” de tinta no papel. | Pullback; câmera baixa. | Crescimento da pilha; tinta. | Pulso; papel. | `brasil_atlas_abertura`; `abertura_pilha_cresce`; `som_movimento`. | Pilha estável → pilha alta, pergunta no ar. |
| 11 | 27,0–30,16 | (respiro da pergunta) | A câmera para; a poeira assenta; a mão entra no quadro e toca a camada de 1888; a luz da lâmpada pulsa. | Plano médio; câmera quase parada. | Poeira; pulso de luz; corte. | Ambiente; respiração. | `brasil_atlas_abertura`. | Pergunta no ar → mão se prepara. |
| 12 | 30,16–32,5 | “A resposta não começa em 1888.” | A mão puxa a camada de 1888 para fora; a pilha se abre; a câmera desce para a camada de baixo; o selo “1888” sai de quadro. | Travelling descendente; foco na fenda. | Deslizamento; revelação da camada de 1500. | Papel; whoosh. | `brasil_atlas_abertura`; `abertura_transicao_camada`; `som_movimento`. | Camada de 1888 no topo → fenda aberta. |
| 13 | 32,5–34,1 | “Começa antes de 1500.” | A camada de 1500 acende: mosaico de territórios, rios, roças, caminhos; um selo “1500” aparece; a câmera macro percorre o mosaico. | Macro da camada; travelling lateral. | Acendimento do mosaico; selo; corte. | Rios, pássaros, fogo doméstico; sem música heroica. | `abertura_camada_1500`; `abertura_selo_1500`. | Camada apagada → mosaico vivo. |
| 14 | 34,1–36,9 | “As camadas do Brasil.” | Volta ao plano geral da mesa; a pilha inteira; o título é carimbado; a lâmpada permanece acesa. | Pullback final; câmera parada. | Título; poeira; fade final. | Papel; ambiente; sem CTA nesta prévia. | `brasil_atlas_abertura`; `titleCards` do HyperFrames. | Mosaico → pilha/título. |

## Densidade mínima por cena

| Cena | Assets visuais mínimos (5+) | Recursos adicionais |
|---|---|---|
| 1 | `brasil_atlas_abertura`; `abertura_lampada`; `abertura_poeira`; `abertura_escuro`; `abertura_luz_quente` | câmera de abertura; clique da lâmpada; ambiente |
| 2 | `brasil_atlas_abertura`; `abertura_selo_55`; `abertura_tinta_55`; `abertura_overlay_55`; `abertura_luz_lampada`; `abertura_poeira` | câmera macro; thud; papel |
| 3 | `abertura_folha_pagamento`; `abertura_ficha_branco`; `abertura_ficha_negro`; `abertura_luva`; `abertura_luz_lampada`; `abertura_poeira` | câmera superior; papel; mesa |
| 4 | `abertura_folha_pagamento`; `abertura_barra_70`; `abertura_linha_tinta`; `abertura_overlay_70`; `abertura_luz_lampada`; `abertura_poeira` | câmera macro; metal; tinta |
| 5 | `brasil_atlas_abertura`; `abertura_selo_1888`; `abertura_transicao_camada`; `abertura_luva`; `abertura_luz_lampada`; `abertura_poeira` | travelling; papel; whoosh; carimbo |
| 6 | `abertura_lei_1888`; `abertura_selo_1888`; `abertura_tinta_1888`; `abertura_overlay_1888`; `abertura_luz_lampada`; `abertura_poeira` | câmera macro; thud; papel |
| 7 | `abertura_lei_1888`; `abertura_vazios_lei`; `abertura_queimado`; `abertura_luva`; `abertura_luz_lampada`; `abertura_poeira` | câmera topo; papel; silêncio |
| 8 | `brasil_atlas_abertura`; `abertura_transicao_camada`; `abertura_queda_camada`; `abertura_luz_lampada`; `abertura_poeira`; `abertura_sombra_camada` | contra-plongée; thud; papel |
| 9 | `brasil_atlas_abertura`; `abertura_mapa_diversidade`; `abertura_camada_renda`; `abertura_overlay_diversidade`; `abertura_luz_lampada`; `abertura_poeira` | órbita; pulso; tinta |
| 10 | `brasil_atlas_abertura`; `abertura_pilha_cresce`; `abertura_tinta_interrogacao`; `abertura_overlay_pergunta`; `abertura_luz_lampada`; `abertura_poeira` | pullback; pulso; papel |
| 11 | `brasil_atlas_abertura`; `abertura_luva`; `abertura_luz_pulso`; `abertura_poeira`; `abertura_sombra_mao`; `abertura_overlay_respiro` | câmera média; ambiente; respiração |
| 12 | `brasil_atlas_abertura`; `abertura_transicao_camada`; `abertura_camada_1500`; `abertura_luva`; `abertura_poeira`; `abertura_luz_lampada` | descida; papel; whoosh |
| 13 | `abertura_camada_1500`; `abertura_selo_1500`; `abertura_mosaico_luz`; `abertura_overlay_1500`; `abertura_luz_camada`; `abertura_poeira` | macro; rios; pássaros |
| 14 | `brasil_atlas_abertura`; `abertura_title_overlay`; `abertura_luz_lampada`; `abertura_poeira`; `abertura_transicao_final`; `abertura_sombra_pilha` | pullback; papel; ambiente |

**Total:** 14 janelas; 12–14 cenas se algumas forem fundidas. A média fica em 2,6 s por cena, contra 36,9 s da prévia anterior. A abertura deixa de ser um plano único e passa a ter cortes, inserções, macros, efeitos e transições. Não há teto de recursos: a tabela acima é o mínimo; a construção pode acrescentar mais.

## Backlog de recursos da abertura

Reutilizar:
- `brasil_atlas_abertura` — mesa, sala, lâmpada, pilha, camada de papel, mapa do Brasil, luva. Aproveitar o que já foi construído, mas usar em **composições e escalas diferentes**.
- `som_impacto` (thud), `som_movimento` (whoosh), `bordo_papel` (papel), `clink`/`som_encaixe` (metal).
- Câmera e iluminação existentes da cena; a lâmpada e a janela continuam as fontes motivadas.

Criar:
- `abertura_selo_55` — carimbo de latão e tinta “55,5%”; overlay/objeto com o número legível.
- `abertura_folha_pagamento` — duas fichas/razão, moedas e régua; sem texto inventado.
- `abertura_barra_70` — barra/linha de tinta que cresce até 70%; animação determinística.
- `abertura_selo_1888` — carimbo e documento do ano; sem fala de figura histórica.
- `abertura_lei_1888` — documento com três áreas vazias; dobra/abre.
- `abertura_vazios_lei` — efeito de escurecimento/queimado nas áreas ausentes.
- `abertura_transicao_camada` — deslizamento/queda/encaixe da camada; estado absoluto.
- `abertura_mapa_diversidade` — mapa com territórios coloridos, sem texto.
- `abertura_camada_renda` — camada escura que cobre o mapa; dado visual de desigualdade.
- `abertura_pilha_cresce` — a pilha cresce/titubeia; animação.
- `abertura_camada_1500` — camada/mosaico de 1500 com rios, roças, caminhos, aldeias; uma cena nova, não só um close da mesa.
- `abertura_selo_1500` — selo do ano.
- `abertura_title` — cartão final (HTML do HyperFrames), não asset 3D.

## QA obrigatório desta abertura

1. Cada uma das 12–14 cenas ligada à frase exata e ao `beatId`; `visualPlan` completo.
2. Cada cena com evento, estado antes/depois, composição distinta e **no mínimo 5 assets visuais**; sem teto. Reuso do atlas só quando a ação e o estado mudarem de forma perceptível.
3. Inspeção em movimento de preparação, ação, contato, reação e resultado em **todas** as cenas.
4. Cortes e junções: verificar continuidade de mapa, mão, lâmpada e escala; nenhum corte “por cronômetro”.
5. Desktop, 390 px de largura e busca fora de ordem.
6. Áudio: voz de teste, impactos e papel; escuta humana pendente.
7. `preview-qa.json` só muda para `ready-for-creator-review` quando todas as cenas estiverem cobertas e não houver P0/P1. A prévia atual fica `rejected`.

## Próximo passo

O projeto da abertura deve declarar `qualityPolicy.minAssetsPerScene: 5` e `qualityPolicy.maxSceneSeconds: 8` no `project.json`; o validador reprova cena com menos de 5 assets visuais e cena acima de 8 s, e não aplica teto de assets.

Validar este mapa de cenas ou ajustar a ordem/duração antes de construir. Depois, a construção segue o mesmo ciclo do Titanic: cena → inspeção em movimento → correção → nova inspeção, com o `beats.json` atualizado para 12–14 tomadas na abertura.
