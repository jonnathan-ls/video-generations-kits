# Revisão do clone Three.js e da biblioteca de assets

## Escopo e resultado

O diretório `js-3d-library` é o repositório oficial `mrdoob/three.js`, versão 0.187.0, commit `7e26babbbe69f411112193d04a41baeafb6ebb3b`. A análise foi estática e direcionada a `utils/server.js`, editor/player, carregadores de assets, scripts de pacote e dependências. Não instalei dependências do clone nem executei seu servidor ou editor.

Não encontrei no código inspecionado um mecanismo explícito de envio de segredos, telemetria ou beacon. Isso não é garantia matemática sobre cada linha dos quase 1 GB do checkout. Os materiais lidos continuam disponíveis e não foram copiados para fora.

O clone tem oito achados no snapshot de `npm audit`: seis moderados e dois baixos, todos no grafo de desenvolvimento; zero alto/crítico. O principal caminho inclui `minimatch` vulnerável por DoS e `deepmerge` com risco de prototype poisoning, alcançando ferramentas como ESLint e `@rollup/plugin-node-resolve`. A auditoria de produção do workspace do kit registrou zero vulnerabilidades nas três dependências reportadas (`research/metadata/dependency-audit.json`). Esses resultados são de uma coleta temporal, não uma promessa sobre versões futuras.

## Riscos concretos observados

- `js-3d-library/utils/server.js:45-63,177-180`: o servidor de desenvolvimento usa a raiz de trabalho como raiz servida, exibe listagens de diretórios e verifica contenção de caminho com `startsWith`; essa checagem não resolve o limite por separador nem symlinks. A chamada de `listen` sem endereço explícito pode expor o serviço além do loopback, conforme o ambiente. Não iniciar esse servidor na pasta de projetos ou na raiz do usuário.
- `js-3d-library/editor/js/libs/app.js:96-104`: o player executa scripts embutidos em projetos importados por `new Function`. Projetos/editor scripts de terceiros não devem ser abertos ou executados como conteúdo confiável.
- Carregadores GLTF e de textura aceitam URLs de recursos referenciados; projetos podem solicitar arquivos externos. Assets baixados devem ser tratados como dados não confiáveis e revisados antes de edição.
- Os exemplos e arquivos de mídia não têm necessariamente uma licença única. Confirmar a licença de cada asset antes de incorporar ou redistribuir. A inspeção de UI reaproveitou padrões de controles, não arquivos executáveis do editor.

## Mitigações aplicadas ao kit

A aplicação do kit usa um servidor próprio em `kit/tools/server.mjs`, ligado ao loopback, com rotas explícitas para pastas necessárias, validação de Host/Origin, CSP sem conexão externa, limites de corpo, resolução de caminho real contra symlink e bloqueio de arquivos ocultos. O preview de vídeo suporta range local. A inspeção usa `TransformControls` e `ViewHelper` distribuídos com a versão fixa `three@0.187.0`; não serve nem executa o clone. A interface não importa projetos arbitrários nem busca texturas externas.

A revisão não encontrou sinal de vazamento confidencial no código examinado, e o uso de recursos de inspeção da biblioteca oficial foi limitado a controles locais. As proteções do kit reduzem exposição no fluxo da aplicação; não transformam código JavaScript arbitrário em conteúdo seguro. A engine continua exigindo revisão de módulos produzidos antes de importá-los.

## Referências profissionais de inspeção adaptadas

- Perspectiva e ortográfica para comparar forma e dimensão.
- Gizmo de translação, giro e escala, alternância local/mundo e seleção/isolamento de partes.
- Corte por plano com eixos, grade, limites e hierarquia de peças.
- Modos clay/normais e contagem de malhas/triângulos para inspeção técnica.

Esses padrões estão na aba **Inspeção** do catálogo. Os controles afetam a visualização de revisão, não a geometria persistida do asset.
