# Experimento preparado

Para iniciar pelo chat: **“Use a skill em `test/motion-storyboard/SKILL.md`. Minha ideia é: …”**. Informe estilo, duração e formato se já tiver preferências; caso contrário, a LLM conduz essas escolhas. A skill foi mantida nesta pasta, sem instalação global, para respeitar o isolamento solicitado.

Prévia da galeria preservada: http://127.0.0.1:4177/artifact/local/index.html

Foram extraídos oito templates integrais, os oito renderizadores de amostras, configuração, validação e lógica de geração de prompt. A captura contém HTML externo e interno e 65 recursos públicos estáticos, com URLs e hashes em `artifact/manifest.json`. O arquivo de tradução pt-BR da interface externa retornou 403 e consta como falha. Código de backend, APIs de conta e telemetria não compõem o espelho público. Nenhum cookie foi usado; os cabeçalhos salvos tiveram valores Set-Cookie ocultados.

A galeria local mantém o visual original e os renderizadores; fontes locais substituem chamadas externas. A ponte de execução da plataforma foi retirada somente da cópia local. Há CSP bloqueando conexões de rede. A LLM continua sendo responsável por interpretar os templates e implementar cada nova narrativa.

Validação executada: 80 configurações de prompt comparadas com a função JavaScript original, limites de duração, integridade SHA-256 dos arquivos capturados, caminhos locais de fontes/CSS e geração dos três arquivos pela CLI. A skill passou no validador de frontmatter. A galeria e o formulário Flat Vector foram inspecionados no navegador; sem erros ou avisos de console naquela verificação.

Nenhuma narrativa nova, aprovação criativa ou MP4 foi gerado nesta preparação. O próximo teste começa com sua ideia no chat. `runs/` recebe a solicitação original, configuração, prompts, plano, recursos, prévias e decisões, permitindo repetir a mesma entrada na produção depois. Não houve análise ou integração dos kits existentes.
