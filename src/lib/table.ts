export type Alignment = 'none' | 'left' | 'right' | 'center';

export interface Table {
  startLine: number;
  endLine: number;
  /** The header row followed by the body rows; the delimiter is not one of them. */
  rows: string[][];
  alignments: Alignment[];
}

/**
 * A row is either delimited by pipes at both ends, which admits a row holding a
 * single cell, or carries a pipe between two cells.
 */
const TABLE_ROW = /^\s*(?:\|.*\||\|?.+\|.+\|?)\s*$/;
const DELIMITER_ROW = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/** Ranges whose characters occupy two columns in a monospaced font. */
const WIDE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/;

/** The narrowest a column may be, so its delimiter still reads as one. */
const MIN_WIDTH = 3;

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Width in terminal columns rather than in code units, so that a table holding
 * CJK text or emoji still lines up.
 */
export function visualWidth(text: string): number {
  let width = 0;
  for (const { segment } of graphemes.segment(text)) {
    width += WIDE.test(segment) ? 2 : 1;
  }
  return width;
}

function parseRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|')) text = text.slice(0, -1);
  return text.split('|').map((cell) => cell.trim());
}

function parseAlignment(cell: string): Alignment {
  const text = cell.trim();
  const left = text.startsWith(':');
  const right = text.endsWith(':');

  if (left && right) return 'center';
  if (right) return 'right';
  if (left) return 'left';
  return 'none';
}

function padCell(text: string, width: number, alignment: Alignment): string {
  const padding = Math.max(0, width - visualWidth(text));

  if (alignment === 'right') return ' '.repeat(padding) + text;
  if (alignment === 'center') {
    const left = Math.floor(padding / 2);
    return ' '.repeat(left) + text + ' '.repeat(padding - left);
  }
  return text + ' '.repeat(padding);
}

function delimiterCell(width: number, alignment: Alignment): string {
  const dashes = '-'.repeat(Math.max(MIN_WIDTH, width));

  if (alignment === 'left') return ':' + dashes.slice(1);
  if (alignment === 'right') return dashes.slice(1) + ':';
  if (alignment === 'center') return ':' + dashes.slice(2) + ':';
  return dashes;
}

/**
 * Finds the tables in a range of lines. A table is a row followed by a
 * delimiter, which is what tells one apart from a line that merely holds pipes.
 */
export function findTables(lines: string[], from = 0, to = lines.length - 1): Table[] {
  const tables: Table[] = [];
  let index = from;

  while (index <= to) {
    const header = lines[index] ?? '';
    if (
      !TABLE_ROW.test(header) ||
      index + 1 > to ||
      !DELIMITER_ROW.test(lines[index + 1] ?? '')
    ) {
      index += 1;
      continue;
    }

    const startLine = index;
    const alignments = parseRow(lines[index + 1] ?? '').map(parseAlignment);
    const rows = [parseRow(header)];

    index += 2;
    while (index <= to && TABLE_ROW.test(lines[index] ?? '')) {
      rows.push(parseRow(lines[index] ?? ''));
      index += 1;
    }

    tables.push({ startLine, endLine: index - 1, rows, alignments });
  }

  return tables;
}

/** Rewrites a table with every column padded to its widest cell. */
export function formatTable(table: Table): string[] {
  const columns = Math.max(table.alignments.length, ...table.rows.map((row) => row.length));
  const alignments = Array.from(
    { length: columns },
    (_, column) => table.alignments[column] ?? 'none'
  );
  const rows = table.rows.map((row) =>
    Array.from({ length: columns }, (_, column) => row[column] ?? '')
  );

  const widths = Array.from({ length: columns }, (_, column) =>
    rows.reduce((widest, row) => Math.max(widest, visualWidth(row[column] ?? '')), MIN_WIDTH)
  );

  const render = (cells: string[]): string => `| ${cells.join(' | ')} |`;
  const [header = [], ...body] = rows;

  return [
    render(
      header.map((cell, column) =>
        padCell(cell, widths[column] ?? 0, alignments[column] ?? 'none')
      )
    ),
    render(
      alignments.map((alignment, column) => delimiterCell(widths[column] ?? 0, alignment))
    ),
    ...body.map((row) =>
      render(
        row.map((cell, column) =>
          padCell(cell, widths[column] ?? 0, alignments[column] ?? 'none')
        )
      )
    ),
  ];
}
