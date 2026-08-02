import assert from 'node:assert/strict';
import test from 'node:test';
import { enterAction, itemPrefix, renumberFrom, toggleTaskMark } from '../src/lib/listEditing';

test('continues an unordered item, keeping marker and indent', () => {
  assert.deepEqual(enterAction('  - item', false), { kind: 'insert', text: '\n  - ' });
  assert.deepEqual(enterAction('* item', false), { kind: 'insert', text: '\n* ' });
});

test('continues an ordered item with the next number', () => {
  assert.deepEqual(enterAction('3) item', false), { kind: 'insert', text: '\n4) ' });
});

test('restarts at one when the setting asks for it', () => {
  assert.deepEqual(enterAction('3. item', true), { kind: 'insert', text: '\n1. ' });
});

test('continues a task list with an unchecked box', () => {
  assert.deepEqual(enterAction('- [x] done', false), { kind: 'insert', text: '\n- [ ] ' });
  assert.deepEqual(enterAction('1. [ ] todo', false), { kind: 'insert', text: '\n2. [ ] ' });
});

test('clears an item left empty, which is how a list is ended', () => {
  assert.deepEqual(enterAction('  - ', false), { kind: 'clearLine' });
  assert.deepEqual(enterAction('- [ ] ', false), { kind: 'clearLine' });
});

test('continues a blockquote, and clears one left empty', () => {
  assert.deepEqual(enterAction('> quoted', false), { kind: 'insert', text: '\n> ' });
  assert.deepEqual(enterAction('> ', false), { kind: 'clearLine' });
});

test('leaves an ordinary line to the editor', () => {
  assert.deepEqual(enterAction('plain text', false), { kind: 'default' });
});

test('measures the marker and its indent', () => {
  assert.deepEqual(itemPrefix('    - [ ] task'), { length: 10, indent: 4 });
  assert.equal(itemPrefix('plain'), null);
});

test('flips a task mark at the column it occupies', () => {
  assert.deepEqual(toggleTaskMark('- [ ] todo'), { column: 2, text: '[x]' });
  assert.deepEqual(toggleTaskMark('  1. [X] done'), { column: 5, text: '[ ]' });
  assert.equal(toggleTaskMark('- plain item'), null);
});

test('renumbers a run from the number it starts at', () => {
  const lines = ['3. one', '9. two', '1. three'];
  assert.deepEqual(renumberFrom(lines, 0), [
    { line: 0, text: '3. one' },
    { line: 1, text: '4. two' },
    { line: 2, text: '5. three' },
  ]);
});

test('steps over nested items without numbering them', () => {
  const lines = ['1. one', '   1. nested', '5. two'];
  assert.deepEqual(renumberFrom(lines, 0), [
    { line: 0, text: '1. one' },
    { line: 2, text: '2. two' },
  ]);
});

test('stops at a shallower item, which belongs to an outer list', () => {
  const lines = ['   1. inner', '   9. inner', '1. outer'];
  assert.deepEqual(renumberFrom(lines, 0), [
    { line: 0, text: '   1. inner' },
    { line: 1, text: '   2. inner' },
  ]);
});

test('does nothing when the starting line is not an ordered item', () => {
  assert.deepEqual(renumberFrom(['- item'], 0), []);
});
