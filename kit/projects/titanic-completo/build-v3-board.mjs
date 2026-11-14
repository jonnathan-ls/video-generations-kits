import fs from 'node:fs/promises';
import path from 'node:path';

const projectDir = path.dirname(new URL(import.meta.url).pathname);
// Build from the feature-length master; production-v2/project.json is only
// the short diagnostic prefix and silently omitted the other story beats.
const source = JSON.parse(await fs.readFile(path.join(projectDir, 'project.json'), 'utf8'));
const board = JSON.parse(await fs.readFile(path.join(projectDir, 'storyboard-v2.json'), 'utf8'));

const vecAsset = (id, variant, position, instanceId, extra = {}) => ({
  id, variant, position, ...(instanceId ? { instanceId } : {}), ...extra
});
const light = { id: 'iluminacao_cinematica_1912', variant: 'padrao', instanceId: 'maritime-lighting' };
const sea = vecAsset('mar_cinematico', 'night', [0, 0, 0], 'night-atlantic');
const ship = vecAsset('transatlantico_titanic', 'titanic', [0, 0, 0], 'titanic-side');

// Hook grounded in Rostron's account: a green light low on the water was
// initially mistaken for the Titanic; only at close range was it identified
// as a lifeboat. The signal is therefore a compact boat light, not a flare.
const hookBridge = row('shot-001-hook');
hookBridge.assets = [
  sea,
  light,
  vecAsset('ponte_observacao_maritima', 'padrao', [0, 0, 0], 'carpathia-observation-bridge'),
  vecAsset('pessoas_maritimas_1912', 'captain', [-1.1, 0, 1.38], 'rostron-observer'),
  vecAsset('orientacao_observador', 'padrao', [0, 0, 0], 'rostron-look', { target: 'rostron-observer', params: { fromYaw: -0.25, turn: 0.5, start: 0.4, duration: 1.25 } }),
  vecAsset('bote_salvamento_1912', 'occupied', [12, 0.45, 55], 'distant-green-boat'),
  vecAsset('sinalizador_verde', 'padrao', [12, 1.45, 50.8], 'low-green-boat-light', { params: { visibilityScale: 2.0 } })
];
hookBridge.camera = {
  from: [0.35, 1.8, -3.2], to: [0.2, 1.8, -2.4],
  target: [12, 1.75, 55], targetTo: [12, 1.75, 55],
  moveDuration: 1.35, fov: 48
};
hookBridge.motion = [{
  target: 'rostron-observer', property: 'rotation', relative: true, ease: 'smooth',
  keyframes: [
    { time: 0, value: [0, 0, 0] },
    { time: 1.15, value: [0, -0.18, 0] },
    { time: 1.65, value: [0, -0.18, 0] }
  ]
}];
hookBridge.staging = {
  description: 'Ponto de vista da ponte do Carpathia: Rostron encontra uma luz verde baixa no horizonte; um bote permanece quase invisível sob o ponto luminoso.',
  dominantAction: 'A câmera aproxima a luz baixa enquanto o capitão se volta para ela',
  secondaryAction: 'O perfil do Carpathia e o mar iluminado estabelecem a escala sem transformar a luz em um feixe vertical.',
  continuity: 'A direção do olhar conduz ao insert e depois ao rosto; o callback posterior muda para a perspectiva do bote.',
  reconstruction: 'Reencenação ilustrativa do depoimento de Arthur Rostron; posição, gesto e distância visual não pretendem reconstituir medidas exatas.',
  sourceBinding: { paragraph: 1, clause: 1, text: hookBridge.sourceText }
};
hookBridge.visualPlan = {
  ...hookBridge.visualPlan,
  attentionTarget: 'Luz verde baixa sobre a água, com o Carpathia como ponto de vista',
  visibleEvent: 'Uma luz verde compacta aparece no horizonte, quase na linha do mar; a silhueta de um bote só começa a se distinguir.',
  stateBefore: 'O Carpathia navega à noite entre o ponto conhecido do pedido de socorro e a área do Titanic.',
  stateAfter: 'Rostron e a câmera orientam-se para a luz, sem revelar ainda a identidade do bote.',
  cameraReveal: 'Push-in curto de trás do capitão em direção ao horizonte; sem flare, coluna ou trilha descendente.'
};

