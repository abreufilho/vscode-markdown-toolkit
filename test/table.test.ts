import assert from 'node:assert/strict';
import test from 'node:test';
import { findTables, formatTable, visualWidth } from '../src/lib/table';

function formatted(markdown: string): string[] {
  const lines = markdown.split('\n');
  const [table] = findTables(lines);
  assert.ok(table, 'expected a table');
  return formatTable(table);
}

test('counts a wide character as two columns and an emoji as one grapheme', () => {
  assert.equal(visualWidth('abc'), 3);
  assert.equal(visualWidth('日本'), 4);
  assert.equal(visualWidth('👨‍👩‍👧'), 1);
});

test('needs a delimiter row to call something a table', () => {
  assert.equal(findTables(['| a | b |', 'not a delimiter']).length, 0);
  assert.equal(findTables(['| a | b |', '| --- | --- |']).length, 1);
});

test('reports the lines a table spans', () => {
  const [table] = findTables(['intro', '| a | b |', '| - | - |', '| 1 | 2 |', 'outro']);
  assert.equal(table?.startLine, 1);
  assert.equal(table?.endLine, 3);
});

test('pads every column to its widest cell', () => {
  assert.deepEqual(formatted('| a | long value |\n| - | - |\n| 1 | 2 |'), [
    '| a   | long value |',
    '| --- | ---------- |',
    '| 1   | 2          |',
  ]);
});

test('keeps the alignment the delimiter declares', () => {
  assert.deepEqual(formatted('| l | c | r |\n| :- | :-: | -: |\n| 1 | 2 | 3 |'), [
    '| l   |  c  |   r |',
    '| :-- | :-: | --: |',
    '| 1   |  2  |   3 |',
  ]);
});

test('keeps the delimiter when the table has no body rows', () => {
  assert.deepEqual(formatted('| a | b |\n| - | - |'), ['| a   | b   |', '| --- | --- |']);
});

test('fills a short row rather than dropping its columns', () => {
  assert.deepEqual(formatted('| a | b |\n| - | - |\n| 1 |'), [
    '| a   | b   |',
    '| --- | --- |',
    '| 1   |     |',
  ]);
});

test('aligns a column holding wide characters', () => {
  assert.deepEqual(formatted('| 日本語 | b |\n| - | - |\n| x | y |'), [
    '| 日本語 | b   |',
    '| ------ | --- |',
    '| x      | y   |',
  ]);
});
