#!/usr/bin/env node

/**
 * Validation script to check if any words in puzzle-data.js can be rearranged
 * to form other valid English words (anagrams). Uses the five-letter word
 * dictionary from GitHub.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { PUZZLE_DATA } from '../../puzzle-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICTIONARY_URL = 'https://raw.githubusercontent.com/charlesreid1/five-letter-words/main/sgb-words.txt';
const LOCAL_DICTIONARY_PATH = path.join(__dirname, 'sgb-words.txt');

/**
 * Normalize a word for anagram comparison by sorting its letters alphabetically
 * @param {string} word - The word to normalize
 * @returns {string} - Normalized string with letters sorted
 */
export function normalizeWordForAnagram(word) {
    return word.toUpperCase().split('').sort().join('');
}

/**
 * Load word list from local file
 * @returns {Promise<string[]>} - Array of words from the dictionary
 */
function loadWordListFromFile() {
    return new Promise((resolve, reject) => {
        console.log('Loading word list from local file...');
        
        fs.readFile(LOCAL_DICTIONARY_PATH, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            
            const words = data
                .split('\n')
                .map(line => line.trim().toUpperCase())
                .filter(word => word.length === 5 && /^[A-Z]+$/.test(word));
            
            console.log(`Loaded ${words.length} five-letter words from local dictionary.`);
            resolve(words);
        });
    });
}

/**
 * Fetch word list from GitHub URL
 * @returns {Promise<string[]>} - Array of words from the dictionary
 */