const hookInsert = row('shot-002-hook');
hookInsert.assets = [
  sea,
  light,
  vecAsset('bote_salvamento_1912', 'occupied', [12, 0.45, 55], 'green-light-source-boat'),
  vecAsset('sinalizador_verde', 'padrao', [12, 1.45, 50.8], 'green-light-source')
];
hookInsert.camera = {
  from: [12.0, 2.55, 39], to: [12.0, 1.95, 43],
  target: [12, 1.35, 50.8], targetTo: [12, 1.35, 50.8],
  moveDuration: 1.0, fov: 39
};
hookInsert.motion = [];
hookInsert.staging = {
  description: 'Insert da luz verde compacta junto à silhueta quase perdida de um bote; o reflexo se quebra em pequenas marcas no mar noturno.',
  dominantAction: 'O ponto verde cresce ligeiramente e para, baixo sobre o horizonte',
  secondaryAction: 'Ondulações e brilho lunar mantêm água e escala legíveis.',
  continuity: 'O corte seguinte retorna ao observador e deixa a pergunta sobre a identidade do bote em aberto.',
  reconstruction: 'A posição e o tamanho são ilustrativos; o depoimento identifica a luz como pertencente a um bote, sem fixar este enquadramento.'
};
hookInsert.visualPlan = {
  ...hookInsert.visualPlan,
  attentionTarget: 'Núcleo verde baixo e o contorno quase invisível do bote',
  visibleEvent: 'A luz está junto ao bote e sobre a superfície, não nasce da água nem desce do céu.',
  stateBefore: 'A luz é vista a distância da ponte do Carpathia.',
  stateAfter: 'Um indício de casco aparece sob o halo compacto.',
  cameraReveal: 'Lente longa mantém o ponto baixo sobre a linha d’água, com aproximação curta e estável.'
};

const hookReaction = row('shot-003-hook');
hookReaction.assets = [
  sea,
  light,
  vecAsset('ponte_observacao_maritima', 'padrao', [0, 0, 0], 'reaction-observation-bridge'),
  vecAsset('pessoas_maritimas_1912', 'captain', [0.78, 0, 1.38], 'rostron-reaction')
];
hookReaction.camera = {
  from: [3.08, 1.94, 2.72], to: [1.78, 1.82, 2.42],
  target: [0.78, 1.56, 1.38], targetTo: [0.8, 1.62, 1.38],
  moveDuration: 1.25, fov: 42
};
hookReaction.motion = [{
  target: 'rostron-reaction', property: 'rotation', relative: true, ease: 'smooth',
  keyframes: [
    { time: 0, value: [0, 0, 0] },
    { time: 0.9, value: [0, -0.27, 0] },
    { time: 1.55, value: [0, -0.27, 0] }
  ]
}];
hookReaction.staging = {
  description: 'Close lateral de Rostron na ponte do Carpathia; o contorno frio da noite recorta o perfil enquanto o olhar permanece no sinal.',
  dominantAction: 'Rostron volta o olhar para a luz fora de quadro',
  secondaryAction: 'O avanço da câmera termina antes de revelar o que emite a luz.',
  continuity: 'Olhar e eixo de câmera apontam para o ponto verde recém-visto.',
  reconstruction: 'Atuação interpretativa baseada no depoimento, sem pretensão de registrar expressão histórica.'
};
hookReaction.visualPlan = {
  ...hookReaction.visualPlan,
  attentionTarget: 'O olhar de Rostron voltado para o ponto verde fora de quadro',
  visibleEvent: 'O capitão percebe a luz e se orienta para ela; a fonte continua sem identificação neste corte.',
  stateBefore: 'A luz acaba de aparecer no horizonte.',
  stateAfter: 'O olhar mantém o rumo enquanto o Carpathia continua a aproximação.',
  cameraReveal: 'Dolly curto para perfil, sem repetir o enquadramento sobre o ombro.'
};

