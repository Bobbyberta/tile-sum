#!/usr/bin/env node

/**
 * Script to generate new puzzles with specific constraints:
 * - Two words that combine to 10 letters (3+7, 4+6, or 5+5)
 * - Scrabble scores of both words must be different
 * - No alternative word combinations with the same Scrabble scores
 * - No duplicates of existing puzzles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { calculateScore, findAlternatives } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATION_DICTIONARY_PATH = path.join(__dirname, 'puzzle-safe-words.txt');
const VALIDATION_DICTIONARY_PATH = path.join(__dirname, 'validation-words.txt');

/**
 * Load dictionary words from a file
 * @param {string} filePath - Path to dictionary file
 * @returns {string[]} - Array of dictionary words
 */
function loadDictionary(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return data
        .split('\n')
        .map(line => line.trim().toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 7 && /^[A-Z]+$/.test(word));
}

/**
 * Get all existing puzzle pairs (normalized for comparison)
 * @returns {Set<string>} - Set of normalized puzzle pairs
 */
function getExistingPuzzles() {
    const existing = new Set();
    
    for (const puzzle of Object.values(PUZZLE_DATA)) {
        if (puzzle.solution && Array.isArray(puzzle.solution) && puzzle.solution.length === 2) {
            const [word1, word2] = puzzle.solution.map(w => w.toUpperCase());
            // Normalize pair (always smaller word first)
            const pairKey = word1 < word2 ? `${word1},${word2}` : `${word2},${word1}`;
            existing.add(pairKey);
        }
    }
    
    return existing;
}

/**
 * Get all words used in existing puzzles
 * @returns {Set<string>} - Set of words already used in puzzles
 */
function getUsedWords() {
    const used = new Set();
    
    for (const puzzle of Object.values(PUZZLE_DATA)) {
        if (puzzle.solution && Array.isArray(puzzle.solution)) {
            for (const word of puzzle.solution) {
                used.add(word.toUpperCase());
            }
        }
    }
    
    return used;
}

/**
 * Check if a puzzle pair is a duplicate
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @param {Set<string>} existingPuzzles - Set of existing puzzle pairs
 * @returns {boolean} - True if duplicate
 */
function isDuplicate(word1, word2, existingPuzzles) {
    const w1 = word1.toUpperCase();
    const w2 = word2.toUpperCase();
    const pairKey = w1 < w2 ? `${w1},${w2}` : `${w2},${w1}`;
    return existingPuzzles.has(pairKey);
}

/**
 * Validate a puzzle pair
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @param {Map<number, Map<number, string[]>>} wordsByLengthAndScore - Dictionary words grouped by length and score
 * @param {Set<string>} existingPuzzles - Set of existing puzzle pairs
 * @param {Set<string>} usedWords - Set of words already used in puzzles
 * @returns {Object|null} - Validation result with error message, or null if valid
 */
function validatePuzzle(word1, word2, wordsByLengthAndScore, existingPuzzles, usedWords) {
    // Check combined length is 10
    if (word1.length + word2.length !== 10) {
        return { valid: false, error: `Combined length is ${word1.length + word2.length}, must be 10` };
    }
    
    // Check scores are different
    const score1 = calculateScore(word1);
    const score2 = calculateScore(word2);
    if (score1 === score2) {
        return { valid: false, error: `Scores are equal: ${score1}` };
    }
    
    // Check for duplicates
    if (isDuplicate(word1, word2, existingPuzzles)) {
        return { valid: false, error: 'Duplicate of existing puzzle' };
    }
    
    // Check if words are already used
    const w1 = word1.toUpperCase();
    const w2 = word2.toUpperCase();
    if (usedWords.has(w1)) {
        return { valid: false, error: `Word "${w1}" already used` };
    }
    if (usedWords.has(w2)) {
        return { valid: false, error: `Word "${w2}" already used` };
    }
    
    // Check for alternative solutions
    const alternatives = findAlternatives(word1, word2, wordsByLengthAndScore);
    if (alternatives.length > 0) {
        return { valid: false, error: `Has ${alternatives.length} alternative solution(s)` };
    }
    
    return { valid: true };
}

/**
 * Generate valid puzzles
 * @param {number} count - Number of puzzles to generate
 * @param {string[]} dictionaryWords - Dictionary words
 * @param {Map<number, Map<number, string[]>>} wordsByLengthAndScore - Dictionary words grouped by length and score
 * @param {Set<string>} existingPuzzles - Set of existing puzzle pairs
 * @param {Set<string>} usedWords - Set of words already used in puzzles
 * @returns {Array<{word1: string, word2: string, score1: number, score2: number}>} - Valid puzzles
 */
