import { existsSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import MarkdownIt from 'markdown-it';
import * as vscode from 'vscode';
import { extendMarkdownIt, highlight } from './lib/markdown';
import {
  buildHtml,
  extractTitle,
  loadLocalStyles,
  rewriteImageSources,
  rewriteMarkdownLinks,
  type PrintTheme,
} from './lib/printHtml';
import { setting } from './lib/settings';

function imageMimeType(file: string): string {
  const extension = path.extname(file).slice(1).toLowerCase();
  return extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
}

/**
 * Points an image at a file the exported page can reach. Embedding the bytes
 * makes the page portable; a file URL keeps it small but ties it to this
 * machine. A source that does not resolve is left as the author wrote it.
 */
function resolveImage(
  source: string,
  documentDirectory: string,
  embed: boolean
): string | null {
  const absolute = path.resolve(documentDirectory, source);
  if (!existsSync(absolute)) return null;

  return embed
    ? `data:${imageMimeType(absolute)};base64,${readFileSync(absolute).toString('base64')}`
    : `file:///${absolute.replace(/\\/g, '/')}`;
}

function createRenderer(): MarkdownIt {
  return extendMarkdownIt(new MarkdownIt({ html: true, linkify: true, highlight }));
}

async function printToHtml(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    void vscode.window.showWarningMessage('Open a markdown document first.');
    return;
  }
  if (editor.document.isDirty) await editor.document.save();

  const markdown = editor.document.getText();
  const documentDirectory = path.dirname(editor.document.uri.fsPath);
  const theme = setting<PrintTheme>('print.theme', 'light');
  const embedImages = setting('print.imgToBase64', false);

  const rendered = rewriteMarkdownLinks(
    rewriteImageSources(createRenderer().render(markdown), (source) =>
      resolveImage(source, documentDirectory, embedImages)
    )
  );

  const html = buildHtml(
    extractTitle(markdown),
    rendered,
    theme,
    loadLocalStyles(context.extensionUri.fsPath, theme)
  );

  const output = editor.document.uri.fsPath.replace(/\.md$/i, '.html');
  await writeFile(output, html, 'utf8');

  const choice = await vscode.window.showInformationMessage(
    `Exported to ${path.basename(output)}`,
    'Open in Browser',
    'Open in Editor'
  );

  if (choice === 'Open in Browser') void vscode.env.openExternal(vscode.Uri.file(output));
  else if (choice === 'Open in Editor')
    void vscode.window.showTextDocument(vscode.Uri.file(output));
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownToolkit.exportHtml', () => printToHtml(context))
  );
}
