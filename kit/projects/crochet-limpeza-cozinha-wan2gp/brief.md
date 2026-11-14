# Cozinha de crochê: dia de limpeza

## Pedido e entendimento

Modelar uma peça vertical de aproximadamente 29,4 segundos a partir do Reel público `Dck3Gz1SHr0`, examinando movimento e cortes por amostragem de 10 fps. A obra será uma montagem tátil sem narração, com ações de limpeza, efeitos pontuais e desenho sonoro original. O criador pediu qualidade alta e continuidade da textura de crochê. O link mostra um **dia de limpeza da cozinha**, não uma receita/cozimento; por isso a sequência foi planejada como limpeza e organização.

O objetivo é preservar a lógica de atenção (troca frequente de tarefa, macros de contato, payoff final) e a leitura artesanal de crochê, criando uma cozinha, uma paleta, mãos, adereços, enquadramentos e ações próprios. O Reel é referência de análise, não entrada visual para a geração. Sua licença de reutilização não foi verificada.

## Fluxo e limite técnico

- Integração local existente: Wan2GP 19.21 no adaptador do projeto, perfil 5, SDPA, modelo instalado Nexus 1.3B / Wan 2.1 T2V.
- Fila planejada: texto para vídeo, 432×768, 16 fps, seis passos, 12 cenas; semente fixa por cena e prompts reproduzíveis em `generation/video.json`.
- O render vertical de entrega seria ampliado para 1080×1920 na montagem local. Isso não inventa detalhe perdido pelo modelo. A resolução base é baixa para fios finos; a textura final pode sair suavizada ou instável. O pedido de qualidade alta fica como meta a verificar, não promessa desta configuração.
- O modelo instalado é T2V de 1,3B. A fila usa o mesmo prefixo de estilo e o mesmo seed-base em todas as cenas, mas não há imagem-âncora/LoRA de crochê, logo a consistência entre clips ainda é um risco concreto.
- A revisão de imagens e movimento da geração fica pendente. Esta etapa para antes de qualquer chamada que rode `doctor` ou aloque CUDA: o outro chat está usando a RTX.

## Referências e decisões

A análise pública e os 294 quadros extraídos a 10 fps estão em `research/references/crochet-mini-kitchen/analysis.md` e na mesma pasta. `kit/catalog/RESUMO.md` e a consulta de cozinha retornaram `cozinha_corte`, mas não há baseline aprovado pertinente a fios, crochê ou miniaturas; não será usado como padrão estético. Áudio do Reel não foi ouvido nem transcrito (o conector local informou que falta `whisper.cpp`). O novo vídeo não reutiliza sua trilha.

## Som proposto

Sem voz. Planejar uma cama instrumental original, leve e brincalhona, com plucks de madeira/feltro e pulso constante, mantendo espaço para foley. Os sons pontuais devem parecer macios e artesanais: água em fio fino, espuma curta, esfregada de tecido, vassoura/fibras no piso, recipientes pousando, pano dobrado e um brilho discreto no plano final. Não copiar trilha ou efeitos do Reel. Tempos detalhados em `sound-design.json`; arquivos e mix continuam por criar e por revisar auditivamente.

## Próximo gate humano

Revisar a sequência de 12 planos, a direção de crochê e o limite de qualidade da Nexus 1.3B. Depois da validação e quando a RTX estiver livre, pode-se iniciar uma geração diagnóstica marcada e inspecionar os clips. Não existe render nem prévia criada nesta etapa.
