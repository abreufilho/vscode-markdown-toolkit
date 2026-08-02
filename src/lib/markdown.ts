import katex from '@neilsustc/markdown-it-katex';
import hljs from 'highlight.js';
import taskLists from 'markdown-it-task-lists';

/**
 * A markdown-it instance. Since version 15 the package ships its own types, and
 * the default export is the constructor; the instance type is a member of the
 * namespace merged onto it.
 */
export type MarkdownItInstance = import('markdown-it').MarkdownIt;

/**
 * Adds the plugins the built-in preview lacks: task lists and KaTeX. Applied
 * both to the editor's preview and to the exported page, so the two agree.
 */
export function extendMarkdownIt(md: MarkdownItInstance): MarkdownItInstance {
  return md.use(taskLists, { enabled: true, label: true }).use(katex);
}

/** Highlights a fenced block, falling back to no highlighting. */
export function highlight(code: string, language: string): string {
  if (!language || !hljs.getLanguage(language)) return '';
  try {
    return hljs.highlight(code, { language }).value;
  } catch {
    return '';
  }
}
