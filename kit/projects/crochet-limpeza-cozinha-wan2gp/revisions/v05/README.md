# Revisão 05 — âncora de IA local + Wan2GP I2V

Esta revisão substitui a geração Nexus somente por texto, que em duas tentativas não manteve a mesma materialidade em toda a cozinha nem produziu a passada horizontal prevista. O plano agora usa um clipe local T2V apenas para obter uma âncora que já mostre a composição e a trama desejadas; a ação-prova é animada depois pelo Fun InP 1.3B na fila nativa do Wan2GP.

Os dois estágios continuam sendo síntese por IA local. O frame-âncora será extraído do MP4 T2V gerado pelo próprio projeto, escolhido por inspeção e registrado por timestamp e SHA-256. Nenhum frame da referência entra no modelo. Não há cena, textura, movimento ou quadro desenhado em código.

As três primeiras âncoras foram rejeitadas: janela e bancada lisas, borda rígida no objeto focal e faixas de madeira nas bordas. A quarta replaneja o beat como uma passada sobre uma esteira de louça de crochê, preservando a ação de esfregar e removendo recipientes rígidos do quadro.

O escopo segue limitado ao beat 01: uma passada curta sobre uma peça de crochê. O plano só será ampliado depois de o MP4 I2V real passar por QA profissional. A ausência de testes unitários é intencional; a validação é audiovisual no arquivo gerado.

## Arquivos

- `generation-plan.json`: estratégia, origem local da âncora, critérios e limite da prova.
- `settings/anchor-t2v*.json`: prompts e parâmetros nativos das tentativas de âncora gerada por IA.
- `settings/proof-i2v.json`: prompt, âncora e parâmetros nativos do Fun InP.
- `output/anchor/`: MP4 T2V de origem da âncora e recibo de fila.
- `input/anchor.png`: frame escolhido da geração local, sem pintura ou composição por código.
- `output/proof/`: MP4 I2V e recibo de fila.
- `qa/`: amostragem a 10 fps e parecer do clipe exato.

O status só pode mudar para `ready-for-creator-review` depois de verificar movimento em velocidade normal, frames a 10 fps, escala de celular e áudio quando houver. Uma folha de contato sozinha não basta.
