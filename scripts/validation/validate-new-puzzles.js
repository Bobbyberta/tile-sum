#!/usr/bin/env node

/**
 * Validation script to check new puzzles against existing puzzle data.
 * Validates:
 * 1. Uniqueness - puzzles don't already exist
 * 2. Scrabble scores - both words have different scores
 * 3. Anagrams - words don't have anagram alternatives
 * 4. Alternative solutions - combined letters can't form other valid word pairs with same scores
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { loadWordList, normalizeWordForAnagram, buildAnagramMap } from './check-anagrams.js';
import { calculateScore, findAlternatives } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load new puzzles from JSON file
 * @param {string} jsonPath - Path to JSON file
 * @returns {Object} - Parsed puzzle data
 */
function loadNewPuzzles(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
        throw new Error(`Puzzle file not found: ${jsonPath}`);
    }
    
    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data);
}

/**
 * Get all existing puzzle pairs (normalized for comparison)
 * @returns {Set<string>} - Set of normalized puzzle pairs
 */
function getExistingPuzzles() {
    const existing = new Set();
    
    for (const puzzle of Object.values(PUZZLE_DATA)) {
        // Check solution array
        if (puzzle.solution && Array.isArray(puzzle.solution) && puzzle.solution.length === 2) {
            const [word1, word2] = puzzle.solution.map(w => w.toUpperCase());
            const pairKey = word1 < word2 ? `${word1},${word2}` : `${word2},${word1}`;
            existing.add(pairKey);
        }
        // Also check words array
        if (puzzle.words && Array.isArray(puzzle.words) && puzzle.words.length === 2) {
            const [word1, word2] = puzzle.words.map(w => w.toUpperCase());
            const pairKey = word1 < word2 ? `${word1},${word2}` : `${word2},${word1}`;
            existing.add(pairKey);
        }
    }
    
    return existing;
}

/**
 * Check if a puzzle pair is unique
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @param {Set<string>} existingPuzzles - Set of existing puzzle pairs
 * @returns {boolean} - True if unique (not duplicate)
 */
function isUnique(word1, word2, existingPuzzles) {
    const w1 = word1.toUpperCase();
    const w2 = word2.toUpperCase();
    const pairKey = w1 < w2 ? `${w1},${w2}` : `${w2},${w1}`;
    return !existingPuzzles.has(pairKey);
}

/**
 * Check if both words have different Scrabble scores
 * @param {string} word1 - First word
 * @param {string} word2 - Second word
 * @returns {Object} - { valid: boolean, score1: number, score2: number }
 */
function validateScores(word1, word2) {
    const score1 = calculateScore(word1);
    const score2 = calculateScore(word2);
    return {
        valid: score1 !== score2,
        score1,
        score2
    };
}

/**
 * Check if a word has anagram alternatives
 * @param {string} word - Word to check
 * @param {Map<string, string[]>} anagramMap - Map of anagram groups
 * @returns {string[]} - Array of anagram alternatives (empty if none)
 */
function getAnagramAlternatives(word, anagramMap) {
    const normalized = normalizeWordForAnagram(word);
    const anagramGroup = anagramMap.get(normalized);
    
    if (!anagramGroup || anagramGroup.length <= 1) {
        return [];
    }
    
    // Filter out the word itself
    return anagramGroup.filter(w => w !== word.toUpperCase());
}

/**
 * Build words by length and score map for alternative solution checking
 * @param {string[]} dictionaryWords - Dictionary words
 * @returns {Map<number, Map<number, string[]>>} - Map of length -> score -> words
 */
function buildWordsByLengthAndScore(dictionaryWords) {
    const map = new Map();
    
    for (const word of dictionaryWords) {
        const length = word.length;
        const score = calculateScore(word);
        
        if (!map.has(length)) {
            map.set(length, new Map());
        }
        
        const scoreMap = map.get(length);
        if (!scoreMap.has(score)) {
            scoreMap.set(score, []);
        }
        
        scoreMap.get(score).push(word);
    }
    
    return map;
}

/**
 * Validate a single puzzle
 * @param {Object} puzzle - Puzzle object with words, solution, categories
 * @param {string} category - Category name
 * @param {number} index - Index in category
 * @param {Set<string>} existingPuzzles - Existing puzzle pairs
 * @param {Map<string, string[]>} anagramMap - Anagram map
 * @param {Map<number, Map<number, string[]>>} wordsByLengthAndScore - Words grouped by length and score
 * @returns {Object} - Validation results
 */
