# Revisão 03 — geração visual com IA local

**Rota ativa:** Wan2GP gera imagens-âncora e clipes. Não haverá cozinha-guia em Three.js nem peças de código para validar.

## O que foi corrigido

- A revisão 01 gerou doze clipes independentes com Nexus T2V 1.3B. O QA reprovou a textura de crochê, a continuidade do cenário e algumas ações; esse lote permanece apenas como diagnóstico.
- A revisão 02 propôs criar uma cozinha determinística em Three.js e aplicar GUV. O criador esclareceu que a imagem precisa vir da IA local, então essa rota foi cancelada antes de construir ou renderizar a guia.
- A revisão 03 preserva a análise de 294 quadros a 10 fps, a ordem de doze beats, o ritmo de cortes, a direção de crochê e o desenho sonoro proposto, mas passa a usar referências visuais geradas pela própria IA local e animação Wan2GP.

## Fluxo planejado

1. A direção por beats, o estilo de crochê e a rota Wan2GP já estão preparados como instruções desta produção; nenhuma aprovação preliminar está sendo solicitada.
2. Confirmar estaticamente os modelos locais, licenças, parâmetros nativos, hashes e memória necessária. A configuração aponta para Qwen Image 2.1 Turbo como gerador de imagem, mas a disponibilidade dos pesos ainda não foi verificada. `fun_inp_1.3B` é candidato a animação de quadros inicial/final; seus pesos não constam no lock atual.
3. Parar antes de qualquer inferência enquanto a RTX estiver ocupada. Quando estiver livre, gerar âncoras por IA e animar somente o primeiro beat com Wan2GP. A primeira prévia entregue para avaliação será esse clipe curto.
4. Aplicar o revisor profissional ao clipe: trama em todos os materiais sólidos, estabilidade temporal, mãos e contatos, ordem de espuma/esfregada/enxágue/pouso, movimento, som do contato e leitura em celular. Corrigir P0/P1 antes de ampliar a fila.
5. Só após o gancho passar, gerar os outros beats e montar cortes, foley e música. Rever o vídeo completo a 10 fps e em movimento; reprovar novamente se a trama, a ação ou o áudio falharem.

O Reel serve para direção de ordem e ritmo. Seus quadros, áudio e vídeo nunca entram como condicionamento ou material de geração. A montagem pode usar ferramentas locais para cortes e sincronização; nenhum quadro de cena é desenhado por código.

## Estado desta revisão

Nenhuma imagem-âncora foi gerada. Nenhuma chamada ao Wan2GP, `doctor`, CUDA ou render foi feita. O modelo de vídeo da revisão 01 não será repetido sem mudança. A lista de recursos 3D está explicitamente marcada como não aplicável; o clipe gerado será a primeira peça revisada.
