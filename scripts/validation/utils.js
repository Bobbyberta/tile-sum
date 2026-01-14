/**
 * Shared utility functions for validation scripts
 * Functions are exported from generate-puzzles.js as the authoritative implementation
 */

import { SCRABBLE_SCORES, PUZZLE_DATA } from '../../puzzle-data.js';

/**
 * Calculate Scrabble score for a word
 * @param {string} word - The word to score
 * @returns {number} - The Scrabble score
 */
export function calculateScore(word) {
    if (!word) return 0;
    return word.split('').reduce((score, letter) => {
        return score + (SCRABBLE_SCORES[letter.toUpperCase()] || 0);
    }, 0);
}

/**
 * Get letter frequency map for a word
 * @param {string} word - The word to analyze
 * @returns {Map<string, number>} - Map of letter -> count
 */
export function getLetterFreq(word) {
    const freq = new Map();
    for (const letter of word.toUpperCase()) {
        freq.set(letter, (freq.get(letter) || 0) + 1);
    }
    return freq;
}

/**
 * Get remaining letters after removing letters from word
 * @param {Map<string, number>} targetFreq - Target frequency map
 * @param {string} word - Word to subtract
 * @returns {Map<string, number>|null} - Remaining frequency map, or null if impossible
 */
export function subtractLetters(targetFreq, word) {
    const remaining = new Map(targetFreq);
    
    for (const letter of word.toUpperCase()) {
        const count = remaining.get(letter);
        if (!count || count <= 0) {
            return null; // Not enough letters
        }
        remaining.set(letter, count - 1);
        if (remaining.get(letter) === 0) {
            remaining.delete(letter);
        }
    }
    
    return remaining;
}

/**
 * Check if a word matches a frequency map
 * @param {string} word - Word to check
 * @param {Map<string, number>} freq - Frequency map
 * @returns {boolean} - True if word matches
 */
export function wordMatchesFreq(word, freq) {
    const wordFreq = getLetterFreq(word);
    if (wordFreq.size !== freq.size) return false;
    
    for (const [letter, count] of freq) {
        if (wordFreq.get(letter) !== count) {
            return false;
        }
    }
    
    return true;
}

/**
 * Find alternative solutions for a word pair
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @param {Map<number, Map<number, string[]>>} wordsByLengthAndScore - Dictionary words grouped by length and score
 * @returns {Array<{word1: string, word2: string, score1: number, score2: number}>} - Alternative solutions
 */
export function findAlternatives(word1, word2, wordsByLengthAndScore) {
    const targetFreq = getLetterFreq(word1 + word2);
    const targetScore1 = calculateScore(word1);
    const targetScore2 = calculateScore(word2);
    const len1 = word1.length;
    const len2 = word2.length;
    
    // Get candidates for word1 (words with matching length and score)
    const candidates1 = wordsByLengthAndScore.get(len1)?.get(targetScore1) || [];
    
    const alternatives = [];
    const seen = new Set();
    
    // Try each candidate for word1
    for (const candidate1 of candidates1) {
        // Skip if it's the original word1
        if (candidate1 === word1) continue;
        
        // Calculate remaining letters needed for word2
        const remainingFreq = subtractLetters(targetFreq, candidate1);
        if (!remainingFreq) continue; // Can't form word1 from available letters
        
        // Get candidates for word2 (words with matching length and score)
        const candidates2 = wordsByLengthAndScore.get(len2)?.get(targetScore2) || [];
        
        for (const candidate2 of candidates2) {
            // Skip if it's the original word2
            if (candidate2 === word2) continue;
            // Skip if it's the original solution (reversed)
            if (candidate1 === word2 && candidate2 === word1) continue;
            
            // Skip if we've already seen this pair
            const pairKey = candidate1 < candidate2 
                ? `${candidate1},${candidate2}` 
                : `${candidate2},${candidate1}`;
            if (seen.has(pairKey)) continue;
            seen.add(pairKey);
            
            // Check if candidate2 matches remaining letters
            if (wordMatchesFreq(candidate2, remainingFreq)) {
                alternatives.push({
                    word1: candidate1,
                    word2: candidate2,
                    score1: targetScore1,
                    score2: targetScore2
                });
            }
        }
    }
    
    return alternatives;
}

/**
 * Get all currently used words from puzzle data
 * @returns {Set<string>} - Set of all words used in puzzles (uppercase)
 */
export function getUsedWords() {
    const usedWords = new Set();
    
    for (const puzzle of Object.values(PUZZLE_DATA)) {
        if (puzzle.words && Array.isArray(puzzle.words)) {
            puzzle.words.forEach(word => {
                usedWords.add(word.toUpperCase());
            });
        }
        if (puzzle.solution && Array.isArray(puzzle.solution)) {
            puzzle.solution.forEach(word => {
                usedWords.add(word.toUpperCase());
            });
        }
    }
    
    return usedWords;
}
