# Biblioteca incremental e aprovação humana

## Contrato

Assets de geometria exportam `create({variant}) → THREE.Group`. Usar metros; y=0 é o chão e +Z é a frente. Movimento exportado em `root.userData.sample(t)` precisa produzir o mesmo resultado para o mesmo t, inclusive ao buscar 5s → 1s → 5s. Sem incrementos dependentes do quadro, relógio ou aleatoriedade sem semente. Personagens e animações antigos são acessados pelo adaptador; não copiar o esqueleto.

Cada asset tem ID estável, tipo, categoria, termos e sinônimos, variações, descrição do que representa e limitações. Separar uma capacidade reutilizável do projeto em que surgiu. Não criar uma classe para cada frase nem um asset que englobe o vídeo inteiro.

## Analisar cada palavra e grupo

`npm run analisar -- narracao.txt asset-plan.lexical.json`

O analisador gera TODAS as janelas contíguas de 1, 2 e 3 palavras, com posições no texto, normaliza acentos e consulta o registro. Não atravessa pontuação; conserva as ambiguidades. Prefere o grupo mais longo na composição e preserva todos os resultados na evidência.

A correspondência literal é apenas a primeira passagem. A LLM deve revisar CADA token não coberto e as relações de cada frase. Classificar em: ligação sem entidade visual; sinônimo de recurso existente; composição de recursos existentes; novo objeto/material/personagem; nova ação/FX/som/transição. “Não encontrado” não equivale a “gerar uma malha para essa palavra”. “Cola” pode ser material ou verbo. Registre a decisão e o contexto antes de criar.

Conservar o texto, offsets, IDs candidatos e decisão semântica. O usuário valida a lista do projeto na aplicação ou por confirmação explícita no chat; só depois a LLM registra `assetPlan.reviewed`, resolve `unresolved` e fixa usos com IDs/variações/revisões aprovadas. A validação da lista tem registro próprio vinculado à narrativa e ao plano e não substitui a aprovação de cada recurso. As relações invisíveis também exigem suporte: direção da água, ponto de contato, conexão do tubo, direção da carga. Se a narrativa pedir “a bancada desliza”, verificar objeto E ação.

### Elementos do entorno

O plano pode incluir recursos de contexto a pedido do criador ou quando forem necessários para escala, orientação e continuidade. Primeiro registre a necessidade no backlog como requisito ambiental ligado à cena e consulte a biblioteca por recursos existentes. Componha rua, veículo, pessoa, vegetação, edifícios, céu e objetos do entorno sem transformar o plano de fundo numa segunda história. Para cada elemento móvel, especifique trajetória, duração e distância; para cada elemento apoiado, especifique sua superfície de contato. Em cenas de arquitetura, verifique que prédios toquem o terreno, que a rua assente no piso e que rodas toquem o asfalto. O recurso não deve ocultar a ação, a legenda ou uma relação que a narração esteja explicando.

### Imagens e vídeos públicos em motion graphics

"Público na web" não significa livre para reutilizar, e não existe um número universal de segundos que libere uma obra protegida. Antes de usar cada imagem ou clipe, confirmar a licença ou o domínio público na página da instituição/detentor e salvar título, criador, origem direta, declaração de direitos, versão/termos da licença, data de consulta, crédito exigido e limites de edição/uso comercial. Se não houver permissão ou condição verificável, não usar. Exibir apenas o trecho que a narrativa justifica; a duração editorial não é um atalho jurídico.

Guardar os arquivos localmente, declarar cada dependência de mídia em `files` do asset para o cache e incorporar crédito legível quando requerido. Motion graphics entram como inset dentro do plano 3D — com entrada, movimento, pausa de leitura e saída sincronizados ao beat — e não substituem o cenário nem cobrem o alvo, a ação ou a legenda. Vídeo externo precisa de origem/licença comprovada e extração local determinística; nunca carregar URL remota durante a renderização.

## Expandir sem recriar

1. Consultar `kit/catalog/RESUMO.md` e `npm run procurar -- termo`, ou a API do catálogo. Ler só metadados; abrir código apenas do recurso que exige alteração.
2. Se faltar uma capacidade, criar um módulo pequeno em `kit/assets/`, usando o contrato acima. Declarar medidas ilustrativas e limites.
3. Preparar uma definição JSON usando `templates/asset.json`. Registrar: `node kit/tools/register-asset.mjs /caminho/definicao.json`.
4. `npm run catalog` e atualizar a aplicação. O registro novo entra automaticamente como pendente. Registrar variações visualmente distintas em entradas próprias do seletor de variação.
5. Mostrar o recurso ao criador no catálogo ou em uma prévia pelo chat. Ele inspeciona e escolhe **Aprovar recurso** ou **Pedir melhoria**, com observação. Uma decisão explícita por chat pode ser registrada em `ReviewStore.save`, identificando a revisão, variação e canal; não inferir aprovação e não preencher `reviews.json` manualmente.
6. Após ajustes, repetir a inspeção. O hash muda e a aprovação anterior perde validade. Somente o recurso e suas dependências de implementação participam da revisão. Adicionar recursos não invalida aprovações de outros; mudanças em helpers afetam os recursos que os importam.
7. Produção: `npm run validar -- projeto.json`. Prévia técnica identificada pode existir para revisão; entrega de produção exige aprovação atual de TODOS os usos e variações.

`reviews.json` é persistente em disco, não em localStorage. A LLM executa os comandos deste contrato; o usuário faz inspeções e aprovações. O fluxo foi testado com repositório de revisões temporário; nenhum asset real foi aprovado automaticamente.

## Limite do corte

O visualizador implementa clipping por plano e assets já abertos. Clipping oculta superfícies sem criar uma tampa geométrica na seção. Para uma seção maciça e hachurada, construir superfícies internas ou adicionar um recurso específico e submetê-lo à aprovação. Não confundir recorte visual com simulação de engenharia.

## Densidade por cena

Não há limite máximo de recursos por cena. O mínimo é **5 assets visuais** (objeto, cenário, personagem, overlay, efeito, transição, material ou luz declarada como asset); câmera, movimento e som entram além disso. Mais recursos são bem-vindos quando cada um serve ao acontecimento, à leitura ou à causalidade. A densidade é conferida no plano de cena e no QA; `project.json` declara `qualityPolicy.minAssetsPerScene: 5`, sem `maxAssetsPerScene`.

## Backlog e tipos

A LLM registra decisões semânticas com evidência, tipo e justificativa em asset-plan.json. O planejador verifica a cobertura de todas as palavras e cria requisitos em catalog/backlog.json antes de existir código. Tipos: object, character, scene, animation, effect, transition, sound, material, camera, lighting e overlay. Um requisito implementado recebe assetId e aguarda revisão; aprovação não é inferida da existência do arquivo.
