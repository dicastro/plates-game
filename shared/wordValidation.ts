// Pure, dependency-free module — imported by both the game client and the Worker.

/*
 * Structural check only: does the word contain the puzzle's consonants, in
 * order, each at least once, with any number of other letters (including
 * repeats of the same consonants) before, between, or after them — AND is
 * the word strictly longer than the consonant count? (No real word in any
 * supported dictionary language is expected to consist solely of consonants
 * with zero vowels, so a word whose length equals the consonant count is
 * rejected before ever reaching the Worker.) See doc/functional/scoring.md
 * and doc/technical/security-anticheat.md §5.
 */
export function isStructurallyValid(word: string, consonants: string[]): boolean {
  if (word.length <= consonants.length) return false;
  
  const upper = word.toUpperCase();
  let cursor = 0;
  for (const consonant of consonants) {
    const found = upper.indexOf(consonant, cursor);
    if (found === -1) return false;
    cursor = found + 1;
  }
  return true;
}