#!/usr/bin/env node

/**
 * Validation script to check that the two words in each puzzle have different Scrabble scores.
 * Reports any puzzles where both words have the same score.
 */

import { PUZZLE_DATA, SCRABBLE_SCORES } from '../../puzzle-data.js';

/**
 * Calculate Scrabble score for a word
 * @param {string} word - The word to score
 * @returns {number} - The Scrabble score
 */
function calculateWordScore(word) {
    if (!word) return 0;
    
    return word
        .toUpperCase()
        .split('')
        .reduce((score, letter) => {
            return score + (SCRABBLE_SCORES[letter] || 0);
        }, 0);
}

/**
 * Check all puzzles for duplicate scores
 * @returns {Array} - Array of puzzles with duplicate scores
 */
function checkPuzzleScores() {
    const issues = [];
    
    for (const [puzzleNumStr, puzzle] of Object.entries(PUZZLE_DATA)) {
        const puzzleNum = parseInt(puzzleNumStr, 10);
        
        if (!puzzle.words || !Array.isArray(puzzle.words) || puzzle.words.length < 2) {
            continue;
        }
        
        const [word1, word2] = puzzle.words;
        const score1 = calculateWordScore(word1);
        const score2 = calculateWordScore(word2);
        
        if (score1 === score2) {
            issues.push({
                puzzleNum,
                word1,
                word2,
                score: score1
            });
        }
    }
    
    return issues;
}

/**
 * Report results
 * @param {Array} issues - Array of puzzles with duplicate scores
 */
function reportResults(issues) {
    console.log('\n' + '='.repeat(80));
    console.log('SCRABBLE SCORE VALIDATION');
    console.log('='.repeat(80));
    
    if (issues.length === 0) {
        console.log('\n✓ All puzzles have different Scrabble scores for their two words!');
        console.log('\nSummary:');
        console.log('  - 0 puzzles with duplicate scores');
        console.log(`  - ${Object.keys(PUZZLE_DATA).length} total puzzles checked`);
    } else {
        console.log(`\n✗ Found ${issues.length} puzzle${issues.length !== 1 ? 's' : ''} with duplicate Scrabble scores:\n`);
        
        for (const { puzzleNum, word1, word2, score } of issues) {
            console.log(`  Puzzle ${puzzleNum}:`);
            console.log(`    Word 1: "${word1}" (score: ${score})`);
            console.log(`    Word 2: "${word2}" (score: ${score})`);
            console.log('');
        }
        
        console.log('Summary:');
        console.log(`  - ${issues.length} puzzle${issues.length !== 1 ? 's' : ''} with duplicate scores`);
        console.log(`  - ${Object.keys(PUZZLE_DATA).length} total puzzles checked`);
    }
    
    console.log('='.repeat(80));
}

/**
 * Main execution function
 */
function main() {
    try {
        console.log('Checking Scrabble scores for all puzzles...\n');
        
        const issues = checkPuzzleScores();
        reportResults(issues);
        
        // Exit with error code if issues found
        if (issues.length > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
