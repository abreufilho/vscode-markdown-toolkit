import * as vscode from 'vscode';

/** Reads one of this extension's settings, scoped to the active document. */
export function setting<T>(key: string, fallback: T): T {
  const resource = vscode.window.activeTextEditor?.document.uri;
  return vscode.workspace.getConfiguration('markdownToolkit', resource).get<T>(key, fallback);
}
