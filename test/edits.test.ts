import assert from 'node:assert/strict';
import test from 'node:test';
import {
  changeHeadingLevel,
  collapseDisplayMathLine,
  cycleListMarker,
  cycleMath,
  isLinkTarget,
  isWrapped,
  toggleCodeFence,
} from '../src/lib/edits';

test('recognises the schemes worth pasting as a link', () => {
  assert.ok(isLinkTarget('  https://example.com/a  '));
  assert.ok(isLinkTarget('mailto:someone@example.com'));
  assert.ok(!isLinkTarget('example.com'));
  assert.ok(!isLinkTarget('https://example.com two words'));
});

test('needs both ends and enough length to count as wrapped', () => {
  assert.ok(isWrapped('**bold**', '**'));
  assert.ok(!isWrapped('**', '**'));
  assert.ok(!isWrapped('**start', '**'));
});

test('raises and lowers a heading, clamped at plain text and level six', () => {
  assert.equal(changeHeadingLevel('## Title', 1), '### Title');
  assert.equal(changeHeadingLevel('## Title', -1), '# Title');
  assert.equal(changeHeadingLevel('# Title', -1), 'Title');
  assert.equal(changeHeadingLevel('Title', -1), 'Title');
  assert.equal(changeHeadingLevel('###### Title', 1), '###### Title');
});

test('turns plain text into a list item, keeping the indent', () => {
  assert.equal(cycleListMarker('  text'), '  - text');
});

test('walks the markers and ends unmarked', () => {
  assert.equal(cycleListMarker('- item'), '* item');
  assert.equal(cycleListMarker('* item'), '+ item');
  assert.equal(cycleListMarker('+ item'), '1. item');
  assert.equal(cycleListMarker('1. item'), 'item');
});

test('treats any ordered item as the same step of the cycle', () => {
  assert.equal(cycleListMarker('7) item'), 'item');
});

test('wraps a selection in a fence and takes it back off', () => {
  assert.equal(toggleCodeFence('code'), '```\ncode\n```');
  assert.equal(toggleCodeFence('```\ncode\n```'), 'code');
});

test('cycles a selection through inline math, display math and plain text', () => {
  assert.equal(cycleMath('x + y'), '$x + y$');
  assert.equal(cycleMath('$x + y$'), '$$\nx + y\n$$');
  assert.equal(cycleMath('$$\nx + y\n$$'), 'x + y');
});

test('collapses a display-math line, and clears an empty one', () => {
  assert.equal(collapseDisplayMathLine('  $$ x + y $$  '), '$x + y$');
  assert.equal(collapseDisplayMathLine('$$$$'), '');
  assert.equal(collapseDisplayMathLine('plain text'), null);
});
