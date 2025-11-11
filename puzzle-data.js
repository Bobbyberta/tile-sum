// Scrabble letter values
const SCRABBLE_SCORES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10
};

// Puzzle data - each puzzle has two words that form an anagram
const PUZZLE_DATA = {
    1: {
        words: ['SNOW', 'FLAKE'],
        solution: ['SNOW', 'FLAKE']
    },
    2: {
        words: ['JOLLY', 'ELF'],
        solution: ['JOLLY', 'ELF']
    },
    3: {
        words: ['GIFT', 'WRAP'],
        solution: ['GIFT', 'WRAP']
    },
    4: {
        words: ['CANDLE', 'LIGHT'],
        solution: ['CANDLE', 'LIGHT']
    },
    5: {
        words: ['STAR', 'TREE'],
        solution: ['STAR', 'TREE']
    },
    6: {
        words: ['WREATH', 'HOLLY'],
        solution: ['WREATH', 'HOLLY']
    },
    7: {
        words: ['ROBIN', 'BERRY'],
        solution: ['ROBIN', 'BERRY']
    },
    8: {
        words: ['CAROL', 'SING'],
        solution: ['CAROL', 'SING']
    },
    9: {
        words: ['COOKIE', 'MILK'],
        solution: ['COOKIE', 'MILK']
    },
    10: {
        words: ['RUDOLF', 'DASHER'],
        solution: ['RUDOLF', 'DASHER']
    },
    11: {
        words: ['TINSEL', 'DECOR'],
        solution: ['TINSEL', 'DECOR']
    },
    12: {
        words: ['BOX', 'UNWRAP'],
        solution: ['BOX', 'UNWRAP']
    },
    13: {
        words: ['FROSTY', 'WINTER'],
        solution: ['FROSTY', 'WINTER']
    },
    14: {
        words: ['TURKEY', 'FAMILY'],
        solution: ['TURKEY', 'FAMILY']
    },
    15: {
        words: ['ADVENT', 'ICICLE'],
        solution: ['ADVENT', 'ICICLE']
    },
    16: {
        words: ['NOEL', 'EVE'],
        solution: ['NOEL', 'EVE']
    },
    17: {
        words: ['COZY', 'FIRE'],
        solution: ['COZY', 'FIRE']
    },
    18: {
        words: ['CANDY', 'STRIPE'],
        solution: ['CANDY', 'STRIPE']
    },
    19: {
        words: ['HEARTH', 'WARM'],
        solution: ['HEARTH', 'WARM']
    },
    20: {
        words: ['COAL', 'SOCKS'],
        solution: ['COAL', 'SOCKS']
    },
    21: {
        words: ['SLEIGH', 'BELL'],
        solution: ['SLEIGH', 'BELL']
    },
    22: {
        words: ['EGGNOG', 'SPICE'],
        solution: ['EGGNOG', 'SPICE']
    },
    23: {
        words: ['YULE', 'LOG'],
        solution: ['YULE', 'LOG']
    },
    24: {
        words: ['SANTA', 'NORTH'],
        solution: ['SANTA', 'NORTH']
    },
    25: {
        words: ['MERRY', 'JOY'],
        solution: ['MERRY', 'JOY']
    }
};

// Get all letters from a puzzle (combined anagram)
function getPuzzleLetters(day) {
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return [];
    
    const combined = puzzle.words.join('');
    // Shuffle the letters for the puzzle
    return shuffleArray(combined.split(''));
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Calculate word score
function calculateWordScore(word) {
    return word.split('').reduce((score, letter) => {
        return score + (SCRABBLE_SCORES[letter.toUpperCase()] || 0);
    }, 0);
}

// Validate solution
function validateSolution(day, word1, word2) {
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return false;
    
    const solution = puzzle.solution;
    return (
        (word1 === solution[0] && word2 === solution[1]) ||
        (word1 === solution[1] && word2 === solution[0])
    );
}

