import * as vscode from 'vscode';
import { setting } from './lib/settings';

interface Rule {
  type: vscode.TextEditorDecorationType;
  pattern: RegExp;
  /** Capture group to decorate; without one the whole match is decorated. */
  group?: number;
}

const MARKER_OPACITY = '0.4';
const HEADING_OPACITY = '0.5';
const FENCE = /^(`{3,}|~{3,})/;

function createRules(): Rule[] {
  return [
    {
      type: vscode.window.createTextEditorDecorationType({ fontWeight: 'bold' }),
      pattern: /(?<!\*)\*\*(?!\*)(.+?)(?<!\*)\*\*(?!\*)/g,
      group: 1,
    },
    {
      type: vscode.window.createTextEditorDecorationType({ fontStyle: 'italic' }),
      pattern: /(?<![*_])([*_])(?![*_])(.+?)(?<![*_])\1(?![*_])/g,
      group: 2,
    },
    {
      type: vscode.window.createTextEditorDecorationType({ textDecoration: 'line-through' }),
      pattern: /~~(.+?)~~/g,
      group: 1,
    },
    {
      type: vscode.window.createTextEditorDecorationType({
        backgroundColor: new vscode.ThemeColor('textCodeBlock.background'),
        borderRadius: '3px',
      }),
      pattern: /(?<!`)(`+)(?!`)(.+?)(?<!`)\1(?!`)/g,
      group: 2,
    },
    {
      type: vscode.window.createTextEditorDecorationType({ opacity: HEADING_OPACITY }),
      pattern: /^(#{1,6})\s/gm,
    },
    {
      type: vscode.window.createTextEditorDecorationType({ opacity: MARKER_OPACITY }),
      pattern: /(?<!\*)\*\*(?!\*)|(?<!\*)\*(?!\*)|~~|(?<!`)(`+)(?!`)/g,
    },
  ];
}

/** Line ranges covered by fenced code, where markup is text rather than markup. */
function fencedRanges(document: vscode.TextDocument): [number, number][] {
  const ranges: [number, number][] = [];
  let start = -1;

  for (let line = 0; line < document.lineCount; line += 1) {
    if (!FENCE.test(document.lineAt(line).text)) continue;
    if (start === -1) start = line;
    else {
      ranges.push([start, line]);
      start = -1;
    }
  }

  return ranges;
}

function decorationsFor(
  editor: vscode.TextEditor,
  rule: Rule,
  text: string,
  fenced: [number, number][]
): vscode.DecorationOptions[] {
  const decorations: vscode.DecorationOptions[] = [];
  rule.pattern.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = rule.pattern.exec(text)) !== null) {
    const captured = rule.group === undefined ? match[0] : match[rule.group];
    if (captured === undefined) continue;

    const offset =
      rule.group === undefined ? match.index : match.index + match[0].indexOf(captured);
    const start = editor.document.positionAt(offset);
    if (fenced.some(([from, to]) => start.line >= from && start.line <= to)) continue;

    decorations.push({
      range: new vscode.Range(start, editor.document.positionAt(offset + captured.length)),
    });
  }

  return decorations;
}

export function activate(context: vscode.ExtensionContext): void {
  const rules = createRules();
  context.subscriptions.push(...rules.map((rule) => rule.type));

  function refresh(editor: vscode.TextEditor | undefined): void {
    if (!editor || editor.document.languageId !== 'markdown') return;

    // Read the setting on each pass, so turning decorations on or off takes
    // effect without reloading the window.
    if (!setting('syntax.decorations', true)) {
      for (const rule of rules) editor.setDecorations(rule.type, []);
      return;
    }

    const text = editor.document.getText();
    const fenced = fencedRanges(editor.document);
    for (const rule of rules) {
      editor.setDecorations(rule.type, decorationsFor(editor, rule, text, fenced));
    }
  }

  refresh(vscode.window.activeTextEditor);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(refresh),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) refresh(editor);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('markdownToolkit.syntax.decorations')) {
        refresh(vscode.window.activeTextEditor);
      }
    })
  );
}
