---
name: assets
description: Mapear cada palavra e grupos de uma a três palavras da narrativa para assets 3D, ações, FX, sons e transições; reutilizar o catálogo, criar apenas lacunas e submeter cada novo recurso à aprovação humana.
---

Leia `kit/docs/assets.md`. A responsabilidade desta skill é o inventário e crescimento da biblioteca, antes da direção de cena.
Siga também `kit/docs/qualidade-audiovisual.md`: o mapa semântico cobre ações, relações, cenário e entorno; datas, cronologia, horários, nomes, siglas e palavras de impacto criam requisitos visuais próprios — não apenas fala ou placa isolada.

Você é a LLM operadora do kit. Execute as ferramentas e edite os arquivos; não peça ao usuário para executar comandos. Ele valida e aprova pelo chat e pela aplicação.

Execute `npm run analisar -- narracao.txt asset-plan.lexical.json`. Confira cada grupo gerado, ambiguidades e cada palavra descoberta. Faça a segunda passagem semântica por frase: substantivos não bastam; ações, materiais, relações e estados também podem precisar de recursos. Registre a decisão com offsets e contexto. Nunca descartar todas as palavras não encontradas como ruído.

Trate datas, horas, duração, cronogramas, números, siglas, termos e palavras de impacto como necessidades de cena explícitas. Escolha recurso visual que prove a relação — linha do tempo, relógio, rota, documento, marcador, mapa, sequência de estados ou objeto ligado à frase — e especifique movimento, destaque e tempo de leitura. Confira nomes e referentes: um navio que resgata não pode ser confundido com o navio que naufragou. Uma legenda ou cartão isolado não cobre a cena nem substitui a checagem histórica.

Leia o catálogo compacto em `kit/catalog/RESUMO.md` e use `npm run procurar -- termo` para detalhes; consulte implementação apenas dos assets envolvidos numa mudança. Não criar de novo um recurso que já existe. Usar ID, variante e revisão; não guardar prompts longos no lugar de contratos.

Não limitar a quantidade de recursos por cena. O mínimo é **5 assets visuais** por cena; **não há teto**. Mais recursos são bem-vindos quando cada um tem função no acontecimento, na leitura, na causalidade ou no contato; não inventar preenchimento decorativo. A densidade faz parte do plano de cena e é conferida no QA.

Para uma lacuna, modele um módulo de responsabilidade pequena a partir de `kit/templates/asset.js` e registre uma definição com `node kit/tools/register-asset.mjs definicao.json`. Teste proporções, contato com o solo, câmera, corte e sample(t) fora de ordem. Atualize o catálogo e apresente o asset na aplicação.

Ao especificar um efeito, registre o que deve receber atenção, qual relação ele revela, sua direção e em que momento deve entrar e sair. Confira contraste e leitura no formato vertical de celular; o efeito precisa realçar o mecanismo sem ocultá-lo ou competir com outro movimento.

Para fotografias ou vídeos disponíveis na web, verifique licença/domínio público na fonte antes de baixar ou usar. "Público" não equivale a liberado e não há uma franquia universal de segundos. Preserve a ficha de origem, autor, licença, atribuição e restrições; armazene a mídia localmente e declare dependências em `files`. Insira como motion graphic dentro da cena principal, sincronizado ao beat e sem cobrir ação ou legenda. Uma evidência principal precisa de escala e tempo de leitura legíveis em celular; não a reduza a uma miniatura nem a uma aparição incidental. Consulte `skills/motion-design/SKILL.md` para coreografia, escala e duração visual. Não use URL remota no render.

Inclua no backlog requisitos do entorno quando o criador pedir elementos para dar escala e vida à cena. Reutilize o catálogo e especifique relações espaciais, trajetória, duração e distância para rua, veículos, pessoas, edifícios, vegetação ou céu. Esses elementos sustentam o ambiente e a leitura do mecanismo; não viram uma segunda narrativa nem cobrem legenda ou ação. Siga `kit/docs/assets.md`.

O criador escolhe por recurso e variação: aprovar ou melhorar, pela aplicação ou em resposta explícita no chat. Uma decisão inequívoca recebida no chat pode ser registrada na revisão correspondente com `ReviewStore.save` e uma observação do canal; isso registra a escolha do criador, não uma aprovação automática. Não clique em aprovação em nome dele, não infira uma decisão, nem edite `reviews.json` manualmente. Se o código mudar, a aprovação perde validade. Produção fica bloqueada até a revisão humana da versão atual. Prévia técnica marcada pode ser usada para a própria revisão.


Antes de implementar, preencha asset-plan.json com todas as decisões semânticas e execute internamente plan-resources.mjs. Consulte o backlog por tipo. Encaminhe a construção para a skill qualidade; objetos, cenários, animações, efeitos, transições, áudio, materiais, câmeras, iluminação e overlays podem ser recursos independentes.
