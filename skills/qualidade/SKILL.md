---
name: qualidade
description: Construir e melhorar recursos reutilizáveis com a engine do kit, usando baselines aprovados e inspeção visual profissional. Aplica-se a geometria, comportamento, materiais, efeitos, câmeras, áudio e outros recursos de produção.
---

Leia `kit/docs/qualidade.md` e só o contrato do tipo a construir. Você, LLM, executa as ferramentas e modifica os arquivos; o usuário avalia o resultado.
Use também `kit/docs/qualidade-audiovisual.md` para composição, completude, motion, luz, legibilidade, referências e loop de revisão.

Em projetos `wan2gp-ai-video`, não construa recursos visuais com a engine. Aplique `kit/docs/wan2gp-ai.md`: identifique requisitos nos beats, faça backlog semântico de prompts/modelos/configurações, gere os quadros/clipes em Wan2GP local e reveja o artefato real. Não criar testes unitários para avaliar vídeo IA. O reviewer deve observar textura, movimento, contatos, continuidade, cortes e áudio em playback; só a execução real pode provar esses atributos.

Consulte o requisito do backlog e sincronize as referências de qualidade aprovadas. Escolha referências adequadas ao tipo e ao mecanismo; não copiar um material ou uma escala sem pertinência. Se não houver baseline daquele tipo, declare a limitação e trate o resultado como proposta sujeita à revisão humana.

O contrato de qualidade vale desde storyboard e prévia conceitual: uma cena de estudo também precisa passar por inspeção visual e de movimento antes de ser oferecida para revisão. Antes de criar ou substituir qualquer cena ou sistema visual em Three.js — incluindo composição, câmera, geometria, materiais, água, céu, iluminação, pós-processamento, motion ou transição — consulte e compare os exemplos locais instalados pertinentes em `node_modules/three/examples/jsm/` e/ou `kit-video-3d/node_modules/three/examples/jsm/`. Leia a implementação junto da API usada. Combine princípios compatíveis com o renderizador do kit; não copie cena inteira nem exemplo dependente de passes, mídia remota, clock contínuo ou interação indisponível. Registre caminhos, princípios, limitações e adaptações em `kit/quality/decisions.md`. Se não existir exemplo correspondente, consulte a implementação mais próxima e documente a lacuna. Sem consulta registrada, a cena fica reprovada para apresentação como pronta. Exemplos orientam implementação; não equivalem a baseline aprovado nem a aprovação visual humana.

Para recursos geométricos e cenas paramétricas, use as peças e movimentos determinísticos em engine/factory. Para animações, efeitos, transições, câmeras, materiais, iluminação e som, siga seu contrato especializado, com aplicação real no destino; não entregar apenas um modelo demonstrativo e ignorar o comportamento no render.
Em histórias de época, verifique astronomia e horizonte antes de inserir lua, sol ou outra fonte celeste; mantenha a cena viva com fontes coerentes com o lugar e o momento, sem sacrificar a verdade histórica.

Em cenas externas, confira o contato de cada elemento com o terreno e entre si: edifícios assentam no solo, ruas no piso, pneus no asfalto e fundações no chão. Para extras móveis, confira escala, distância, trajetória, velocidade e janela de passagem; eles dão contexto sem disputar com a ação, a legenda ou o mecanismo. Siga `kit/docs/qualidade.md`.

Faça checagens de geometria, transformações, dimensões, orçamento, busca temporal fora de ordem e dependências locais. Revise também vistas frontal, lateral, superior, perspectiva e corte na aplicação. O teste técnico não prova beleza, clareza ou adequação narrativa.

## Gate de qualidade da pré-visualização

Antes de apresentar um esboço visual, confirme que `beats.json` cobre os beats relevantes e que cada cena tem `visualPlan` ligado à fala: `beatId`, `attentionTarget`, `visualQuestion`, `visibleEvent`, `stateBefore`, `stateAfter`, `cameraReveal` e `soundIntent`. Não usar poucas imagens de capítulo como substituto do storyboard de uma narrativa longa.

Conte cenas × unidades de fala antes de inspecionar. Cada frase/oração com acontecimento próprio precisa de uma cena distinta; um parágrafo/beat com várias frases não pode virar uma cena única. A referência é de 2 a 5 s por cena. Cada cena declara no mínimo **5 recursos**, sem teto máximo; mais recursos são bem-vindos quando servem ao acontecimento, à leitura ou à causalidade. Prévia de trecho usa a mesma granularidade e o mesmo QA da versão final. Reprovar cena única para gancho multi-frase, ausência de cortes/inserções/efeitos, cena com menos de 5 recursos e `preview-qa.json` marcado `ready-for-creator-review` sem a contagem e a inspeção de todas as cenas.

No navegador, inspecione todas as cenas. Para cada motion, verifique preparação, trajetória, contatos, reação, resultado e pausa; teste tempos em ordem e fora de ordem. Confira relações espaciais e contatos, hierarquia de foco, leitura de texto/crédito, silhueta, iluminação e contraste. Revise também em escala de celular e enquadramento vertical quando fizer parte do destino. Para mídia pública, verifique procedência, licença, crédito e presença visual; um URL ou arquivo cadastrado não prova que a evidência está legível na cena.

Registre findings e evidências em `kit/projects/<id>/preview-qa.json`. A prévia fica `rejected` enquanto houver P0/P1 ou `not-verified` enquanto faltarem inspeções obrigatórias. Corrija as causas e repita o passe afetado antes de fornecer o link como pronto para avaliação. Esse gate não exige nem inicia render do vídeo final, não aprova assets e não substitui a revisão humana.

Para shaders customizados, confira exposição, linear/sRGB e transformação de saída do Three.js no render final; resultado válido em GLSL pode continuar preto ou estourado se a saída não corresponder ao espaço de cor da composição. Para planos de fundo, confira alcance da câmera, recorte/horizonte, silhuetas e leitura sobre água e céu em cada escala usada no plano.

Em efeitos e overlays, inspecione a hierarquia visual em 9:16 e em escala de celular: alvo legível, mecanismo visível, contraste suficiente e entrada/saída coerente com a fala. Remova movimento que não explique uma relação ou desvie o foco.

Mostre o recurso implementado no backlog em estado de revisão. Não conceda aprovação. Quando houver feedback humano, ajuste a implementação, repita os checks e registre a melhoria em quality/decisions.md. Preserve as aprovações de recursos sem alteração.
