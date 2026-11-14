# Engine de recursos e evolução de qualidade

A LLM interpreta o requisito e escolhe o contrato. A engine fornece peças, movimentos, validações e referências; não decide sozinha o que uma palavra significa nem substitui a revisão humana.

## Construção geométrica

`engine/factory/materials.js` define materiais locais; `geometry.js` cria peças explícitas; `motion.js` aplica movimento absoluto; `index.js` compõe a receita. As peças têm nomes estáveis, unidades em metros, posição e material. O movimento é função do tempo, com eixo, amplitude, início e duração. Receitas pequenas e módulos específicos evitam reconstruir um objeto já existente.

O estudo da junta usa essa engine: dormentes, perfil do trilho, talas, parafusos e uma folga identificável. É uma proposta ilustrativa, com 33 malhas, não uma especificação executiva nem uma aprovação implícita.

## Referências aprovadas

A LLM consulta baselines válidos por revisão e variação. O baseline registra decisões humanas existentes. O padrão inclui silhueta legível, materiais coerentes, proporção, conexões, leitura em corte e movimento que corresponde à narrativa. Uma parede aprovada pode servir de referência de legibilidade de geometria; não implica que aço deva parecer tijolo.

O profile versionado define limites técnicos. Se o usuário pedir outra direção de detalhe ou material, registrar a decisão em `quality/decisions.md`, aprimorar o builder ou módulo pertinente e repetir a inspeção. Não aumentar todas as regras para corrigir um defeito isolado.

### QA antes da aprovação de narrativa visual

O padrão começa no storyboard visual: “esboço” não é isenção de QA. Uma cena só pode ser apresentada como pronta para revisão depois de mapear o beat e sua fala, consultar e registrar exemplo Three.js local antes da implementação, percorrer cada cena e movimento no navegador e resolver os P0/P1. Documente o passe em `kit/projects/<id>/preview-qa.json`, com cenas cobertas, referências e caminhos de evidência. Marque `not-verified` quando um domínio não foi inspecionado e `rejected` diante de bloqueador. Uma prévia aprovada internamente para revisão continua sem aprovar assets ou escolhas do criador.

Conte cenas × unidades de fala: cada frase/oração com acontecimento próprio precisa de uma cena distinta; um parágrafo/beat com várias frases não pode virar uma cena única. A referência é de 2 a 5 s por cena. Cada cena declara no mínimo **5 recursos**, sem limite máximo; mais recursos são bem-vindos quando cada um serve ao acontecimento, à leitura ou à causalidade. Prévia de trecho usa a mesma granularidade e o mesmo QA da versão final; “provisório” não dispensa cobertura. Reprovar cena única para gancho multi-frase, ausência de cortes/inserções/efeitos e cena com menos de 5 recursos.

No preflight conceitual, avalie causalidade visual, diferença entre beats, foco, composição, contato/escala, luz e contraste, leitura em celular, movimento demonstrativo e presença de mídia de referência quando ela tiver função narrativa. O estudo pode usar geometria provisória por depender de validação de plano; mesmo assim, silhueta, enquadramento, relações espaciais e motion precisam demonstrar a intenção sem defeitos evidentes. O QA profissional do filme completo exige o artefato exato, inspeção de movimento e som, conforme `skills/revisao-profissional/SKILL.md`.

### Exemplos Three.js instalados localmente

Antes de implementar um efeito de render conhecido, procure a demonstração equivalente dentro de `node_modules/three/examples/jsm/` (e em `kit-video-3d/node_modules/three/examples/jsm/` para esse pack). Compare a versão instalada e consulte a geometria, material/shader e ciclo de render do exemplo. `Water.js` é uma referência de Fresnel, direção de luz, brilho especular e conversão de cor; `Sky.js` orienta gradiente atmosférico por direção; `RoomEnvironment.js` demonstra fontes de reflexão de ambiente. São exemplos de implementação, não baselines estéticos. Adapte-os aos contratos locais, que exigem assets locais, tempo determinístico e busca fora de ordem; um exemplo que exige `onBeforeRender` com um renderizador ou arquivos de textura externos precisa de outra estratégia. Registre a referência, a adaptação e o resultado em `quality/decisions.md`. Não inicie o servidor de exemplos do Three.js nem importe ferramentas de edição para a aplicação.

### Apoio espacial e ambiente de cena

Inspecione a relação com o chão em perspectiva e nas vistas laterais: edifícios e vegetação devem encontrar o terreno; rua e calçadas devem se apoiar no piso; pneus devem tocar a superfície de circulação; fundações devem encontrar o solo. Corrija a posição do asset ou a geometria de base antes de ajustar a câmera. Para elementos de ambiente que se movem, confira trajetória, velocidade, distância e entrada/saída em relação à fala. Eles podem enriquecer escala e sensação de lugar, mas não devem cobrir o mecanismo, a legenda ou competir com um efeito explicativo.

## Checks e limites

O validador verifica vértices e transformações finitos, dimensões, contagem de malhas e triângulos, sample(t) fora de ordem e indícios explícitos de rede/execução dinâmica. Essa busca estática não é uma sandbox nem uma garantia de segurança de JavaScript arbitrário. Importar somente módulos produzidos/revisados pela LLM, sem dependências desconhecidas.

O catálogo mostra aprovação humana separada da qualidade técnica. Uma aprovação estética não corrige um erro técnico. Uma checagem técnica aprovada não concede aprovação estética.

## Contratos além da geometria

- Objeto/personagem/cenário: `create({variant}) → Object3D`, com sample(t) quando animado.
- Animação/efeito/transição: implementar `apply(context,t,params)` de estado absoluto e uma prévia identificada em create(). O contexto informa os alvos; o runtime deve aplicar o comportamento, não renderizar a peça de demonstração como parte da cena.
- Câmera: `apply({camera,targets},t,params)` altera posição/orientação dentro de limites e preserva o eixo do mecanismo.
- Material: `createMaterial(params)` e prévia geométrica; aplicação por materialId no alvo.
- Iluminação: criação de luzes e sample(t), sem downloads de HDR ou texturas durante render.
- Som: arquivo local ou DSP determinístico, duração e ponto de contato; revisão auditiva humana.
- Overlay: geometria ou HTML com faixa temporal explícita e zona de leitura; não tapar o mecanismo.

### Ênfase sem competição

Inspecione efeitos e setas na composição vertical e na escala de um celular. O efeito deve ser percebido de imediato, apontar para o mecanismo certo e preservar sua silhueta. Ajuste tamanho, contraste, direção e duração para a frase que explica; evite animação persistente ou vários acentos simultâneos. Depois de entender o fluxo, a seta pode sair para devolver o foco à construção. A decisão estética continua com o criador.

Os contratos especializados são implementados quando a narrativa os exigir. Não tratar uma receita de caixas como solução genérica para todos os tipos.
