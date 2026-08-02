import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildToc,
  extractHeadings,
  findTocRange,
  numberHeadings,
  parseLevelRange,
  unnumberHeadings,
  type TocOptions,
} from '../src/lib/toc';

const OPTIONS: TocOptions = {
  minLevel: 1,
  maxLevel: 6,
  ordered: false,
  slugifyMode: 'github',
};

function headingsOf(markdown: string) {
  return extractHeadings(markdown.split('\n'));
}

test('reads a level range, and falls back when it is malformed', () => {
  assert.deepEqual(parseLevelRange('2..4'), [2, 4]);
  assert.deepEqual(parseLevelRange('nonsense'), [1, 6]);
});

test('collects atx and setext headings with their level and line', () => {
  assert.deepEqual(headingsOf('# One\n\nTwo\n---\n\n### Three'), [
    { level: 1, text: 'One', line: 0 },
    { level: 2, text: 'Two', line: 2 },
    { level: 3, text: 'Three', line: 5 },
  ]);
});

test('drops the closing hashes of a closed atx heading', () => {
  assert.deepEqual(headingsOf('## Title ##'), [{ level: 2, text: 'Title', line: 0 }]);
});

test('ignores headings inside fenced code', () => {
  assert.deepEqual(headingsOf('```\n# Not a heading\n```\n# Real'), [
    { level: 1, text: 'Real', line: 3 },
  ]);
});

test('ignores front matter, which uses the same dashes as a setext rule', () => {
  assert.deepEqual(headingsOf('---\ntitle: Post\n---\n# Real'), [
    { level: 1, text: 'Real', line: 3 },
  ]);
});

test('skips the heading below an omit marker', () => {
  assert.deepEqual(headingsOf('# Kept\n<!-- omit from toc -->\n# Dropped\n# Also kept'), [
    { level: 1, text: 'Kept', line: 0 },
    { level: 1, text: 'Also kept', line: 3 },
  ]);
});

test('indents from the shallowest heading it keeps', () => {
  const toc = buildToc(headingsOf('## Top\n### Under\n#### Deeper'), OPTIONS);

  assert.equal(
    toc,
    [
      '<!-- TOC -->',
      '',
      '- [Top](#top)',
      '  - [Under](#under)',
      '    - [Deeper](#deeper)',
      '',
      '<!-- /TOC -->',
    ].join('\n')
  );
});

test('keeps only the configured levels', () => {
  const toc = buildToc(headingsOf('# One\n## Two\n### Three'), {
    ...OPTIONS,
    minLevel: 2,
    maxLevel: 2,
  });

  assert.match(toc, /- \[Two]\(#two\)/);
  assert.doesNotMatch(toc, /Three/);
});

test('numbers an ordered list per level, restarting under a new parent', () => {
  const toc = buildToc(headingsOf('# A\n## A1\n## A2\n# B\n## B1'), {
    ...OPTIONS,
    ordered: true,
  });

  assert.deepEqual(toc.split('\n').slice(2, 7), [
    '1. [A](#a)',
    '  1. [A1](#a1)',
    '  2. [A2](#a2)',
    '2. [B](#b)',
    '  1. [B1](#b1)',
  ]);
});

test('disambiguates repeated headings the way the hosts do', () => {
  const toc = buildToc(headingsOf('# Notes\n# Notes'), OPTIONS);

  assert.match(toc, /\[Notes]\(#notes\)/);
  assert.match(toc, /\[Notes]\(#notes-1\)/);
});

test('finds an existing table of contents by its markers', () => {
  const lines = ['# Title', '<!-- TOC -->', '- [Title](#title)', '<!-- /TOC -->', 'body'];
  assert.deepEqual(findTocRange(lines), { startLine: 1, endLine: 3 });
});

test('reports no range when a marker is missing', () => {
  assert.equal(findTocRange(['<!-- TOC -->', '- [Title](#title)']), null);
});

test('numbers headings and replaces a number already there', () => {
  assert.deepEqual(numberHeadings(headingsOf('# 9 One\n## Two\n## Three\n# Four'), 1, 6), [
    { line: 0, text: '# 1 One' },
    { line: 1, text: '## 1.1 Two' },
    { line: 2, text: '## 1.2 Three' },
    { line: 3, text: '# 2 Four' },
  ]);
});

test('strips numbers only from the headings that carry one', () => {
  assert.deepEqual(unnumberHeadings(headingsOf('# 1 One\n# Two')), [
    { line: 0, text: '# One' },
  ]);
});
