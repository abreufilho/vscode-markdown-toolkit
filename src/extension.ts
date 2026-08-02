import type * as vscode from 'vscode';
import * as completion from './completion';
import * as formatting from './formatting';
import { extendMarkdownIt, type MarkdownItInstance } from './lib/markdown';
import * as listEditing from './listEditing';
import * as print from './print';
import * as syntaxDecorations from './syntaxDecorations';
import * as tableFormatter from './tableFormatter';
import * as toc from './toc';

export function activate(context: vscode.ExtensionContext): void {
  formatting.activate(context);
  listEditing.activate(context);
  toc.activate(context);
  tableFormatter.activate(context);
  completion.activate(context);
  print.activate(context);
  syntaxDecorations.activate(context);
}

export function deactivate(): void {}

/** Called by the built-in preview to extend its renderer. */
export { extendMarkdownIt };

export type { MarkdownItInstance };
