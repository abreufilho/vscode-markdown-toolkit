import * as vscode from 'vscode';
import { findTables, formatTable } from './lib/table';

function tableEdits(document: vscode.TextDocument, range?: vscode.Range): vscode.TextEdit[] {
  const lines = Array.from(
    { length: document.lineCount },
    (_, line) => document.lineAt(line).text
  );
  const from = range ? range.start.line : 0;
  const to = range ? range.end.line : document.lineCount - 1;

  return findTables(lines, from, to).map((table) =>
    vscode.TextEdit.replace(
      new vscode.Range(
        table.startLine,
        0,
        table.endLine,
        document.lineAt(table.endLine).text.length
      ),
      formatTable(table).join('\n')
    )
  );
}

async function formatTables(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const edits = tableEdits(editor.document);
  if (edits.length === 0) return;

  await editor.edit((builder) => {
    for (const edit of edits) builder.replace(edit.range, edit.newText);
  });
}

export function activate(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = { language: 'markdown' };

  context.subscriptions.push(
    vscode.commands.registerCommand('mdaio.formatTable', formatTables),
    vscode.languages.registerDocumentFormattingEditProvider(selector, {
      provideDocumentFormattingEdits: (document) => tableEdits(document),
    }),
    vscode.languages.registerDocumentRangeFormattingEditProvider(selector, {
      provideDocumentRangeFormattingEdits: (document, range) => tableEdits(document, range),
    })
  );
}
