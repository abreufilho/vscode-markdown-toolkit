import * as vscode from 'vscode';
import {
  changeHeadingLevel,
  collapseDisplayMathLine,
  cycleListMarker,
  cycleMath,
  isLinkTarget,
  isWrapped,
  unwrap,
  wrap,
} from './lib/edits';
import { setting } from './lib/settings';

/**
 * Edits every selection in one pass, so an edit does not shift the selections
 * that follow it. Each entry records how many characters the edit added or
 * removed, and later selections are translated by the running total.
 */
function shiftedSelection(
  editor: vscode.TextEditor,
  index: number,
  shifts: number[]
): vscode.Selection {
  const selection = editor.selections[index];
  if (!selection) throw new Error(`no selection at ${index}`);

  const shift = shifts[index] ?? 0;
  return new vscode.Selection(
    selection.start.translate(0, shift),
    selection.end.translate(0, shift)
  );
}

function addShift(shifts: number[], from: number, delta: number): void {
  for (let index = from + 1; index < shifts.length; index += 1) {
    shifts[index] = (shifts[index] ?? 0) + delta;
  }
}

/** The wrapper that already surrounds the selection, if it sits just outside it. */
function surroundingWrapper(
  document: vscode.TextDocument,
  selection: vscode.Selection,
  wrapper: string
): vscode.Range | null {
  const start = document.offsetAt(selection.start);
  const end = document.offsetAt(selection.end);
  if (start < wrapper.length) return null;

  const before = document.getText(
    new vscode.Range(document.positionAt(start - wrapper.length), selection.start)
  );
  const after = document.getText(
    new vscode.Range(selection.end, document.positionAt(end + wrapper.length))
  );

  return before === wrapper && after === wrapper
    ? new vscode.Range(
        document.positionAt(start - wrapper.length),
        document.positionAt(end + wrapper.length)
      )
    : null;
}

async function toggleWrapping(wrapper: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await editor.edit((builder) => {
    const shifts = new Array<number>(editor.selections.length).fill(0);
    const added = wrapper.length * 2;

    for (let index = 0; index < editor.selections.length; index += 1) {
      const selection = shiftedSelection(editor, index, shifts);
      const text = editor.document.getText(selection);

      if (isWrapped(text, wrapper)) {
        builder.replace(selection, unwrap(text, wrapper));
        addShift(shifts, index, -added);
        continue;
      }

      if (selection.isEmpty) {
        const word = editor.document.getWordRangeAtPosition(selection.start);
        if (!word) {
          builder.insert(selection.start, wrapper + wrapper);
          addShift(shifts, index, added);
          continue;
        }

        const wordText = editor.document.getText(word);
        const wrapped = isWrapped(wordText, wrapper);
        builder.replace(word, wrapped ? unwrap(wordText, wrapper) : wrap(wordText, wrapper));
        addShift(shifts, index, wrapped ? -added : added);
        continue;
      }

      const surrounding = surroundingWrapper(editor.document, selection, wrapper);
      if (surrounding) {
        builder.replace(surrounding, unwrap(editor.document.getText(surrounding), wrapper));
        addShift(shifts, index, -added);
      } else {
        builder.replace(selection, wrap(text, wrapper));
        addShift(shifts, index, added);
      }
    }
  });
}

/** Applies a line rewrite to the line each selection starts on. */
async function editLines(rewrite: (line: string) => string | null): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await editor.edit((builder) => {
    for (const selection of editor.selections) {
      const line = editor.document.lineAt(selection.start.line);
      const replacement = rewrite(line.text);
      if (replacement !== null) builder.replace(line.range, replacement);
    }
  });
}

async function toggleCodeBlock(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await editor.edit((builder) => {
    for (const selection of editor.selections) {
      const text = editor.document.getText(selection);
      const fenced = text.startsWith('```') && text.endsWith('```');
      const opened = text.indexOf('\n');
      const closed = text.lastIndexOf('\n');

      builder.replace(
        selection,
        fenced && opened !== closed ? text.slice(opened + 1, closed) : '```\n' + text + '\n```'
      );
    }
  });
}

async function toggleMath(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  await editor.edit((builder) => {
    for (const selection of editor.selections) {
      if (!selection.isEmpty) {
        builder.replace(selection, cycleMath(editor.document.getText(selection)));
        continue;
      }

      const line = editor.document.lineAt(selection.start.line);
      const collapsed = collapseDisplayMathLine(line.text);
      if (collapsed === null) builder.insert(selection.start, '$$');
      else builder.replace(line.range, collapsed);
    }
  });
}

async function pasteAsLink(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const clipboard = (await vscode.env.clipboard.readText()).trim();
  if (!isLinkTarget(clipboard)) {
    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
    return;
  }

  await editor.edit((builder) => {
    for (const selection of editor.selections) {
      if (selection.isEmpty) builder.insert(selection.start, `[](${clipboard})`);
      else builder.replace(selection, `[${editor.document.getText(selection)}](${clipboard})`);
    }
  });
}

export function activate(context: vscode.ExtensionContext): void {
  const commands: Record<string, () => Promise<void>> = {
    'markdownToolkit.toggleBold': () => toggleWrapping(setting('bold.indicator', '**')),
    'markdownToolkit.toggleItalic': () => toggleWrapping(setting('italic.indicator', '*')),
    'markdownToolkit.toggleStrikethrough': () => toggleWrapping('~~'),
    'markdownToolkit.toggleCodeSpan': () => toggleWrapping('`'),
    'markdownToolkit.toggleCodeBlock': toggleCodeBlock,
    'markdownToolkit.toggleMath': toggleMath,
    'markdownToolkit.headingUp': () => editLines((line) => changeHeadingLevel(line, 1)),
    'markdownToolkit.headingDown': () => editLines((line) => changeHeadingLevel(line, -1)),
    'markdownToolkit.toggleList': () => editLines(cycleListMarker),
    'markdownToolkit.paste': pasteAsLink,
  };

  for (const [name, run] of Object.entries(commands)) {
    context.subscriptions.push(vscode.commands.registerCommand(name, run));
  }
}
