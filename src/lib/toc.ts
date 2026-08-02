import { slugify, uniqueSlug, type SlugifyMode } from './slugify';

export const TOC_START = '<!-- TOC -->';
export const TOC_END = '<!-- /TOC -->';

export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface TocOptions {
  minLevel: number;
  maxLevel: number;
  ordered: boolean;
  slugifyMode: SlugifyMode;
}

export interface LineRange {
  startLine: number;
  endLine: number;
}

/** A heading marked to stay out of the table of contents. */
const OMIT = /<!--\s*omit\s+from\s+toc\s*-->/i;
const FENCE = /^(`{3,}|~{3,})/;
const FRONT_MATTER = /^---\s*$/;
const ATX = /^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/;
const SETEXT_H1 = /^={2,}\s*$/;
const SETEXT_H2 = /^-{2,}\s*$/;
const SECTION_NUMBER = /^\d[\d.]*\s+/;

/** Reads a `1..6` setting, falling back to the whole range when malformed. */
export function parseLevelRange(range: string): [number, number] {
  const match = range.match(/^(\d)\.\.(\d)$/);
  if (!match?.[1] || !match[2]) return [1, 6];
  return [Number(match[1]), Number(match[2])];
}

/**
 * Collects the headings of a document, skipping front matter, fenced code and
 * anything the author marked to omit.
 */
export function extractHeadings(lines: string[]): Heading[] {
  const headings: Heading[] = [];
  let fenceChar = '';
  let inFence = false;
  let inFrontMatter = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';

    if (index === 0 && FRONT_MATTER.test(line)) {
      inFrontMatter = true;
      continue;
    }
    if (inFrontMatter) {
      if (FRONT_MATTER.test(line)) inFrontMatter = false;
      continue;
    }

    const fence = line.match(FENCE);
    if (fence?.[1]) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence[1][0] ?? '';
      } else if (line.startsWith(fenceChar)) {
        inFence = false;
        fenceChar = '';
      }
      continue;
    }
    if (inFence) continue;

    if (OMIT.test(line)) {
      // The marker sits on its own line, above the heading it excludes.
      if (/^#{1,6}\s+/.test(lines[index + 1] ?? '')) index += 1;
      continue;
    }

    const atx = line.match(ATX);
    if (atx?.[1] && atx[2]) {
      headings.push({ level: atx[1].length, text: atx[2].trim(), line: index });
      continue;
    }

    const next = lines[index + 1];
    if (next === undefined || line.trim() === '') continue;
    if (SETEXT_H1.test(next)) headings.push({ level: 1, text: line.trim(), line: index });
    else if (SETEXT_H2.test(next)) headings.push({ level: 2, text: line.trim(), line: index });
  }

  return headings;
}

/** Renders the list between the markers, indented from the shallowest heading. */
export function buildToc(headings: Heading[], options: TocOptions): string {
  const kept = headings.filter(
    (heading) => heading.level >= options.minLevel && heading.level <= options.maxLevel
  );
  const base = kept.length > 0 ? Math.min(...kept.map((heading) => heading.level)) : 1;
  const seen = new Map<string, number>();
  const counters = new Array<number>(7).fill(0);
  const lines = [TOC_START, ''];

  for (const heading of kept) {
    const slug = uniqueSlug(slugify(heading.text, options.slugifyMode), seen);
    let marker = '-';

    if (options.ordered) {
      counters[heading.level] = (counters[heading.level] ?? 0) + 1;
      marker = `${counters[heading.level]}.`;
      for (let deeper = heading.level + 1; deeper <= 6; deeper += 1) counters[deeper] = 0;
    }

    lines.push(`${'  '.repeat(heading.level - base)}${marker} [${heading.text}](#${slug})`);
  }

  lines.push('', TOC_END);
  return lines.join('\n');
}

/** Locates an existing table of contents by its markers. */
export function findTocRange(lines: string[]): LineRange | null {
  let startLine = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const text = (lines[index] ?? '').trim();
    if (text === TOC_START) startLine = index;
    else if (text === TOC_END && startLine >= 0) return { startLine, endLine: index };
  }

  return null;
}

/** A heading rewritten with, or without, its section number. */
export interface HeadingRewrite {
  line: number;
  text: string;
}

function withoutNumber(text: string): string {
  return text.replace(SECTION_NUMBER, '');
}

/** Numbers the headings in range, resetting deeper counters at each step. */
export function numberHeadings(
  headings: Heading[],
  minLevel: number,
  maxLevel: number
): HeadingRewrite[] {
  const counters = new Array<number>(7).fill(0);
  const rewrites: HeadingRewrite[] = [];

  for (const heading of headings) {
    if (heading.level < minLevel || heading.level > maxLevel) continue;

    counters[heading.level] = (counters[heading.level] ?? 0) + 1;
    for (let deeper = heading.level + 1; deeper <= 6; deeper += 1) counters[deeper] = 0;

    const number = counters.slice(minLevel, heading.level + 1).join('.');
    rewrites.push({
      line: heading.line,
      text: `${'#'.repeat(heading.level)} ${number} ${withoutNumber(heading.text)}`,
    });
  }

  return rewrites;
}

/** Strips section numbers, touching only the headings that carry one. */
export function unnumberHeadings(headings: Heading[]): HeadingRewrite[] {
  return headings
    .filter((heading) => withoutNumber(heading.text) !== heading.text)
    .map((heading) => ({
      line: heading.line,
      text: `${'#'.repeat(heading.level)} ${withoutNumber(heading.text)}`,
    }));
}
