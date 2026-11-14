# Kit local Wan2GP

Integração paralela ao kit Three.js. Código oficial em `vendor/wan2gp`, versão 19.21,
commit `f0b54e02aa32b539e7be5c65cf4ada67db69da26`. Licença original preservada em
`vendor/wan2gp/LICENSE.txt`; os modelos têm suas próprias licenças nas origens.
O adaptador não altera o código oficial nem converte aprovação de assets 3D em
aprovação de material gerado.

A LLM opera tudo abaixo. O criador recebe arquivos e prévias; não executa comandos.

## Ambiente e operação interna

- `node kit/tools/setup-wan2gp.mjs`: instala Python 3.11 e dependências no ambiente
  isolado `.tools/wan2gp-venv`, preservando outros ambientes.
- `npm run wan2gp -- doctor`: testa um tensor real na GPU e registra diagnóstico
  em `kit/integrations/wan2gp/runtime/doctor.json`. Testes não simulam GPU operacional.
- `npm run wan2gp -- download-models`: baixa pesos públicos com revisões fixadas,
  sem token/cookies e com tamanho/SHA-256 conferidos em `models.lock.json`.
- `npm run wan2gp -- ui`: inicia interface somente em `127.0.0.1:7860`, sem share.
- `npm run wan2gp -- generate <settings.json> <saída> [--dry-run] [--offline]`:
  usa a fila JSON nativa do upstream, com diretório de trabalho correto e registro
  de hash, commit, estado e código de saída. Recusa ambiente sem CUDA funcional.

Perfil 5, atenção SDPA, sem compilação solicitada. Preset Nexus 1.3B com seis passos
e vídeo vertical 288×512 é ponto inicial para 6 GiB de VRAM, não promessa de
qualidade nem de desempenho. `generation/image.json` usa modo imagem do mesmo
modelo; `generation/video.json` contém a fila de vídeo. Outros modelos suportados
pelo upstream podem ser usados em novos arquivos de settings após verificar
memória, disco e licenças. Downloads são de pesos públicos; prompts, narração e
vídeos permanecem locais. A primeira execução pode buscar arquivos auxiliares
do modelo; `--offline` impede novos downloads.

`environment.lock.txt` registra as versões efetivamente instaladas nesta máquina.
O verificador uv sinaliza o tag cp36 do wheel oficial decord 0.6.0; o pacote usa
ctypes e seu import foi conferido no Python 3.11. Nenhum wheel foi retaggeado.
Demais dependências não apresentaram incompatibilidades no verificador.
Pesos, ambiente, saídas e cópia do upstream ficam fora do controle de versão.
Configuração e adaptador ficam no repositório; não expor ckpts, ambiente ou a
árvore do upstream no servidor do Studio.

## Comparação do arco

Origem: `kit/projects/arco-alvenaria/render/video.mp4`, 41,576 s, narrativa E3 e voz
pm_santa já escolhidas pelo criador. Projeto novo em
`kit/projects/arco-alvenaria-wan2gp`, sem modificar o original. Triagem lexical
foi refeita para todas as janelas de 1–3 palavras. A triagem semântica E3 é
reutilizada como referência; aprovação do novo plano e dos clipes fica pendente.

1. `node kit/tools/wan2gp-compare.mjs prepare` cria dez pedidos de geração ligados
   a ações visíveis, a fila completa, um teste de imagem e um teste da abertura.
2. Com CUDA funcional, testar imagem e abertura antes de expandir para a fila.
3. Aplicar `skills/revisao-profissional/SKILL.md`: contatos entre cunhas, estabilidade
   dos pilares, sequência de montagem/retirada do cimbre e continuidade. Setas e
   legendas são composição local; não aceitar símbolos ou texto inventados pelo
   modelo. As relações de forças precisam ser conferidas contra a cena original.
4. Somente após corrigir o gancho, gerar e revisar os demais clipes. Os nomes de
   saída esperados constam em `generation-plan.json`; revisar nomes reais do upstream.
5. `node kit/tools/wan2gp-compare.mjs assemble-internal` exige os dez clipes,
   recompõe legendas e usa o áudio original. Cria MP4 interno marcado e comparação
   lado a lado, sem conceder aprovação. A montagem é inicial e ainda precisa de
   inspeção e correção de duração, transições, efeitos explicativos e som.