function fetchWordListFromGitHub() {
    return new Promise((resolve, reject) => {
        console.log('Fetching word list from GitHub...');
        
        https.get(DICTIONARY_URL, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch dictionary: HTTP ${res.statusCode}`));
                return;
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const words = data
                    .split('\n')
                    .map(line => line.trim().toUpperCase())
                    .filter(word => word.length === 5 && /^[A-Z]+$/.test(word));
                
                console.log(`Loaded ${words.length} five-letter words from dictionary.`);
                resolve(words);
            });
        }).on('error', (err) => {
            reject(new Error(`Network error fetching dictionary: ${err.message}`));
        });
    });
}

/**
 * Load word list, preferring local file, falling back to GitHub
 * @returns {Promise<string[]>} - Array of words from the dictionary
 */
export async function loadWordList() {
    // Check if local file exists
    if (fs.existsSync(LOCAL_DICTIONARY_PATH)) {
        try {
            return await loadWordListFromFile();
        } catch (error) {
            console.warn(`Warning: Could not read local dictionary file: ${error.message}`);
            console.warn('Falling back to GitHub...\n');
        }
    }
    
    // Fall back to GitHub
    try {
        return await fetchWordListFromGitHub();
    } catch (error) {
        throw new Error(
            `Failed to load dictionary from GitHub: ${error.message}\n\n` +
            `To use a local dictionary file instead:\n` +
            `1. Download sgb-words.txt from:\n` +
            `   ${DICTIONARY_URL}\n` +
            `2. Save it as: ${LOCAL_DICTIONARY_PATH}`
        );
    }
}

/**
 * Build anagram map from dictionary words
 * Groups words by their normalized (sorted letters) form
 * @param {string[]} words - Array of dictionary words
 * @returns {Map<string, string[]>} - Map of normalized form -> array of words
 */
export function buildAnagramMap(words) {
    console.log('Building anagram map...');
    const anagramMap = new Map();
    const total = words.length;
    const progressInterval = Math.max(1, Math.floor(total / 20)); // Update every 5%
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const normalized = normalizeWordForAnagram(word);
        if (!anagramMap.has(normalized)) {
            anagramMap.set(normalized, []);
        }
        anagramMap.get(normalized).push(word);
        
        // Show progress
        if (i % progressInterval === 0 || i === words.length - 1) {
            const percent = Math.round((i + 1) / total * 100);
            process.stdout.write(`\r  Processing words: ${i + 1}/${total} (${percent}%)`);
        }
    }
    
    console.log('\nFiltering anagram groups...');
    // Filter to only include groups with 2+ words (actual anagrams)
    const filteredMap = new Map();
    let groupCount = 0;
    for (const [normalized, wordList] of anagramMap) {
        if (wordList.length > 1) {
            filteredMap.set(normalized, wordList);
        }
        groupCount++;
        if (groupCount % 1000 === 0) {
            process.stdout.write(`\r  Filtered ${groupCount}/${anagramMap.size} groups`);
        }
    }
    process.stdout.write(`\r  Filtered ${groupCount}/${anagramMap.size} groups\n`);
    
    return filteredMap;
}

/**
 * Extract all words from puzzle data with their metadata
 * @returns {Array<{word: string, puzzleNum: number, position: number}>}
 */
function extractPuzzleWords() {
    const words = [];
    
    for (const [puzzleNumStr, puzzle] of Object.entries(PUZZLE_DATA)) {
        const puzzleNum = parseInt(puzzleNumStr, 10);
        
        if (puzzle.words && Array.isArray(puzzle.words)) {
            puzzle.words.forEach((word, index) => {
                words.push({
                    word: word.toUpperCase(),
                    puzzleNum,
                    position: index
                });
            });
        }
    }
    
    return words;
}

/**
 * Check puzzle words against anagram map
 * @param {Array<{word: string, puzzleNum: number, position: number}>} puzzleWords
 * @param {Map<string, string[]>} anagramMap
 * @returns {Array<{word: string, puzzleNum: number, position: number, alternatives: string[]}>}
 */
function checkPuzzleWords(puzzleWords, anagramMap) {
    const results = [];
    const skipped = [];
    const total = puzzleWords.length;
    const progressInterval = Math.max(1, Math.floor(total / 20)); // Update every 5%
    
    for (let i = 0; i < puzzleWords.length; i++) {
        const { word, puzzleNum, position } = puzzleWords[i];
        
        // Skip words that aren't 5 letters
        if (word.length !== 5) {
            skipped.push(word);
            continue;
        }
        
        const normalized = normalizeWordForAnagram(word);
        const anagramGroup = anagramMap.get(normalized);
        
        if (anagramGroup) {
            // Filter out the puzzle word itself from alternatives
            const alternatives = anagramGroup.filter(w => w !== word);
            
            if (alternatives.length > 0) {
                results.push({
                    word,
                    puzzleNum,
                    position,
                    alternatives
                });
            }
        }
        
        // Show progress
        if (i % progressInterval === 0 || i === puzzleWords.length - 1) {
            const percent = Math.round((i + 1) / total * 100);
            process.stdout.write(`\r  Checking puzzle words: ${i + 1}/${total} (${percent}%)`);
        }
    }
    
    console.log(''); // New line after progress
    return { results, skipped };
}

/**
 * Format and output results
 * @param {Array} results - Array of words with anagram alternatives
 * @param {string[]} skipped - Array of skipped words
 * @param {number} totalWords - Total number of puzzle words checked
 */
function reportResults(results, skipped, totalWords) {
    console.log('\nChecking puzzle words for anagram alternatives...\n');
    
    if (results.length > 0) {
        console.log('Found anagram alternatives:');
        for (const { word, puzzleNum, position, alternatives } of results) {
            console.log(`  Puzzle ${puzzleNum}, word "${word}" (position ${position}):`);
            console.log(`    Alternatives: ${alternatives.join(', ')}`);
        }
    } else {
        console.log('No anagram alternatives found! ✓');
    }
    
    if (skipped.length > 0) {
        const uniqueSkipped = [...new Set(skipped)];
        console.log(`\nSkipped (not 5 letters): ${uniqueSkipped.slice(0, 20).join(', ')}${uniqueSkipped.length > 20 ? '...' : ''}`);
    }
    
    console.log('\nSummary:');
    console.log(`  - ${results.length} word${results.length !== 1 ? 's' : ''} have anagram alternatives`);
    console.log(`  - ${totalWords} total words checked`);
    console.log(`  - ${skipped.length} word${skipped.length !== 1 ? 's' : ''} skipped (not 5 letters)`);
}

/**
 * Main execution function
 */
async function main() {
    try {
        // Load dictionary (prefer local, fallback to GitHub)
        const dictionaryWords = await loadWordList();
        
        // Build anagram map
        const anagramMap = buildAnagramMap(dictionaryWords);
        console.log(`Found ${anagramMap.size} anagram groups in dictionary.\n`);
        
        // Extract puzzle words
        console.log('Extracting puzzle words...');
        const puzzleWords = extractPuzzleWords();
        console.log(`Extracted ${puzzleWords.length} words from ${Object.keys(PUZZLE_DATA).length} puzzles.\n`);
        
        // Check for anagrams
        const { results, skipped } = checkPuzzleWords(puzzleWords, anagramMap);
        
        // Report results
        reportResults(results, skipped, puzzleWords.length);
        
        // Exit with error code if anagrams found
        if (results.length > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script only if this is the main module (not imported)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