function validatePuzzle(puzzle, category, index, existingPuzzles, anagramMap, wordsByLengthAndScore) {
    const words = puzzle.words || puzzle.solution || [];
    if (words.length !== 2) {
        return {
            valid: false,
            error: `Puzzle must have exactly 2 words, found ${words.length}`
        };
    }
    
    const [word1, word2] = words.map(w => w.toUpperCase());
    const puzzleId = `${category}[${index}]`;
    
    const results = {
        puzzleId,
        category,
        index,
        word1,
        word2,
        checks: {
            uniqueness: { valid: true },
            scores: { valid: true },
            anagrams: { valid: true },
            alternatives: { valid: true }
        },
        valid: true,
        errors: []
    };
    
    // Check uniqueness
    if (!isUnique(word1, word2, existingPuzzles)) {
        results.checks.uniqueness = {
            valid: false,
            error: `Duplicate puzzle: [${word1}, ${word2}] already exists`
        };
        results.valid = false;
        results.errors.push(results.checks.uniqueness.error);
    }
    
    // Check scores
    const scoreCheck = validateScores(word1, word2);
    if (!scoreCheck.valid) {
        results.checks.scores = {
            valid: false,
            score1: scoreCheck.score1,
            score2: scoreCheck.score2,
            error: `Both words have same score: ${scoreCheck.score1}`
        };
        results.valid = false;
        results.errors.push(results.checks.scores.error);
    } else {
        results.checks.scores = scoreCheck;
    }
    
    // Check anagrams (only if words are in validation dictionary range)
    const anagram1 = word1.length >= 3 && word1.length <= 8 
        ? getAnagramAlternatives(word1, anagramMap) 
        : [];
    const anagram2 = word2.length >= 3 && word2.length <= 8 
        ? getAnagramAlternatives(word2, anagramMap) 
        : [];
    
    if (anagram1.length > 0 || anagram2.length > 0) {
        results.checks.anagrams = {
            valid: false,
            word1Alternatives: anagram1,
            word2Alternatives: anagram2,
            error: `Word${anagram1.length > 0 ? ` "${word1}"` : ''}${anagram1.length > 0 && anagram2.length > 0 ? ' and' : ''}${anagram2.length > 0 ? ` "${word2}"` : ''} have anagram alternatives`
        };
        results.valid = false;
        results.errors.push(results.checks.anagrams.error);
    }
    
    // Check alternative solutions (only if both words are in validation dictionary range)
    if (word1.length >= 3 && word1.length <= 8 && word2.length >= 3 && word2.length <= 8) {
        const alternatives = findAlternatives(word1, word2, wordsByLengthAndScore);
        if (alternatives.length > 0) {
            results.checks.alternatives = {
                valid: false,
                alternatives,
                error: `Found ${alternatives.length} alternative solution(s) with same scores`
            };
            results.valid = false;
            results.errors.push(results.checks.alternatives.error);
        }
    } else {
        results.checks.alternatives = {
            valid: true,
            skipped: true,
            reason: `Words not in validation dictionary range (3-8 letters): ${word1.length}, ${word2.length}`
        };
    }
    
    return results;
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Get input file from command line
        const jsonPath = process.argv[2];
        if (!jsonPath) {
            console.error('Usage: node validate-new-puzzles.js <puzzles.json>');
            process.exit(1);
        }
        
        console.log('='.repeat(80));
        console.log('VALIDATING NEW PUZZLES');
        console.log('='.repeat(80));
        console.log(`\nLoading puzzles from: ${jsonPath}\n`);
        
        // Load new puzzles
        const newPuzzles = loadNewPuzzles(jsonPath);
        
        // Get existing puzzles
        console.log('Loading existing puzzles from puzzle-data.js...');
        const existingPuzzles = getExistingPuzzles();
        console.log(`Found ${existingPuzzles.size} existing puzzle pairs.\n`);
        
        // Load dictionary and build maps
        console.log('Loading validation dictionary...');
        const dictionaryWords = await loadWordList();
        console.log(`Loaded ${dictionaryWords.length} words.\n`);
        
        console.log('Building anagram map...');
        const anagramMap = buildAnagramMap(dictionaryWords);
        console.log(`Found ${anagramMap.size} anagram groups.\n`);
        
        console.log('Building words by length and score map...');
        const wordsByLengthAndScore = buildWordsByLengthAndScore(dictionaryWords);
        console.log(`Built map with ${wordsByLengthAndScore.size} length groups.\n`);
        
        // Validate all puzzles
        console.log('Validating puzzles...\n');
        const allResults = [];
        let totalPuzzles = 0;
        
        for (const [category, puzzles] of Object.entries(newPuzzles)) {
            if (!Array.isArray(puzzles)) {
                console.warn(`Warning: Category "${category}" is not an array, skipping.`);
                continue;
            }
            
            for (let i = 0; i < puzzles.length; i++) {
                const puzzle = puzzles[i];
                totalPuzzles++;
                const result = validatePuzzle(
                    puzzle,
                    category,
                    i,
                    existingPuzzles,
                    anagramMap,
                    wordsByLengthAndScore
                );
                allResults.push(result);
            }
        }
        
        // Generate report
        const validPuzzles = allResults.filter(r => r.valid);
        const invalidPuzzles = allResults.filter(r => !r.valid);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalPuzzles,
                valid: validPuzzles.length,
                invalid: invalidPuzzles.length,
                checks: {
                    uniqueness: {
                        passed: allResults.filter(r => r.checks.uniqueness.valid).length,
                        failed: allResults.filter(r => !r.checks.uniqueness.valid).length
                    },
                    scores: {
                        passed: allResults.filter(r => r.checks.scores.valid).length,
                        failed: allResults.filter(r => !r.checks.scores.valid).length
                    },
                    anagrams: {
                        passed: allResults.filter(r => r.checks.anagrams.valid).length,
                        failed: allResults.filter(r => !r.checks.anagrams.valid).length
                    },
                    alternatives: {
                        passed: allResults.filter(r => r.checks.alternatives.valid).length,
                        failed: allResults.filter(r => !r.checks.alternatives.valid).length
                    }
                }
            },
            results: allResults
        };
        
        // Write JSON report
        const outputPath = path.join(__dirname, 'validation-results.json');
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        
        // Console output
        console.log('='.repeat(80));
        console.log('VALIDATION RESULTS');
        console.log('='.repeat(80));
        console.log(`\nTotal puzzles checked: ${totalPuzzles}`);
        console.log(`Valid puzzles: ${validPuzzles.length} ✓`);
        console.log(`Invalid puzzles: ${invalidPuzzles.length}${invalidPuzzles.length > 0 ? ' ✗' : ''}\n`);
        
        console.log('Check Summary:');
        console.log(`  Uniqueness:    ${report.summary.checks.uniqueness.passed} passed, ${report.summary.checks.uniqueness.failed} failed`);
        console.log(`  Scores:        ${report.summary.checks.scores.passed} passed, ${report.summary.checks.scores.failed} failed`);
        console.log(`  Anagrams:      ${report.summary.checks.anagrams.passed} passed, ${report.summary.checks.anagrams.failed} failed`);
        console.log(`  Alternatives:  ${report.summary.checks.alternatives.passed} passed, ${report.summary.checks.alternatives.failed} failed\n`);
        
        if (invalidPuzzles.length > 0) {
            console.log('Invalid Puzzles:\n');
            for (const result of invalidPuzzles) {
                console.log(`${result.puzzleId}: [${result.word1}, ${result.word2}]`);
                for (const error of result.errors) {
                    console.log(`  ✗ ${error}`);
                }
                
                // Show detailed check results
                if (!result.checks.uniqueness.valid) {
                    console.log(`    Uniqueness: ${result.checks.uniqueness.error}`);
                }
                if (!result.checks.scores.valid) {
                    console.log(`    Scores: ${result.checks.scores.error} (${result.checks.scores.score1} = ${result.checks.scores.score2})`);
                }
                if (!result.checks.anagrams.valid) {
                    const alt1 = result.checks.anagrams.word1Alternatives || [];
                    const alt2 = result.checks.anagrams.word2Alternatives || [];
                    if (alt1.length > 0) {
                        console.log(`    "${result.word1}" anagrams: ${alt1.join(', ')}`);
                    }
                    if (alt2.length > 0) {
                        console.log(`    "${result.word2}" anagrams: ${alt2.join(', ')}`);
                    }
                }
                if (!result.checks.alternatives.valid) {
                    console.log(`    Alternative solutions:`);
                    for (const alt of result.checks.alternatives.alternatives) {
                        console.log(`      - [${alt.word1}, ${alt.word2}] (scores: ${alt.score1}, ${alt.score2})`);
                    }
                }
                console.log('');
            }
        } else {
            console.log('✓ All puzzles passed validation!\n');
        }
        
        console.log(`Detailed report saved to: ${outputPath}`);
        console.log('='.repeat(80));
        
        // Exit with error code if any puzzles failed
        process.exit(invalidPuzzles.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
