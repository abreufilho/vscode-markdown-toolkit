/*
 * The two markdown-it plugins this extension adds ship no type declarations.
 * Declaring them as plugins is enough: neither is called with anything beyond
 * what markdown-it already types.
 */

declare module 'markdown-it-task-lists' {
  import type { PluginWithOptions } from 'markdown-it';

  interface TaskListsOptions {
    /** Render the checkboxes rather than leaving the brackets as text. */
    enabled?: boolean;
    /** Wrap the item in a label, so its text toggles the checkbox. */
    label?: boolean;
  }

  const taskLists: PluginWithOptions<TaskListsOptions>;
  export default taskLists;
}

declare module '@neilsustc/markdown-it-katex' {
  import type { PluginSimple } from 'markdown-it';

  const katex: PluginSimple;
  export default katex;
}
