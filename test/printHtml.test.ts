import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHtml, escapeHtml, inlineCssAssets } from '../src/lib/printHtml';

test('inlines a local font as a data uri, resolved against the stylesheet', () => {
  const reads: string[] = [];
  const css = inlineCssAssets(
    '@font-face{src:url("fonts/example.woff2")}',
    '/extension/dist/vendor',
    (assetPath) => {
      reads.push(assetPath);
      return Buffer.from('font-data');
    }
  );

  assert.deepEqual(reads, ['/extension/dist/vendor/fonts/example.woff2']);
  assert.match(css, /data:font\/woff2;base64,/);
  assert.doesNotMatch(css, /fonts\/example\.woff2/);
});

test('leaves remote and data urls alone', () => {
  const untouched =
    '@font-face{src:url(https://cdn.example/f.woff2),url(data:font/woff2;base64,AA)}';
  assert.equal(
    inlineCssAssets(untouched, '/extension/dist/vendor', () => {
      throw new Error('should not read');
    }),
    untouched
  );
});

test('falls back to a generic mime type for an unknown extension', () => {
  const css = inlineCssAssets('div{background:url(art.bin)}', '/vendor', () =>
    Buffer.from('x')
  );
  assert.match(css, /data:application\/octet-stream;base64,/);
});

test('builds a page whose styles are embedded and whose title is escaped', () => {
  const html = buildHtml('Private & local', '<h1>Ready</h1>', 'dark', '.katex{display:inline}');

  assert.match(html, /<title>Private &amp; local<\/title>/);
  assert.match(html, /\.katex\{display:inline\}/);
  assert.match(html, /<h1>Ready<\/h1>/);
  assert.doesNotMatch(html, /<link[^>]+stylesheet/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test('escapes the characters that would break out of markup or an attribute', () => {
  assert.equal(escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});
