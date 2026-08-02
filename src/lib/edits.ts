/** A link target worth pasting as a markdown link rather than as plain text. */
const LINK_TARGET = /^(https?:\/\/|mailto:|tel:)\S+$/i;

const LIST_ITEM = /^(\s*)([-*+]|\d+[.)]) (.*)$/;
const INDENT = /^(\s*)(.*)$/;
const HEADING = /^(#{0,6})\s*(.*)$/;

/** The order `Toggle List` walks through, ending unmarked. */
const LIST_MARKERS = ['- ', '* ', '+ ', '1. '];

export function isLinkTarget(text: string): boolean {
  return LINK_TARGET.test(text.trim());
}

export function isWrapped(text: string, wrapper: string): boolean {
  return (
    text.length >= wrapper.length * 2 && text.startsWith(wrapper) && text.endsWith(wrapper)
  );
}

export function unwrap(text: string, wrapper: string): string {
  return text.slice(wrapper.length, -wrapper.length);
}

export function wrap(text: string, wrapper: string): string {
  return wrapper + text + wrapper;
}

/** Moves a heading by `delta` levels, clamped between plain text and `######`. */
export function changeHeadingLevel(line: string, delta: number): string {
  const [, hashes = '', text = ''] = line.match(HEADING) ?? [];
  const level = Math.max(0, Math.min(6, hashes.length + delta));
  return level > 0 ? `${'#'.repeat(level)} ${text}` : text;
}

/**
 * Advances a line through the list markers and back to plain text. An ordered
 * item counts as `1.` whatever its number, so the cycle stays predictable.
 */
export function cycleListMarker(line: string): string {
  const item = line.match(LIST_ITEM);

  if (!item) {
    const [, indent = '', text = ''] = line.match(INDENT) ?? [];
    return `${indent}${LIST_MARKERS[0] ?? '- '}${text}`;
  }

  const [, indent = '', marker = '', text = ''] = item;
  const current = /^\d+[.)]$/.test(marker) ? '1. ' : `${marker} `;
  const next = LIST_MARKERS.indexOf(current) + 1;

  return next >= LIST_MARKERS.length
    ? `${indent}${text}`
    : `${indent}${LIST_MARKERS[next] ?? ''}${text}`;
}

/** Wraps a selection in a fence, or removes the fence it already carries. */
export function toggleCodeFence(text: string): string {
  if (text.startsWith('```') && text.endsWith('```')) {
    const opened = text.indexOf('\n');
    const closed = text.lastIndexOf('\n');
    return opened === closed ? '' : text.slice(opened + 1, closed);
  }
  return '```\n' + text + '\n```';
}

/**
 * Cycles a selection through inline math, display math and back to plain text,
 * which is the order an author needs while drafting a formula.
 */
export function cycleMath(text: string): string {
  if (text.startsWith('$$') && text.endsWith('$$') && text.length >= 4) {
    const opened = text.indexOf('\n');
    const closed = text.lastIndexOf('\n');
    const inner = opened === closed ? text.slice(2, -2) : text.slice(opened + 1, closed);
    return inner.trim();
  }
  if (text.startsWith('$') && text.endsWith('$') && text.length >= 2) {
    return '$$\n' + text.slice(1, -1) + '\n$$';
  }
  return '$' + text + '$';
}

/** Collapses a display-math line back to inline math, or clears an empty one. */
export function collapseDisplayMathLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('$$') || !trimmed.endsWith('$$') || trimmed.length < 4) return null;

  const inner = trimmed.slice(2, -2).trim();
  return inner ? `$${inner}$` : '';
}
