# Reprodução no celular

Página local para assistir aos testes guiado e livre, na mesma rede Wi-Fi do computador. Endereço configurado nesta sessão: <http://192.168.15.10:4180/>. Depende do servidor ativo e desse IP; o criador relatou ter encontrado e assistido à página guiada pelo celular.

A comparação aparece primeiro; o short vertical vem abaixo. Controles nativos permitem reprodução inline e tela cheia conforme o navegador, com links de download. Não há autoplay; iniciar um vídeo pausa o outro. A qualidade Wan2GP permanece identificada como experimental.

A raiz mantém o teste guiado e oferece um link para <http://192.168.15.10:4180/livre/>. O teste livre usa dez clipes gerados somente por texto com Nexus1.3B, em 432×768, e a mesma narração AAC. A geração livre não recebe quadros originais; a comparação inclui o original como referência de avaliação. Esse diagnóstico permanece não aprovado; assistir à página não constitui aprovação de recursos.

## Manutenção pelo agente

Toda operação cabe ao agente, sem pedir comandos ou edição de arquivos ao usuário. Executar na raiz do projeto `node kit/tools/serve-video-lan.mjs 192.168.15.10 4180` para disponibilizar esta página no endereço autorizado. Sem argumentos, o servidor usa apenas `127.0.0.1:4180`. Conferir o IP local antes de reabrir o compartilhamento se a rede mudar e entregar o link atualizado pelo chat.

O servidor aceita apenas GET/HEAD e uma lista fixa de dez rotas: `/`, `/livre/`, `/player.css`, `/player.js`, `/poster.jpg`, `/comparacao.mp4`, `/short.mp4`, `/livre-comparacao.mp4`, `/livre-short.mp4` e `/livre-poster.jpg`. Não expõe o Studio, suas APIs de aprovação, nem arquivos arbitrários do projeto. MP4 têm suporte a intervalos de bytes para busca e reprodução. Não há dependências remotas nem envio a serviços externos.

- `/comparacao.mp4`: `../render/comparison-internal.mp4`.
- `/short.mp4`: `../render/wan2gp-internal.mp4`.
- `poster.jpg`: quadro extraído aos 2 segundos de `../render/comparison-internal.mp4`.
- `/livre/`: `livre.html`, usando o mesmo CSS e JavaScript.
- `/livre-comparacao.mp4`: `../../arco-alvenaria-wan2gp-livre/render/comparison-internal.mp4`.
- `/livre-short.mp4`: `../../arco-alvenaria-wan2gp-livre/render/wan2gp-internal.mp4`.
- `/livre-poster.jpg`: `livre-poster.jpg`, quadro extraído aos 2 segundos da comparação livre.

Ao trocar um vídeo, conferir duração, proporção, texto e poster; manter a lista explícita de arquivos no servidor. Verificar HTTP 200 nas duas páginas e mídias, intervalos inicial e sufixo com 206 nos quatro MP4, e `/api/reviews` com 404. Inspecionar em viewport de celular e testar reprodução, pausa mútua e navegação entre os testes. O teste em navegador simulado não confirma funcionamento no telefone físico; a confirmação anterior do usuário cobre a página guiada.

## Continuidade visual

Extensão do sistema existente em `DESIGN.md` e `studio/style.css`: branco, texto escuro, índigo, sans do sistema e foco visível. A página usa corpo de 16px, título fluido de 1,8–2,4rem, subtítulos de 1,2rem, links com alvo mínimo de 44px e layout de coluna até 850px. Esses ajustes de leitura e reprodução são locais; não alteram o sistema global. `PRODUCT.md`, `DESIGN.md` e eventuais sidecars permanecem preservados.