const radio = row('shot-006-radio');
radio.assets = [
  light,
  vecAsset('radio_bordo_1912', 'padrao', [0, 0, 0], 'active-wireless-room'),
  vecAsset('mensagem_bordo_1912', 'papel', [0, 0, 0], 'received-order'),
  vecAsset('equipamentos_resgate_1912', 'headphones', [0, 0, 0], 'receiver-headphones'),
  vecAsset('pessoas_maritimas_1912', 'worker', [0.9, 0, 0.12], 'wireless-operator', { rotation: [0, Math.PI, 0] })
];
radio.camera = {
  // The side wall begins at x=2.5. Staying inside the room reveals the
  // operator, Morse key and table instead of photographing that wall.
  from: [1.78, 2.25, 1.65], to: [1.28, 1.72, 0.72],
  target: [0.58, 1.2, -1.15], targetTo: [0.52, 1.02, -1.38],
  moveDuration: 2.15, fov: 56
};
radio.motion = [{
  target: 'wireless-operator', part: 'right-arm', property: 'rotation', relative: true, ease: 'smooth',
  keyframes: [
    { time: 0, value: [-0.1, 0, 0] },
    { time: 0.55, value: [-0.72, 0, 0.02] },
    { time: 1.0, value: [-0.18, 0, 0.02] },
    { time: 1.45, value: [-0.72, 0, 0.02] },
    { time: 2.1, value: [-0.18, 0, 0.02] },
    { time: 2.95, value: [-0.72, 0, 0.02] }
  ]
}];
radio.staging = {
  description: 'Um operador sentado trabalha a chave Morse; a alavanca pulsa em sequência curta, com receptor, bobina e tira de papel no mesmo eixo.',
  dominantAction: 'O operador transmite e o mecanismo da chave acompanha o ritmo Morse',
  secondaryAction: 'A folha de mensagem e os fones identificam a estação sem inventar texto legível.',
  continuity: 'A câmera entra pelo ombro e termina no contato da mão com a chave, mantendo paredes e teto fechados no quadro.',
  reconstruction: 'Reconstrução ilustrativa de uma estação de rádio de bordo; não atribui operador nem mensagem específicos.',
  sourceBinding: { paragraph: 2, clause: 1, text: radio.sourceText }
};
radio.visualPlan = {
  ...radio.visualPlan,
  attentionTarget: 'Mão do operador e alavanca telegráfica em movimento',
  visibleEvent: 'A mão trabalha a chave Morse; o receptor e o papel situam a ação de comunicação.',
  stateBefore: 'O operador ocupa a estação com os fones ao alcance.',
  stateAfter: 'A chave segue transmitindo enquanto o quadro permanece ancorado na mesa.',
  cameraReveal: 'Travelling do ombro para a alavanca, bobina e papel; nenhum buraco de parede entra no enquadramento.'
};

const lightCallback = row('shot-012-deck');
lightCallback.assets = [
  sea,
  light,
  vecAsset('bote_salvamento_1912', 'occupied', [0, 0.45, 0], 'source-lifeboat'),
  vecAsset('sinalizador_verde', 'padrao', [0, 1.65, 0], 'source-green-light'),
  vecAsset('navio_carpathia', 'carpathia', [34, 0, 170], 'approaching-carpathia')
];
lightCallback.camera = {
  from: [5.2, 2.8, -5.3], to: [5.0, 2.65, -4.8],
  target: [34, 9, 164], targetTo: [34, 9, 164],
  moveDuration: 2.05, fov: 48
};
lightCallback.motion = [{
  target: 'approaching-carpathia', property: 'position', relative: false, ease: 'smooth',
  keyframes: [
    { time: 0, value: [34, 0, 184] },
    { time: 2.45, value: [34, 0, 170] }
  ]
}];
lightCallback.staging = {
  description: 'Novo eixo, agora a partir do bote: o ponto verde está preso à embarcação baixa no primeiro plano e o Carpathia se aproxima em silhueta lateral.',
  dominantAction: 'A luz do bote permanece baixa enquanto o navio de resgate cresce ao fundo',
  secondaryAction: 'A água reflete luz fria quebrada; a forma de casco confirma a origem sem repetir a ponte do gancho.',
  continuity: 'A câmera parte da borda do bote e aponta para o Carpathia; o próximo corte muda ao costado do Titanic e ao impacto.',
  reconstruction: 'Composição ilustrativa baseada na identificação posterior da luz como sendo de um bote; distância e ângulo são aproximados.',
  sourceBinding: { paragraph: 4, clause: 2, text: lightCallback.sourceText }
};
lightCallback.visualPlan = {
  ...lightCallback.visualPlan,
  attentionTarget: 'A luz verde no bote e o Carpathia reconhecível ao fundo',
  visibleEvent: 'A câmera confirma a fonte baixa no bote e distingue o navio de resgate por sua silhueta lateral e única chaminé.',
  stateBefore: 'A origem da luz permanece incerta para quem a observa de longe.',
  stateAfter: 'O bote é legível em primeiro plano e o Carpathia se aproxima em direção a ele.',
  cameraReveal: 'Perspectiva baixa a partir do bote, com travelling curto; não volta ao plano da ponte.'
};

function row(id) {
  const result = board.scenes.find((scene) => scene.id === id);
  if (!result) throw new Error(`Beat ausente: ${id}`);
  return structuredClone(result);
}
function authoredScene(base, updates) {
  return {
    ...base,
    ...updates,
    implementation: 'requires-assets',
    qaStatus: 'not-rendered-not-reviewed',
    construction: {
      status: 'layout-authored-not-rendered',
      reason: 'Nova composição física para revisão visual em movimento; preservar o sentido da fala.',
      pending: []
    }
  };
}

