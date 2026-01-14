#!/usr/bin/env node

/**
 * Script to check if any puzzles have alternative solutions - i.e., different word pairs
 * that use the same letters, have the same Scrabble scores, and same number of letters.
 * Uses validation-words.txt dictionary.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { loadWordList } from './check-anagrams.js';
import { calculateScore, getLetterFreq, subtractLetters, wordMatchesFreq } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Find alternative solutions for a puzzle
 * @param {number} puzzleNum - Puzzle number
 * @param {Map<number, string[]>} wordsByScore - Dictionary words grouped by score
 * @returns {Array<{word1: string, word2: string, score1: number, score2: number}>} - Alternative solutions
 */
function findAlternatives(puzzleNum, wordsByScore) {
    const puzzle = PUZZLE_DATA[puzzleNum];
    if (!puzzle || !puzzle.solution) return [];
    
    const [word1, word2] = puzzle.solution;
    
    // Only check if both words are between 3-8 letters (validation dictionary range)
    if (word1.length < 3 || word1.length > 8 || word2.length < 3 || word2.length > 8) return [];
    
    const targetFreq = getLetterFreq(word1 + word2);
    const targetScore1 = calculateScore(word1);
    const targetScore2 = calculateScore(word2);
    
    // Get candidates for word1 (words with matching score)
    const candidates1 = wordsByScore.get(targetScore1) || [];
    
    const alternatives = [];
    const seen = new Set();
    
    // Try each candidate for word1
    for (const candidate1 of candidates1) {
        // Skip if it's the original word1
        if (candidate1 === word1) continue;
        
        // Calculate remaining letters needed for word2
        const remainingFreq = subtractLetters(targetFreq, candidate1);
        if (!remainingFreq) continue; // Can't form word1 from available letters
        
        // Get candidates for word2 (words with matching score)
        const candidates2 = wordsByScore.get(targetScore2) || [];
        
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
 * Main execution function
 */
async function main() {
    try {
        console.log('Checking for alternative solutions (5-letter words only)...\n');
        
        // Load dictionary
        console.log('Loading dictionary...');
        const dictionaryWords = await loadWordList();
        console.log(`Loaded ${dictionaryWords.length} words.\n`);
        
        // Group words by score for efficient lookup
        console.log('Grouping words by score...');
        const wordsByScore = new Map();
        for (const word of dictionaryWords) {
            const score = calculateScore(word);
            if (!wordsByScore.has(score)) {
                wordsByScore.set(score, []);
            }
            wordsByScore.get(score).push(word);
        }
        console.log(`Grouped into ${wordsByScore.size} score groups.\n`);
        
        // Filter puzzles where both words are 3-8 letters (validation dictionary range)
        console.log('Filtering puzzles with words in validation dictionary range (3-8 letters)...');
        const validPuzzles = [];
        for (const [puzzleNumStr, puzzle] of Object.entries(PUZZLE_DATA)) {
            const puzzleNum = parseInt(puzzleNumStr, 10);
            if (puzzle.solution && puzzle.solution.length === 2) {
                const [word1, word2] = puzzle.solution;
                if (word1.length >= 3 && word1.length <= 8 && word2.length >= 3 && word2.length <= 8) {
                    validPuzzles.push(puzzleNum);
                }
            }
        }
        console.log(`Found ${validPuzzles.length} puzzles with words in validation dictionary range.\n`);
        
        // Check each puzzle
        console.log('Checking for alternative solutions...\n');
        const results = [];
        
        for (let i = 0; i < fiveLetterPuzzles.length; i++) {
            const puzzleNum = fiveLetterPuzzles[i];
            const alternatives = findAlternatives(puzzleNum, wordsByScore);
            if (alternatives.length > 0) {
                const puzzle = PUZZLE_DATA[puzzleNum];
                results.push({
                    puzzleNum,
                    solution: puzzle.solution,
                    alternatives
                });
            }
            
            if ((i + 1) % 10 === 0 || i === validPuzzles.length - 1) {
                process.stdout.write(`\r  Checked ${i + 1}/${validPuzzles.length} puzzles`);
            }
        }
        process.stdout.write(`\n\n`);
        
        // Write results to file
        const outputPath = path.join(__dirname, 'alternative-solutions.json');
        const outputData = {
            timestamp: new Date().toISOString(),
            totalPuzzlesChecked: fiveLetterPuzzles.length,
            puzzlesWithAlternatives: results.length,
            results: results.map(result => ({
                puzzleNum: result.puzzleNum,
                original: result.solution,
                originalScores: [
                    calculateScore(result.solution[0]),
                    calculateScore(result.solution[1])
                ],
                alternativeCount: result.alternatives.length,
                alternatives: result.alternatives
            }))
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`Results written to: ${outputPath}\n`);
        
        // Report results
        if (results.length === 0) {
            console.log('✓ No alternative solutions found!');
            console.log('All puzzles have unique solutions.\n');
        } else {
            console.log(`✗ Found ${results.length} puzzle(s) with alternative solutions:\n`);
            
            for (const result of results) {
                const [word1, word2] = result.solution;
                const score1 = calculateScore(word1);
                const score2 = calculateScore(word2);
                
                console.log(`Puzzle ${result.puzzleNum}:`);
                console.log(`  Original: [${word1}, ${word2}] (scores: ${score1}, ${score2})`);
                console.log(`  Alternatives (${result.alternatives.length}):`);
                
                for (const alt of result.alternatives) {
                    console.log(`    - [${alt.word1}, ${alt.word2}] (scores: ${alt.score1}, ${alt.score2})`);
                }
                console.log('');
            }
        }
        
        process.exit(results.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
