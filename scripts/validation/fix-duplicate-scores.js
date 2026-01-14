#!/usr/bin/env node

/**
 * Script to find replacement words for puzzles where both words have the same Scrabble score.
 * Finds replacement words that have different scores and no anagram alternatives.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA, SCRABBLE_SCORES } from '../../puzzle-data.js';
import { loadWordList, normalizeWordForAnagram, buildAnagramMap } from './check-anagrams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Find puzzles with duplicate scores
 * @returns {Array} - Array of puzzles with duplicate scores
 */
function findPuzzlesWithDuplicateScores() {
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
                word1: word1.toUpperCase(),
                word2: word2.toUpperCase(),
                score: score1,
                word1Length: word1.length,
                word2Length: word2.length
            });
        }
    }
    
    return issues;
}

/**
 * Find replacement word for a word that needs different score
 * @param {string} wordToReplace - Word to replace
 * @param {number} targetScore - Score that the other word has (need different score)
 * @param {number} wordLength - Length of word to replace
 * @param {string[]} dictionaryWords - All dictionary words
 * @param {Map<string, string[]>} anagramMap - Map of anagram groups
 * @param {Set<string>} usedWords - Set of already used words
 * @param {Set<string>} usedReplacements - Set of replacement words already used
 * @returns {string|null} - Replacement word or null if not found
 */
function findReplacementWord(wordToReplace, targetScore, wordLength, dictionaryWords, anagramMap, usedWords, usedReplacements) {
    // Filter words by length
    const candidates = dictionaryWords.filter(w => w.length === wordLength);
    
    // Shuffle for randomness (or we could sort for consistency)
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    
    for (const candidate of shuffled) {
        // Skip if already used
        if (usedWords.has(candidate) || usedReplacements.has(candidate)) {
            continue;
        }
        
        // Check score is different
        const candidateScore = calculateWordScore(candidate);
        if (candidateScore === targetScore) {
            continue;
        }
        
        // Check no anagram alternatives (or only itself)
        const normalized = normalizeWordForAnagram(candidate);
        const anagramGroup = anagramMap.get(normalized);
        if (anagramGroup && anagramGroup.length > 1) {
            continue;
        }
        
        return candidate;
    }
    
    return null;
}

/**
 * Find replacements for all puzzles with duplicate scores
 * @param {string[]} dictionaryWords - All dictionary words
 * @param {Map<string, string[]>} anagramMap - Map of anagram groups
 * @param {Set<string>} usedWords - Set of already used words
 * @param {Array} issues - Puzzles with duplicate scores
 * @returns {Map<string, string>} - Map of old word -> new word
 */
function findReplacements(dictionaryWords, anagramMap, usedWords, issues) {
    console.log('\nFinding replacement words...');
    
    const replacements = new Map();
    const usedReplacements = new Set();
    
    for (const { puzzleNum, word1, word2, score } of issues) {
        // Try to replace the shorter word first (easier to find replacements)
        // If same length, replace word1
        const wordToReplace = word1.length <= word2.length ? word1 : word2;
        const otherWord = wordToReplace === word1 ? word2 : word1;
        const otherScore = calculateWordScore(otherWord);
        
        const replacement = findReplacementWord(
            wordToReplace,
            otherScore,
            wordToReplace.length,
            dictionaryWords,
            anagramMap,
            usedWords,
            usedReplacements
        );
        
        if (replacement) {
            replacements.set(wordToReplace, replacement);
            usedReplacements.add(replacement);
            console.log(`  Puzzle ${puzzleNum}: "${wordToReplace}" → "${replacement}" (score: ${calculateWordScore(replacement)} vs ${otherScore})`);
        } else {
            console.warn(`  Puzzle ${puzzleNum}: No replacement found for "${wordToReplace}"`);
        }
    }
    
    return replacements;
}

/**
 * Generate replacement report
 * @param {Array} issues - Puzzles with duplicate scores
 * @param {Map<string, string>} replacements - Replacement mapping
 */