const people = row('shot-008-deck');
people.assets = [
  light,
  vecAsset('corredor_bordo_1912', 'padrao', [0, 0, 0], 'passenger-passage'),
  vecAsset('pessoas_maritimas_1912', 'passengers', [0, 0, -1.2], 'varied-passenger-group'),
  vecAsset('pessoas_maritimas_1912', 'steward', [0.82, 0, -3.35], 'foreground-steward'),
  vecAsset('pessoas_maritimas_1912', 'worker', [-0.78, 0, -0.55], 'foreground-worker'),
  vecAsset('pertences_bordo_1912', 'mala', [-0.38, 0, -0.55], 'travel-case')
];
// The legacy beat targeted internal captain/head nodes that do not exist in
// the reusable crowd asset. Animate two named figures in the new group instead.
people.motion = [
  {
    target: 'varied-passenger-group', part: 'passenger-01', property: 'rotation',
    relative: true,
    keyframes: [
      { time: 0, value: [0, 0, 0] },
      { time: 1.05, value: [0, -0.12, 0] },
      { time: 2.9, value: [0, -0.12, 0] }
    ]
  },
  {
    target: 'varied-passenger-group', part: 'passenger-06', property: 'rotation',
    relative: true,
    keyframes: [
      { time: 0, value: [0, 0, 0] },
      { time: 1.3, value: [0, 0.15, 0] },
      { time: 3, value: [0, 0.15, 0] }
    ]
  }
];
people.staging = {
  description: 'Um grupo variado ocupa o corredor em camadas; um funcionário abre passagem e uma mala atravessa o primeiro plano.',
  dominantAction: 'Passageiros diferentes avançam em ritmos e direções discretamente distintos',
  secondaryAction: 'O funcionário se posiciona junto à passagem enquanto a mala passa perto da câmera',
  continuity: 'Corte motivado pelo próximo acontecimento; manter o corredor como eixo espacial.',
  reconstruction: 'Figurantes ilustrativos, sem falas, identidades ou destinos inventados.',
  sourceBinding: { paragraph: 3, clause: 1, text: people.sourceText }
};
people.visualPlan = {
  ...people.visualPlan,
  attentionTarget: 'A escala humana dentro do navio',
  visibleEvent: 'Um grupo de passageiros com silhuetas e roupas distintas ocupa a passagem; a profundidade sugere uma população maior sem virar contagem literal.',
  stateBefore: 'O corredor está livre e a câmera encontra a primeira camada de pessoas.',
  stateAfter: 'A passagem permanece ocupada em diferentes profundidades; funcionários e bagagem dão escala ao movimento.',
  cameraReveal: 'Avanço pelo corredor, passando de um funcionário próximo ao grupo em profundidade.',
  soundIntent: 'Passos de couro e tecido, mala sobre madeira; sem falas inventadas.'
};

const capacity = row('shot-009-lifeboat');
capacity.assets = [
  sea,
  light,
  ship,
  vecAsset('bote_salvamento_1912', 'occupied', [15, 18.6, -9], 'capacity-boat'),
  vecAsset('pessoas_maritimas_1912', 'passengers', [12.55, 17.05, -13], 'waiting-passengers'),
  vecAsset('pessoas_maritimas_1912', 'steward', [12.35, 17.05, -5.3], 'deck-steward'),
  vecAsset('pessoas_maritimas_1912', 'worker', [12.42, 17.05, -3.3], 'deck-worker')
];
capacity.motion = [];
capacity.camera = {
  from: [25, 22, -1], to: [23, 20.6, -3],
  target: [15, 18.2, -9], targetTo: [15.4, 18.5, -9],
  moveDuration: 2.1, fov: 52
};
capacity.staging = {
  description: 'Plano lateral do convés: quatro lugares ocupados no bote e um grupo permanece na área de embarque, junto aos turcos.',
  dominantAction: 'O bote aberto revela assentos ocupados e bancos ainda livres',
  secondaryAction: 'Passageiros aguardam no convés ao lado dos turcos',
  continuity: 'Manter casco, turcos, bote e pessoas no mesmo eixo para que a distância e a capacidade possam ser lidas.',
  reconstruction: 'Reconstrução ilustrativa da situação; não representa indivíduos ou um bote específico.',
  sourceBinding: { paragraph: 3, clause: 2, text: capacity.sourceText }
};
capacity.visualPlan = {
  ...capacity.visualPlan,
  attentionTarget: 'O contraste entre assentos e pessoas aguardando',
  visibleEvent: 'Quatro passageiros ocupam bancos distintos no bote; outras pessoas aguardam no convés junto ao mesmo ponto de descida.',
  stateBefore: 'A câmera estabelece o costado, os turcos e o bote acima da água.',
  stateAfter: 'Lugares ocupados e passageiros ainda no convés permanecem legíveis no mesmo quadro.',
  cameraReveal: 'Aproximação em diagonal que começa no costado e termina sobre os bancos e a fila.',
  soundIntent: 'Madeira, passos no convés e cabo sob tensão; breve queda de ambiência ao revelar os assentos.'
};

