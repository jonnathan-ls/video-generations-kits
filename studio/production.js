const API = '/api/production/titanic-completo';
const REFRESH_MS = 20_000;
const $ = (selector, root = document) => root.querySelector(selector);
const knownLabels = {
  queued: 'Na fila', pending: 'Aguardando', waiting: 'Aguardando', not_started: 'Não iniciada',
  building: 'Em produção', rendering: 'Renderizando', in_progress: 'Em produção', running: 'Em produção',
  rendered: 'Render gerado', complete: 'Render concluído', completed: 'Render concluído', ready: 'Disponível',
  review: 'Aguardando revisão', needs_review: 'Aguardando revisão', approved: 'Aprovação informada',
  blocked: 'Pausado', failed: 'Falha', error: 'Falha'
};
let refreshing = false;
let hasData = false;
let previewWindow = null;

function humanize(value, fallback = 'Estado não informado') {
  if (value == null || value === '') return fallback;
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  return knownLabels[key] || String(value).replace(/[_-]+/g, ' ').replace(/^\p{L}/u, x => x.toLocaleUpperCase('pt-BR'));
}

function formatTime(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return 'Tempo não informado';
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDuration(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return 'duração não informada';
  if (seconds < 60) return `${seconds.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return remainder ? `${minutes} min ${String(remainder).padStart(2, '0')} s` : `${minutes} min`;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function stateClass(status) {
  const value = String(status || '').toLowerCase();
  if (/rendering|building|in_progress|running|produção|produ|em construção/.test(value)) return 'working';
  if (/rendered|complete|done|approved|ready|conclu|aprov/.test(value)) return 'done';
  if (/failed|error|blocked|falha|paus/.test(value)) return 'problem';
  return 'waiting';
}

function safePreviewUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw, location.origin);
    const local = url.origin === location.origin || ['127.0.0.1', 'localhost', '::1'].includes(url.hostname);
    if (!local || !['http:', 'https:'].includes(url.protocol)) return null;
    return url.href;
  } catch { return null; }
}

function progressValues(progress = {}) {
  const complete = Number(progress.completed);
  const total = Number(progress.total);
  const hasCounts = Number.isFinite(complete) && Number.isFinite(total) && total > 0;
  const reportedPercent = progress.percent == null || progress.percent === '' ? NaN : Number(progress.percent);
  const percent = Number.isFinite(reportedPercent)
    ? Math.max(0, Math.min(100, reportedPercent))
    : hasCounts ? Math.max(0, Math.min(100, (complete / total) * 100)) : null;
  return { complete, total, hasCounts, percent };
}

function renderSummary(data) {
  const project = data.project || {};
  const progress = data.progress || {};
  const currentStep = data.currentStep;
  $('#project-title').textContent = project.title || 'Titanic';
  $('#project-status').textContent = humanize(project.status, 'Estado não informado');
  $('#project-state-dot').className = `state-light ${stateClass(project.status)}`;

  const values = progressValues(progress);
  $('#progress-percent').textContent = values.percent == null ? '—' : `${Math.round(values.percent)}%`;
  $('#progress-count').textContent = values.hasCounts
    ? `${values.complete.toLocaleString('pt-BR')} de ${values.total.toLocaleString('pt-BR')} cenas com prévia ou render`
    : 'Contagem ainda não informada';
  $('#progress-label').textContent = progress.label || 'Sem etapa de progresso informada';
  $('#progress-note').textContent = values.percent == null
    ? 'A produção ainda não forneceu uma medição de avanço.'
    : 'Prévia 3D e vídeo renderizado são etapas distintas; nenhuma prévia representa aprovação de qualidade.';
  $('#progress-fill').style.width = `${values.percent ?? 0}%`;
  const bar = $('#progress-bar');
  if (values.percent == null) bar.removeAttribute('aria-valuenow');
  else bar.setAttribute('aria-valuenow', String(Math.round(values.percent)));

  const stepText = typeof currentStep === 'string' ? currentStep : currentStep?.label || currentStep?.title;
  $('#current-step').textContent = stepText || 'Etapa não informada';
  const scope = project.previewScope;
  $('#preview-scope').textContent = scope?.label || (Number.isFinite(Number(scope?.duration)) ? `Janela de ${formatDuration(scope.duration)}` : 'Escopo não informado');
  const updatedAt = project.updatedAt;
  $('#last-updated').textContent = updatedAt ? `Produção atualizada ${new Date(updatedAt).toLocaleString('pt-BR')}` : `Consultado ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  $('#connection-label').textContent = 'Produção conectada';
  $('#connection-label').parentElement.classList.add('connected');
}

function renderQueue(queue) {
  const list = $('#queue-list');
  list.replaceChildren();
  if (!Array.isArray(queue)) {
    list.append(element('div', 'empty-state', 'Fila ainda não informada pela API.'));
    $('#queue-count').textContent = '—';
    return;
  }
  $('#queue-count').textContent = String(queue.length);
  if (queue.length === 0) {
    list.append(element('div', 'empty-state', 'A fila está vazia neste momento.'));
    return;
  }
  for (const [index, item] of queue.entries()) {
    const row = element('article', 'queue-item');
    const dot = element('span', `status-dot ${stateClass(item.status)}`);
    dot.setAttribute('aria-hidden', 'true');
    const copy = element('div', 'queue-copy');
    copy.append(element('strong', '', item.label || item.title || `Item ${index + 1}`));
    if (item.detail) copy.append(element('span', 'subtle', item.detail));
    row.append(dot, copy, element('span', `state-pill ${stateClass(item.status)}`, humanize(item.status)));
    list.append(row);
  }
}

function renderScene(scene) {
  const card = element('article', `scene-card ${stateClass(scene.status)}`);
  const head = element('div', 'scene-head');
  const numberAndTitle = element('div', 'scene-title-wrap');
  const time = element('span', 'scene-time', `${formatTime(scene.start)} · ${formatDuration(scene.duration)}`);
  numberAndTitle.append(time, element('h4', '', scene.title || scene.id || 'Cena sem título'));
  const state = element('span', `state-pill ${stateClass(scene.status)}`, humanize(scene.status));
  head.append(numberAndTitle, state);
  card.append(head);

  if (scene.narration) {
    const quote = element('p', 'scene-narration', `“${scene.narration}”`);
    card.append(quote);
  } else {
    card.append(element('p', 'scene-narration missing-copy', 'Fala desta cena ainda não informada.'));
  }
  if (scene.visualEvent) {
    const plan = element('div', 'scene-plan');
    plan.append(element('strong', '', 'O que acontece'), element('p', '', scene.visualEvent));
    if (scene.attentionTarget) plan.append(element('span', '', `Foco visual · ${scene.attentionTarget}`));
    card.append(plan);
  }

  const footer = element('div', 'scene-footer');
  const qaStatus = scene.qaStatus;
  footer.append(element('span', 'review-state', `Revisão: ${humanize(qaStatus, 'não informada')}`));
  const actions = element('div', 'scene-actions');
  const previewUrl = safePreviewUrl(scene.previewUrl);
  if (previewUrl) {
    const isMp4 = new URL(previewUrl).pathname.toLowerCase().endsWith('.mp4');
    const start = Number(scene.previewStart);
    const end = Number(scene.previewEnd);
    if (isMp4 && Number.isFinite(start) && Number.isFinite(end) && end > start) {
      const button = element('button', 'button button-preview', 'Assistir este trecho ▶');
      button.type = 'button';
      button.setAttribute('aria-label', `Assistir o trecho isolado: ${scene.title || scene.id || 'cena'}`);
      button.addEventListener('click', () => openScenePreview({ url: previewUrl, start, end, title: scene.title || scene.id || 'Cena', duration: scene.duration, frameStep: scene.previewFrameStep }));
      actions.append(button);
    } else {
      const link = element('a', 'button button-preview', 'Abrir prévia isolada ↗');
      link.href = previewUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Abrir prévia isolada: ${scene.title || scene.id || 'cena'}`);
      actions.append(link);
    }
  }
  const stagePreviewUrl = safePreviewUrl(scene.preRenderPreviewUrl);
  if (stagePreviewUrl) {
    const link = element('a', 'button button-preview button-stage-preview', 'Ver cena 3D antes do render ↗');
    link.href = stagePreviewUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Ver prévia 3D antes do render: ${scene.title || scene.id || 'cena'}`);
    actions.append(link);
  } else if (!previewUrl) {
    footer.append(element('span', 'preview-unavailable', scene.preRenderPreviewUrl ? 'Prévia local indisponível' : 'Cena aguardando storyboard'));
  }
  if (actions.childElementCount) footer.append(actions);
  card.append(footer);
  return card;
}

function renderBlocks(blocks) {
  const list = $('#blocks-list');
  list.replaceChildren();
  if (!Array.isArray(blocks)) {
    list.append(element('div', 'empty-state', 'Blocos ainda não informados pela API.'));
    return;
  }
  if (!blocks.length) {
    list.append(element('div', 'empty-state', 'Nenhum bloco registrado ainda.'));
    return;
  }

  blocks.forEach((block, index) => {
    const details = document.createElement('details');
    details.className = `block-card ${stateClass(block.status)}`;
    details.open = stateClass(block.status) === 'working' || (index === 0 && !blocks.some(b => stateClass(b.status) === 'working'));
    const summary = document.createElement('summary');
    const left = element('div', 'block-summary-main');
    left.append(element('span', 'block-kicker', `BLOCO ${String(index + 1).padStart(2, '0')}`), element('h3', '', block.title || `Trecho ${formatTime(block.start)}`));
    const span = Number(block.end) - Number(block.start);
    const timeRange = `${formatTime(block.start)} — ${formatTime(block.end)}${Number.isFinite(span) && span >= 0 ? ` · ${formatDuration(span)}` : ''}`;
    const right = element('div', 'block-summary-state');
    right.append(element('span', 'block-time', timeRange), element('span', `state-pill ${stateClass(block.status)}`, humanize(block.status)));
    summary.append(left, right, element('span', 'chevron', '⌄'));
    details.append(summary);
    const content = element('div', 'block-content');
    if (block.description) content.append(element('p', 'block-description', block.description));
    const scenes = Array.isArray(block.scenes) ? block.scenes : [];
    content.append(element('div', 'scene-count-line', `${scenes.length} ${scenes.length === 1 ? 'cena' : 'cenas'} neste bloco`));
    const sceneList = element('div', 'scene-list');
    if (!scenes.length) sceneList.append(element('div', 'empty-state', 'Cenas ainda não registradas neste bloco.'));
    else scenes.forEach(scene => sceneList.append(renderScene(scene)));
    content.append(sceneList);
    details.append(content);
    list.append(details);
  });
}

function showError(message, isError = true) {
  const node = $('#load-error');
  node.hidden = false;
  node.textContent = message;
  node.classList.toggle('is-error', isError);
}

async function refresh({quiet = false} = {}) {
  if (refreshing) return;
  refreshing = true;
  const button = $('#refresh');
  button.disabled = true;
  button.classList.add('is-refreshing');
  try {
    const response = await fetch(API, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`A API respondeu ${response.status}.`);
    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error('A resposta da produção está vazia ou inválida.');
    hasData = true;
    $('#load-error').hidden = true;
    renderSummary(data);
    renderQueue(data.queue);
    renderBlocks(data.blocks);
  } catch (error) {
    $('#connection-label').textContent = 'Produção indisponível';
    $('#connection-label').parentElement.classList.remove('connected');
    showError(hasData ? `Não foi possível atualizar. Os dados exibidos são da última resposta recebida. ${error.message}` : `Não foi possível carregar o estado da produção. ${error.message}`, !hasData);
    if (!hasData) {
      $('#blocks-list').replaceChildren(element('div', 'empty-state', 'Nenhum progresso será presumido enquanto a API não responder.'));
      $('#queue-list').replaceChildren(element('div', 'empty-state', 'Fila indisponível.'));
    }
  } finally {
    refreshing = false;
    button.disabled = false;
    button.classList.remove('is-refreshing');
  }
}

$('#refresh').addEventListener('click', () => refresh());
const previewDialog = $('#preview-dialog');
const previewVideo = $('#scene-video');
const previewMessage = $('#preview-message');
function openScenePreview({url, start, end, title, duration, frameStep = 1 / 24}) {
  const safeStart = Math.max(0, start);
  previewWindow = { start: safeStart, end: Math.max(safeStart, end - frameStep), displayEnd: end };
  $('#preview-title').textContent = title;
  $('#preview-meta').textContent = `${formatTime(start)}–${formatTime(end)} no render disponível · ${formatDuration(duration)} de cena`;
  previewMessage.hidden = true;
  previewVideo.hidden = false;
  previewVideo.pause();
  previewVideo.src = url;
  previewVideo.currentTime = previewWindow.start;
  previewVideo.onloadedmetadata = () => {
    if (!previewWindow) return;
    previewVideo.currentTime = Math.min(previewWindow.start, Math.max(0, previewVideo.duration - 0.05));
    previewVideo.play().catch(() => {});
  };
  if (!previewDialog.open) previewDialog.showModal();
}
previewVideo.addEventListener('timeupdate', () => {
  if (previewWindow && previewVideo.currentTime >= previewWindow.end) {
    previewVideo.pause();
    previewVideo.currentTime = previewWindow.end;
  }
});
previewVideo.addEventListener('seeking', () => {
  if (!previewWindow || !Number.isFinite(previewVideo.duration)) return;
  const clamped = Math.max(previewWindow.start, Math.min(previewWindow.end, previewVideo.currentTime));
  if (Math.abs(clamped - previewVideo.currentTime) > 0.08) previewVideo.currentTime = clamped;
});
previewVideo.addEventListener('play', () => {
  if (previewWindow && previewVideo.currentTime >= previewWindow.end - 0.03) previewVideo.currentTime = previewWindow.start;
});
function closeScenePreview() {
  previewVideo.pause();
  previewVideo.removeAttribute('src');
  previewVideo.load();
  previewWindow = null;
  if (previewDialog.open) previewDialog.close();
}
$('#close-preview').addEventListener('click', closeScenePreview);
previewDialog.addEventListener('click', event => { if (event.target === previewDialog) closeScenePreview(); });
previewDialog.addEventListener('close', () => { if (previewWindow) closeScenePreview(); });
refresh();
window.setInterval(() => refresh({ quiet: true }), REFRESH_MS);
