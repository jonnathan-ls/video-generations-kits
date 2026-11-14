# Operação do projeto

## Rota ativa: geração local com IA

Os quadros e clipes desta produção são gerados por modelos locais do Wan2GP. O projeto não usa Three.js para desenhar a cozinha, não produz assets JavaScript e não pede aprovação da lista de recursos 3D. O Studio foi atualizado para explicar esse fluxo.

A revisão 01 contém um lote T2V reprovado, preservado para diagnóstico. A revisão 02 propôs uma cozinha-guia 3D e foi cancelada antes da construção quando o criador esclareceu a rota desejada. A revisão 03 preserva os doze beats e prepara âncoras de imagem geradas por IA local e animação Wan2GP. O modelo precisa ser confirmado e fixado antes da fila; o mesmo Nexus T2V da revisão 01 não será repetido como solução.

## Revisões humanas

A direção criativa é revisada como beats, estilo, prompts e som. A primeira prova audiovisual será um clipe Wan2GP do beat 01. O revisor profissional inspeciona textura, continuidade, ações, cortes, som e leitura em celular antes de ampliar o lote. A aprovação de um plano não aprova o clipe ou o vídeo final.

## Limite atual

Não houve geração, doctor/CUDA ou render da revisão 03. A RTX segue reservada ao outro chat. O Qwen Image 2.1 Turbo está configurado como ferramenta de imagem no Wan2GP, mas a presença dos pesos não está verificada; `fun_inp_1.3B` é apenas um candidato de animação e não consta no lock de modelos atual.

Os arquivos em `generation/` são da fila T2V da revisão 01 e estão reprovados. O script raiz `prepare-generation.mjs` foi desativado para impedir que esse fluxo antigo seja preparado novamente. Não executar a fila antiga como produção ativa.
