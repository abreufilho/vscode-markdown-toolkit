/** The slug flavours the table of contents can produce. */
export type SlugifyMode = 'github' | 'gitlab' | 'gitea';

/** Everything a slug drops: punctuation, symbols, and anything not a letter,
 * a digit, an underscore, whitespace or a hyphen. */
const STRIP = /[^\p{L}\p{N}_\s-]/gu;
const HTML_TAG = /<[^>]*>/g;
const WHITESPACE = /\s+/g;

/**
 * Drops inline HTML, tag and content alike, so `<em>Title</em>` slugs as
 * `title` rather than `emtitleem`.
 *
 * One pass is not enough: removing the inner tag of `<<a>script>` leaves
 * `<script>` behind. Repeating until the text stops changing reaches a string
 * that holds no tag at all.
 */
function stripHtmlTags(text: string): string {
  let current = text;
  let previous: string;

  do {
    previous = current;
    current = current.replace(HTML_TAG, '');
  } while (current !== previous);

  return current;
}

function base(heading: string): string {
  return stripHtmlTags(heading.trim().toLowerCase())
    .replace(STRIP, '')
    .replace(WHITESPACE, '-');
}

/**
 * Turns a heading into the anchor the host generates for it. GitHub and Gitea
 * agree; GitLab additionally drops trailing hyphens.
 */
export function slugify(heading: string, mode: SlugifyMode = 'github'): string {
  const slug = base(heading);
  return mode === 'gitlab' ? slug.replace(/-+$/, '') : slug;
}

/**
 * Disambiguates a repeated slug the way the hosts do, by appending the number
 * of times it has already been seen.
 */
export function uniqueSlug(slug: string, seen: Map<string, number>): string {
  const count = seen.get(slug) ?? 0;
  seen.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count}`;
}