const launch = row('shot-010-lifeboat');
launch.assets = [
  sea,
  light,
  ship,
  vecAsset('capacidade_botes_1912', 'empty-spaces', [15, 18.6, -9], 'launch-boat')
];
launch.camera = {
  from: [24, 24, -2], to: [24, 8, 8],
  target: [15, 17.8, -9], targetTo: [18.4, 1.4, 2],
  moveDuration: 3.65, fov: 52
};
launch.motion = [{
  target: 'launch-boat', property: 'position', relative: false, ease: 'linear',
  keyframes: [
    { time: 0, value: [15, 18.6, -9] },
    { time: 0.7, value: [15, 16.8, -8.8] },
    { time: 2.35, value: [15.2, 6.4, -6.8] },
    { time: 3.35, value: [16.8, 0.65, -2.0] },
    { time: 3.9, value: [18.7, 0.65, 2.0] }
  ]
}];
launch.staging = {
  description: 'A câmera desce junto ao bote: os cabos aliviam, o casco atravessa o nível do convés e termina apoiado na água, ainda próximo ao Titanic.',
  dominantAction: 'O bote desce dos turcos até tocar a água',
  secondaryAction: 'Os bancos vazios continuam visíveis durante a descida',
  continuity: 'A mesma composição conecta convés, cordas, costado e superfície do mar; não saltar a posição do bote.',
  reconstruction: 'Ação ilustrativa; quantidade e ocupação do bote não são apresentadas como reconstituição de uma embarcação identificada.',
  sourceBinding: { paragraph: 3, clause: 3, text: launch.sourceText }
};
launch.visualPlan = {
  ...launch.visualPlan,
  attentionTarget: 'Os assentos vazios durante a descida',
  visibleEvent: 'Um bote com quatro ocupantes desce dos turcos; bancos desocupados continuam visíveis enquanto o casco alcança o mar.',
  stateBefore: 'O bote está suspenso ao lado do costado e os cabos estão tensionados.',
  stateAfter: 'O bote flutua afastado alguns metros, com assentos vazios ainda no enquadramento.',
  cameraReveal: 'A câmera acompanha a descida em travelling vertical e abre um pouco quando o casco encontra a água.',
  soundIntent: 'Cabo correndo, madeira rangendo e água tocando o casco; sem acento musical genérico.'
};

const originalImpact = row('shot-013-impact');
const impactDuration = 2.35;
const rescueDuration = originalImpact.duration - impactDuration;
const impact = authoredScene(originalImpact, {
  id: 'shot-013-impact', start: originalImpact.start, duration: impactDuration,
  assets: [sea, light, ship, vecAsset('gelo_maritimo', 'iceberg', [19, -0.1, 96], 'iceberg-contact', { scale: [0.42, 0.78, 0.58] })],
  camera: {
    from: [57, 18, 122], to: [53, 15, 118],
    target: [17, 4, 96], targetTo: [17, 3.5, 96],
    moveDuration: 2.15, fov: 48
  },
  motion: [],
  staging: {
    description: 'Detalhe amplo do costado na linha d’água; a massa do iceberg encosta no casco sem sugerir um desenho exato do bloco histórico.',
    dominantAction: 'A câmera revela o volume de gelo junto à faixa de casco e à água',
    secondaryAction: 'Luz fria percorre o relevo do aço e as facetas do gelo',
    continuity: 'Manter a linha d’água, a superfície do mar e o costado em contato no mesmo plano.',
    reconstruction: 'Visualização ilustrativa do choque; formato do iceberg e padrão exato de dano não são afirmados.',
    sourceBinding: { paragraph: 5, clause: 1, text: originalImpact.sourceText }
  },
  visualPlan: {
    ...originalImpact.visualPlan,
    beatId: 'titanic-v3:impacte-no-costado',
    attentionTarget: 'O contato entre iceberg e costado',
    visibleEvent: 'O gelo alcança a linha d’água do Titanic e encosta no casco em escala de navio.',
    stateBefore: 'Noite marítima calma; o navio cruza o campo visual sem o gelo em primeiro plano.',
    stateAfter: 'O iceberg ocupa o bordo do quadro e revela o contato com o casco e o mar.',
    cameraReveal: 'Travelling curto ao longo do casco, terminando na massa de gelo junto à água.',
    readPause: { start: 1.88, duration: 0.26 }
  }
});

