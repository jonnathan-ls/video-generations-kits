# Kit de vídeo

Este kit é operado pela LLM através do chat. Você apresenta a ideia, acompanha o desenvolvimento e faz validações e aprovações. **Você não precisa executar comandos, editar código ou configurar arquivos.**

A aplicação local permite inspecionar os recursos e registrar suas decisões. A LLM cuida de iniciar ou recuperar a aplicação quando necessário.

## Como pedir

- “Quero um vídeo explicando por que o piso estufa. Vamos começar pelos recursos necessários.”
- “Sugira ideias para vídeos que revelem como as coisas funcionam por dentro.”
- “Estude este link e proponha uma narrativa original no estilo do kit.”
- “Use este áudio como narração e identifique os recursos necessários.”
- “Analise esta narrativa e monte o backlog de objetos, cenas, animações, efeitos, sons e câmeras.”
- “Aproveitei a forma dessa peça, mas quero melhorar o material e o movimento.”
- “Os recursos estão aprovados. Podemos avançar para a narração e as cenas.”

## Etapas simples

A LLM confirma o pedido, pesquisa os fatos e propõe a narrativa. Depois consulta o catálogo, identifica os recursos que faltam, constrói os necessários e apresenta os resultados para sua revisão. Somente após essas aprovações o trabalho avança para voz, montagem das cenas, prévia e vídeo final.

Cada etapa fica registrada em arquivos pequenos para que a LLM possa retomar o projeto e melhorar o kit. Um pedido pode terminar apenas na preparação de assets; não é obrigatório produzir o vídeo inteiro na mesma interação.

## O que você acompanha na aplicação

- **Catálogo existente:** recursos disponíveis, com aprovação por variação e versão.
- **Aprovados:** inclui recursos com alguma variação aprovada; a aplicação mostra quando a aprovação é parcial.
- **Novos da narrativa:** recursos implementados em resposta a um roteiro, com sua origem identificada.
- **Recursos do vídeo:** lista do projeto com itens do catálogo e necessidades novas. Você valida a lista e, separadamente, aprova cada recurso e variação antes da produção.

A aprovação da parede com água fria foi preservada na migração de estrutura. Recursos novos não anulam essa aprovação. Se a implementação do próprio recurso mudar, ele volta para revisão.

## Referências e arquivos

O **kit Wan2GP** acrescenta geração local de imagens e vídeos, operada pelo chat.
A primeira comparação experimental usa o short do arco de alvenaria, preservando
narração e voz. O material gerado tem revisão própria e não herda as aprovações
do vídeo original. A operação técnica está em [kit/docs/wan2gp.md](kit/docs/wan2gp.md).

[Análise inicial dos seis vídeos](research/reports/analise.md), [estudo dos sete vídeos RicksClips](research/reports/ricks.md), [estudo dos sete Reels HiddenHome](research/reports/hiddenhome.md), [revisão da biblioteca Three.js](research/reports/library-security.md) e [nomes propostos para o canal](kit/docs/nomes.md). Os estudos e quadros são insumos de consulta da LLM.

O conteúdo técnico que orienta a LLM fica em [AGENTS.md](AGENTS.md), nas skills de responsabilidade específica e em `kit/docs`. Os kits de origem e a biblioteca clonada permanecem como referências. Os comandos existentes nesses materiais são ferramentas da LLM, não tarefas para você.
