## Contrato da adaptação local

O template abaixo foi escrito para um HTML Artifact do Claude. Neste experimento a LLM executora é o agente do chat atual. Crie os HTMLs e recursos em `test/runs/<sessão>/`, execute ferramentas e ofereça prévias em loopback. A geração narrativa e a implementação visual são trabalho da LLM, não do substituidor de variáveis.

As referências a “esta conversa Claude”, “Artifact”, “cole em um novo chat” e a proibição original de terminal são substituídas pela execução local autorizada pelo usuário. Não peça que ele copie prompts, rode scripts, instale pacotes ou recupere o servidor. Os arquivos originais permanecem sem alteração para comparação.

Conserve a direção visual, o mecanismo narrativo, a configuração, a aprovação condicional do storyboard e a honestidade sobre alinhamento e MP4. Não transforme um estilo 2D escolhido em 3D por causa do foco da produção existente. Preserve o uso de Three.js quando o template o exigir, com dependência local, sem servidor de exemplos ou scripts do editor.

As amostras da galeria são renderizadores Canvas 2D ilustrativos, inclusive nos cartões que recomendam Three.js/WebGL para a produção. Elas não provam a engine final nem contêm um gerador de vídeos completos. Não substitua refração real por transparência quando Liquid Glass for escolhido, nem nuvens de pontos por uma imagem estática em Generative Particles.

A prévia fica em `127.0.0.1`, com arquivos locais e acesso restrito à pasta `test/`. Para servir: `python3 -m http.server 4177 --bind 127.0.0.1 --directory test` (executado pela LLM; reutilize o serviço se já estiver ativo). Use outra porta de loopback se houver conflito. Não reutilize cookies, habilite telemetria ou envie conteúdo a serviços externos sem a autorização apropriada. Downloads de bibliotecas necessárias ao estilo devem ficar locais; nenhuma dependência remota em tempo de reprodução.

Com voz, use o arquivo autorizado e sua duração decodificada. Sem alinhamento real, identifique os tempos como estimativas. Transcrição e escolha de voz não são a mesma coisa: não sintetize uma voz por conta própria. Sem áudio fornecido, não marque o estado como sincronizado. Música e SFX ativos são procedurais, como pede a origem.

Prefira a exportação real em MP4 descrita pelo template. Se precisar de ferramentas locais para codificar ou muxar, a LLM deve executá-las, preservando duração e faixas. Isso é uma adaptação técnica explícita; não alegue que o template original a fazia. Verifique o arquivo antes de anunciar entrega. Um storyboard validável é uma entrega de etapa; não exige exportação final naquele momento.
