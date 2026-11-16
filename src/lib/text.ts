/** Lowercase, strip accents/punctuation, expand ligatures, collapse spaces. */
export function normalizeFrench(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'a', 'au', 'aux', 'de', 'des', 'du', 'd', 'l', 'la', 'le', 'les', 'et', 'en', 'sur', 'avec', 'sans', 'un', 'une', 'son', 'sa', 'ses', 'maison',
]);

/** Meaningful tokens of a normalised string (stopwords removed, simple plural stripping). */
export function tokens(normalized: string): string[] {
  return normalized
    .split(' ')
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(singular);
}

function singular(token: string): string {
  if (token.length > 3 && (token.endsWith('s') || token.endsWith('x'))) return token.slice(0, -1);
  return token;
}

/** Levenshtein distance, used for small typos in dish names. */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/** True if `phrase` (normalised) occurs in `text` (normalised) as whole words. */
export function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}
