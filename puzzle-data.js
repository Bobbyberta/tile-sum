// Scrabble letter values
export const SCRABBLE_SCORES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10
};

// Puzzle data - each puzzle has two words that form an anagram
export const PUZZLE_DATA = {
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
export function getPuzzleLetters(day) {
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
export function calculateWordScore(word) {
    return word.split('').reduce((score, letter) => {
        return score + (SCRABBLE_SCORES[letter.toUpperCase()] || 0);
    }, 0);
}

// Validate solution
export function validateSolution(day, word1, word2) {
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return false;
    
    const solution = puzzle.solution;
    return (
        (word1 === solution[0] && word2 === solution[1]) ||
        (word1 === solution[1] && word2 === solution[0])
    );
}

// Date and Puzzle Mapping System
// Start date: December 1, 2025 (puzzle #1)
export const PUZZLE_START_DATE = new Date(2025, 11, 1); // Month is 0-indexed, so 11 = December

// Get puzzle number for a given date
export function getPuzzleNumberForDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    // Set time to start of day for accurate comparison
    const puzzleDate = new Date(date);
    puzzleDate.setHours(0, 0, 0, 0);
    const startDate = new Date(PUZZLE_START_DATE);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const timeDiff = puzzleDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Puzzle number is 1-indexed, so add 1
    return daysDiff + 1;
}

// Get date for a given puzzle number
export function getDateForPuzzleNumber(puzzleNum) {
    const puzzleNumber = parseInt(puzzleNum);
    if (isNaN(puzzleNumber) || puzzleNumber < 0) {
        return null;
    }
    
    // Puzzle #0 is a dummy/test puzzle, return a placeholder date (Dec 1, 2025)
    if (puzzleNumber === 0) {
        return new Date(PUZZLE_START_DATE);
    }
    
    const date = new Date(PUZZLE_START_DATE);
    date.setDate(date.getDate() + (puzzleNumber - 1));
    return date;
}

// Check if we're in advent mode (before Dec 26) or daily mode (Dec 26+)
export function isAdventMode() {
    // Check for test mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const testValue = urlParams.get('test');
    
    // Advent test mode forces advent mode
    if (testValue === 'advent') {
        return true;
    }
    
    // Archive test mode forces daily mode
    if (testValue === 'archive') {
        return false;
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const december26 = new Date(currentYear, 11, 26); // Month is 0-indexed, so 11 = December
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    december26.setHours(0, 0, 0, 0);
    
    // Advent mode is before December 26
    return today < december26;
}

// Format date as YYYY-MM-DD string
export function formatDateString(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Parse date string (YYYY-MM-DD) to Date object
export function parseDateString(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
}