const rescue = authoredScene(originalImpact, {
  id: 'shot-013-rescue-arrival', start: originalImpact.start + impactDuration, duration: rescueDuration,
  assets: [
    sea,
    light,
    vecAsset('navio_carpathia', 'carpathia', [0, 0, 0], 'carpathia-receiving'),
    vecAsset('bote_salvamento_1912', 'occupied', [21.5, 0.65, -4], 'rescue-boat'),
    vecAsset('pessoas_maritimas_1912', 'steward', [9.8, 5.6, -4], 'rescue-crew'),
    // The archive image enters with “à chegada do resgate”, remains readable
    // through the consequence beat, and exits before the next chapter cut.
    vecAsset('inset_fotografico_historico', 'rescue-archive', [0, 0, 0], 'rescue-archive-photo', { params: { enterAt: 1.46, exitAt: 3.6 } })
  ],
  camera: {
    from: [80, 24, -80], to: [22, 9, -14],
    target: [11, 5.3, -4], targetTo: [10.8, 0.8, -4],
    moveDuration: 1.65, fov: 54
  },
  motion: [{
    target: 'rescue-boat', property: 'position', relative: false, ease: 'smooth',
    keyframes: [
      { time: 0, value: [21.5, 0.65, -4] },
      { time: 2.6, value: [11.4, 0.65, -4] },
      { time: 3.55, value: [10.9, 0.65, -4] }
    ]
  }],
  staging: {
    description: 'O bote ocupado aproxima-se da escada iluminada do Carpathia. Quando a fala chega ao resgate, um registro fotográfico de 1912 entra como cartão de arquivo e sai antes do título de capítulo; a reconstrução 3D continua visível como cena principal.',
    dominantAction: 'O bote alcança o costado do Carpathia',
    secondaryAction: 'A câmera acompanha o contato lateral; um insert documental identificado entra e se estabiliza junto à frase sobre a chegada do resgate',
    continuity: 'O mar permanece sob o bote; a escala do Carpathia substitui o detalhe do iceberg sem retornar ao mesmo enquadramento.',
    reconstruction: 'Reconstrução ilustrativa de chegada ao navio de resgate, sem atribuir identidade ou gesto testemunhal a figurantes. A fotografia mostra sobreviventes a caminho do Carpathia, não este enquadramento reconstruído.',
    sourceBinding: { paragraph: 5, clause: 1, text: originalImpact.sourceText }
  },
  visualPlan: {
    ...originalImpact.visualPlan,
    beatId: 'titanic-v3:chegada-carpathia',
    attentionTarget: 'O bote aproxima-se do navio de resgate',
    visibleEvent: 'Um bote aproxima-se da escada do Carpathia enquanto um registro fotográfico de sobreviventes de 1912 entra como inset creditado; a cena 3D segue visível e em movimento.',
    stateBefore: 'O navio de resgate está ao fundo e o bote ainda se encontra afastado.',
    stateAfter: 'O bote alcança a lateral iluminada do Carpathia; a aproximação fica concluída.',
    cameraReveal: 'Dolly lateral baixo que mantém bote e escada legíveis; no trecho “à chegada do resgate”, o cartão fotográfico entra no alto do quadro, faz um push-in discreto e sai antes do corte.',
    readPause: { start: rescueDuration - 0.62, duration: 0.42 }
  }
});

// A distant side view establishes the Carpathia's scale; the following cut
// isolates its single funnel and bridge so the name does not sit over another
// nearly identical broadside. Both shots remain tied to the narrated hook.
const carpathiaApproach = authoredScene(row('shot-004-hook'), {
  assets: [
    sea,
    light,
    vecAsset('navio_carpathia', 'carpathia', [0, 0, 0], 'carpathia-wide'),
    { id: 'vapor_bordo_1912', variant: 'padrao', target: 'carpathia-wide', params: { position: [0, 30.8, -3.4] } }
  ],
  camera: {
    from: [148, 36, 10], to: [138, 32, 14],
    target: [0, 13, 0], targetTo: [0, 12, 0],
    moveDuration: 3.5, fov: 49
  },
  motion: [{
    target: 'carpathia-wide', property: 'position', relative: false, ease: 'smooth',
    keyframes: [{ time: 0, value: [0, 0, 0] }, { time: 3.7, value: [0, 0, 7] }]
  }],
  staging: {
    description: 'Plano lateral aberto do Carpathia atravessando o Atlântico noturno, com uma única chaminé e vapor acompanhando o avanço.',
    dominantAction: 'O Carpathia corta o mar em direção ao sinal distante',
    secondaryAction: 'A lua recorta o casco e a nuvem de vapor sobe da chaminé',
    continuity: 'O plano aberto prepara o corte de identificação para a ponte e a chaminé, sem repetir o close do costado.',
    reconstruction: 'Embarcação ilustrativa; escala e enquadramento não são uma reconstrução arqueológica.'
  },
  visualPlan: {
    ...row('shot-004-hook').visualPlan,
    attentionTarget: 'Silhueta completa do Carpathia avançando no mar noturno',
    visibleEvent: 'O navio de resgate atravessa a água em perfil inteiro; sua única chaminé e o vapor dão escala.',
    stateBefore: 'Uma luz verde baixa foi percebida no horizonte.',
    stateAfter: 'O Carpathia segue em direção ao sinal, ainda sem alcançar a embarcação que o emite.',
    cameraReveal: 'Dolly lateral de plano aberto para manter casco, convés, chaminé e água no mesmo quadro.'
  }
});

