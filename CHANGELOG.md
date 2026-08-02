# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-02

First public release.

### Added

- Formatting commands for bold, italic, strikethrough, code spans, code blocks,
  math, heading levels, list markers and pasting a URL as a link.
- List editing on Enter, Tab, Shift+Tab and Backspace, with ordered lists that
  renumber themselves, and a command to toggle a task item.
- Table formatting that pads columns by the width they occupy, so CJK text and
  emoji line up; available from the command and from Format Document.
- A table of contents between markers, kept up to date on save, with GitHub,
  GitLab and Gitea anchors and optional section numbers.
- Completions for KaTeX commands and environments, heading anchors, link
  reference labels and workspace paths, with image dimensions.
- Task lists and KaTeX in the built-in markdown preview.
- Export to a self-contained HTML file, with stylesheets, fonts and optionally
  images embedded.
