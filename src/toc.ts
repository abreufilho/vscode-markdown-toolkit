import * as vscode from 'vscode';
import { setting } from './lib/settings';
import type { SlugifyMode } from './lib/slugify';
import {
  buildToc,
  extractHeadings,
  findTocRange,
  numberHeadings,
  parseLevelRange,
  unnumberHeadings,
  type Heading,
  type HeadingRewrite,
  type LineRange,
  type TocOptions,
} from './lib/toc';

function documentLines(document: vscode.TextDocument): string[] {
  return Array.from({ length: document.lineCount }, (_, line) => document.lineAt(line).text);
}

function headingsOf(document: vscode.TextDocument): Heading[] {
  return extractHeadings(documentLines(document));
}

function tocOptions(): TocOptions {
  const [minLevel, maxLevel] = parseLevelRange(setting('toc.levels', '1..6'));
  return {
    minLevel,
    maxLevel,
    ordered: setting('toc.orderedList', false),
    slugifyMode: setting<SlugifyMode>('toc.slugifyMode', 'github'),
  };
}

function tocRange(document: vscode.TextDocument): vscode.Range | null {
  const range = findTocRange(documentLines(document));
  if (!range) return null;
  return new vscode.Range(
    range.startLine,
    0,
    range.endLine,
    document.lineAt(range.endLine).text.length
  );
}

function renderToc(document: vscode.TextDocument): string {
  return buildToc(headingsOf(document), tocOptions());
}

async function createToc(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const toc = renderToc(editor.document);
  await editor.edit((builder) => builder.insert(editor.selection.active, toc));
}

async function updateToc(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const range = tocRange(editor.document);
  if (!range) return;
  await editor.edit((builder) => builder.replace(range, renderToc(editor.document)));
}

async function applyRewrites(rewrites: HeadingRewrite[]): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  await editor.edit((builder) => {
    for (const rewrite of rewrites) {
      builder.replace(editor.document.lineAt(rewrite.line).range, rewrite.text);
    }
  });
}

async function addSectionNumbers(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const { minLevel, maxLevel } = tocOptions();
  await applyRewrites(numberHeadings(headingsOf(editor.document), minLevel, maxLevel));
}

async function removeSectionNumbers(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  await applyRewrites(unnumberHeadings(headingsOf(editor.document)));
}

/** A lens on the markers, so the list can be refreshed without the palette. */
const codeLensProvider: vscode.CodeLensProvider = {
  provideCodeLenses(document) {
    const range = tocRange(document);
    if (!range) return [];
    return [new vscode.CodeLens(range, { title: 'Update TOC', command: 'mdaio.tocUpdate' })];
  },
};

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mdaio.tocCreate', createToc),
    vscode.commands.registerCommand('mdaio.tocUpdate', updateToc),
    vscode.commands.registerCommand('mdaio.secNumbersAdd', addSectionNumbers),
    vscode.commands.registerCommand('mdaio.secNumbersRemove', removeSectionNumbers),
    vscode.languages.registerCodeLensProvider({ language: 'markdown' }, codeLensProvider),
    // Read on each save rather than at activation, so turning the setting on
    // takes effect without reloading the window.
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (event.document.languageId !== 'markdown') return;
      if (!setting('toc.updateOnSave', true)) return;

      const range: LineRange | null = findTocRange(documentLines(event.document));
      if (!range) return;

      const target = new vscode.Range(
        range.startLine,
        0,
        range.endLine,
        event.document.lineAt(range.endLine).text.length
      );
      event.waitUntil(
        Promise.resolve([vscode.TextEdit.replace(target, renderToc(event.document))])
      );
    })
  );
}
