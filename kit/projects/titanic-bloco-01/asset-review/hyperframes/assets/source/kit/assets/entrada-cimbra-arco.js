import { createArchPreview } from './arch-preview.js';
import { baseTransform, resolveTarget, smoothStep } from './behavior-utils.js';

function orderFor(name) {
  if (name.startsWith('sapata_')) return { phase: 0, rank: Number(name.match(/_(\d+)$/)?.[1] || 0) };
  if (name.startsWith('escora_')) return { phase: 1, rank: Number(name.match(/_(\d+)$/)?.[1] || 0) };
  if (name.startsWith('travessa_')) return { phase: 2, rank: name.includes('baixa') ? 0 : 1 };
  const match = name.match(/^costela_(\d+)_(\d+)$/);
  if (match) {
    const rib = Number(match[1]);
    const segment = Number(match[2]);
    const edgeRank = Math.min(segment - 1, 13 - segment);
    return { phase: 3, rank: edgeRank * 3 + rib - 1 };
  }
  return { phase: 4, rank: 0 };
}

export function apply(context, time, params = {}) {
  const centering = resolveTarget(context, params, 'centering', 'cimbra_arco');
  if (!centering) return;
  const duration = Number(params.duration) || 1.72;
  const pieces = [];
  centering.traverse((part) => {
    if (!part.isMesh || part === centering) return;
    const order = orderFor(part.name);
    const phaseDelay = [0.02, 0.12, 0.29, 0.43, 0.43][order.phase];
    const stagger = order.phase === 3 ? order.rank * 0.034 : order.rank * 0.028;
    pieces.push({ part, order, delay: phaseDelay + stagger });
  });

  for (const { part, order, delay } of pieces) {
    const base = baseTransform(part);
    const progress = smoothStep(time, delay, 0.25);
    part.position.copy(base.position);
    part.rotation.copy(base.rotation);
    part.scale.copy(base.scale);
    const rise = order.phase === 3 ? 1.8 : Math.max(0.48, base.position.y + 0.36);
    part.position.y -= rise * (1 - progress);
  }
}

export function create() {
  return createArchPreview(apply, 'centering');
}
