# Rota motion graphics 2D — do pedido ao MP4

Esta rota existe para vídeos fechados de **mapas, documentos, tipografia, dados, arquivo e colagem animada** — o tipo de peça em que a imagem nasce de HTML/CSS/SVG/Canvas 2D no HyperFrames, não de geometria 3D.

Ela mantém os contratos de fala, cobertura, som, legenda e inspeção. Ela remove o que só faz sentido na rota 3D: catálogo de assets, aprovação por recurso, plano lexical, prova de GPU e prévia separada do arquivo.

## Quando usar

- O pedido é um vídeo curto (15–90 s) ou uma peça longa de 10–20 min baseada em mapa, documento, arquivo, tipografia ou dados.
- A história se explica por relação, data, território, texto e imagem de arquivo.
- O prazo é curto e o resultado precisa ser um MP4 verificável, não uma cena 3D.

**Não use** quando a história depende de espaço, física, água, luz volumétrica, personagem 3D ou câmera em um mundo construído. Nesse caso, use a rota Three.js e o gate dela.

## Contrato de saída

Antes de escrever, fixe em uma linha:

`duração | formato | fps | língua | voz | legenda | arquivo final | prazo`

Exemplo: `30 s | 1920×1080 | 30 fps | pt-BR | Kokoro pm_santa | embutida + .srt | MP4 H.264/AAC | hoje`.

Para peça longa, o contrato inclui `capítulos`, `blocos de render` e `duração por bloco`. Não comece sem esse contrato.

## Pipeline

1. **Narrativa fechada.** Uma pergunta, uma tese, 8–12 beats. CTA natural no fecho, depois do payoff. Sem três alternativas quando o pedido já é um vídeo fechado.
2. **Voz primeiro.** Gere a narração, meça a duração real e alinhe as palavras. A voz é o relógio; a cena não define o tempo.
3. **Shot list.** Cada frase/oração com acontecimento próprio vira uma cena. Cada cena declara: acontecimento, mundo, 5+ recursos, câmera, transição, som e estado antes/depois.
4. **Sistema visual.** Uma metáfora (atlas, mesa, arquivo, linha do tempo), uma paleta, duas ou três fontes, texturas reutilizáveis. Construa uma vez; varie composição, escala, luz e conteúdo.
5. **Primeiro corte renderizado.** Monte o HTML, rode `check`, renderize um draft de 10–30 s e inspecione frames reais. Não espere a peça inteira para ver a primeira imagem.
6. **Loop de correção.** Contact sheet → encontrar P0/P1 → corrigir causa → reinspecionar. Render de 30 s em 1080p deve levar minutos, não horas.
7. **Som, legenda e master.** Trilha, 15–25 SFX, ducking sob a voz, legenda embutida, `.srt`, loudness de entrega. Depois, MP4 limpo.

## Voz e pausas

A narração não é uma lista corrida de frases. O contrato vale para 30 s e para 15 min:

- **Frases:** pausa de 0,25–0,45 s entre frases; a pontuação do texto precisa conduzir a respiração.
- **Parágrafos:** pausa de 0,8–1,2 s entre parágrafos; 1,2–2,0 s entre capítulos e cartelas narradas.
- **Longa:** TTS a 0,95–1,05×. Não use 1,15× para caber 15 min; ajuste o texto, não a velocidade.
- **Curta:** 1,0–1,1×. Se precisar de 1,15× para caber 30 s, corte palavras.
- **Segmentação:** gere por parágrafo ou por grupo de frases, acrescente silêncio entre blocos e alinhe o texto exato. Não exiba texto novo sobre voz antiga.
- **Escuta:** voz sintetizada não é aprovada por ASR. O ASR confirma inteligibilidade; a naturalidade, a dicção e o timbre precisam de escuta humana.

Uma narração corrida, sem pausa, é P1. O vídeo pode ter 16 cenas por segundo de fala; a voz não pode ter 15 minutos sem respiro.

## Cobertura e densidade

- A unidade é a fala, não o parágrafo. Um parágrafo com quatro frases não é uma cena.
- **Cena narrativa:** 5+ recursos (objeto/cenário, personagem/ação, câmera, luz, overlay/efeito, transição, som, material, animação). Sem teto.
- **Insert / cartela / transição:** 3+ recursos com justificativa; um insert de 0,8 s não precisa de 5 elementos se o acontecimento é um flash.
- **Duração:** 2–5 s por cena no curta; 6–12 s no longa, com movimento interno e pelo menos dois sub-beats. Acima de 12 s só com justificativa e QA.
- **Mundos:** varie o set. Não use o mesmo arranjo com zoom/cor diferente como se fosse cena nova. No longa, cada capítulo tem um mundo predominante e 2–3 variações.
- **Texto na tela:** data, sigla e termo de impacto recebem tratamento próprio. Não cubra o mecanismo com cartão genérico.

## Longa duração

Para 10–20 min, não tente uma cena por frase do texto inteiro em um único arquivo monolítico. Use capítulos e blocos:

