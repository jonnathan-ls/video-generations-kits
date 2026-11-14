# Referências consultadas — storyboard middle (52–173)

2026-11-08. Escopo: encenação explícita do choque, inundação, evacuação e comunicações, usando apenas recursos registrados.

- `js-3d-library/examples/jsm/objects/Water.js`: superfície contínua e refletiva, normal e luz coerentes. Limite: água plana de WebGL não resolve alagamento volumétrico. Adaptação: reusar `mar_cinematico` para todo exterior, e `passagem_estanque_1912` para água confinada; nunca colocar um quarto sobre a superfície oceânica.
- `js-3d-library/examples/jsm/objects/Sky.js`: domo contínuo além do enquadramento e direção de luz consistente. Limite: modelo analítico diurno, não é evidência histórica da lua em 14/15 abril de 1912. Adaptação: céu noturno estilizado do oceano é ambiente ilustrativo, não fotografia nem alegação de luar real (na noite da colisão não havia luar útil); luz de preenchimento deve manter leitura sem atribuí-la a uma lua documental.
- `kit/assets/period-radio-room.js`, `period-corridor.js`, `period-quarters.js`, `period-engine-room.js`: dimensões, teto e paredes completos. Câmeras ficam dentro de x±2.5/y<3.5 na rádio, x±2/y<3.5 no corredor, x±3/y<3.5 no alojamento, x±5/y<4.2 nas máquinas. Limite: sets ilustrativos, não reconstrução métrica de cômodos ou navios nomeados.
- `kit/assets/period-board-actions.js`: rig com mão-alvo e ações walk, operate, rest, receive, write, carry. A ação é determinística por tempo; o alvo de mão deve existir fisicamente e coincidir com o objeto.
- `kit/engine/shot-motion.js`: keyframes determinísticos e objetos com instanceId reais. Usar deslocamentos/rotações de peças concretas, não descrições de ação sem implementação.
- `kit/assets/period-watertight-passage.js`: corredor integral, porta vertical e água próxima/distante. Limite: spill é uma demonstração genérica de progressão, não trajetória exata da inundação Titanic. Toda tomada desse mecanismo é reconstrução ilustrativa.

Baselines: os recursos marítimos aprovados parcialmente pelo criador na prévia do bloco 01 informam estilo; isto não transfere aprovação a estas 122 novas composições. Nenhuma aprovação estética foi criada.

Lacunas que não devem ser ocultadas: não há foguete branco registrado (o sinalizador verde pertence aos botes); não há modelo identificado de Californian; jornais/mapas genéricos não são fac-símiles dos inquéritos de 1912/1992. Evitar fabricar documentos, nomear genericamente a reconstrução e sinalizar esses limites ao integrador. Inspeção em movimento ainda obrigatória após integração.

## Correção física do transbordamento (mesmo ciclo)

Consulta anterior à alteração: `js-3d-library/examples/jsm/objects/Water.js` (superfície refletiva sem volume implícito) e `kit/assets/period-watertight-passage.js` (superfícies/volumes, parede e soleira reais). O shader Water não decide onde a parede termina; essa condição deve estar na geometria. Adaptação: abertura superior visível e delimitada acima da contenção transversal, soleira superior de transbordamento e lâmina contínua que só se revela quando o nível excede a cota geométrica. A face de queda fica do lado próximo da parede; ela não representa água atravessando aço. As bordas dos volumes de cada lado chegam à parede para não existir salto entre reservatório e lâmina. Limite histórico: corte didático de passagem/compartimentos genéricos, sem alegar planta, cota ou cronologia arqueológica do Titanic. Os cômodos permanecem completos, com paredes laterais e teto contínuos.

## Novos recursos de resgate — consulta antes da implementação

- `js-3d-library/examples/jsm/geometries/ParametricGeometry.js`: superfícies definidas por posições e derivadas contínuas, com UVs/normais calculáveis. Adaptação: fundo arqueado da embarcação dobrável invertida e superfícies de lã que envolvem tronco/ombros. Limite: geometria paramétrica não prova fidelidade arqueológica ou resolve colisões de tecido automaticamente.
- `js-3d-library/examples/physics_ammo_cloth.html`: malha subdividida e contatos fixos antes da simulação de gravidade. Adaptação: pregas pré-compostas com pontos de apoio explícitos nos ombros, mantendo seek determinístico. Não importar Ammo, timers ou uma simulação instável para a engine.
- `kit/assets/period-person-rig.js`: origem nos pés; quadril y0.87, ombro aproximadamente y1.40, pescoço y1.475; seated mantém quadril/ombros locais e projeta joelhos até z0.40. Adaptação: roupa e personagem compartilham origem/escala/yaw; topologia da roupa inclui gola vazada, ombros, costas e frente com sobreposição. `seated` aumenta a projeção sobre colo/joelhos em vez de desenhar um retângulo no ar.
- `kit/assets/period-lifeboat.js`: escora, materiais e silhueta são referências de craft, não geometria a virar. O dobrável B invertido será módulo distinto, sem passageiros embutidos, bancos/gunwales de bote rígido ou boias infláveis modernas. Madeira de fundo exposta, lona colapsada na água e pontos de apoio sobre o fundo. Escala e estrutura explicitamente ilustrativas.

Backlog novo mantido em `production-v3/rescue-resource-definitions.json` para o integrador registrar antes de incluir no catálogo. Sem aprovação estética automática.

## Gesto de envolver com casaco — consulta anterior ao refinamento

`kit/engine/shot-motion.js` (`sampleKeyframes`, progressão suave determinística) e `kit/assets/period-rescue-cloth.js` (ombros/gola ancorados ao rig) foram consultados antes de adicionar `wrapAt`/`wrapDuration`. Princípio: mover apenas os painéis livres da frente ao redor de um eixo anatômico; preservar gola, ombros e costas como apoio. A preparação mantém a abertura legível; mãos se aproximam antes de o pano fechar; a pausa final é estado estável. Limite: tecido pré-composto, sem simulação universal de colisão. O gesto não transporta o casaco no espaço nem deve ser acionado com grandes rotações simultâneas do tronco.

Refinamento implementado em `period-rescue-cloth.js`: `coat` com `wrapAt` explícito e `wrapDuration`1.6–3s. Sem `wrapAt` permanece a composição anterior. Painéis giram sobre uma seção exterior ao tronco apenas abaixo dos apoios; gola/ombros/costas não são transladados. Bordas acompanham o pano. Preparação18%, mãos18–38%, fechamento32–78%, pausa78–100% e estado final persistente. `userData.wrap.handAnchorsAt(t)` permite sincronizar as mãos do outro personagem com as bordas; as coordenadas são locais ao receptor, não ao personagem que oferece o casaco.

Inspeção: vistas3/4 abertas/fechadas em Chrome (`/tmp/titanic-wrap-open.png`, `/tmp/titanic-wrap-closed.png`). Sem passagem pelo tronco percebida nessas vistas; fechamento evidente. Checagem de vertices finitos e amostragem0/.45/1.15/2.2/0/2.2 determinística. Vértice de ombro permaneceu idêntico. Esta inspeção do recurso não aprova a encenação a duas pessoas: mãos, pele, escala e contatos ainda precisam ser vistos na cena226.