function generateReport(issues, replacements) {
    console.log('\n' + '='.repeat(80));
    console.log('REPLACEMENT REPORT');
    console.log('='.repeat(80));
    
    const replaced = [];
    const notReplaced = [];
    
    for (const { puzzleNum, word1, word2, score } of issues) {
        const wordToReplace = word1.length <= word2.length ? word1 : word2;
        const replacement = replacements.get(wordToReplace);
        
        if (replacement) {
            const newScore = calculateWordScore(replacement);
            const otherWord = wordToReplace === word1 ? word2 : word1;
            const otherScore = calculateWordScore(otherWord);
            
            replaced.push({
                puzzleNum,
                oldWord: wordToReplace,
                newWord: replacement,
                oldScore: score,
                newScore,
                otherWord,
                otherScore
            });
        } else {
            notReplaced.push({ puzzleNum, word1, word2, score });
        }
    }
    
    console.log(`\n✓ Successfully found replacements for ${replaced.length} puzzles`);
    if (notReplaced.length > 0) {
        console.log(`✗ Could not find replacements for ${notReplaced.length} puzzles`);
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log('REPLACEMENTS BY PUZZLE:');
    console.log('-'.repeat(80));
    
    const sortedPuzzles = replaced.sort((a, b) => a.puzzleNum - b.puzzleNum);
    for (const item of sortedPuzzles) {
        console.log(`\nPuzzle ${item.puzzleNum}:`);
        console.log(`  "${item.oldWord}" (score: ${item.oldScore}) → "${item.newWord}" (score: ${item.newScore})`);
        console.log(`  Other word: "${item.otherWord}" (score: ${item.otherScore})`);
        console.log(`  ✓ Scores are now different!`);
    }
    
    if (notReplaced.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('PUZZLES WITHOUT REPLACEMENTS:');
        console.log('-'.repeat(80));
        for (const { puzzleNum, word1, word2, score } of notReplaced) {
            console.log(`  Puzzle ${puzzleNum}: "${word1}" and "${word2}" (both score: ${score})`);
        }
    }
}

/**
 * Generate replacement mapping file
 * @param {Map<string, string>} replacements - Replacement mapping
 */
function generateReplacementFile(replacements) {
    const outputPath = path.join(__dirname, 'score-replacements.json');
    
    const replacementObj = {};
    for (const [oldWord, newWord] of replacements) {
        replacementObj[oldWord] = newWord;
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(replacementObj, null, 2));
    console.log(`\n✓ Replacement mapping saved to: ${outputPath}`);
    console.log(`  You can review this file and then apply replacements using apply-score-replacements.js`);
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Finding replacement words for puzzles with duplicate Scrabble scores...\n');
        
        // Find puzzles with duplicate scores
        const issues = findPuzzlesWithDuplicateScores();
        console.log(`Found ${issues.length} puzzles with duplicate scores.\n`);
        
        if (issues.length === 0) {
            console.log('No puzzles need fixing! ✓');
            return;
        }
        
        // Load dictionary
        const dictionaryWords = await loadWordList();
        
        // Build anagram map
        const anagramMap = buildAnagramMap(dictionaryWords);
        console.log(`Found ${anagramMap.size} anagram groups in dictionary.\n`);
        
        // Get used words
        console.log('Collecting currently used words...');
        const usedWords = getUsedWords();
        console.log(`Found ${usedWords.size} unique words currently used in puzzles.\n`);
        
        // Find replacements
        const replacements = findReplacements(dictionaryWords, anagramMap, usedWords, issues);
        
        // Generate report
        generateReport(issues, replacements);
        
        // Generate replacement file
        if (replacements.size > 0) {
            generateReplacementFile(replacements);
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('Next steps:');
        console.log('1. Review the score-replacements.json file');
        console.log('2. Run: node scripts/validation/apply-score-replacements.js');
        console.log('   (This will apply the replacements to puzzle-data.js)');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