- **10 capítulos** de 70–110 s.
- **6–8 cenas por capítulo** (60–80 cenas no total), 8–15 s cada.
- **Blocos de render** de 2–3 capítulos; o master é montado depois.
- **Voz** gerada por parágrafo/capítulo, com pausas; alinhamento e `.srt` no master.
- **Template por capítulo:** mapa, documento, pintura, dados, retrato, linha do tempo, cartela, montagem. Repita o template com conteúdo e composição diferentes; não repita o mesmo evento.
- **Transições:** no máximo 3–5 tipos, com causa visível. Corte seco é permitido; dip e flash são pontuação, não enfeite.
- **QA:** inspecione um frame por cena, cortes, capítulos e o master. Um contact sheet de 1 fps ajuda a achar repetição e flicker.

## Assets e licenças

- Prefira **imagens de arquivo em domínio público** e mapas oficiais (IBGE, Natural Earth). Registre fonte e licença em `CREDITS.md`.
- Use **uma** foto com licença CC BY-SA só se o crédito e a licença forem aceitáveis; caso contrário, troque por domínio público.
- Texturas, papéis, grão e luz podem ser geradas localmente (Pillow/numpy) e reutilizadas.
- Não use imagem gerada por IA para representar pessoa, documento ou acontecimento histórico real. Use arquivo, mapa ou ilustração declaradamente estilizada.

## HyperFrames: o mínimo

```bash
# wrapper local (evita depender do cache do npm)
node kit/tools/hf.mjs check <projeto>/hyperframes --json
node kit/tools/hf.mjs snapshot <projeto>/hyperframes --at 3,9,15 -o <projeto>/qa/snaps
node kit/tools/hf.mjs render <projeto>/hyperframes --quality delivery --fps 30 --workers 2 --output <projeto>/render/video-silent.mp4
```

Para composição DOM/SVG 2D **sem WebGL**, a GPU não é necessária para a lógica da cena, mas **é obrigatória para render longo**: antes de capturar mais de 60 s, rode a prova com `--browser-gpu --gpu --no-low-memory-mode` e PRIME quando houver Optimus. O sandbox de arquivos pode esconder `/dev/nvidia*`; o processo de render precisa de acesso ao dispositivo. Se o probe cair em software, pare e reporte; não inicie o master em CPU. Prova curta de QA (até 30 s) pode usar CPU com autorização explícita. Registre `hardware gpu` ou `software gpu` no QA.

## QA mínimo

- `check` sem erro; warnings de arquivo grande/track denso são aceitáveis no longa.
- Um frame por cena, cortes e 3 momentos de cada capítulo; contact sheet de 1 fps no master.
- Nenhum frame preto involuntário, flicker, texto cortado, cartão sobre legenda ou asset piscando.
- Voz contínua, pausas audíveis, legendas nos onsets, `.srt` com o texto aprovado.
- Master em −14 LUFS (YouTube), true peak ≤ −1,0 dBFS; voz acima da trilha.
- `qa/report.json` com escopo, evidências, findings e o que não foi verificado.

## Timebox

- 15–30 s: 2–4 h.
- 60–90 s: 1 dia.
- 10–15 min: 2–4 dias, em blocos.
- Se o próximo passo não produz fala, imagem ou som, ele não é um gate; é planejamento. Corte.

## Anti-padrões que reprovam

- Uma cena única para um gancho/parágrafo com várias frases.
- Prévia de 36 s com uma cena e um movimento, chamada de “provisório”.
- Planejar 3D, catálogo e aprovações para uma peça que é mapa + tipografia.
- Esperar aprovação a cada cena; o criador valida o vídeo, não o micro-passo.
- Repetir o mesmo layout com zoom/cor diferente.
- Voz corrida sem pausas; texto novo sobre voz antiga.
- Render por software em 3D sem decisão explícita; ou provar GPU para um HTML 2D.
- Entregar HTML/prévia e chamar de vídeo; a entrega é o MP4 + SRT + capa.

## Caso real — novembro de 2026

**30 s:** 16 cenas, 1,875 s em média, 85 palavras, voz a 1,15×, 5 imagens de arquivo, 20 efeitos, 11 cues de legenda. O que fez diferença: voz primeiro, uma metáfora visual (atlas), 5+ recursos por cena, arquivo real e render de 2 min por 30 s.

**15 min:** 9 capítulos, 58 cenas, 15,5 s em média, 736 s de voz + pausas até 900 s, voz a 0,90×, 236 cues, 58 cues de SFX, 7 imagens de arquivo. O que funcionou: templates por capítulo, mapas/dados/documentos, pausas de 1,2–2,2 s entre grupos, render único de 900 s. O que ficou pendente: cenas de 19–24 s pedem sub-beats ou divisão; a foto de Diretas é pequena; a legenda foi proporcional ao grupo, não alinhada por palavra; o primeiro frame tem 0,4 s de silêncio visual.

**Lição:** a rota 2D escala quando o conteúdo é template + dados + arquivo. O gargalo não é o render; é a decisão de quantas cenas cada grupo de fala merece. Em 15 min, 58 cenas é o mínimo para não virar slideshow; 75–90 cenas é o alvo confortável.
