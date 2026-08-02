// Assembles what ships in the VSIX:
//   extension.js      bundled host code, with dependency licences appended
//   dist/vendor/      stylesheets and fonts the exported page embeds
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const modules = resolve(root, 'node_modules');

// The exported page carries these inline, so they travel with the extension
// rather than being fetched from a CDN when the page is opened.
const VENDOR = [
  [resolve(modules, 'katex/dist/katex.min.css'), 'katex.min.css'],
  [resolve(modules, 'highlight.js/styles/github.min.css'), 'github.min.css'],
  [resolve(modules, 'highlight.js/styles/github-dark.min.css'), 'github-dark.min.css'],
];

// KaTeX resolves its fonts relative to its stylesheet; the export inlines them
// from here, so the directory has to keep that layout.
const VENDOR_FONTS = resolve(modules, 'katex/dist/fonts');

await rm(dist, { recursive: true, force: true });
await rm(resolve(root, 'extension.js'), { force: true });

await build({
  entryPoints: [resolve(root, 'src/extension.ts')],
  outfile: resolve(root, 'extension.js'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  legalComments: 'eof',
});

await mkdir(resolve(dist, 'vendor'), { recursive: true });
for (const [from, name] of VENDOR) {
  await cp(from, resolve(dist, 'vendor', name));
}
await cp(VENDOR_FONTS, resolve(dist, 'vendor', 'fonts'), { recursive: true });

console.log('build: extension.js, dist/vendor');
