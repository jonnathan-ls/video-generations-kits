/** Deterministic captions. Word alignment is supplied, never inferred as measured. */
export const CAPTION_REVEALS = ['phrase', 'progressive-character', 'progressive-word', 'word-highlight'];
const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });
export const graphemes = text => [...segmenter.segment(String(text))].map(part => part.segment);
const key = text => String(text).normalize('NFC').toLocaleUpperCase('pt-BR').replace(/[^\p{L}\p{N}]/gu, '');

export function compileCaption(cue, style = {}, alignedWords = []) {
  const start = Number(cue.start), end = start + Number(cue.duration);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('Intervalo de legenda inválido.');
  const offset = Number(cue.timeOffset || 0);
  const timingStart = start - offset, timingDuration = Number(cue.sourceDuration ?? (cue.duration + offset)), timingEnd = timingStart + timingDuration;
  if (!Number.isFinite(offset) || offset < 0 || !Number.isFinite(timingDuration) || timingDuration <= 0 || timingEnd < end - .001) throw new Error('Origem temporal de legenda inválida.');
  const mode = cue.reveal || style.reveal || 'phrase';
  if (!CAPTION_REVEALS.includes(mode)) throw new Error(`Abordagem de legenda desconhecida: ${mode}`);
  const text = String(cue.text).normalize('NFC').toLocaleUpperCase('pt-BR');
  const tokens = [...text.matchAll(/\S+|\s+/gu)].map(match => ({ text: match[0], space: /^\s+$/u.test(match[0]) }));
  const words = tokens.filter(token => !token.space);
  const supplied = cue.words || alignedWords.filter(word => Number(word.start) < timingEnd && Number(word.end) > timingStart);
  const aligned = supplied.length > 0;
  if (aligned && (supplied.length !== words.length || supplied.some((word, i) => key(word.text ?? word.word) !== key(words[i].text)))) {
    throw new Error(`Alinhamento de palavras diverge da legenda: ${text}`);
  }
  const total = words.reduce((sum, word) => sum + graphemes(word.text).length, 0);
  let consumed = 0, previousEnd = timingStart;
  words.forEach((word, index) => {
    word.characters = graphemes(word.text);
    const weight = word.characters.length;
    word.start = aligned ? Math.max(timingStart, Number(supplied[index].start)) : timingStart + timingDuration * consumed / total;
    word.end = aligned ? Math.min(timingEnd, Number(supplied[index].end)) : timingStart + timingDuration * (consumed + weight) / total;
    if (!Number.isFinite(word.start) || !Number.isFinite(word.end) || (word.end < word.start || (mode === 'progressive-character' && word.end === word.start)) || word.start < previousEnd - .001) {
      throw new Error(`Tempos de palavra inválidos na legenda: ${text}`);
    }
    previousEnd = word.end;
    consumed += weight;
    // At word onset reveal its first grapheme. Remaining graphemes land before word end.
    word.revealTimes = word.characters.map((_, i) => word.start + (word.end - word.start) * i / weight);
  });
  return { text, start, end, mode, tokens, words, timingSource: aligned ? 'provided-word-alignment' : 'estimated-grapheme' };
}

export function sampleCaption(model, time) {
  const active = time >= model.start && time < model.end;
  return {
    active,
    words: model.words.map(word => ({
      visible: active && (model.mode === 'phrase' || model.mode === 'word-highlight' || time >= word.start),
      highlighted: active && model.mode === 'word-highlight' && time >= word.start && time < word.end,
      characters: word.revealTimes.map(at => active && (model.mode !== 'progressive-character' || time >= at))
    }))
  };
}

/** Hidden graphemes retain the complete cue's layout, including its line breaks. */
export function mountCaptionCopy(element, model) {
  const document = element.ownerDocument;
  element.replaceChildren();
  element.setAttribute('aria-label', model.text);
  let index = 0;
  const nodes = [];
  for (const token of model.tokens) {
    if (token.space) { element.append(document.createTextNode(token.text)); continue; }
    const word = model.words[index++], wrapper = document.createElement('span');
    wrapper.className = 'caption-word';
    wrapper.style.whiteSpace = 'nowrap';
    wrapper.setAttribute('aria-hidden', 'true');
    const characters = word.characters.map(text => {
      const node = document.createElement('span');
      node.textContent = text; wrapper.append(node); return node;
    });
    element.append(wrapper); nodes.push({ wrapper, characters });
  }
  return time => {
    const state = sampleCaption(model, time);
    nodes.forEach((node, index) => {
      const word = state.words[index];
      node.wrapper.style.color = word.highlighted ? 'var(--caption-highlight, #ffd05a)' : '';
      node.characters.forEach((character, charIndex) => {
        character.style.visibility = word.visible && word.characters[charIndex] ? 'visible' : 'hidden';
      });
    });
  };
}
