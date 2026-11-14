# Ferramentas internas da LLM

Todos os comandos desta página são executados pelo agente no terminal da máquina. Nunca pedir que o usuário os execute. A documentação de uso humano está no README, sem tarefas técnicas.

- Aplicação: `npm run studio`. A LLM verifica a resposta e abre o endereço local. Se a porta estiver ocupada pelo próprio servidor, reutilizar ou reiniciar somente o processo conhecido.
- Iniciar projeto: `node kit/tools/start-project.mjs <id> <título>`.
- Consultar catálogo: `npm run procurar -- <termo>`; ler `kit/catalog/RESUMO.md` antes de módulos.
- Mapa lexical: `npm run analisar -- <projeto>/narration.txt <projeto>/lexical.json`.
- Depois da triagem semântica de TODAS as palavras: `node kit/tools/plan-resources.mjs <projeto>`.
- Sincronizar baselines: `node kit/tools/sync-baselines.mjs`.
- Construir receita geométrica: `node kit/tools/build-resource.mjs <especificação.json>`.
- Registrar implementação: `node kit/tools/register-asset.mjs <definição.json>`. O requisito introducedBy.requirementId precisa existir.
- Qualidade: profile em `kit/quality/profile.json`, relatórios em `kit/quality/reports`, decisões humanas em `kit/catalog/reviews.json`. Aprovações ou pedidos de melhoria explícitos no chat podem ser registrados via `ReviewStore.save` na revisão/variação exata, com nota do canal; nunca escrever `reviews.json` manualmente nem inferir a decisão.
- Voz local em português: a LLM usa `kit/tools/voice-pt.py` com o Python e o Kokoro já disponíveis em `~/StickFilms/.tools`; verificar pronúncia e apresentar amostras antes de fixar a voz.
- Plano do vídeo: o usuário confere e valida a lista na aplicação ou confirma explicitamente pelo chat. Após a confirmação, a LLM persiste a decisão com `approveProjectPlan` e a impressão digital atual; não edita `plan-review.json` diretamente. Mudanças da narração ou do plano exigem nova validação.
- Validar produção: `npm run validar -- <projeto>/project.json`.
- Exportar HyperFrames: `node kit/tools/export-hyperframes.mjs <projeto>/project.json`. O modo --preview é marcado e só serve para revisão.
- Vídeo IA local: usar a fila Wan2GP documentada em `kit/docs/wan2gp.md` e `kit/docs/wan2gp-ai.md`; qualidade se valida no clipe real com revisão audiovisual, não com testes unitários. Por solicitação do criador, o kit não mantém nem executa a suíte unitária.
- Storyboard executável: `node kit/tools/storyboard-compile.mjs <project.json> <storyboard.json> <output/project.json>`. Recusa layouts pendentes; `--until <segundos> --diagnostic` gera somente prova interna com gaps preservados.
- Pacotes e cache: `node kit/tools/render-segments.mjs plan|status|export|render|assemble <project.json>`. Ler `render-incremental.md` antes; entrega limpa usa modo e gates próprios.
- Agentes por cena: `node kit/tools/scene-jobs.mjs init|claim|submit|review|status ...`. Ler `agentes-producao.md`; contratos e leases impedem dois produtores alterarem as mesmas cenas.

Backlog não é um worker autônomo. A LLM o lê e executa o próximo trabalho durante a interação pelo chat. Não prometer que uma tarefa será construída em segundo plano se não houver um agente trabalhando nela.

## Revisão profissional obrigatória

Aplicar `skills/revisao-profissional/SKILL.md` antes de liberar vídeo ou prévia renderizada como pronta. Conferir `node kit/tools/qa-gate.mjs <projeto>/project.json --artifact <video-exato>`. Player `--preview --internal-qa` pode mostrar interface diagnóstica; o MP4 assistível deve ser sempre limpo, sem plano visual, controles ou marca técnica. O parecer fica em `<projeto>/qa/report.json`, com evidências reais, escopo e bloqueadores; passar no script verifica vínculo/estado, não concede aprovação estética ou humana. Para storyboard e estudos sem render, usar o gate de prévia em `AGENTS.md`/`kit/docs/qualidade.md` e registrar `preview-qa.json`; não iniciar render do vídeo.
