# Brief — As camadas do Brasil

## Pedido

Produzir um vídeo animado educativo de aproximadamente 12 a 13 minutos, em português brasileiro, para público geral, sobre a formação histórica do Brasil — do período anterior a 1500 até o presente. A pergunta que orienta a peça é: como o Brasil foi formado e por que sua história produziu um país tão diverso e, ao mesmo tempo, marcado por conflitos e desigualdades persistentes?

A referência indicada pelo criador é o vídeo **“423 Years of American History in 13 Minutes”**, do canal **Fun History** ([YouTube](https://www.youtube.com/watch?v=5Pm_s2wzxo0), 12:45). Ela serve como referência de arquitetura narrativa — ritmo, sequência de beats, uso de mapas, explicações causais, humor e payoff —, não como fonte de frases, diálogos, piadas, personagens, cenas, ilustrações ou identidade visual. A obra será original.

## Entendimento confirmado

- **Formato:** vídeo horizontal 16:9, 1920×1080, 30 fps, português brasileiro, legendas embutidas e `.srt` para YouTube.
- **Duração:** meta de 12 a 13 minutos. O texto será medido com a voz escolhida; não vou acelerar a fala para caber.
- **Público:** geral, sem exigir formação histórica. A narração deve soar como alguém contando uma história, não como leitura de livro didático.
- **Estrutura:** 10 beats na ordem definida pelo criador; 9 capítulos narrados + prólogo com o título do vídeo.
- **Escopo desta etapa:** pesquisa, narrativa e mapa de beats. Sem cenas, sem voz, sem render e sem lista de assets aprovada.
- **Rota técnica:** Three.js + HyperFrames. O projeto tem rota Wan2GP local, mas ela só se aplica quando o `state.json` declara `wan2gp-ai-video`; não é o caso. Não haverá geração de vídeo por IA para os mapas ou cenas históricas.
- **Voz:** ainda não escolhida. As opções locais são `pf_dora`, `pm_alex` e `pm_santa`; a escolha será feita com amostras depois da validação da narrativa.
- **Sem instalações, configurações novas ou assets pagos.** A referência e a transcrição foram guardadas em `research/references/5Pm_s2wzxo0/` apenas para análise.

## Referência estudada

- **Título:** “423 Years of American History in 13 Minutes”
- **Canal:** Fun History
- **Duração:** 764,77 s (12:45)
- **Transcrição:** automática em inglês, cerca de 2.200 palavras; usada apenas para mapear a estrutura, não como fonte factual.
- **Quadros:** amostragem espaçada para observar ritmo e recursos visuais; nenhum quadro será reutilizado.
- **O que a referência faz:** abre com uma afirmação superlativa sobre o país e, em seguida, desmonta a expectativa mostrando que a maior parte do território foi ignorada por mais de um século. Usa mapas de satélite, territórios chapados, caricaturas de líderes com balões de fala, gravuras de arquivo, ícones e transições causais rápidas. O humor vem de esquetes dramatizadas, anacronismos e situações burocráticas. Termina no início do século XX, com uma chamada de canal.
- **O que será preservado:** a ordem das funções narrativas (gancho → passado profundo → colonização → economia e violência → expansão → instituições → conflito e ruptura → modernização → payoff), a progressão causal, o uso de mapas para tornar o território visível, a alternância entre explicação e alívio, e o retorno à pergunta inicial.
- **O que não será copiado:** frases, piadas, diálogos, personagens, mapas, ilustrações, satélite, territórios chapados, caricaturas, trilha, identidade visual e o CTA da referência. O CTA do canal é original. Nenhuma fala de figura histórica será inventada.

### Mapa de correspondência

| Função na referência | Como a referência cumpre | Beat brasileiro |
|---|---|---|
| Gancho e promessa | afirmação superlativa + mapa + “a ascensão foi inesperada” | 1. Paradoxo diversidade/desigualdade + pilha de mapas |
| Passado profundo | vikings, Colombo, Tordesilhas; o mapa antes da “descoberta” | 2. Povos indígenas antes de 1500; mosaico, não vazio |
| Colonização e interesse | colônias inglesas, franceses, guerra; mapa redesenhado | 3. Chegada portuguesa, pau-brasil, capitanias |
| Economia e violência | a referência concentra a escravidão no bloco da Guerra Civil | 4. Açúcar, escravidão indígena e africana, resistência |
| Expansão territorial | Louisiana, população, oeste, guerras | 5. Bandeiras, gado, ouro, tratados; mapa esticado |
| Instituições | independência, constituição, governo | 6. Corte no Rio, independência, Império, 1824 |
| Conflito e ruptura | escravidão, Guerra Civil, Lincoln | 7. Abolição sem terra, República excludente |
| Modernização e poder | Havaí, Cuba, Panamá, potência mundial | 8. Indústria, Vargas, Brasília, ditadura |
| Extensão do pedido | a referência termina antes do presente | 9. Redemocratização e 1988 |
| Payoff | potência mundial + CTA | 10. Presente, pilha de camadas, reflexão |

**Divergências deliberadas.** A referência concentra a escravidão no bloco da Guerra Civil; o pedido distribui a escravidão colonial no beat 4 e a abolição no beat 7. Preservo a função causal — economia → conflito → ruptura —, não a posição americana. A referência expande o território depois da independência; no Brasil, a expansão colonial vem antes de 1822. A ordem definida pelo criador é cronológica e causal para o Brasil, e é ela que orienta a peça. O humor da referência é recriado em situações burocráticas e visuais, com personagens ficcionais, sem esquetes com figuras históricas.

## Tese e gancho

**Tese.** O Brasil é diverso porque foi construído por muitos povos e territórios; é desigual porque, por cinco séculos, as instituições organizaram essa diversidade em hierarquias — quem tinha terra, quem podia votar, quem era cidadão. Cada camada histórica mudou o mapa e as leis, mas não desfez completamente a hierarquia anterior. O vídeo conta essa acumulação, não uma sucessão de datas.

**Gancho (texto falado):** “Mais da metade da população brasileira se declara preta ou parda. Mesmo assim, um trabalhador branco ganha, em média, quase 70% mais por hora do que um trabalhador negro. O Brasil foi o último país independente das Américas a abolir a escravidão, em 1888 — e a lei não trouxe indenização para quem foi libertado, nem distribuição de terra, nem política de integração. Como um dos países mais diversos do mundo se tornou também um dos mais desiguais? A resposta não começa em 1888. Começa antes de 1500.”

## Pesquisa e fontes

### Já verificado

- **Censo 2022:** 203.080.756 habitantes; 45,3% pardos (92,1 milhões), 10,2% pretos (20,6 milhões), 43,5% brancos (88,2 milhões), 0,8% indígenas (1,7 milhão), 0,4% amarelos (850,1 mil). Pretos e pardos somam **55,5%**. Fonte: [IBGE/SECOM](https://www.gov.br/secom/pt-br/acompanhe-a-secom/noticias/2023/12/pardos-sao-maioria-da-populacao-brasileira-pela-primeira-vez-indica-ibge).
- **Rendimento por hora:** em 2022, trabalhadores brancos recebiam R$ 20,0/h, valor 61,4% acima dos pretos ou pardos (R$ 12,4/h); o dado de 2023, divulgado em dezembro de 2024, aponta 67,7% de diferença. O roteiro usa “quase 70%”, referente ao dado mais recente. Fontes: [IBGE 2022](https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/38543-em-2022-rendimento-hora-dos-trabalhadores-brancos-r-20-0-era-61-4-maior-que-o-dos-pretos-ou-pardos-r-12-4) e [Folha/IBGE 2024](https://www1.folha.uol.com.br/mercado/2024/12/brancos-recebem-677-a-mais-por-hora-de-trabalho-do-que-negros.shtml). **Atualizar antes da gravação.**
- **Tráfico transatlântico:** cerca de 4,8 a 5 milhões de africanos desembarcaram no Brasil entre 1501 e 1866; o país foi o maior destino das Américas. Fontes: [Slave Voyages](https://www.slavevoyages.org/assessment/estimates) e [síntese de Leonardo Marques (Yale University Press)](https://dev-yale-press-multisite.pantheonsite.io/2016/11/21/the-slave-trade-in-the-u-s-and-brazil-comparisons-and-connections/).
- **Abolição:** a Lei nº 3.353, de 13 de maio de 1888, tem dois artigos e não previu indenização aos libertos, distribuição de terra ou política de integração. Fonte: [Lei Áurea](https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm).
- **Brasil e Cuba:** Cuba aboliu a escravidão em 7 de outubro de 1886; Brasil e Cuba foram os dois últimos países das Américas a abolir, e o Brasil era o último país independente. Fonte: [USP/FFLCH](https://www.fflch.usp.br/38892?page=5).
- **Povos indígenas no Censo 2022:** 1,7 milhão de indígenas, 391 etnias e 295 línguas. Fontes: [IBGE](https://anda.ibge.gov.br/en/agencia-news/2184-news-agency/news/44866-2022-census-brazil-has-391-indigenous-ethnicities-and-295-indigenous-languages) e [ISA](https://acervo.socioambiental.org/index.php/acervo/noticias/numeros-de-povos-e-linguas-indigenas-crescem-no-brasil-mostra-censo-2022).
- **Gini:** 51,5 em 2023 e 50,3 em 2024, segundo o World Bank. Fonte: [FRED/World Bank](https://fred.stlouisfed.org/data/SIPOVGINIBRA). O roteiro não usa o número exato; diz que o país continua entre os mais desiguais.

### A confirmar antes da gravação

- **População indígena antes de 1500:** as estimativas variam muito. A BBC, em 2000, cita 3,5 a 8 milhões, com cerca de 5 milhões como número mais aceito; a pesquisa acadêmica posterior revisa esses números. O roteiro diz apenas “milhões de pessoas”, sem cravar um total. Fonte de referência: [BBC Brasil](https://www.bbc.com/portuguese/esp_bra_indios.htm).
- **Número de línguas antes de 1500:** não há consenso; o roteiro diz “centenas de povos” e reserva os números de 391 etnias/295 línguas para o Censo 2022.
- **Tordesilhas (1494), Cabral (1500), navegadores anteriores, presença francesa, capitanias (1534), Salvador (1549):** conferir em fontes primárias/institucionais e em Boris Fausto antes da gravação. O roteiro não afirma que Cabral foi o primeiro europeu a chegar.
- **Açúcar, escravidão indígena e africana, Palmares/Zumbi (1695):** conferir em Stuart Schwartz, Flávio Gomes e João José Reis. O roteiro trata a substituição da mão de obra indígena pela africana como processo, não como troca simples.
- **Ouro, capital para o Rio (1763), Madri (1750), Santo Ildefonso (1777), Guerra Guaranítica (1754–1756), Inconfidência Mineira (1789), Tiradentes (1792):** conferir em Boris Fausto, Jaime Cortesão e no acervo de mapas do IBGE/Biblioteca Nacional.
- **Corte no Rio (1808), Reino Unido (1815), independência (1822), guerra da independência, Constituição de 1824, abdicação (1831), Regência, maioridade (1840), Guerra do Paraguai (1864–1870):** conferir em Lilia Schwarcz e Heloisa Starling, Boris Fausto e documentos oficiais. O roteiro afirma que a independência não foi pacífica nem um só dia.
- **Leis abolicionistas (1850, 1871, 1885, 1888), Constituição de 1891, República Velha, coronelismo:** conferir nos textos legais e em José Murilo de Carvalho. O roteiro diz que a Constituição de 1891 manteve o voto restrito; conferir a formulação exata.
- **Vargas (1930, 1937, 1945), CLT (1943), Brasília (1960), golpe de 1964, AI-5 (1968), abertura, 1985:** conferir em Marcos Napolitano, na Comissão Nacional da Verdade e em fontes oficiais. O roteiro não chama o regime de 1964 de “revolução”.
- **Constituição de 1988:** conferir os artigos sobre saúde, educação, assistência, previdência, indígenas e quilombolas; o roteiro fala em “bases do SUS”, porque a organização do sistema veio depois, em 1990. Fonte: [Constituição](https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm).
- **“Democracia racial”:** é uma ideia historiográfica e uma narrativa pública, não um fato. O roteiro a apresenta como crença que ajudou a esconder o racismo; conferir a formulação com Lilia Schwarcz e Florestan Fernandes.

### Fontes de apoio previstas

- **Sínteses históricas:** Boris Fausto, *História do Brasil*; Lilia Schwarcz e Heloisa Starling, *Brasil: uma biografia*; Caio Prado Jr., *Formação do Brasil contemporâneo*.
- **Escravidão e resistência:** Stuart Schwartz, *Segredos internos*; Flávio Gomes, *A hidra e os pântanos*; João José Reis, *Rebelião escrava no Brasil*.
- **Povos indígenas:** Manuela Carneiro da Cunha (org.), *História dos índios no Brasil*; Eduardo Góes Neves; Anna Roosevelt; ISA e FUNAI.
- **Império e República:** José Murilo de Carvalho, *A formação das almas* e *Os bestializados*; Lilia Schwarcz; Boris Fausto.
- **Ditadura e redemocratização:** Marcos Napolitano, *1964: História do regime militar brasileiro*; Comissão Nacional da Verdade; IPEA.
- **Mapas e geodados:** IBGE (malhas territoriais), Natural Earth (domínio público), Biblioteca Nacional e Arquivo Nacional. Fronteiras históricas serão desenhadas como polígonos esquemáticos; o vídeo dirá “mapa esquemático” quando necessário.
- **Imagens de arquivo:** somente com licença/domínio público verificado e crédito; caso contrário, recriar em 3D/ilustração original. Nenhuma imagem da referência será usada.

## CTA e AI slop

**CTA obrigatório.** Todo vídeo narrado do canal inclui, em algum momento, um convite curto e natural à inscrição no canal e à curtida. Neste projeto, o CTA fica depois do payoff, para não interromper a conclusão: “Se você quiser continuar abrindo esses mapas com a gente, se inscreve no canal e curte o vídeo. A próxima camada começa no próximo vídeo.” O CTA usa a metáfora do atlas, pede as duas ações e não soa como anúncio genérico. A pergunta final continua sendo o último conteúdo histórico.

**Proibição de AI slop.** É proibido trecho de conversa de IA / AI slop: metacomentário de assistente, disclaimers de modelo, “como uma IA”, “enquanto modelo de linguagem”, fórmulas genéricas (“no mundo de hoje”, “é importante ressaltar”, “em suma”, “vamos mergulhar”, “não é apenas X, é Y”), enchimento, listas de tópicos, repetição de conectivos e tom de post/chat. A narração deve soar como uma pessoa contando uma história. A regra está explícita em `AGENTS.md`, `kit/docs/qualidade-audiovisual.md`, `skills/direcao/SKILL.md` e `kit/docs/narrativa.md`.

## Cobertura de cenas e densidade

A unidade de cobertura é a fala, não o parágrafo: cada frase ou oração com acontecimento próprio recebe uma cena distinta. A abertura de 36,9 s tem 14 cenas (média de 2,6 s), não uma. Cada cena declara no mínimo **5 assets visuais**, sem limite máximo; mais recursos são bem-vindos quando servem ao acontecimento, à leitura ou à causalidade. Câmera, movimento e som contam além dos 5 assets visuais.

Prévia de trecho não é teste de conceito de uma cena: usa a mesma granularidade e o mesmo QA da versão final. “Provisório” não dispensa cobertura. O `project.json` declara `qualityPolicy.minAssetsPerScene: 5`, `qualityPolicy.maxSceneSeconds: 8` e nenhum `maxAssetsPerScene`; o validador `kit/tools/production.mjs` reprova cena abaixo de 5 assets e cena acima de 8 s, sem teto de assets. O plano corretivo está em `preview-opening-plan.md`; a prévia anterior foi marcada `rejected`.

## Direção visual (resumo)

**Conceito: “atlas de camadas”.** O Brasil é uma pilha de mapas, papéis, vidros e miniaturas sobre a mesa de uma cartógrafa. Cada época é uma camada; a câmera levanta, gira e atravessa as camadas. No fim, a pilha inteira forma o país de hoje. A pergunta visual é: *o que fica embaixo quando uma camada nova é colocada?*

- **Mapas:** base IBGE/Natural Earth; fronteiras históricas esquemáticas; cada beat tem um estado antes/depois (mosaico indígena → costa → plantations/rotas → interior/ouro/tratados → capital/Império → café/abolição/República → indústria/Brasília/ditadura → direitos → pilha atual).
- **Personagens:** miniaturas de madeira/cerâmica, com roupas e ferramentas pesquisadas; nenhuma caricatura de líder. A **cartógrafa** é ficcional, sem falas; o **funcionário da coroa** é ficcional, com um carimbo maior que ele, e concentra o humor burocrático. Figuras históricas entram como documentos, objetos, silhuetas ou medalhões, nunca como bonecos falantes.
- **Pessoas escravizadas e povos indígenas:** indivíduos e comunidades com trabalho, conhecimento, família e resistência; não são cenário. A violência é nomeada, não espetacularizada.
- **Luz:** lâmpada de trabalho sobre a mesa; fontes práticas dentro dos dioramas; fundos pintados em vez de céu literal. Sem sol/lua inventados.
- **Som:** papel, carimbo, régua, madeira, metal, água, cana, moenda, trem, fábrica, rádio; trilha acústica pequena; silêncio nos momentos de escravidão e ditadura. Voz à frente.
- **Humor:** gesto e burocracia (régua que escorrega, carimbo que não fecha, papelada da corte, Constituição pesada). Nunca em escravidão, genocídio, racismo, tortura ou desaparecimento.
- **Formato:** 1920×1080, 30 fps, legendas embutidas + `.srt`, capítulos narrados. Sem UI ou texto técnico no MP4.

## Limites e próximos passos

- Não há cenas, voz, assets aprovados ou render nesta etapa.
- A narração proposta está em `narrative-v1.md`; depois da validação, ela será copiada para `narration.txt` e passará pela análise lexical.
- A duração será medida com a voz escolhida. Se a leitura passar de 13:10, corto 30–50 palavras sem perder os fatos e a causalidade.
- O próximo gate humano é a validação da narrativa. Depois vêm análise lexical, plano de recursos, construção/revisão de assets, storyboard, prévia, voz e render.
