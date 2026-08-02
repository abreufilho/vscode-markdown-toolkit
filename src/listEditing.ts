import * as vscode from 'vscode';
import { enterAction, itemPrefix, renumberFrom, toggleTaskMark } from './lib/listEditing';
import { setting } from './lib/settings';

function documentLines(document: vscode.TextDocument): string[] {
  return Array.from({ length: document.lineCount }, (_, line) => document.lineAt(line).text);
}

async function renumber(editor: vscode.TextEditor, startLine: number): Promise<void> {
  if (!setting('orderedList.autoRenumber', true)) return;

  const rewrites = renumberFrom(documentLines(editor.document), startLine);
  if (rewrites.length === 0) return;

  await editor.edit((builder) => {
    for (const rewrite of rewrites) {
      builder.replace(editor.document.lineAt(rewrite.line).range, rewrite.text);
    }
  });
}

async function onEnterKey(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const cursor = editor.selection.active;
  const line = editor.document.lineAt(cursor.line);
  const action = enterAction(
    line.text,
    setting<string>('orderedList.marker', 'ordered') === 'one'
  );

  switch (action.kind) {
    case 'clearLine':
      await editor.edit((builder) => builder.replace(line.range, ''));
      return;
    case 'insert':
      await editor.edit((builder) => builder.insert(cursor, action.text));
      await renumber(editor, cursor.line + 1);
      return;
    default:
      await vscode.commands.executeCommand('type', { text: '\n' });
  }
}

async function onBackspaceKey(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.selection;
  const line = editor.document.lineAt(selection.active.line);
  const prefix = selection.isEmpty ? itemPrefix(line.text) : null;

  // Backspace at the end of the marker outdents or unmarks the item; anywhere
  // else it deletes a character, as the editor would.
  if (!prefix || selection.active.character !== prefix.length) {
    await vscode.commands.executeCommand('deleteLeft');
    return;
  }

  if (prefix.indent > 0) {
    await indentList(false);
  } else {
    await editor.edit((builder) => builder.replace(line.range, line.text.slice(prefix.length)));
  }
}

async function indentList(increase: boolean): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const tabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 2;

  await editor.edit((builder) => {
    for (const selection of editor.selections) {
      for (let line = selection.start.line; line <= selection.end.line; line += 1) {
        if (increase) {
          builder.insert(new vscode.Position(line, 0), ' '.repeat(tabSize));
          continue;
        }

        const indent = editor.document.lineAt(line).text.match(/^(\s+)/);
        if (indent?.[1]) {
          builder.delete(new vscode.Range(line, 0, line, Math.min(indent[1].length, tabSize)));
        }
      }
    }
  });

  for (const selection of editor.selections) {
    await renumber(editor, selection.start.line);
  }
}

async function checkTaskList(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await editor.edit((builder) => {
    for (const selection of editor.selections) {
      for (let line = selection.start.line; line <= selection.end.line; line += 1) {
        const toggled = toggleTaskMark(editor.document.lineAt(line).text);
        if (!toggled) continue;
        builder.replace(
          new vscode.Range(line, toggled.column, line, toggled.column + 3),
          toggled.text
        );
      }
    }
  });
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mdaio.onEnterKey', onEnterKey),
    vscode.commands.registerCommand('mdaio.onTabKey', () => indentList(true)),
    vscode.commands.registerCommand('mdaio.onShiftTabKey', () => indentList(false)),
    vscode.commands.registerCommand('mdaio.onBackspaceKey', onBackspaceKey),
    vscode.commands.registerCommand('mdaio.checkTaskList', checkTaskList)
  );
}
