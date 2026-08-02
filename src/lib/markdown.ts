import katex from '@neilsustc/markdown-it-katex';
import hljs from 'highlight.js';
import type MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

/**
 * Adds the plugins the built-in preview lacks: task lists and KaTeX. Applied
 * both to the editor's preview and to the exported page, so the two agree.
 */
export function extendMarkdownIt(md: MarkdownIt): MarkdownIt {
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