6. Entrega final continua sujeita ao QA profissional e às decisões humanas do
   novo material. O adaptador não fornece atalho para o exportador final.

## Bloqueio encontrado nesta instalação

Em 7 de novembro de 2026, o driver informou `GPU Recovery Action: Reset` e
`GPU requires reset`. CUDA retornou código 100 e o PyTorch não conseguiu alocar
tensor. O reset com `nvidia-smi --gpu-reset -i 0` respondeu que não é suportado.
O próprio entrypoint do upstream falha na consulta da capacidade CUDA. Não houve
geração de imagem/vídeo nem validação nativa da fila. Reiniciar a sessão Python
não recupera esse estado do driver. Não reiniciar o computador, descarregar
drivers nem alterar dispositivos PCI sem autorização para interromper o sistema.
Após recuperação da GPU, repetir doctor e validação nativa antes de gerar.

## Recuperação e primeiro teste

Após reinicialização autorizada que não concluiu normalmente, o criador relatou
ter desligado pelo botão e ligado novamente. CUDA voltou a funcionar e a fila
nativa de imagem passou em dry-run offline. A primeira imagem foi gerada em
`wan2gp-output/arco-image-test.jpg`. O boot anterior registra Xid 120 (exceção GSP)
e Xid 154 (reset necessário), anteriores à instalação. Os logs encerram durante
o shutdown normal; não permitem determinar o travamento final. Não executar novo
reboot sem autorização específica. Evidências no projeto de comparação em qa/.

## Modo guiado para mecanismos

Texto-para-vídeo puro do Nexus 1.3B não preservou a cunha nem os contatos; os
testes ficam registrados como reprovados. O modo nativo `GUV` (vídeo-a-vídeo)
usa um guia sem legendas, mantendo o projeto original intacto. Força 0.45
ainda antecipou o encaixe e mudou objetos de contexto. O teste conservador
com `denoising_strength: 0.1` preservou a ação nos quadros inspecionados.
Seis passos nominais resultaram em um passo de denoising efetivo após a injeção
da fonte; declarar esse dado, sem apresentar o resultado como geração livre.

Para repetir a preparação, a LLM usa `node kit/tools/wan2gp-clean-guide.mjs`
(cópia local via HyperFrames 0.9.14, 288×512, 16 fps, check antes do render)
e `node kit/tools/wan2gp-compare.mjs prepare-guides`. Isso cria a fila guiada
e guias por cena. Testar `generation/hook-guided-clean.json` antes da fila
`generation/video-guided-rest.json`. Saídas ficam em `wan2gp-guided-output`.
Legenda é recomposta localmente; o AAC original é copiado sem remixagem.
A montagem continua experimental, marcada e dependente de QA e decisão humana.

## Comparação livre a partir da narrativa

O criador esclareceu que quer comparar uma nova encenação criada pela IA a
partir da narrativa e do áudio, sem copiar o vídeo original. O teste guiado
continua preservado e identificado. O projeto independente é
`kit/projects/arco-alvenaria-wan2gp-livre`.

A LLM prepara dez pedidos com `node kit/tools/wan2gp-free.mjs prepare`, gera
`generation/video.json` com o adaptador e depois compõe com
`node kit/tools/wan2gp-free.mjs assemble-internal`. O modelo é Nexus 1.3B,
432×768, 16 fps, seis passos. O teste não utiliza `video_guide`, `image_refs`,
frame inicial ou outro input visual. Os metadados do primeiro MP4 também
confirmam `video_prompt_type` e `image_prompt_type` vazios.

O original é lido somente na montagem para copiar o áudio e construir o lado
esquerdo do comparativo. Cenário, luz, enquadramento e movimento da geração
livre vêm dos prompts em uma oficina de alvenaria. Não corrigir uma falha
deste teste trocando por material guiado: o criador pediu justamente observar
as diferenças e limites da geração livre. Material diagnóstico pode reprovar
na revisão e ainda documentar o resultado; não apresentá-lo como publicação
aprovada ou como avaliação de todos os modelos disponíveis no Wan2GP.
