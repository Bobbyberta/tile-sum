#!/usr/bin/env node

/**
 * Script to generate puzzles using:
 * - 6-letter and 7-letter words from unused-words.txt
 * - 3-letter and 4-letter words from puzzle-safe-words.txt (not yet used)
 * Each word used only once
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { calculateScore, findAlternatives } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUZZLE_SAFE_WORDS_PATH = path.join(__dirname, 'puzzle-safe-words.txt');
const UNUSED_WORDS_PATH = path.join(__dirname, 'unused-words.txt');
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
        .filter(word => word.length >= 3 && word.length <= 8 && /^[A-Z]+$/.test(word));
}

/**
 * Get word usage count from puzzles
 * Only counts from solution (words and solution are the same, so we don't double-count)
 * @returns {Map<string, number>} - Map of word -> usage count
 */
function getWordUsageCount() {
    const usage = new Map();
    
    for (const puzzle of Object.values(PUZZLE_DATA)) {
        // Only count from solution to avoid double-counting (words and solution are the same)
        if (puzzle.solution && Array.isArray(puzzle.solution)) {
            for (const word of puzzle.solution) {
                const upper = word.toUpperCase();
                usage.set(upper, (usage.get(upper) || 0) + 1);
            }
        }
    }
    
    return usage;
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
            const pairKey = word1 < word2 ? `${word1},${word2}` : `${word2},${word1}`;
            existing.add(pairKey);
        }
    }
    
    return existing;
}

/**
 * Check if a puzzle pair is a duplicate
 */
function isDuplicate(word1, word2, existingPuzzles) {
    const w1 = word1.toUpperCase();
    const w2 = word2.toUpperCase();
    const pairKey = w1 < w2 ? `${w1},${w2}` : `${w2},${w1}`;
    return existingPuzzles.has(pairKey);
}

/**
 * Validate a puzzle pair
 * @param {string} word1 - First word (3 or 4 letters from puzzle-safe-words)
 * @param {string} word2 - Second word (6 or 7 letters from unused words)
 * @param {Map<number, Map<number, string[]>>} wordsByLengthAndScore - Dictionary words grouped by length and score
 * @param {Set<string>} existingPuzzles - Set of existing puzzle pairs
 * @param {Map<string, number>} wordUsageCount - Current usage count of words
 * @param {Set<string>} currentUsedWords - Words used in this generation session
 * @param {boolean} isShortWordFromSafeList - True if word1 is from puzzle-safe-words (can be used twice total)
 */
function validatePuzzle(word1, word2, wordsByLengthAndScore, existingPuzzles, wordUsageCount, currentUsedWords, isShortWordFromSafeList) {
    if (word1.length + word2.length !== 10) {
        return { valid: false, error: `Combined length is ${word1.length + word2.length}, must be 10` };
    }
    
    const score1 = calculateScore(word1);
    const score2 = calculateScore(word2);
    if (score1 === score2) {
        return { valid: false, error: `Scores are equal: ${score1}` };
    }
    
    if (isDuplicate(word1, word2, existingPuzzles)) {
        return { valid: false, error: 'Duplicate of existing puzzle' };
    }
    
    const w1 = word1.toUpperCase();
    const w2 = word2.toUpperCase();
    
    // Check if long word (6/7 letters) is already used (should only be used once)
    if (currentUsedWords.has(w2)) {
        return { valid: false, error: `Long word "${w2}" already used` };
    }
    
    // Check if short word (3/4 letters) has been used twice already
    if (isShortWordFromSafeList) {
        const currentUsage = (wordUsageCount.get(w1) || 0) + (currentUsedWords.has(w1) ? 1 : 0);
        if (currentUsage >= 2) {
            return { valid: false, error: `Short word "${w1}" already used twice` };
        }
    } else {
        // Shouldn't happen, but check anyway
        if (currentUsedWords.has(w1)) {
            return { valid: false, error: `Word "${w1}" already used` };
        }
    }
    
    const alternatives = findAlternatives(word1, word2, wordsByLengthAndScore);
    if (alternatives.length > 0) {
        return { valid: false, error: `Has ${alternatives.length} alternative solution(s)` };
    }
    
    return { valid: true };
}

/**
 * Generate puzzles from unused 6/7-letter words and available 3/4-letter words
 */
