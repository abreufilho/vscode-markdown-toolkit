# Security Policy

## Supported Versions

The latest release receives fixes. Older versions do not.

## Reporting a Vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/abreufilho/vscode-markdown-aio/security/advisories/new).
Please do not open a public issue for a vulnerability.

This is a personal project maintained on a best-effort basis. There is no
response time commitment. If a report needs a fix that I cannot make, I will say
so rather than leave it open.

## Scope

The extension reads markdown the user opens and writes an HTML file beside it.
That content is untrusted, so:

- the exported page embeds its stylesheets and fonts and references no origin,
  so opening it makes no request;
- the page title is escaped before it is written into the markup;
- nothing is fetched over the network, at any point.

The exported page renders the document with `html: true`, which is what the
built-in preview does as well: inline HTML written in the document reaches the
output. Do not export a document you would not open in a browser.

Rendering is delegated to markdown-it, KaTeX and highlight.js. A flaw in how
they parse input belongs upstream, but report it here as well and I will forward
it.
