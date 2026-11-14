# Produção por agentes e cenas com ownership

Este contrato é operado pela LLM. O criador valida cenas e vídeo pelo chat e pela aplicação; não recebe instalação, comandos, edição de JSON ou recuperação de tarefas.

O storyboard mestre define fala, fatos, acontecimentos, continuidade, recursos e som. Um integrador único mantém `project.json`, timeline global, mixagem, catálogo compartilhado, versões de entrega e estado do projeto. Produtores trabalham em arquivos exclusivos por cena. Um revisor diferente do produtor inspeciona o resultado renderizado e registra correções. Reunir arquivos de agentes não concede qualidade, verificação factual, aprovação de asset ou aprovação humana.

## Manifesto de trabalho

`kit/tools/scene-jobs.mjs` agrupa as cenas do storyboard para delegação. O padrão é 180 segundos por grupo de trabalho; `--seconds 20` cria grupos menores. Os tempos originais da voz são mantidos, sem quantização. Cenas não são cortadas ao meio; uma cena individual pode ultrapassar o limite. Esses grupos são tarefas autorais, não substituem os pacotes quantizados do render incremental em `segment-plan.mjs`.

A pasta de tarefas contém:

- `manifest.json`: fonte canônica, hash por cena e ownership de arquivos por tarefa. O manifesto é imutável depois de inicializado.
- `jobs/<job-id>.json`: cenas atribuídas, produtor, revisor e estado de produção.
- `shots/<scene-id>.json`: cena autorada/implementada, `inputHash`, `owner`, estado e indicação explícita de que aprovação não foi concedida.
- `leases/<job-id>-producer.json` e `leases/<job-id>-reviewer.json`: exclusão temporária por papel com token e vencimento.
- `reviews/<job-id>.json`: registro do revisor independente, findings e referências de evidência.
- `locks/<job-id>.json`: exclusão curta das operações de claim/submit/review.

A inicialização não sobrescreve um manifesto existente. Nova revisão ou redistribuição que mude ownership usa outra pasta de tarefas, preparada pelo integrador. Não editar o owner para tomar trabalho de outro agente.

## Uso pelo orquestrador

O CLI prepara tarefas locais; não inicia agentes, serviços externos ou renderizações automaticamente. O agente coordenador da sessão despacha as tarefas com o mecanismo de colaboração disponível, informando ownership exclusivo e a existência dos demais trabalhadores.

Exemplos executados pelo agente na raiz do projeto:

```sh
node kit/tools/scene-jobs.mjs init --storyboard kit/projects/titanic-completo/storyboard-v2.json --dir kit/projects/titanic-completo/scene-jobs-v2 --seconds 180
node kit/tools/scene-jobs.mjs status --dir kit/projects/titanic-completo/scene-jobs-v2
node kit/tools/scene-jobs.mjs claim --dir kit/projects/titanic-completo/scene-jobs-v2 --job scenejob-001 --owner produtor-abertura --role producer --lease 900
```

O claim retorna um token e o prazo. O produtor prepara um arquivo de submissão contendo `{ "scenes": [...] }`, com exatamente os IDs da tarefa, preservando `id`, `start`, `duration` e `sourceText`. Cada cena declara `productionStage`:

- `authored`: direção existente, ainda em construção.
- `assets-pending`: recurso ou coreografia necessária ainda falta.
- `implemented`: layout mínimo estruturalmente executável; não equivale a bom resultado visual.
- `review-requested`: produção solicita inspeção independente.
- `rejected`: há correção exigida. O revisor pode devolver a tarefa inteira; o finding identifica quais cenas precisam mudar.

O agente submete com `submit --dir <pasta> --job <id> --owner <produtor> --token <token> --file <arquivo>`. O comando valida o lote inteiro antes de publicar arquivos individuais e mantém o owner fora do payload de cena. Estados como `approved` são recusados. Cenas `implemented` ou `review-requested` precisam de assets com posições numéricas, câmera e ausência de `implementation: requires-assets`. Isso é uma checagem estrutural mínima, não um compilador, teste de animação, aprovação estética ou selo de QA.

Uma tarefa com todas as cenas `review-requested` pode ser assumida por outro agente usando `claim --role reviewer`. O próprio produtor é impedido de assumir a revisão. O revisor trabalha sobre snapshot das saídas submetidas e deve inspecionar o MP4/frames e som pertinentes conforme `skills/revisao-profissional/SKILL.md`, sem aprovar pela leitura do plano.

