/*
 * The two markdown-it plugins this extension adds ship no type declarations.
 * Declaring the call signature is enough: neither is used with anything beyond
 * the instance and its own options.
 *
 * markdown-it 15 stopped exporting PluginSimple and PluginWithOptions, so the
 * signatures are written out here rather than borrowed from it.
 */

declare module 'markdown-it-task-lists' {
  interface TaskListsOptions {
    /** Render the checkboxes rather than leaving the brackets as text. */
    enabled?: boolean;
    /** Wrap the item in a label, so its text toggles the checkbox. */
    label?: boolean;
  }

  const taskLists: (md: import('markdown-it').MarkdownIt, options?: TaskListsOptions) => void;
  export default taskLists;
}

declare module '@neilsustc/markdown-it-katex' {
  const katex: (md: import('markdown-it').MarkdownIt) => void;
  export default katex;
}
