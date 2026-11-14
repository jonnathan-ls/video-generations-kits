# Protocolo de produção de vídeo com IA local

Este fluxo se aplica a projetos cujo `state.json` selecione `wan2gp-ai-video` ou `wan2gp-local-ai-video`. Ele preserva a direção e o QA do kit e troca a construção de cenas pela geração visual local Wan2GP.

## 1. Referência e direção

Analise o vídeo de referência a 10 fps. Registre beats, ações, cortes, ritmo, estados antes/depois, composição, movimento e intenção sonora. Preserve a ordem e a função dos acontecimentos quando o criador pedir modelagem estrutural, mas crie prompts, cenário, personagens, materiais e realização próprios. A referência serve à direção; não entra na fila de modelos como imagem, vídeo ou áudio sem autorização explícita.

Mantenha `beats.json`, a bíblia de estilo e o desenho sonoro. Para cada clipe, o plano aponta o beat, alvo visual, pergunta, ação observável, estado inicial/final, câmera e som. Em material sem fala, não inventar narração ou legenda de fala.

## 2. Plano de prompts e continuidade

Escreva um prompt global conciso para identidade visual e prompts por plano para a ação específica. Um clipe curto deve ter uma ação principal, com contato, reação e resultado fáceis de ler. Registre também o prompt negativo, duração, orientação, resolução, seed, versão nativa dos parâmetros e política de corte. Evite pedir várias ações encadeadas dentro de um único clipe se cortes separados melhorarem controle e legibilidade.

Toda superfície e objeto que a direção definir como crochê precisa aparecer como fio de algodão com laçadas e relevo legíveis. Fixe paleta, escala aparente do fio, layout, luz e desenho das mãos. O prompt precisa proteger a trama contra superfícies lisas/realistas e mudanças temporais; isso é intenção, não prova de qualidade. Âncoras de início/fim são geradas ou editadas por IA local e entram na fila como mídia local identificada por hash. Se não houver modelo local de imagem, é permitido gerar um clipe T2V curto no Wan2GP e extrair dele um frame por inspeção. Preserve o MP4 de origem e registre timestamp, frame escolhido e hashes; extração/crop editorial não pode pintar nem desenhar conteúdo novo.

## 3. Modelos e reprodução

Antes de gerar, confirme que o modelo existe no diretório local usado pelo Wan2GP, confira licença/origem, parâmetros nativos, hash dos pesos, espaço em disco e VRAM. Não marcar um candidato como disponível porque aparece no código ou na interface. Registrar exatamente modelo, revisão, quantização, resolução, frames, steps, seed, prompts, versão Wan2GP e recibo da fila. Uma mudança de modelo ou configuração cria nova revisão.

Use a fila nativa via `kit/tools/wan2gp.mjs generate`. Uma checagem operacional de GPU serve apenas para evitar iniciar com CUDA indisponível ou ocupada; ela não avalia a estética. Não iniciar a geração quando os pesos faltarem, o espaço for insuficiente ou outra carga estiver usando a GPU. Nunca usar Three.js, HTML, CSS, SVG, canvas ou desenho por código para fabricar os quadros do vídeo. Para I2V, fixe a origem da imagem de início e o modo nativo de prompt aceito pelo modelo; mudança de âncora exige nova revisão.

## 4. Clipe-prova e revisão

Comece por um clipe curto e representativo, separado da geração completa. Preserve o MP4 original da fila e registre hash e metadados. Inspecione os frames amostrados a 10 fps e assista ao movimento em velocidade normal e em escala de celular. Confira preparação, contato, reação e resultado; trama estável em todos os materiais sólidos; mãos e anatomia; identidade do cenário; posição e forma dos objetos; câmera; cortes; textura de água/espuma; flicker e deformações.

Se houver áudio, ouça o clipe e alinhe foley ao contato efetivamente visível. Mixagem e cue timings são revistos com a imagem real, não aprovados apenas pelo desenho sonoro. Marque `rejected` ou `not-verified` quando houver falha ou inspeção ausente. Corrija prompt, duração, seed, parâmetros ou modelo, gere novamente e repita o passe afetado até não haver P0/P1. Um dry-run prova apenas que a fila pode ser interpretada; nunca prova a imagem.

O parecer fica registrado nos arquivos QA do projeto com clipe/hash, escopo, frames ou momentos inspecionados, findings concretos e resultado. Só após passar o clipe-prova, expanda para os outros beats e repita a revisão em todas as cenas, nas junções e na montagem completa. A entrega continua sujeita ao `skills/revisao-profissional/SKILL.md`.

## 5. Montagem e revisão humana

Código de edição pode ordenar e cortar clipes, manter o ritmo, sincronizar som, criar mix e codificar o MP4. Não pode desenhar ou reconstruir o conteúdo visual. Os capítulos só existem se narrados; não adicionar interface, prompts, notas técnicas, controles ou marcas nos pixels do arquivo assistível.

Não criar catálogo nem solicitar aprovação de assets 3D nesta rota. A primeira revisão estética humana acontece sobre um clipe Wan2GP realmente gerado; a aprovação do vídeo completo é uma decisão posterior e separada.

## Testes

Por solicitação do criador, esta produção não usa testes unitários. Não adicionar, executar ou exigir uma suíte unitária para gerar ou julgar o vídeo. O critério é QA audiovisual direto no arquivo gerado: movimento, textura, continuidade, cortes e áudio. A ausência de testes unitários não reduz nem substitui esse QA.