A submissão de revisão usa `review --dir <pasta> --job <id> --owner <revisor> --token <token> --file <arquivo>`, com payload:

```json
{
  "result": "changes-requested",
  "findings": [
    {
      "sceneId": "shot-006-radio",
      "severity": "P1",
      "observation": "O papel desliza sem contato visível.",
      "correction": "Construir antecipação, contato, transferência e pausa.",
      "acceptance": "Mão, papel e mesa mantêm contatos legíveis no MP4."
    }
  ],
  "evidence": ["qa/bloco-01/radio-contact.png"]
}
```

`changes-requested` devolve a tarefa ao produtor como `rejected`. Depois ele pode assumir novo lease e corrigir. `inspection-recorded` conserva `review-requested`: registra a inspeção sem conceder aprovação profissional ou humana. `evidence` precisa ser uma lista não vazia; o CLI registra referências, mas não verifica o conteúdo audiovisual desses arquivos. A barreira profissional independente continua obrigatória. Não usar um registro de inspeção como aprovação do filme.

## Concorrência e retomada

Claims e operações usam `fs.open` com `wx`; dois agentes não recebem o mesmo lease ativo. Cada papel tem ownership persistente. Mesmo após expirar o lease, outro owner não pode sobrescrever produção existente. O mesmo owner pode assumir novo token após o vencimento; token antigo não permite submissão. Uma tarefa em revisão não volta a produção sem devolução do revisor. Papéis concorrentes no mesmo job são bloqueados.

Antes de claim/submit/review, os hashes das cenas canônicas são comparados ao manifesto. Se a fala, o tempo ou o plano-fonte da tarefa mudou, a operação é recusada. Mudanças numa cena de outro grupo não invalidam a tarefa atual. Mudança na saída depois do claim do revisor invalida o snapshot da revisão. O integrador confere os hashes novamente antes de compor; nenhum arquivo externo tem lock de edição obrigatório, portanto a verificação do CLI não constitui uma transação atômica com todo o repositório.

Arquivos são publicados por gravação temporária exclusiva e rename atômico. A atomicidade é por arquivo: um encerramento abrupto pode deixar um lote parcialmente escrito. O integrador só consome tarefa com submissão concluída, fonte atual e estado coerente, nunca um conjunto de arquivos soltos durante submit. Se a inicialização falhar no meio, preservar a pasta para diagnóstico e iniciar em uma nova pasta. Um lock curto abandonado por processo encerrado deve ser inspecionado e recuperado pelo agente integrador, após conferir que não há operação ativa. O CLI não apaga locks ativos por timeout nem transfere ownership automaticamente.

IDs recusam barras, pontos, traversal e duplicações; caminhos de saída são derivados do manifesto. Pastas e arquivos de saída symlink são recusados. Esta proteção evita colisões e saídas indevidas no fluxo cooperativo; não é sandbox de segurança contra um processo que edita livremente o mesmo filesystem.

## Integração e qualidade

O integrador verifica os pacotes aprováveis em contexto antes de atualizar a timeline mestre. Ele mantém continuidade entre cenas, evita repetição de composição/evento, confere a ligação com cada frase e conserva as lacunas reais. Novos modelos, gráficos, materiais, gestos e FX são construídos quando a narrativa exige; não há fallback automático para casco, quarto ou mar.

Correções visuais seguem referência primeiro: produtor e revisor abrem o trecho real, identificam o asset e consultam um exemplo local pertinente do Three.js e o recurso semelhante mais forte do kit antes de decidir a mudança. Se a causa está num asset criado do zero, o produtor atualiza o módulo reutilizável e lista as cenas dependentes; se está na encenação, altera apenas as cenas afetadas. O revisor confere o render em movimento contra a referência e o critério de aceite, devolve o bloqueio ao owner e repete o ciclo até a causa visual desaparecer. O integrador recompõe somente pacotes afetados e junções, preserva cache válido e deixa revisões alteradas pendentes da decisão humana.

A preparação de grupos pode rodar em paralelo. Renderizações pesadas compartilham uma fila com limite de GPU medido; mais agentes não devem abrir renderizadores concorrentes indiscriminadamente. O CLI de jobs não gerencia GPU nem substitui a fila de render.

`status` informa estados, cenas com layout estrutural mínimo, pendências e fontes desatualizadas. Esses números não medem realismo, beleza, ritmo, ausência de repetição, sincronismo, naturalidade ou retenção. A revisão em movimento do bloco, das junções e do filme inteiro permanece separada das aprovações humanas e dos assets.
