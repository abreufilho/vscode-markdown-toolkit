export const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.bmp',
  '.ico',
]);

/** KaTeX commands worth suggesting; `{}` marks where the cursor should land. */
export const KATEX_COMMANDS = [
  '\\alpha',
  '\\beta',
  '\\gamma',
  '\\delta',
  '\\epsilon',
  '\\zeta',
  '\\eta',
  '\\theta',
  '\\iota',
  '\\kappa',
  '\\lambda',
  '\\mu',
  '\\nu',
  '\\xi',
  '\\pi',
  '\\rho',
  '\\sigma',
  '\\tau',
  '\\upsilon',
  '\\phi',
  '\\chi',
  '\\psi',
  '\\omega',
  '\\Gamma',
  '\\Delta',
  '\\Theta',
  '\\Lambda',
  '\\Xi',
  '\\Pi',
  '\\Sigma',
  '\\Upsilon',
  '\\Phi',
  '\\Psi',
  '\\Omega',
  '\\frac{}{}',
  '\\sqrt{}',
  '\\sqrt[]{}',
  '\\sum',
  '\\prod',
  '\\int',
  '\\iint',
  '\\iiint',
  '\\lim',
  '\\inf',
  '\\sup',
  '\\log',
  '\\ln',
  '\\exp',
  '\\sin',
  '\\cos',
  '\\tan',
  '\\partial',
  '\\nabla',
  '\\forall',
  '\\exists',
  '\\nexists',
  '\\in',
  '\\notin',
  '\\subset',
  '\\subseteq',
  '\\supset',
  '\\supseteq',
  '\\cup',
  '\\cap',
  '\\setminus',
  '\\emptyset',
  '\\leq',
  '\\geq',
  '\\neq',
  '\\approx',
  '\\equiv',
  '\\sim',
  '\\propto',
  '\\infty',
  '\\pm',
  '\\mp',
  '\\times',
  '\\div',
  '\\cdot',
  '\\circ',
  '\\hat{}',
  '\\bar{}',
  '\\vec{}',
  '\\dot{}',
  '\\ddot{}',
  '\\tilde{}',
  '\\mathbb{}',
  '\\mathcal{}',
  '\\mathbf{}',
  '\\mathrm{}',
  '\\mathit{}',
  '\\left(',
  '\\right)',
  '\\left[',
  '\\right]',
  '\\left\\{',
  '\\right\\}',
  '\\begin{}',
  '\\end{}',
  '\\text{}',
  '\\textbf{}',
  '\\textit{}',
  '\\overline{}',
  '\\underline{}',
  '\\overbrace{}',
  '\\underbrace{}',
  '\\rightarrow',
  '\\leftarrow',
  '\\Rightarrow',
  '\\Leftarrow',
  '\\leftrightarrow',
  '\\Leftrightarrow',
  '\\mapsto',
];

export const ENVIRONMENT_NAMES = [
  'equation',
  'equation*',
  'align',
  'align*',
  'aligned',
  'gather',
  'gather*',
  'matrix',
  'pmatrix',
  'bmatrix',
  'vmatrix',
  'cases',
  'array',
  'split',
];

const MATH_COMMAND = /\\([a-zA-Z]*)$/;
const ENVIRONMENT = /\\begin\{([^}]*)$/;
const ANCHOR = /\]\(#([^)]*)$/;
/** A bare `#` mid-line; at the start of a line it opens a heading instead. */
const BARE_ANCHOR = /\S#([^)\s]*)$/;
const LINK_PATH = /(?:\]\(|!\[.*?\]\()([^)]*)$/;
const IMG_SRC = /<img[^>]*src=["']([^"']*)$/;
const REFERENCE_USE = /\[([^\]]*)\]\[([^\]]*)$/;
const REFERENCE_DEFINITION = /^\[([^\]]+)\]:\s+(.+)$/;

/** The commands matching what has been typed after a backslash. */
export function matchMathCommands(prefix: string): string[] | null {
  const match = prefix.match(MATH_COMMAND);
  if (!match) return null;

  const typed = (match[1] ?? '').toLowerCase();
  return KATEX_COMMANDS.filter((command) => command.toLowerCase().includes(typed));
}

/**
 * Turns `\frac{}{}` into a snippet whose tabstops are numbered in order, so Tab
 * walks through the arguments instead of landing on all of them at once.
 */
export function commandSnippet(command: string): string {
  let stop = 0;
  return command.slice(1).replace(/\{}/g, () => `{$${(stop += 1)}}`);
}

export function isEnvironmentPrefix(prefix: string): boolean {
  return ENVIRONMENT.test(prefix);
}

export function isAnchorPrefix(prefix: string): boolean {
  return ANCHOR.test(prefix) || BARE_ANCHOR.test(prefix);
}

export function isReferencePrefix(prefix: string): boolean {
  return REFERENCE_USE.test(prefix);
}

export interface PathPrefix {
  /** What has been typed so far, which may name a directory. */
  typed: string;
  /** Whether the position expects an image, and so only image files. */
  image: boolean;
}

export function matchPathPrefix(prefix: string): PathPrefix | null {
  const match = prefix.match(LINK_PATH) ?? prefix.match(IMG_SRC);
  const typed = match?.[1];
  if (typed === undefined) return null;
  if (typed.startsWith('http') || typed.startsWith('#')) return null;

  return { typed, image: prefix.includes('![') || prefix.includes('<img') };
}

/** The link reference definitions of a document, by label. */
export function collectReferences(lines: string[]): Map<string, string> {
  const references = new Map<string, string>();

  for (const line of lines) {
    const match = line.match(REFERENCE_DEFINITION);
    if (match?.[1] && match[2]) references.set(match[1].toLowerCase(), match[2]);
  }

  return references;
}
