import assert from 'node:assert/strict';
import test from 'node:test';
import { extractTitle, rewriteImageSources, rewriteMarkdownLinks } from '../src/lib/printHtml';

test('prefers an explicit title comment over the first heading', () => {
  assert.equal(extractTitle('<!-- title: Chosen -->\n# Heading'), 'Chosen');
  assert.equal(extractTitle('intro\n\n# Heading\n# Later'), 'Heading');
  assert.equal(extractTitle('no title here'), 'Untitled');
});

test('rewrites a local image through the resolver', () => {
  const html = rewriteImageSources(
    '<img src="art/logo.png" alt="x">',
    () => 'data:image/png;base64,AA'
  );
  assert.equal(html, '<img src="data:image/png;base64,AA" alt="x">');
});

test('leaves remote and data sources untouched', () => {
  const html = '<img src="https://example.com/a.png"><img src="data:image/png;base64,AA">';
  assert.equal(
    rewriteImageSources(html, () => {
      throw new Error('should not resolve');
    }),
    html
  );
});

test('keeps a source the resolver cannot place', () => {
  const html = '<img src="missing.png">';
  assert.equal(
    rewriteImageSources(html, () => null),
    html
  );
});

test('points markdown links at their exported neighbours', () => {
  assert.equal(
    rewriteMarkdownLinks('<a href="guide.md">Guide</a>'),
    '<a href="guide.html">Guide</a>'
  );
});

test('leaves a link into a repository pointing at the source', () => {
  const html = '<a href="https://github.com/o/r/blob/main/README.md">README</a>';
  assert.equal(rewriteMarkdownLinks(html), html);
});

test('compares the host, so a lookalike is rewritten like any other link', () => {
  assert.equal(
    rewriteMarkdownLinks('<a href="https://github.com.example.org/blob/x/a.md">a</a>'),
    '<a href="https://github.com.example.org/blob/x/a.html">a</a>'
  );
  assert.equal(
    rewriteMarkdownLinks('<a href="https://example.org/x/blob/github.com/a.md">a</a>'),
    '<a href="https://example.org/x/blob/github.com/a.html">a</a>'
  );
});
