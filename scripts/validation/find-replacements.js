#!/usr/bin/env node

/**
 * Script to find replacement words for puzzle words that have anagram alternatives.
 * Finds unused 5-letter words from the dictionary that have no anagram alternatives.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';
import { loadWordList, normalizeWordForAnagram, buildAnagramMap } from './check-anagrams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all currently used words from puzzle data
 * @returns {Set<string>} - Set of all words used in puzzles (uppercase)
 */
function getUsedWords() {
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

/**
 * Find words that need replacement (5-letter words with anagram alternatives)
 * @param {Map<string, string[]>} anagramMap - Map of normalized form -> array of words
 * @returns {Array<{word: string, puzzleNum: number, position: number, alternatives: string[]}>}
 */
function findWordsToReplace(anagramMap) {
    const wordsToReplace = [];
    
    for (const [puzzleNumStr, puzzle] of Object.entries(PUZZLE_DATA)) {
        const puzzleNum = parseInt(puzzleNumStr, 10);
        
        if (puzzle.words && Array.isArray(puzzle.words)) {
            puzzle.words.forEach((word, index) => {
                const upperWord = word.toUpperCase();
                
                // Only process 5-letter words
                if (upperWord.length !== 5) return;
                
                const normalized = normalizeWordForAnagram(upperWord);
                const anagramGroup = anagramMap.get(normalized);
                
                if (anagramGroup) {
                    // Filter out the puzzle word itself from alternatives
                    const alternatives = anagramGroup.filter(w => w !== upperWord);
                    
                    if (alternatives.length > 0) {
                        wordsToReplace.push({
                            word: upperWord,
                            puzzleNum,
                            position: index,
                            alternatives
                        });
                    }
                }
            });
        }
    }
    
    return wordsToReplace;
}

/**
 * Find replacement words from dictionary
 * @param {string[]} dictionaryWords - All dictionary words
 * @param {Map<string, string[]>} anagramMap - Map of anagram groups
 * @param {Set<string>} usedWords - Set of already used words
 * @param {Array} wordsToReplace - Words that need replacement
 * @returns {Map<string, string>} - Map of old word -> new word
 */
function findReplacements(dictionaryWords, anagramMap, usedWords, wordsToReplace) {
    console.log('\nFinding replacement words...');
    
    // Get all 5-letter words with no anagram alternatives
    const wordsWithoutAnagrams = new Set();
    for (const word of dictionaryWords) {
        if (word.length === 5) {
            const normalized = normalizeWordForAnagram(word);
            const anagramGroup = anagramMap.get(normalized);
            
            // Only include words with no anagram alternatives (or only themselves)
            if (!anagramGroup || anagramGroup.length === 1) {
                wordsWithoutAnagrams.add(word);
            }
        }
    }
    
    console.log(`Found ${wordsWithoutAnagrams.size} words with no anagram alternatives.`);
    
    // Filter out already used words
    const availableWords = Array.from(wordsWithoutAnagrams).filter(
        word => !usedWords.has(word)
    );
    
    console.log(`Found ${availableWords.length} unused words with no anagram alternatives.`);
    
    if (availableWords.length < wordsToReplace.length) {
        console.warn(`\nWarning: Only ${availableWords.length} replacement words available, but ${wordsToReplace.length} words need replacement.`);
        console.warn('Some words may not be replaced.');
    }
    
    // Create replacement map
    const replacements = new Map();
    const usedReplacements = new Set();
    
    for (const { word } of wordsToReplace) {
        // Find an available replacement
        const replacement = availableWords.find(
            w => !usedReplacements.has(w)
        );
        
        if (replacement) {
            replacements.set(word, replacement);
            usedReplacements.add(replacement);
        } else {
            console.warn(`No replacement found for: ${word}`);
        }
    }
    
    return replacements;
}

/**
 * Generate replacement report
 * @param {Array} wordsToReplace - Words that need replacement
 * @param {Map<string, string>} replacements - Replacement mapping
 */
function generateReport(wordsToReplace, replacements) {
    console.log('\n' + '='.repeat(80));
    console.log('REPLACEMENT REPORT');
    console.log('='.repeat(80));
    
    const replaced = [];
    const notReplaced = [];
    
    for (const { word, puzzleNum, position, alternatives } of wordsToReplace) {
        const replacement = replacements.get(word);
        if (replacement) {
            replaced.push({ word, replacement, puzzleNum, position, alternatives });
        } else {
            notReplaced.push({ word, puzzleNum, position, alternatives });
        }
    }
    
    console.log(`\n✓ Successfully found replacements for ${replaced.length} words`);
    if (notReplaced.length > 0) {
        console.log(`✗ Could not find replacements for ${notReplaced.length} words`);
    }
    
    // Group by puzzle for easier review
    const byPuzzle = new Map();
    for (const item of replaced) {
        if (!byPuzzle.has(item.puzzleNum)) {
            byPuzzle.set(item.puzzleNum, []);
        }
        byPuzzle.get(item.puzzleNum).push(item);
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log('REPLACEMENTS BY PUZZLE:');
    console.log('-'.repeat(80));
    
    const sortedPuzzles = Array.from(byPuzzle.entries()).sort((a, b) => a[0] - b[0]);
    for (const [puzzleNum, items] of sortedPuzzles) {
        console.log(`\nPuzzle ${puzzleNum}:`);
        for (const { word, replacement, position } of items) {
            console.log(`  Position ${position}: "${word}" → "${replacement}"`);
        }
    }
    
    if (notReplaced.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('WORDS WITHOUT REPLACEMENTS:');
        console.log('-'.repeat(80));
        for (const { word, puzzleNum, position } of notReplaced) {
            console.log(`  Puzzle ${puzzleNum}, position ${position}: "${word}"`);
        }
    }
}

/**
 * Generate replacement mapping file
 * @param {Map<string, string>} replacements - Replacement mapping
 */
function generateReplacementFile(replacements) {
    const outputPath = path.join(__dirname, 'replacements.json');
    
    const replacementObj = {};
    for (const [oldWord, newWord] of replacements) {
        replacementObj[oldWord] = newWord;
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(replacementObj, null, 2));
    console.log(`\n✓ Replacement mapping saved to: ${outputPath}`);
    console.log(`  You can review this file and then apply replacements using apply-replacements.js`);
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Finding replacement words for puzzle words with anagram alternatives...\n');
        
        // Load dictionary
        const dictionaryWords = await loadWordList();
        
        // Build anagram map
        const anagramMap = buildAnagramMap(dictionaryWords);
        console.log(`Found ${anagramMap.size} anagram groups in dictionary.\n`);
        
        // Get used words
        console.log('Collecting currently used words...');
        const usedWords = getUsedWords();
        console.log(`Found ${usedWords.size} unique words currently used in puzzles.\n`);
        
        // Find words that need replacement
        console.log('Identifying words that need replacement...');
        const wordsToReplace = findWordsToReplace(anagramMap);
        console.log(`Found ${wordsToReplace.length} words that need replacement.\n`);
        
        // Find replacements
        const replacements = findReplacements(dictionaryWords, anagramMap, usedWords, wordsToReplace);
        
        // Generate report
        generateReport(wordsToReplace, replacements);
        
        // Generate replacement file
        if (replacements.size > 0) {
            generateReplacementFile(replacements);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('Next steps:');
        console.log('1. Review the replacements.json file');
        console.log('2. Run: node scripts/validation/apply-replacements.js');
        console.log('   (This will apply the replacements to puzzle-data.js)');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
