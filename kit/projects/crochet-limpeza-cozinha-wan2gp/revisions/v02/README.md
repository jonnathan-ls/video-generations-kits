# Revisão 02 — cozinha de crochê

**Status atual: substituída antes da geração.** O criador confirmou que este projeto deve gerar os visuais com IA local Wan2GP, sem guia de cozinha em Three.js. Os arquivos abaixo ficam preservados como histórico da proposta cancelada; não peça validação da lista de assets desta revisão e não construa a guia.

**Estado:** modelagem textual e preflight estático preparados; nenhuma imagem, guia, clip ou montagem foi renderizado nesta revisão.

A revisão 01 continua preservada como diagnóstico reprovado. Ela usou 12 pedidos T2V independentes, a 432×768, sem guia visual compartilhado. O relatório registrou deriva de material e cenário, troca de ações e inspeção incompleta em movimento. Esses arquivos não são amostras aprovadas.

A revisão 02 preserva a ordem e a cadência observadas nos 294 quadros a 10 fps e troca a estratégia: primeiro construir uma cozinha-guia determinística, com a textura de crochê presente na própria geometria/material; depois testar um único trecho com o modo Wan2GP `GUV` e denoise 0,1. O valor é uma hipótese inicial baseada no guia de outra cena do repositório, ainda sem validação para crochê.

O lote não será ampliado até o primeiro trecho passar pelos critérios do QA. A etapa atual termina antes de qualquer chamada ao Wan2GP, `doctor`, CUDA, render de guia ou render de vídeo, conforme o limite estabelecido pelo criador.

Arquivos desta revisão:

- `modeling.md`: diagnóstico, método, limites e sequência operacional.
- `beats.json`: mapa de 12 beats, estados, ações, câmera e inserts planejados.
- `asset-plan.json`: inventário semântico anterior à construção; todos os novos recursos ficam pendentes de revisão.
- `style-bible.json`: âncoras visuais e prompt de preservação do guia.
- `generation-plan.json`: configurações locais fixadas e gates futuros, sem fila executável.
- `sound-design.json`: proposta original de música e foley vinculada aos contatos; áudio ainda não foi ouvido ou mixado.
- `qa/plan-review.json` e `qa/preflight.json`: revisão da modelagem e validação estática, sem alegar QA audiovisual do vídeo.