const carpathiaName = authoredScene(row('shot-005-rescue'), {
  assets: [sea, light, vecAsset('navio_carpathia', 'carpathia', [0, 0, 0], 'carpathia-name-reveal')],
  camera: {
    from: [38, 31, 24], to: [31, 28, 17],
    target: [0, 25, -3.4], targetTo: [0, 25, -3.4],
    moveDuration: 2.0, fov: 48
  },
  motion: [],
  staging: {
    description: 'O corte sai do perfil completo e aproxima a ponte e a única chaminé do Carpathia, enquanto a água e o céu permanecem visíveis.',
    dominantAction: 'A câmera identifica a chaminé única e a ponte do navio',
    secondaryAction: 'Luzes práticas quentes separam a estrutura do céu frio',
    continuity: 'Mudança de escala e eixo em relação ao perfil aberto; em seguida, corta para o operador de rádio.',
    reconstruction: 'Detalhe ilustrativo da embarcação, não registro de configuração exata.'
  },
  visualPlan: {
    ...row('shot-005-rescue').visualPlan,
    attentionTarget: 'Ponte e chaminé única do Carpathia',
    visibleEvent: 'O nome Carpathia acompanha a identificação visual do navio por sua ponte e única chaminé.',
    stateBefore: 'O plano aberto estabeleceu o navio no mar.',
    stateAfter: 'O Carpathia foi identificado antes do corte para o pedido de socorro.',
    cameraReveal: 'Push-in curto ao alto do navio, sem repetir o enquadramento lateral amplo.'
  }
});

// Keep the question about delayed help grounded in a working wireless room:
// map and chronometer sit on the existing desk instead of floating on black.
const rescueQuestion = authoredScene(row('shot-011-deck'), {
  assets: [
    vecAsset('radio_bordo_1912', 'padrao', [0, 0, 0], 'rescue-question-wireless-room'),
    vecAsset('mesa_navegacao_1912', 'route-chart', [-0.08, 0.13, -1.8], 'rescue-question-chart', { scale: 0.78, params: { table: false } }),
    vecAsset('mesa_navegacao_1912', 'chronometer', [1.12, 0.275, -1.8], 'rescue-question-clock', { scale: 0.62, params: { table: false, hour: 11, minute: 40 } })
  ],
  camera: {
    from: [1.55, 2.3, 0.55], to: [1.2, 1.82, 0.2],
    target: [-0.12, 0.95, -1.72], targetTo: [-0.18, 0.95, -1.8],
    moveDuration: 2.0, fov: 52
  },
  motion: [],
  staging: {
    description: 'Carta e cronômetro ocupam a mesa da estação de rádio; a pergunta sobre a demora ganha distância, tempo e um espaço de trabalho visível.',
    dominantAction: 'A câmera aproxima o percurso marcado e o cronômetro',
    secondaryAction: 'A estação fechada e a luz de mesa preservam contexto sem um fundo vazio.',
    continuity: 'Mesmo espaço da transmissão anterior, mas em detalhe de rota e tempo; o corte volta ao horizonte na pergunta seguinte.',
    reconstruction: 'Carta esquemática ilustrativa, sem copiar mapa histórico nem afirmar um trajeto preciso.'
  },
  visualPlan: {
    ...row('shot-011-deck').visualPlan,
    attentionTarget: 'Rota do Atlântico e cronômetro na mesa de bordo',
    visibleEvent: 'A mesa de navegação coloca distância e tempo ao lado da pergunta sobre a chegada da ajuda.',
    stateBefore: 'O pedido de socorro já está em transmissão.',
    stateAfter: 'A distância entre navios torna-se o novo problema narrativo.',
    cameraReveal: 'Travelling descendente até a carta e o cronômetro, dentro de uma sala completa e iluminada.'
  }
});

