import * as fs from 'node:fs';
import * as path from 'node:path';

export type PrintTheme = 'light' | 'dark';

/** Reads a font or image referenced by the vendored stylesheets. */
export type ReadAsset = (assetPath: string) => Buffer;

const MIME_TYPES: Record<string, string> = {
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/** A url() that points at a file on disk, rather than at data or a host. */
const LOCAL_URL = /url\((["']?)(?!data:|https?:|#)([^"')]+)\1\)/g;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rewrites the files a stylesheet points at as data URIs, so the exported page
 * carries its fonts instead of depending on paths that only exist here.
 */
export function inlineCssAssets(
  css: string,
  baseDirectory: string,
  readAsset: ReadAsset = fs.readFileSync
): string {
  return css.replace(LOCAL_URL, (_match: string, _quote: string, asset: string) => {
    const assetPath = path.resolve(baseDirectory, asset);
    const mime =
      MIME_TYPES[path.extname(assetPath).toLowerCase()] ?? 'application/octet-stream';
    return `url("data:${mime};base64,${readAsset(assetPath).toString('base64')}")`;
  });
}

/** Loads the vendored KaTeX and highlight.js stylesheets for the theme. */
export function loadLocalStyles(extensionRoot: string, theme: PrintTheme): string {
  const vendor = path.join(extensionRoot, 'dist', 'vendor');
  const highlight = theme === 'dark' ? 'github-dark.min.css' : 'github.min.css';

  return [
    inlineCssAssets(fs.readFileSync(path.join(vendor, 'katex.min.css'), 'utf8'), vendor),
    fs.readFileSync(path.join(vendor, highlight), 'utf8'),
  ].join('\n');
}

const TITLE_COMMENT = /^<!--\s*title:\s*(.+?)\s*-->/m;
const FIRST_HEADING = /^#\s+(.+)/m;
const IMG_SRC = /(<img[^>]*\ssrc=["'])([^"']+)(["'][^>]*>)/g;
const MARKDOWN_HREF = /(<a[^>]*\shref=["'])([^"']+\.md)(["'][^>]*>)/g;

/** The exported page's title: an explicit comment, else the first heading. */
export function extractTitle(markdown: string): string {
  return markdown.match(TITLE_COMMENT)?.[1] ?? markdown.match(FIRST_HEADING)?.[1] ?? 'Untitled';
}

/** Replaces a rendered image source; returning null leaves it as it is. */
export type ResolveImage = (source: string) => string | null;

/**
 * Rewrites the images of a rendered page. A source that already points at data
 * or at a host is left alone, since it resolves the same way anywhere.
 */
export function rewriteImageSources(html: string, resolve: ResolveImage): string {
  return html.replace(IMG_SRC, (match, before: string, source: string, after: string) => {
    if (source.startsWith('data:') || source.startsWith('http')) return match;
    const resolved = resolve(source);
    return resolved === null ? match : `${before}${resolved}${after}`;
  });
}

/**
 * Whether a link points at a file inside a GitHub repository, where the `.md`
 * source is what a reader expects to land on.
 *
 * The host is compared after parsing rather than searched for in the string: as
 * a substring, `github.com` matches `github.com.example.org` and
 * `example.org/?to=github.com` just as happily.
 */
function isRepositoryBlobLink(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    // A relative link, which names a neighbour rather than a repository.
    return false;
  }

  const host = url.hostname.toLowerCase();
  return (
    (host === 'github.com' || host.endsWith('.github.com')) && url.pathname.includes('/blob/')
  );
}

/**
 * Points links at the exported neighbours rather than at the sources, so a set
 * of documents exported together still links up. Links into a repository are
 * left alone.
 */
export function rewriteMarkdownLinks(html: string): string {
  return html.replace(MARKDOWN_HREF, (match, before: string, href: string, after: string) =>
    isRepositoryBlobLink(href) ? match : `${before}${href.replace(/\.md$/i, '.html')}${after}`
  );
}

/** Assembles a self-contained page: every style is embedded, nothing is fetched. */
export function buildHtml(
  title: string,
  body: string,
  theme: PrintTheme,
  vendorStyles: string
): string {
  const dark = theme === 'dark';
  const fg = dark ? '#c9d1d9' : '#24292f';
  const bg = dark ? '#0d1117' : '#fff';
  const surface = dark ? '#161b22' : '#f6f8fa';
  const border = dark ? '#30363d' : '#d0d7de';
  const muted = dark ? '#8b949e' : '#57606a';
  const link = dark ? '#58a6ff' : '#0969da';

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
${vendorStyles}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:900px;margin:0 auto;padding:2rem;line-height:1.6;color:${fg};background:${bg}}
pre{padding:1rem;border-radius:6px;overflow-x:auto;background:${surface}}
code{font-family:'SFMono-Regular',Consolas,monospace;font-size:.9em}
:not(pre)>code{padding:.2em .4em;border-radius:3px;background:${surface}}
table{border-collapse:collapse;width:100%}th,td{border:1px solid ${border};padding:6px 13px}
th{background:${surface}}img{max-width:100%}
blockquote{border-left:4px solid ${border};margin:0;padding:0 1rem;color:${muted}}
a{color:${link}}hr{border:none;border-top:1px solid ${border}}
input[type=checkbox]{margin-right:.5em}
</style></head><body>
${body}
</body></html>`;
}
