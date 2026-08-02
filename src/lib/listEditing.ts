const ORDERED = /^(\s*)(\d+)([.)]) ((\[[ x]\] )?.*)$/;
const UNORDERED = /^(\s*)([-*+]) ((\[[ x]\] )?.*)$/;
const BLOCKQUOTE = /^(\s*>[\s>]*)/;
const EMPTY_ITEM = /^(\s*)([-*+]|\d+[.)]) (\[[ x]\] )?$/;
const ITEM_PREFIX = /^(\s*)([-*+]|\d+[.)]) (\[[ x]\] )?/;
const TASK_MARK = /^(\s*(?:[-*+]|\d+[.)]) )\[([ x])\]/i;

/** What pressing Enter should do on a given line. */
export type EnterAction =
  { kind: 'clearLine' } | { kind: 'insert'; text: string } | { kind: 'default' };

/** A line rewritten in place. */
export interface LineRewrite {
  line: number;
  text: string;
}

/**
 * Continues the list or quote the cursor is in. An item left empty is cleared
 * instead, which is how a list is ended without deleting the marker by hand.
 */
export function enterAction(line: string, restartOrderedAtOne: boolean): EnterAction {
  if (EMPTY_ITEM.test(line)) return { kind: 'clearLine' };

  const ordered = line.match(ORDERED);
  if (ordered) {
    const [, indent = '', number = '0', delimiter = '.', , task] = ordered;
    const next = restartOrderedAtOne ? 1 : Number(number) + 1;
    return { kind: 'insert', text: `\n${indent}${next}${delimiter} ${task ? '[ ] ' : ''}` };
  }

  const unordered = line.match(UNORDERED);
  if (unordered) {
    const [, indent = '', marker = '-', , task] = unordered;
    return { kind: 'insert', text: `\n${indent}${marker} ${task ? '[ ] ' : ''}` };
  }

  const quote = line.match(BLOCKQUOTE);
  if (quote?.[1]) {
    return line.trim() === quote[1].trim()
      ? { kind: 'clearLine' }
      : { kind: 'insert', text: `\n${quote[1]}` };
  }

  return { kind: 'default' };
}

/** Length of the marker, if the line starts with one, and its indent. */
export function itemPrefix(line: string): { length: number; indent: number } | null {
  const match = line.match(ITEM_PREFIX);
  if (!match) return null;
  return { length: match[0].length, indent: (match[1] ?? '').length };
}

/** The `[x]` or `[ ]` a line carries, flipped, with the column to write it at. */
export function toggleTaskMark(line: string): { column: number; text: string } | null {
  const match = line.match(TASK_MARK);
  if (!match?.[1] || !match[2]) return null;
  return { column: match[1].length, text: match[2] === ' ' ? '[x]' : '[ ]' };
}

/**
 * Renumbers an ordered list from a line onwards. Nested items are stepped over
 * and a shallower item ends the run, so numbering stays inside its own level.
 */
export function renumberFrom(lines: string[], startLine: number): LineRewrite[] {
  const first = (lines[startLine] ?? '').match(ORDERED);
  if (!first) return [];

  const baseIndent = (first[1] ?? '').length;
  let number = Number(first[2] ?? '1');
  const rewrites: LineRewrite[] = [];

  for (let index = startLine; index < lines.length; index += 1) {
    const item = (lines[index] ?? '').match(ORDERED);
    if (!item) break;

    const indent = (item[1] ?? '').length;
    if (indent < baseIndent) break;
    if (indent > baseIndent) continue;

    rewrites.push({ line: index, text: `${item[1]}${number}${item[3]} ${item[4]}` });
    number += 1;
  }

  return rewrites;
}