// The chapter card now rides over an actual Southampton quay composition:
// daytime water, dock, ship and people replace the isolated chart on black.
const departure = authoredScene(row('shot-014-port'), {
  assets: [
    vecAsset('porto_maritimo_1912', 'padrao', [0, 0, 0], 'southampton-quay'),
    vecAsset('mar_cinematico', 'day', [0, 0, 0], 'departure-water'),
    vecAsset('transatlantico_titanic', 'titanic', [0, 0, 0], 'titanic-departure'),
    vecAsset('pessoas_maritimas_1912', 'passengers', [-58, 4.2, 72], 'quayside-passengers'),
    { id: 'vapor_bordo_1912', variant: 'padrao', target: 'titanic-departure', params: { position: [0, 31, 63] } },
    { id: 'vapor_bordo_1912', variant: 'padrao', target: 'titanic-departure', params: { position: [0, 31, 20] } },
    { id: 'vapor_bordo_1912', variant: 'padrao', target: 'titanic-departure', params: { position: [0, 31, -22] } }
  ],
  camera: {
    from: [-40, 23, 125], to: [-40, 21, 110],
    target: [0, 16, 0], targetTo: [0, 16, -8],
    moveDuration: 3.8, fov: 54
  },
  motion: [{
    target: 'titanic-departure', property: 'position', relative: false, ease: 'smooth',
    keyframes: [{ time: 0, value: [0, 0, 0] }, { time: 3.8, value: [3.2, 0, 0] }]
  }],
  staging: {
    description: 'Plano de capítulo na partida: câmera do lado do canal olha para o Titanic em perfil, com o cais de tijolo e guindastes atrás do casco; água diurna e escala humana permanecem legíveis.',
    dominantAction: 'O transatlântico inicia a saída do cais',
    secondaryAction: 'Fumaça leve sobe das chaminés; passageiros e armazéns situam o porto sem alegar uma planta exata.',
    continuity: 'O título repousa sobre a cena de partida; o próximo corte pode passar para objetos e detalhes da viagem.',
    reconstruction: 'Cais e enquadramento são ilustrativos, não uma reconstituição arqueológica de Southampton.'
  },
  visualPlan: {
    ...row('shot-014-port').visualPlan,
    attentionTarget: 'Titanic deixando o cais em abril de 1912',
    visibleEvent: 'O navio começa a afastar-se do cais diante do porto, com água, docas e pessoas visíveis.',
    stateBefore: 'A introdução noturna e a promessa do resgate terminam.',
    stateAfter: 'A narrativa volta ao início da viagem em um ambiente diurno reconhecível.',
    cameraReveal: 'Plano aberto do lado do canal, com navio e água dominantes; o cais e os guindastes aparecem atrás da linha do casco sob o título de capítulo.'
  }
});

const authoredRows = new Map([
  ['shot-008-deck', people],
  ['shot-001-hook', hookBridge],
  ['shot-002-hook', hookInsert],
  ['shot-003-hook', hookReaction],
  ['shot-004-hook', carpathiaApproach],
  ['shot-005-rescue', carpathiaName],
  ['shot-006-radio', radio],
  ['shot-012-deck', lightCallback],
  ['shot-009-lifeboat', capacity],
  ['shot-010-lifeboat', launch],
  ['shot-011-deck', rescueQuestion],
  ['shot-014-port', departure],
  ['shot-013-impact', null]
]);
board.scenes = board.scenes.flatMap((scene) => {
  if (!authoredRows.has(scene.id)) return [scene];
  if (scene.id === 'shot-013-impact') return [impact, rescue];
  return [authoredRows.get(scene.id)];
});
board.revision = 'titanic-v3-reference-led-quality';
board.updatedAt = new Date().toISOString();
board.summary = 'Ajustes reference-first em navio, iceberg, pessoas, bote e montagem contextual; diagnóstico visual curto para revisão humana.';

const sourceScene = source.scenes.find((scene) => scene.id === 'shot-013-impact');
const sourceImpact = { ...structuredClone(sourceScene), id: impact.id, start: impact.start, duration: impact.duration };
const sourceRescue = { ...structuredClone(sourceScene), id: rescue.id, start: rescue.start, duration: rescue.duration };
const sourceScenes = source.scenes.filter((scene) => scene.id !== 'shot-013-impact');
const sourceInsertAt = sourceScenes.findIndex((scene) => scene.id === 'shot-014-port');
sourceScenes.splice(sourceInsertAt, 0, sourceImpact, sourceRescue);
source.scenes = sourceScenes;

const outDir = path.join(projectDir, 'production-v3');
await fs.mkdir(outDir, { recursive: true });
for (const font of source.fonts || []) font.source = path.relative(outDir, path.resolve(projectDir, font.source));
if (source.audio?.voice) source.audio.voice = path.relative(outDir, path.resolve(projectDir, source.audio.voice));
await fs.writeFile(path.join(projectDir, 'storyboard-v3.json'), JSON.stringify(board, null, 2) + '\n');
await fs.writeFile(path.join(outDir, 'source-project.json'), JSON.stringify(source, null, 2) + '\n');
console.log(JSON.stringify({
  board: 'storyboard-v3.json',
  source: 'production-v3/source-project.json',
  scenes: { capacity: 'shot-009-lifeboat', launch: 'shot-010-lifeboat', impact: impact.id, rescue: rescue.id },
  prefixDuration: departure.start + departure.duration
}, null, 2));
