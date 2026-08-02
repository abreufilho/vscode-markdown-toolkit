# Contributing

## Maintenance Status

This is a personal project. Issues and pull requests are welcome, and I read
them, but I answer when I have time. Treat a fork as a valid outcome rather than
a last resort.

## Local Setup

```bash
npm ci
npm test          # type-checks, then compiles and runs the unit tests
npm run lint
npm run format:check
npm run build     # produces extension.js and dist/
```

Press `F5` in VS Code to launch an Extension Development Host with the extension
loaded.

## Layout

Logic that does not need the editor lives under `src/lib/` and is unit tested;
the modules beside it hold the VS Code wiring. A change to how markdown is read
or rewritten belongs in `src/lib/`, with a test.

## Before Opening a Pull Request

Run `npm run lint`, `npm run format:check` and `npm test`. CI runs the same
checks plus `vsce package`, which catches manifest and `.vscodeignore` mistakes
that the other steps miss.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
Explain in the body why the change is needed, not what the diff already shows.

## Scope

The extension helps with writing markdown in the editor and exporting it.
Changes that add telemetry or load anything over the network fall outside that
scope.
