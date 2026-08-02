# Markdown Toolkit

[![CI](https://github.com/abreufilho/vscode-markdown-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/abreufilho/vscode-markdown-toolkit/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/abreufilho/vscode-markdown-toolkit?color=blue)](https://github.com/abreufilho/vscode-markdown-toolkit/releases/latest)
[![License](https://img.shields.io/github/license/abreufilho/vscode-markdown-toolkit?color=blue)](LICENSE)

Editing helpers for markdown: formatting shortcuts, list and table handling, a
table of contents, completions, KaTeX and task lists in the preview, and export
to a self-contained HTML file.

Everything runs locally. The stylesheets and fonts the export embeds ship inside
the extension, so an exported page needs no network to render.

## Requirements

VS Code 1.80 or later.

## Installation

Download the `.vsix` from the [latest release](https://github.com/abreufilho/vscode-markdown-toolkit/releases/latest)
and install it:

```bash
code --install-extension markdown-toolkit-<version>.vsix
```

## Features

**Formatting** — toggle bold, italic, strikethrough, code spans, code blocks and
math on the selection or the word under the cursor. Raise and lower headings,
cycle list markers, and paste a URL over a selection to make a link.

**Lists** — Enter continues the list or quote, and clears an item left empty.
Tab and Shift+Tab indent, Backspace at the marker outdents, and ordered lists
renumber themselves. Task list items toggle from a command.

**Tables** — format a table so its columns line up, counting CJK text and emoji
by the width they occupy. Runs from the command, from Format Document, and from
Format Selection.

**Table of contents** — build one between markers, keep it up to date on save,
and refresh it from a code lens. Anchors follow GitHub, GitLab or Gitea. Section
numbers can be added and removed.

**Completions** — KaTeX commands and environments, heading anchors, link
reference labels, and paths from the workspace, with the dimensions of an image
shown beside its name.

**Preview** — task lists and KaTeX in the built-in markdown preview.

**Export** — write the document as one HTML file with the styles, the fonts and,
if you ask for it, the images embedded. Links between markdown documents point
at their exported neighbours.

## Commands

| Command                          | Default keybinding           |
| -------------------------------- | ---------------------------- |
| `Markdown: Toggle Bold`          | <kbd>Ctrl</kbd>+<kbd>B</kbd> |
| `Markdown: Toggle Italic`        | <kbd>Ctrl</kbd>+<kbd>I</kbd> |
| `Markdown: Toggle Strikethrough` | <kbd>Alt</kbd>+<kbd>S</kbd>  |
| `Markdown: Toggle Math`          | <kbd>Alt</kbd>+<kbd>M</kbd>  |
| `Markdown: Toggle Task Check`    | <kbd>Alt</kbd>+<kbd>C</kbd>  |

<kbd>Enter</kbd>, <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd> and
<kbd>Backspace</kbd> gain list behaviour inside a markdown editor, and fall back
to what the editor would otherwise do.

The rest of the commands are in the Command Palette under `Markdown:`.

## Settings

| Setting                                    | Default   | Effect                                                    |
| ------------------------------------------ | --------- | --------------------------------------------------------- |
| `markdownToolkit.bold.indicator`           | `**`      | Characters used to toggle bold                            |
| `markdownToolkit.italic.indicator`         | `*`       | Characters used to toggle italic                          |
| `markdownToolkit.toc.levels`               | `1..6`    | Heading levels the table of contents keeps                |
| `markdownToolkit.toc.orderedList`          | `false`   | Number the entries instead of bulleting them              |
| `markdownToolkit.toc.updateOnSave`         | `true`    | Refresh an existing table of contents when the file saves |
| `markdownToolkit.toc.slugifyMode`          | `github`  | Anchor flavour: `github`, `gitlab` or `gitea`             |
| `markdownToolkit.orderedList.marker`       | `ordered` | `one` keeps every item numbered `1.`                      |
| `markdownToolkit.orderedList.autoRenumber` | `true`    | Renumber a list after it is edited                        |
| `markdownToolkit.syntax.decorations`       | `true`    | Style emphasis and dim its markers in the editor          |
| `markdownToolkit.print.theme`              | `light`   | Theme of the exported page                                |
| `markdownToolkit.print.imgToBase64`        | `false`   | Embed images instead of linking to them                   |

## Privacy

Everything runs locally. The extension performs no network requests and collects
no telemetry.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the local setup and the checks that
run before a pull request. Participation follows the
[Code of Conduct](CODE_OF_CONDUCT.md). To report a vulnerability, see the
[security policy](SECURITY.md).

## Third-Party

[KaTeX](https://github.com/KaTeX/KaTeX) stylesheets and fonts and
[highlight.js](https://github.com/highlightjs/highlight.js) themes ship as files
under `dist/vendor/`; their licences are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The bundled JavaScript carries
its licences at the end of `extension.js`.

## License

[MIT](LICENSE) © [Antonio Abreu Filho](https://abreufilho.com.br)