function generatePuzzles(count, dictionaryWords, wordsByLengthAndScore, existingPuzzles, usedWords) {
    const validPuzzles = [];
    const tried = new Set();
    const currentUsedWords = new Set(usedWords); // Track words used in this generation session
    const maxAttempts = count * 100000; // Increase attempts significantly for remaining words
    let attempts = 0;
    
    // Generate combinations: 3+7, 4+6, 5+5
    const lengthPairs = [[3, 7], [4, 6], [5, 5]];
    
    // Get words by length, filtering out already used words
    const wordsByLength = new Map();
    for (const word of dictionaryWords) {
        const upperWord = word.toUpperCase();
        // Skip words that are already used
        if (currentUsedWords.has(upperWord)) continue;
        
        const len = word.length;
        if (!wordsByLength.has(len)) {
            wordsByLength.set(len, []);
        }
        wordsByLength.get(len).push(word);
    }
    
    console.log('\nGenerating puzzles...\n');
    console.log(`Available words by length:`);
    for (const len of [3, 4, 5, 6, 7]) {
        const count = (wordsByLength.get(len) || []).length;
        console.log(`  ${len} letters: ${count} words`);
    }
    console.log();
    
    while (validPuzzles.length < count && attempts < maxAttempts) {
        attempts++;
        
        // Randomly select a length pair
        const [len1, len2] = lengthPairs[Math.floor(Math.random() * lengthPairs.length)];
        
        // Get available words of appropriate lengths (not already used)
        const words1 = (wordsByLength.get(len1) || []).filter(w => !currentUsedWords.has(w.toUpperCase()));
        const words2 = (wordsByLength.get(len2) || []).filter(w => !currentUsedWords.has(w.toUpperCase()));
        
        if (words1.length === 0 || words2.length === 0) continue;
        
        const word1 = words1[Math.floor(Math.random() * words1.length)];
        const word2 = words2[Math.floor(Math.random() * words2.length)];
        
        // Create pair key to avoid retrying same combination
        const pairKey = word1 < word2 ? `${word1},${word2}` : `${word2},${word1}`;
        if (tried.has(pairKey)) continue;
        tried.add(pairKey);
        
        // Validate the pair
        const validation = validatePuzzle(word1, word2, wordsByLengthAndScore, existingPuzzles, currentUsedWords);
        
        if (validation.valid) {
            const score1 = calculateScore(word1);
            const score2 = calculateScore(word2);
            validPuzzles.push({
                word1,
                word2,
                score1,
                score2
            });
            // Mark words as used
            currentUsedWords.add(word1.toUpperCase());
            currentUsedWords.add(word2.toUpperCase());
            console.log(`  ✓ Generated puzzle ${validPuzzles.length}/${count}: [${word1}, ${word2}] (scores: ${score1}, ${score2})`);
        }
        
        if (attempts % 1000 === 0) {
            process.stdout.write(`  Attempted ${attempts} combinations, found ${validPuzzles.length} valid puzzles\r`);
        }
    }
    
    if (attempts >= maxAttempts && validPuzzles.length < count) {
        console.log(`\n  Warning: Reached maximum attempts (${maxAttempts}). Generated ${validPuzzles.length} out of ${count} requested puzzles.`);
    }
    
    return validPuzzles;
}

/**
 * Main execution function
 */
async function main() {
    try {
        const args = process.argv.slice(2);
        const count = parseInt(args[0], 10);
        
        if (isNaN(count) || count <= 0) {
            console.error('Usage: node generate-puzzles.js <number_of_puzzles>');
            console.error('Example: node generate-puzzles.js 10');
            process.exit(1);
        }
        
        console.log(`Generating ${count} new puzzle(s)...\n`);
        
        // Load generation dictionary (shorter list for word selection)
        console.log('Loading generation dictionary...');
        const generationWords = loadDictionary(GENERATION_DICTIONARY_PATH);
        console.log(`Loaded ${generationWords.length} words from generation dictionary.\n`);
        
        // Load validation dictionary (full list for validation)
        console.log('Loading validation dictionary...');
        const validationWords = loadDictionary(VALIDATION_DICTIONARY_PATH);
        console.log(`Loaded ${validationWords.length} words from validation dictionary.\n`);
        
        // Group validation words by length and score for efficient lookup
        console.log('Grouping validation words by length and score...');
        const validationWordsByLengthAndScore = new Map();
        for (const word of validationWords) {
            const len = word.length;
            const score = calculateScore(word);
            
            if (!validationWordsByLengthAndScore.has(len)) {
                validationWordsByLengthAndScore.set(len, new Map());
            }
            const wordsByScore = validationWordsByLengthAndScore.get(len);
            
            if (!wordsByScore.has(score)) {
                wordsByScore.set(score, []);
            }
            wordsByScore.get(score).push(word);
        }
        console.log('Grouped validation words by length and score.\n');
        
        // Load existing puzzles
        console.log('Loading existing puzzles...');
        const existingPuzzles = getExistingPuzzles();
        console.log(`Found ${existingPuzzles.size} existing puzzles.\n`);
        
        // Get words already used in existing puzzles
        console.log('Loading used words from existing puzzles...');
        const usedWords = getUsedWords();
        console.log(`Found ${usedWords.size} words already used in existing puzzles.\n`);
        
        // Generate puzzles
        const puzzles = generatePuzzles(count, generationWords, validationWordsByLengthAndScore, existingPuzzles, usedWords);
        
        if (puzzles.length === 0) {
            console.log('\n✗ No valid puzzles could be generated with the given constraints.');
            process.exit(1);
        }
        
        // Output results
        console.log(`\n✓ Successfully generated ${puzzles.length} valid puzzle(s):\n`);
        
        const output = {
            timestamp: new Date().toISOString(),
            count: puzzles.length,
            puzzles: puzzles.map(p => ({
                words: [p.word1, p.word2],
                solution: [p.word1, p.word2],
                scores: [p.score1, p.score2]
            }))
        };
        
        // Print puzzles
        for (const puzzle of puzzles) {
            console.log(`  [${puzzle.word1}, ${puzzle.word2}] (scores: ${puzzle.score1}, ${puzzle.score2})`);
        }
        
        // Write to file
        const outputPath = path.join(__dirname, 'generated-puzzles.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n✓ Puzzles written to: ${outputPath}\n`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
