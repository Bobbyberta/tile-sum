#!/usr/bin/env node

/**
 * Script to analyze remaining words from puzzle-safe-words.txt that haven't been used
 * and calculate how many more puzzles can potentially be generated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { calculateScore } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUZZLE_SAFE_WORDS_PATH = path.join(__dirname, 'puzzle-safe-words.txt');
const UNUSED_WORDS_PATH = path.join(__dirname, 'unused-words.txt');

/**
 * Get all words currently used in puzzles
 * @returns {Set<string>} - Set of used words (uppercase)
 */
function getUsedWords() {
    const used = new Set();
    
    for (const puzzle of Object.values(PUZZLE_DATA)) {
        if (puzzle.solution && Array.isArray(puzzle.solution)) {
            for (const word of puzzle.solution) {
                used.add(word.toUpperCase());
            }
        }
        if (puzzle.words && Array.isArray(puzzle.words)) {
            for (const word of puzzle.words) {
                used.add(word.toUpperCase());
            }
        }
    }
    
    return used;
}

/**
 * Load puzzle-safe-words.txt
 * @returns {string[]} - Array of words
 */
function loadPuzzleSafeWords() {
    const data = fs.readFileSync(PUZZLE_SAFE_WORDS_PATH, 'utf8');
    return data
        .split('\n')
        .map(line => line.trim().toUpperCase())
        .filter(word => word.length >= 3 && word.length <= 7 && /^[A-Z]+$/.test(word));
}

/**
 * Group words by length
 * @param {string[]} words - Array of words
 * @returns {Map<number, string[]>} - Map of length -> words
 */
function groupWordsByLength(words) {
    const byLength = new Map();
    for (const word of words) {
        const len = word.length;
        if (!byLength.has(len)) {
            byLength.set(len, []);
        }
        byLength.get(len).push(word);
    }
    return byLength;
}

/**
 * Calculate maximum possible puzzles
 * Each puzzle needs 2 words that combine to 10 letters (3+7, 4+6, or 5+5)
 * @param {Map<number, string[]>} wordsByLength - Words grouped by length
 * @returns {number} - Maximum possible puzzles
 */
function calculateMaxPuzzles(wordsByLength) {
    const len3 = (wordsByLength.get(3) || []).length;
    const len4 = (wordsByLength.get(4) || []).length;
    const len5 = (wordsByLength.get(5) || []).length;
    const len6 = (wordsByLength.get(6) || []).length;
    const len7 = (wordsByLength.get(7) || []).length;
    
    // Possible combinations: 3+7, 4+6, 5+5
    const combo37 = Math.min(len3, len7);
    const combo46 = Math.min(len4, len6);
    const combo55 = Math.floor(len5 / 2); // Can pair 5-letter words
    
    // Theoretical maximum (but constraints will reduce this)
    const theoreticalMax = combo37 + combo46 + combo55;
    
    return {
        theoreticalMax,
        breakdown: {
            '3+7': combo37,
            '4+6': combo46,
            '5+5': combo55
        },
        availableWords: {
            3: len3,
            4: len4,
            5: len5,
            6: len6,
            7: len7
        }
    };
}

/**
 * Main execution function
 */
function main() {
    try {
        console.log('Analyzing remaining words...\n');
        
        // Load puzzle-safe words
        console.log('Loading puzzle-safe-words.txt...');
        const allWords = loadPuzzleSafeWords();
        console.log(`Loaded ${allWords.length} words from puzzle-safe-words.txt.\n`);
        
        // Get used words
        console.log('Loading used words from puzzle-data.js...');
        const usedWords = getUsedWords();
        console.log(`Found ${usedWords.size} words already used in puzzles.\n`);
        
        // Find unused words
        const unusedWords = allWords.filter(word => !usedWords.has(word));
        console.log(`Unused words: ${unusedWords.length}\n`);
        
        // Group unused words by length
        const unusedByLength = groupWordsByLength(unusedWords);
        
        console.log('Unused words by length:');
        for (const len of [3, 4, 5, 6, 7]) {
            const count = (unusedByLength.get(len) || []).length;
            console.log(`  ${len} letters: ${count} words`);
        }
        console.log();
        
        // Calculate maximum possible puzzles
        const maxPuzzles = calculateMaxPuzzles(unusedByLength);
        
        console.log('Maximum possible puzzles (theoretical):');
        console.log(`  Total: ${maxPuzzles.theoreticalMax}`);
        console.log(`  Breakdown:`);
        console.log(`    3+7 letter pairs: ${maxPuzzles.breakdown['3+7']}`);
        console.log(`    4+6 letter pairs: ${maxPuzzles.breakdown['4+6']}`);
        console.log(`    5+5 letter pairs: ${maxPuzzles.breakdown['5+5']}`);
        console.log();
        
        console.log('Note: Actual number will be lower due to constraints:');
        console.log('  - Different Scrabble scores required');
        console.log('  - No alternative solutions allowed');
        console.log('  - No duplicate puzzle pairs');
        console.log();
        
        // Save unused words to file
        console.log('Saving unused words to unused-words.txt...');
        fs.writeFileSync(UNUSED_WORDS_PATH, unusedWords.join('\n'));
        console.log(`✓ Saved ${unusedWords.length} unused words to: ${UNUSED_WORDS_PATH}\n`);
        
        // Show some examples
        console.log('Sample unused words:');
        const samples = unusedWords.slice(0, 20);
        for (const word of samples) {
            const score = calculateScore(word);
            console.log(`  ${word} (${word.length} letters, score: ${score})`);
        }
        if (unusedWords.length > 20) {
            console.log(`  ... and ${unusedWords.length - 20} more`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
