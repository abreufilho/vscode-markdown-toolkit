import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { imageSize } from 'image-size';
import * as vscode from 'vscode';
import {
  collectReferences,
  commandSnippet,
  ENVIRONMENT_NAMES,
  IMAGE_EXTENSIONS,
  isAnchorPrefix,
  isEnvironmentPrefix,
  isReferencePrefix,
  matchMathCommands,
  matchPathPrefix,
} from './lib/completion';
import { setting } from './lib/settings';
import { slugify, uniqueSlug, type SlugifyMode } from './lib/slugify';
import { extractHeadings } from './lib/toc';

const { CompletionItem, CompletionItemKind, SnippetString } = vscode;

function documentLines(document: vscode.TextDocument): string[] {
  return Array.from({ length: document.lineCount }, (_, line) => document.lineAt(line).text);
}

function mathItems(prefix: string): vscode.CompletionItem[] | null {
  const commands = matchMathCommands(prefix);
  if (!commands) return null;

  return commands.map((command) => {
    const item = new CompletionItem(command, CompletionItemKind.Function);
    item.insertText = command.includes('{}')
      ? new SnippetString(commandSnippet(command))
      : command.slice(1);
    return item;
  });
}

function environmentItems(prefix: string): vscode.CompletionItem[] | null {
  if (!isEnvironmentPrefix(prefix)) return null;

  return ENVIRONMENT_NAMES.map((environment) => {
    const item = new CompletionItem(environment, CompletionItemKind.Snippet);
    item.insertText = new SnippetString(`${environment}}\n$0\n\\\\end{${environment}}`);
    return item;
  });
}

function anchorItems(
  document: vscode.TextDocument,
  prefix: string
): vscode.CompletionItem[] | null {
  if (!isAnchorPrefix(prefix)) return null;

  const mode = setting<SlugifyMode>('toc.slugifyMode', 'github');
  const seen = new Map<string, number>();

  return extractHeadings(documentLines(document)).map((heading) => {
    const slug = uniqueSlug(slugify(heading.text, mode), seen);
    const item = new CompletionItem(`#${slug}`, CompletionItemKind.Reference);
    item.detail = heading.text;
    item.insertText = slug;
    return item;
  });
}

async function imageDetail(file: string): Promise<string | undefined> {
  try {
    const { width, height } = imageSize(await fs.readFile(file));
    return width && height ? `${width}×${height}` : undefined;
  } catch {
    return undefined;
  }
}

async function pathItems(
  document: vscode.TextDocument,
  prefix: string
): Promise<vscode.CompletionItem[] | null> {
  const match = matchPathPrefix(prefix);
  if (!match) return null;

  const documentDirectory = path.dirname(document.uri.fsPath);
  const directory = match.typed.includes('/')
    ? path.resolve(documentDirectory, path.dirname(match.typed))
    : documentDirectory;

  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return null;
  }

  const visible = entries.filter((entry) => {
    if (entry.name.startsWith('.')) return false;
    if (match.image && entry.isFile()) {
      return IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
    }
    return true;
  });

  return Promise.all(
    visible.map(async (entry) => {
      const directoryEntry = entry.isDirectory();
      const item = new CompletionItem(
        entry.name,
        directoryEntry ? CompletionItemKind.Folder : CompletionItemKind.File
      );

      if (directoryEntry) {
        item.insertText = `${entry.name}/`;
      } else if (match.image) {
        const detail = await imageDetail(path.join(directory, entry.name));
        if (detail) item.detail = detail;
      }

      return item;
    })
  );
}

function referenceItems(
  document: vscode.TextDocument,
  prefix: string
): vscode.CompletionItem[] | null {
  if (!isReferencePrefix(prefix)) return null;

  return [...collectReferences(documentLines(document))].map(([label, url]) => {
    const item = new CompletionItem(label, CompletionItemKind.Reference);
    item.detail = url;
    return item;
  });
}

const provider: vscode.CompletionItemProvider = {
  provideCompletionItems(document, position) {
    const prefix = document.lineAt(position.line).text.slice(0, position.character);

    return (
      mathItems(prefix) ??
      environmentItems(prefix) ??
      anchorItems(document, prefix) ??
      referenceItems(document, prefix) ??
      pathItems(document, prefix)
    );
  },
};

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'markdown' },
      provider,
      '\\',
      '(',
      '[',
      '/',
      '#'
    )
  );
}
