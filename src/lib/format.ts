const ALWAYS_LOWERCASE = new Set([
  // articles
  "a", "an", "the",
  // coordinating conjunctions
  "and", "but", "or", "nor", "so", "yet",
  // short prepositions
  "at", "by", "in", "of", "on", "to", "up", "as", "vs", "via",
]);

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Converts a string to MLA title case:
 * - Always capitalizes first and last word
 * - Capitalizes all major words
 * - Lowercases articles, coordinating conjunctions, and short prepositions
 * - Preserves all-caps acronyms (e.g. "UI", "E2E", "CI/CD")
 */
export function toMlaTitleCase(str: string): string {
  const words = str.split(" ");
  return words
    .map((word, index) => {
      // Preserve all-caps acronyms (length > 1 so single letters still capitalize)
      if (word.length > 1 && word === word.toUpperCase()) return word;
      // Always capitalize first and last word
      if (index === 0 || index === words.length - 1) return capitalizeWord(word);
      // Lowercase excluded words
      if (ALWAYS_LOWERCASE.has(word.toLowerCase())) return word.toLowerCase();
      return capitalizeWord(word);
    })
    .join(" ");
}
