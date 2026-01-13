// Mock puzzle data for testing
export const MOCK_SCRABBLE_SCORES = {
  'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
  'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
  'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
  'Y': 4, 'Z': 10
};

export const MOCK_PUZZLE_DATA = {
  0: {
    words: ['TEST', 'DUMMY'],
    solution: ['TEST', 'DUMMY']
  },
  1: {
    words: ['SNOW', 'FLAKE'],
    solution: ['SNOW', 'FLAKE']
  },
  2: {
    words: ['JOLLY', 'ELF'],
    solution: ['JOLLY', 'ELF']
  }
};

// Mock puzzle data functions
export function getMockPuzzleLetters(day) {
  const puzzle = MOCK_PUZZLE_DATA[day];
  if (!puzzle) return '';
  return puzzle.words.join('').split('').sort(() => Math.random() - 0.5).join('');
}

export function calculateMockWordScore(word) {
  return word.toUpperCase().split('').reduce((score, letter) => {
    return score + (MOCK_SCRABBLE_SCORES[letter] || 0);
  }, 0);
}

export function validateMockSolution(day, word1, word2) {
  const puzzle = MOCK_PUZZLE_DATA[day];
  if (!puzzle) return false;
  
  const solution = puzzle.solution.map(w => w.toUpperCase());
  const words = [word1.toUpperCase(), word2.toUpperCase()];
  
  return (
    (words[0] === solution[0] && words[1] === solution[1]) ||
    (words[0] === solution[1] && words[1] === solution[0])
  );
}