function generatePuzzles(unusedWords, puzzleSafeWords, wordsByLengthAndScore, existingPuzzles, wordUsageCount) {
    const validPuzzles = [];
    const currentUsedWords = new Set(); // Track words used in this generation session
    const tried = new Set();
    const maxAttempts = 1000000;
    let attempts = 0;
    
    // Separate unused words by length (6 and 7)
    const unused6 = unusedWords.filter(w => w.length === 6);
    const unused7 = unusedWords.filter(w => w.length === 7);
    
    // Get all 3 and 4 letter words from puzzle-safe-words
    // They can be used if current usage < 2 (already used once, can use once more)
    const available3 = puzzleSafeWords.filter(w => {
        if (w.length !== 3) return false;
        const currentUsage = (wordUsageCount.get(w) || 0);
        return currentUsage < 2; // Can be used if used less than 2 times
    });
    
    const available4 = puzzleSafeWords.filter(w => {
        if (w.length !== 4) return false;
        const currentUsage = (wordUsageCount.get(w) || 0);
        return currentUsage < 2; // Can be used if used less than 2 times
    });
    
    console.log('\nAvailable words:');
    console.log(`  3 letters (can use once more): ${available3.length} words`);
    console.log(`  4 letters (can use once more): ${available4.length} words`);
    console.log(`  6 letters (unused): ${unused6.length} words`);
    console.log(`  7 letters (unused): ${unused7.length} words\n`);
    
    // Generate 3+7 combinations
    console.log('Generating 3+7 letter puzzles...');
    for (const word3 of available3) {
        // Check if this word has been used twice already (including in this session)
        const usageBefore = wordUsageCount.get(word3) || 0;
        const usageInSession = currentUsedWords.has(word3) ? 1 : 0;
        if (usageBefore + usageInSession >= 2) continue;
        
        for (const word7 of unused7) {
            if (currentUsedWords.has(word7)) continue;
            
            attempts++;
            const pairKey = word3 < word7 ? `${word3},${word7}` : `${word7},${word3}`;
            if (tried.has(pairKey)) continue;
            tried.add(pairKey);
            
            const validation = validatePuzzle(word3, word7, wordsByLengthAndScore, existingPuzzles, wordUsageCount, currentUsedWords, true);
            
            if (validation.valid) {
                const score1 = calculateScore(word3);
                const score2 = calculateScore(word7);
                validPuzzles.push({
                    word1: word3,
                    word2: word7,
                    score1,
                    score2
                });
                currentUsedWords.add(word3);
                currentUsedWords.add(word7);
                console.log(`  ✓ Generated puzzle ${validPuzzles.length}: [${word3}, ${word7}] (scores: ${score1}, ${score2})`);
                
                // Stop if we've used all 3-letter or 7-letter words
                if (currentUsedWords.has(word3) && available3.filter(w => !currentUsedWords.has(w)).length === 0) break;
                if (unused7.filter(w => !currentUsedWords.has(w)).length === 0) break;
            }
        }
    }
    
    // Generate 4+6 combinations
    console.log('\nGenerating 4+6 letter puzzles...');
    for (const word4 of available4) {
        // Check if this word has been used twice already (including in this session)
        const usageBefore = wordUsageCount.get(word4) || 0;
        const usageInSession = currentUsedWords.has(word4) ? 1 : 0;
        if (usageBefore + usageInSession >= 2) continue;
        
        for (const word6 of unused6) {
            if (currentUsedWords.has(word6)) continue;
            
            attempts++;
            const pairKey = word4 < word6 ? `${word4},${word6}` : `${word6},${word4}`;
            if (tried.has(pairKey)) continue;
            tried.add(pairKey);
            
            const validation = validatePuzzle(word4, word6, wordsByLengthAndScore, existingPuzzles, wordUsageCount, currentUsedWords, true);
            
            if (validation.valid) {
                const score1 = calculateScore(word4);
                const score2 = calculateScore(word6);
                validPuzzles.push({
                    word1: word4,
                    word2: word6,
                    score1,
                    score2
                });
                currentUsedWords.add(word4);
                currentUsedWords.add(word6);
                console.log(`  ✓ Generated puzzle ${validPuzzles.length}: [${word4}, ${word6}] (scores: ${score1}, ${score2})`);
                
                // Stop if we've used all 4-letter or 6-letter words
                if (available4.filter(w => !currentUsedWords.has(w)).length === 0) break;
                if (unused6.filter(w => !currentUsedWords.has(w)).length === 0) break;
            }
        }
    }
    
    console.log(`\nTotal attempts: ${attempts}`);
    return validPuzzles;
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Generating puzzles from unused 6/7-letter words and available 3/4-letter words...\n');
        
        // Load unused words (6 and 7 letters)
        console.log('Loading unused words...');
        const unusedWordsData = fs.readFileSync(UNUSED_WORDS_PATH, 'utf8');
        const unusedWords = unusedWordsData
            .split('\n')
            .map(line => line.trim().toUpperCase())
            .filter(word => (word.length === 6 || word.length === 7) && /^[A-Z]+$/.test(word));
        console.log(`Loaded ${unusedWords.length} unused words (6 and 7 letters).\n`);
        
        // Load puzzle-safe words (for 3 and 4 letter words)
        console.log('Loading puzzle-safe-words.txt...');
        const puzzleSafeWords = loadDictionary(PUZZLE_SAFE_WORDS_PATH);
        console.log(`Loaded ${puzzleSafeWords.length} words from puzzle-safe-words.txt.\n`);
        
        // Load validation dictionary
        console.log('Loading validation dictionary...');
        const validationWords = loadDictionary(VALIDATION_DICTIONARY_PATH);
        console.log(`Loaded ${validationWords.length} words from validation dictionary.\n`);
        
        // Group validation words by length and score
        console.log('Grouping validation words by length and score...');
        const wordsByLengthAndScore = new Map();
        for (const word of validationWords) {
            const len = word.length;
            const score = calculateScore(word);
            
            if (!wordsByLengthAndScore.has(len)) {
                wordsByLengthAndScore.set(len, new Map());
            }
            const wordsByScore = wordsByLengthAndScore.get(len);
            
            if (!wordsByScore.has(score)) {
                wordsByScore.set(score, []);
            }
            wordsByScore.get(score).push(word);
        }
        console.log('Grouped validation words by length and score.\n');
        
        // Get existing puzzles and word usage count
        console.log('Loading existing puzzles...');
        const existingPuzzles = getExistingPuzzles();
        const wordUsageCount = getWordUsageCount();
        console.log(`Found ${existingPuzzles.size} existing puzzles.\n`);
        
        // Show usage stats for 3/4 letter words
        const threeLetterWords = puzzleSafeWords.filter(w => w.length === 3);
        const fourLetterWords = puzzleSafeWords.filter(w => w.length === 4);
        const threeUsedOnce = threeLetterWords.filter(w => (wordUsageCount.get(w) || 0) === 1).length;
        const fourUsedOnce = fourLetterWords.filter(w => (wordUsageCount.get(w) || 0) === 1).length;
        console.log(`3-letter words: ${threeLetterWords.length} total, ${threeUsedOnce} used once (can use again)`);
        console.log(`4-letter words: ${fourLetterWords.length} total, ${fourUsedOnce} used once (can use again)\n`);
        
        // Generate puzzles
        const puzzles = generatePuzzles(unusedWords, puzzleSafeWords, wordsByLengthAndScore, existingPuzzles, wordUsageCount);
        
        if (puzzles.length === 0) {
            console.log('\n✗ No valid puzzles could be generated.');
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
        const outputPath = path.join(__dirname, 'generated-puzzles-from-unused.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n✓ Puzzles written to: ${outputPath}\n`);
        
        // Calculate maximum possible
        const max3_7 = Math.min(available3.length, unused7.length);
        const max4_6 = Math.min(available4.length, unused6.length);
        console.log(`\nMaximum possible puzzles (theoretical):`);
        console.log(`  3+7 letter pairs: ${max3_7} (limited by ${available3.length} three-letter words or ${unused7.length} seven-letter words)`);
        console.log(`  4+6 letter pairs: ${max4_6} (limited by ${available4.length} four-letter words or ${unused6.length} six-letter words)`);
        console.log(`  Total theoretical: ${max3_7 + max4_6}`);
        console.log(`  Actual generated: ${puzzles.length}`);
        console.log(`  Efficiency: ${Math.round(puzzles.length / (max3_7 + max4_6) * 100)}%`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
