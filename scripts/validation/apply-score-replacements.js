#!/usr/bin/env node

/**
 * Script to apply score-based word replacements to puzzle-data.js
 * Reads score-replacements.json and updates puzzle-data.js with the new words
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { calculateScore } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUZZLE_DATA_PATH = path.join(__dirname, '../../puzzle-data.js');
const REPLACEMENTS_PATH = path.join(__dirname, 'score-replacements.json');

/**
 * Load replacements from JSON file
 * @returns {Map<string, string>} - Map of old word -> new word
 */
function loadReplacements() {
    if (!fs.existsSync(REPLACEMENTS_PATH)) {
        throw new Error(`Replacements file not found: ${REPLACEMENTS_PATH}\nRun fix-duplicate-scores.js first.`);
    }
    
    const data = fs.readFileSync(REPLACEMENTS_PATH, 'utf8');
    const replacementsObj = JSON.parse(data);
    
    const replacements = new Map();
    for (const [oldWord, newWord] of Object.entries(replacementsObj)) {
        replacements.set(oldWord.toUpperCase(), newWord.toUpperCase());
    }
    
    return replacements;
}

/**
 * Apply replacements to puzzle data
 * @param {Map<string, string>} replacements - Replacement mapping
 * @returns {Object} - Updated puzzle data
 */
function applyReplacements(replacements) {
    const updatedData = JSON.parse(JSON.stringify(PUZZLE_DATA)); // Deep copy
    const applied = [];
    
    for (const [puzzleNumStr, puzzle] of Object.entries(updatedData)) {
        const puzzleNum = parseInt(puzzleNumStr, 10);
        
        // Update words array
        if (puzzle.words && Array.isArray(puzzle.words)) {
            puzzle.words = puzzle.words.map((word, index) => {
                const upperWord = word.toUpperCase();
                if (replacements.has(upperWord)) {
                    const newWord = replacements.get(upperWord);
                    const oldScore = calculateWordScore(word);
                    const newScore = calculateWordScore(newWord);
                    const otherWord = puzzle.words[index === 0 ? 1 : 0];
                    const otherScore = calculateWordScore(otherWord);
                    
                    applied.push({
                        puzzleNum,
                        position: index,
                        oldWord: word,
                        newWord: newWord,
                        oldScore,
                        newScore,
                        otherWord,
                        otherScore
                    });
                    return newWord;
                }
                return word;
            });
        }
        
        // Update solution array
        if (puzzle.solution && Array.isArray(puzzle.solution)) {
            puzzle.solution = puzzle.solution.map((word, index) => {
                const upperWord = word.toUpperCase();
                if (replacements.has(upperWord)) {
                    return replacements.get(upperWord);
                }
                return word;
            });
        }
    }
    
    return { updatedData, applied };
}

/**
 * Write updated puzzle data back to file
 * @param {Object} updatedData - Updated puzzle data
 * @param {Array} applied - List of applied replacements
 * @param {Map<string, string>} replacements - Replacement mapping
 */
function writePuzzleData(updatedData, applied, replacements) {
    // Read the original file to preserve formatting and comments
    const originalContent = fs.readFileSync(PUZZLE_DATA_PATH, 'utf8');
    
    // Create a backup
    const backupPath = PUZZLE_DATA_PATH + '.backup';
    fs.writeFileSync(backupPath, originalContent);
    console.log(`✓ Backup created: ${backupPath}`);
    
    // Build replacement map from all replacements (not just applied ones)
    // This ensures we replace all instances in the file
    let newContent = originalContent;
    
    for (const [oldWord, newWord] of replacements) {
        // Escape special regex characters in the word
        const escapedOld = oldWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Match word in single quotes: 'WORD' (case-insensitive)
        const singleQuoteRegex = new RegExp(`'${escapedOld}'`, 'gi');
        newContent = newContent.replace(singleQuoteRegex, `'${newWord}'`);
        
        // Match word in double quotes: "WORD" (case-insensitive)
        const doubleQuoteRegex = new RegExp(`"${escapedOld}"`, 'gi');
        newContent = newContent.replace(doubleQuoteRegex, `"${newWord}"`);
    }
    
    // Write the updated content
    fs.writeFileSync(PUZZLE_DATA_PATH, newContent);
    console.log(`✓ Updated puzzle data written to: ${PUZZLE_DATA_PATH}`);
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Applying score-based word replacements to puzzle-data.js...\n');
        
        // Load replacements
        const replacements = loadReplacements();
        console.log(`Loaded ${replacements.size} replacements.\n`);
        
        // Apply replacements
        console.log('Applying replacements...');
        const { updatedData, applied } = applyReplacements(replacements);
        console.log(`Applied ${applied.length} replacements.\n`);
        
        // Show summary
        console.log('Replacements applied:');
        const byPuzzle = new Map();
        for (const item of applied) {
            if (!byPuzzle.has(item.puzzleNum)) {
                byPuzzle.set(item.puzzleNum, []);
            }
            byPuzzle.get(item.puzzleNum).push(item);
        }
        
        const sortedPuzzles = Array.from(byPuzzle.entries()).sort((a, b) => a[0] - b[0]);
        for (const [puzzleNum, items] of sortedPuzzles) {
            console.log(`\nPuzzle ${puzzleNum}:`);
            for (const { oldWord, newWord, oldScore, newScore, otherWord, otherScore } of items) {
                console.log(`  "${oldWord}" (score: ${oldScore}) → "${newWord}" (score: ${newScore})`);
                console.log(`  Other word: "${otherWord}" (score: ${otherScore})`);
                console.log(`  ✓ Scores are now different!`);
            }
        }
        
        // Write updated data
        console.log('\nWriting updated puzzle data...');
        writePuzzleData(updatedData, applied, replacements);
        
        console.log('\n' + '='.repeat(80));
        console.log('✓ Replacements applied successfully!');
        console.log('\nNext steps:');
        console.log('1. Review the changes in puzzle-data.js');
        console.log('2. Run: npm run build:data (to rebuild encoded puzzle data)');
        console.log('3. Run: npm run validate:scores (to verify no duplicate scores remain)');
        console.log('4. Test the puzzles to ensure they still work correctly');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
