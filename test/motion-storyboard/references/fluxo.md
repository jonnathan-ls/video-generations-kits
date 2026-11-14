# Fluxo extraído do artefato

Origem: https://claude.ai/artifact/V2ZdmTZ3o6MUYG7ffBVWkw

## O que foi observado

O documento externo carrega um frame. O frame contém estilos CSS, oito renderizadores de amostras Canvas, oito prompts completos e lógica de formulário, persistência local e substituição de variáveis. A página não chama uma API de geração de histórias ou vídeo: copia o prompt para execução pela LLM. A escolha de outro estilo mantém os campos do formulário.

Os originais estão em `artifact/raw/page.html` e `artifact/raw/content.html`; os scripts e CSS inline também foram separados ali. `artifact/catalog.json` preserva os campos dos oito estilos e os atalhos por intenção. Os prompts completos estão em `artifact/templates/`. `artifact/manifest.json` registra URLs, hashes, recursos capturados e falhas, distinguindo o que foi acessível de serviços internos. A versão local em `artifact/local/index.html` retira somente a ponte da plataforma e troca fontes por arquivos locais; o arquivo original permanece intacto.

## Escolha criativa

- `paper-cut-out`: papel em camadas, fibras, recortes e sombras; processos acolhedores e explicações editoriais.
- `generative-particles`: pontos luminosos que montam objetos e relações; tecnologia, comparações, lançamentos. Texto auxiliar legível e marcas autênticas.
- `liquid-glass`: lentes e refração de conteúdo real; interfaces e produtos; maior custo de renderização.
- `kinetic-typography`: palavras são os objetos e demonstram a ideia; argumentos, dicas e frameworks. Texto conciso é essencial.
- `isometric-line-art`: desenho técnico, câmera ortográfica, mecanismos e percursos; sistemas, logística e arquitetura.
- `flat-vector`: ilustrações 2D, cortes e morphs que explicam causalidade; ciência e funcionamento cotidiano.
- `risograph-print`: tintas sobrepostas, retículas e desalinhamento controlado; cultura, música e histórias editoriais.
- `8-bit-pixel-art`: sprites, bitmap e transições em tiles; jogos, programação e explicações lúdicas. Movimento coerente com a grade.

Estes resumos ajudam a selecionar; leia o template completo escolhido antes de projetar cenas. As recomendações são heurísticas do artefato, não restrições temáticas.

## Estado e variáveis originais

`config.json` usa `style` (um id acima), `topic` (texto), `storyboard`, `voiceover`, `script` (texto), `subtitles`, `min`, `sec`, `vertical`, `music`, `sfx`. Todos os toggles são booleanos. Defaults originais: tema vazio; storyboard falso; voz falsa; script vazio; legendas falsas; 0 min e 30 sec; horizontal; música e SFX verdadeiros. O teste pelo chat recomenda storyboard verdadeiro, explicitando a adaptação.

`buildPrompt` substitui `TOPIC`, `STORYBOARD`, `VOICEOVER`, `TRANSCRIPT`, `SUBTITLES`, `DURATION`, `FORMAT`, `RESOLUTION`, `SFX`, `MUSIC`. Sem voz, duração de 5 a 600 segundos. Com voz, duração vem do MP3; o texto do script tem espaços normalizados e aspas duplas trocadas por simples. O formulário só ativa legendas com voz, embora alguns templates descrevam legendas sem voz; o script preserva o comportamento do formulário. Um pedido explícito diferente deve ser registrado como adaptação, nunca alteração silenciosa do prompt original.

Horizontal: 1920 × 1080, 16:9. Vertical: 1080 × 1920, 9:16. Todos pedem 30 fps e MP4 real. Música e efeitos são sintetizados com Web Audio. Voz é um arquivo fornecido, não TTS embutido.

## Estrutura narrativa compartilhada

Os templates pedem uma explicação conectada e visualmente específica: objetivos de aprendizado, demonstração de mecanismo ou comparação, transformações internas de cena e transições motivadas. Aproximadamente 4–6 aprendizados, 4–5 composições e 12–18 beats aparecem como sugestões em alguns templates; adapte à duração e ao assunto. Não são cotas universais.

Storyboard ativo: planejar cenas com tempo, conteúdo, composição, movimentos, transição, texto e som; renderizar um quadro representativo real por composição; obter aprovação explícita antes da animação. Storyboard desativado: avançar à animação. O layout de seleção usa amostras prontas; o storyboard do tema precisa de arte nova e específica.

Animação: reutilizar o storyboard aprovado, renderizar por tempo determinístico, conservar detalhes do estilo, fazer a explicação acontecer por movimento. Player com play/pause, reinício, seek, relógio, controles das faixas ativas e exportação. Validar carregamento, cenas e alguns tempos relevantes. A origem recomenda uma primeira entrega forte com verificação breve, sem refinamento interminável.

## Evidências no código

- `raw/inline-05.js`: `RENDER`, desenho e animação das amostras.
- `raw/inline-06.js`: array `PROMPTS` com oito strings integrais.
- `raw/inline-07.js`: `STYLES`, `STARTS`, `TIPS`, `DEF`, `buildPrompt`, `copyPrompt`, validação e eventos.
- `scripts/capture.py`: extração e captura reproduzível; consultas a APIs de conta e telemetria são excluídas do espelho.
- `scripts/build_prompt.py`: substituição compatível com `buildPrompt`; produz arquivos, sem simular decisões criativas.
