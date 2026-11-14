# Revisão 04 — clipe-prova Wan2GP

Esta revisão executa a rota visual por IA local, sem quadros ou cenas desenhados em código. A direção continua ligada aos beats analisados a 10 fps; a primeira geração isola apenas uma passada da esponja para medir textura, contato e estabilidade temporal antes de expandir.

O lote anterior usou doze clipes T2V com ações encadeadas e foi reprovado. A revisão 04 usa o mesmo checkpoint local disponível (`t2v_nexus_1.3B`), mas muda a unidade de geração: um único movimento contínuo, enquadramento macro fixo e sem enxágue ou pouso. A primeira tentativa ainda produziu uma peça lisa de cerâmica e foi reprovada. A segunda tentativa altera a escolha do objeto e reforça a construção têxtil, sem trocar o fluxo de IA por código. Isso é um clipe-prova, não a versão final do Short. Se a trama não se sustentar, a fila não será expandida com esse checkpoint.

O modelo Qwen Image 2.1 Turbo e o Fun InP 1.3B ainda não estão nos checkpoints locais. A GPU está livre; o disco tem 6,5 GiB disponíveis, então nenhum download de pesos maiores foi feito.

## Arquivos

- `generation-plan.json`: pipeline, modelo, limite e critérios do clipe-prova.
- `settings/`: prompts e parâmetros enviados à fila nativa do Wan2GP, por tentativa.
- `output/`: recibo e MP4 retornados pelo Wan2GP.
- `qa/`: inspeção profissional do arquivo exato, após a geração.

A validação não é uma aprovação de assets. A decisão estética só pode acontecer depois de inspecionar o clipe gerado em movimento, a 10 fps e em escala de celular. Nenhum teste unitário é necessário ou usado.
