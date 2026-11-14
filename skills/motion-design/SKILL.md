---
name: motion-design
description: Dirigir motion graphics narrativos, fotografias e fragmentos de filme como camadas legíveis dentro de cenas 3D já compostas. Aplicar ao planejar ou revisar evidências visuais animadas, mapas, documentos, datas, anotações, títulos e transições.
---

Este skill adapta princípios do [Bang Motion](https://github.com/bangtutorial/bang-motion) (MIT; snapshot da versão 1.19.0 em `references/bang-motion-upstream-SKILL.md`) ao fluxo longo deste projeto. Em 2026-11-08, o repositório reportava 1,6 mil estrelas. Também incorpora uma seleção do pack MIT [iart-ai/motion-design-skills](https://github.com/iart-ai/motion-design-skills) — animação, composição, direção de motion e edição rítmica — arquivada em `references/iart-motion-design/`; esse pack reportava 207 estrelas e o hub [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills), 1,3 mil. A pesquisa também avaliou o [Remotion Agent Skills](https://github.com/remotion-dev/skills) (6,6 mil estrelas): é oficial e popular, mas suas instruções pressupõem o renderer React/Remotion, enquanto este projeto usa Three.js/HyperFrames. Ele não foi integrado como segundo renderer; aproveitamos apenas princípios compatíveis de ritmo, tipo e sincronização. As regras selecionadas foram adaptadas ao Three.js/HyperFrames e aos tempos da narração. Não importar receitas que dependam de Remotion ou After Effects, nem copiar exemplos visuais. As referências informam craft; não substituem storyboard, decisões humanas, direitos de mídia nem inspeção do render.

## Antes de animar

- Prenda cada elemento gráfico a um beat e a uma frase concreta: o que a imagem documenta, qual pergunta ela responde, qual detalhe deve ser percebido e o que muda depois.
- Escolha um alvo visual primário. Organize texto, data, crédito, mapa, fotografia e marcação como evidência em camadas secundárias; retire-as quando a informação já foi lida.
- Preserve a cena 3D como espaço contínuo. Uma foto ou filmagem entra como plano/objeto dentro desse mundo; não deve virar montagem de miniaturas nem substituir automaticamente a reconstituição.
- Use um movimento motivado para guiar o olhar: aproximação ao detalhe, recorte revelado, rota desenhada, data carimbada, documento aberto, seta que conecta causas. Evite animação ornamental sem função causal.
- Dê a cada beat uma hierarquia de movimento: um foco protagonista, respostas de apoio e textura ambiental discreta. A cena não precisa mover tudo; mantenha uma âncora de leitura e deixe a pausa posterior ao gesto revelar seu resultado.
- Prefira entradas que desaceleram ao assentar e saídas que aceleram; use trajetória curva, antecipação ou seguimento somente quando o peso e a ação justificarem. Objetos grandes demoram mais a responder que grafismos pequenos. Easing uniforme não deve transformar ações diferentes em uma mesma assinatura mecânica.
- Enquadre pelo acontecimento e pelo corte final: um movimento de câmera principal por beat, com espaço negativo e áreas seguras para legenda/crédito. No 16:9, mantenha evidência e rosto dentro da zona central que sobrevive à versão mobile; refaça o enquadramento, não apenas recorte o quadro.

## Evidência de arquivo com presença

- Uma imagem ou filmagem relevante precisa estar em tela pelo tempo de leitura do beat, em escala suficiente para reconhecer o objeto/detalhe em tamanho de celular. Como padrão de produção, não deixe evidência principal com menos de 3 s de presença total nem menos de 2 s legível em escala estável; estenda quando a narração ou o detalhe exigir. Uma aparição mais breve só se justifica como flash intencional e ainda deve ser percebida.
- Se a evidência carrega a afirmação principal, faça-a ocupar uma porção claramente visível do quadro (em geral, cerca de 40% a 55% da largura como ponto de partida). Ela pode crescer, receber foco, mover-se ou compartilhar espaço com o modelo 3D, desde que não cubra a ação, a legenda ou o sujeito essencial.
- Integre com moldura/material, parallax, movimento de câmera, recorte, detalhe ampliado ou sobreposição pontual. Crédito e data permanecem legíveis sem competir com a legenda. O efeito deve conduzir a evidência, não escondê-la.
- Para vídeo de arquivo, escolha o trecho pelo gesto ou mudança real que sustenta a frase; preserve contexto antes/depois quando necessário. Congele ou desacelere somente se não adulterar o sentido; sinalize reconstrução/ilustração quando a imagem não for evidência literal.
- Guarde fonte, titular/autoria, licença/restrição, atribuição e segmento usado junto ao recurso local. Não existe limite universal de segundos que torne um uso automaticamente autorizado. Siga `skills/assets/SKILL.md`; use apenas fontes com situação de uso verificada para a finalidade pretendida.

## Movimento e montagem

- Componha a entrada, ação, leitura e saída como um movimento único. Pode haver antecipação e acabamento secundário, mas eles não devem atrasar o instante narrativo.
- Varie escala e ritmo pelo acontecimento: um documento pode receber uma pausa; uma colisão, um acento; uma rota, um travelling. Não imponha a mesma entrada, zoom, easing ou transição em cada corte.
- Uma transição deve nascer de direção, forma, som ou ação que atravessa o corte. Preserve pelo menos uma âncora espacial quando o espectador precisa entender continuidade; não faça dissolver mundos incompatíveis por padrão.
- Mantenha estados determinísticos por tempo de timeline, com keyframes que respondam a seek/render fora de ordem. Não usar relógio, timers, mídia remota ou aleatoriedade durante render.
- Verifique composição a 100%, em movimento e em largura de celular. Inspecione contraste, recorte, legibilidade do crédito, hierarquia e o quadro de saída antes de aprovar.

## Entrega ao fluxo

No storyboard do beat, registre a evidência e origem, função narrativa, área de tela, início/fim em tempo local, movimento, marcação, legenda concorrente, entrada/saída e intenção sonora. No backlog, trate cada lacuna possível como asset/overlay, câmera, transição, motion ou som. Depois de construir, renderize o pacote afetado e revise em movimento segundo `skills/revisao-profissional/SKILL.md`; imagens no storyboard não contam como qualidade comprovada. Mudança do código do recurso exige nova revisão daquele recurso, sem invalidar os demais.

Use como referência de timing e fluxo as notas locais HyperFrames em `/home/jonnathan/.agents/skills/hyperframes/references/motion.md` e `overlays.md`. A direção narrativa e os contratos locais prevalecem sobre receitas do material externo.

As referências externas completas mantidas para consulta estão em `references/iart-motion-design/` e `references/bang-motion-upstream-SKILL.md`; foram copiadas com suas licenças. Leia só o arquivo pertinente ao beat, sem carregar ou executar scripts de terceiros durante render.

Cards de evidência, datas, siglas, termos e fotografias ficam centralizados, com padding equilibrado, hierarquia e acabamento de destaque; mantenha escala e tempo legíveis. Busque e registre os exemplos Three.js mais pertinentes e siga `kit/docs/qualidade-audiovisual.md`.

Para cada quadro de foto, filme, documento ou texto, centralize a composição e confira margens internas iguais nos quatro lados, incluindo topo/base e laterais. Construa-o como evidência de destaque — moldura, acabamento, contraste, luz, profundidade e entrada/saída própria — sem virar um retângulo simples ou miniatura. Mantenha uma zona livre para legendas e ação 3D. Use o Three.js local como biblioteca de referências de implementação: consulte as implementações pertinentes a cada mecanismo utilizado e registre princípios, limites e adaptação em `kit/quality/decisions.md` antes de alterar o módulo.

A presença é medida no player, descontando entrada e saída. Fotografias com pessoas, texto ou detalhes normalmente pedem 4–7 s, podendo atravessar um corte motivado. Se o beat é curto, planeje o insert em uma passagem maior e preserve a mesma evidência durante a continuidade; não comprima sua leitura a um flash. Varie por função: painel lateral que assenta, documento revelado, detalhe ampliado, díptico comparativo ou foco de evidência; não alternar templates por sorteio. O estado central fica estável para leitura. Verifique também o tempo efetivo após qualquer retiming de voz.
