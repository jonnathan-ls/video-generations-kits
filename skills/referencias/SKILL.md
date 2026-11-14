---
name: referencias
description: Coletar vídeos públicos de referência, comprovar ranking de visualizações, baixar com yt-dlp, transcrever com Whisper e analisar quadros, narrativa e áudio para calibrar o kit explicativo 3D sem copiar conteúdo.
---

Leia `research/reports/analise.md` como exemplo de evidência e limites. Separe dados observados, hipóteses e decisões propostas.

Você é a LLM operadora do kit. Execute as ferramentas e edite os arquivos; não peça ao usuário para executar comandos. Ele valida e aprova pelo chat e pela aplicação.

Verifique o yt-dlp global antes de procurar nos repositórios. Nesta máquina ele está em ~/.local/bin, instalado com `uv tool install --with curl-cffi 'yt-dlp[default]'`. Use --js-runtimes node para YouTube quando necessário. Instagram individual funcionou publicamente com --impersonate chrome; o perfil não funcionou. gallery-dl foi avaliado e exigiu login neste caso. Não prometer que uma ferramenta sempre baixa qualquer plataforma.

Liste toda a amostra pública do perfil, salve contagens e data, ordene e selecione a quantidade solicitada. Fixados não são sinônimo de mais vistos. Quando a interface abrevia contagens, registre a abreviação e sua precisão. Se a lista estiver incompleta, não apresente a seleção como ranking completo. Evite baixar traduções desnecessárias de legendas.

Não extrair cookies de uma sessão sem autorização explícita. Se o acesso público falhar, conclua as partes independentes e peça somente o acesso que falta, explicando o bloqueio concreto.

Use o script local de transcrição informado em `kit/docs/audio.md`. Extraia quadros espaçados e sequências curtas de movimento. Inspecione visualmente os arquivos. Relacione trechos temporais à ação, câmera, revelação interna, legenda e contato. Em áudio, medir LUFS do mix não identifica os instrumentos/FX. Não afirmar timbre, sincronismo exato ou retenção sem evidência suficiente.

Guarde relatórios, dados, quadros e transcrições em `research/` como insumos da LLM; a aplicação é para inspeção e validação de recursos, sem aba de referências. Transforme padrões em regras modulares originais; não reproduza a assinatura, os assets, roteiros ou trilhas dos canais.
