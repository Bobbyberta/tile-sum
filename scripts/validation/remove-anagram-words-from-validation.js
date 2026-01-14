#!/usr/bin/env node

/**
 * Script to remove words from puzzle-safe-words.txt that have anagrams
 * in the validation-words.txt dictionary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUZZLE_SAFE_WORDS_PATH = path.join(__dirname, 'puzzle-safe-words.txt');
const VALIDATION_WORDS_PATH = path.join(__dirname, 'validation-words.txt');
const BACKUP_PATH = path.join(__dirname, 'puzzle-safe-words.txt.backup');

/**
 * Normalize a word for anagram comparison by sorting its letters alphabetically
 * @param {string} word - The word to normalize
 * @returns {string} - Normalized string with letters sorted
 */
function normalizeWordForAnagram(word) {
    return word.toUpperCase().split('').sort().join('');
}

/**
 * Build anagram map from dictionary words
 * Groups words by their normalized (sorted letters) form
 * @param {string[]} words - Array of dictionary words
 * @returns {Map<string, string[]>} - Map of normalized form -> array of words
 */
function buildAnagramMap(words) {
    console.log('Building anagram map from validation dictionary...');
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
        if (groupCount % 10000 === 0) {
            process.stdout.write(`\r  Filtered ${groupCount}/${anagramMap.size} groups`);
        }
    }
    process.stdout.write(`\r  Filtered ${groupCount}/${anagramMap.size} groups\n`);
    
    return filteredMap;
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Removing words with anagrams from puzzle-safe-words.txt...\n');
        
        // Load validation-words.txt dictionary
        console.log('Loading validation-words.txt dictionary...');
        const validationData = fs.readFileSync(VALIDATION_WORDS_PATH, 'utf8');
        const validationWords = validationData
            .split('\n')
            .map(line => line.trim().toUpperCase())
            .filter(word => word.length >= 3 && word.length <= 8 && /^[A-Z]+$/.test(word));
        console.log(`Loaded ${validationWords.length} words from validation dictionary.\n`);
        
        // Build anagram map
        const anagramMap = buildAnagramMap(validationWords);
        console.log(`Found ${anagramMap.size} anagram groups in validation dictionary.\n`);
        
        // Load puzzle-safe-words.txt
        console.log('Loading puzzle-safe-words.txt...');
        const allWords = fs.readFileSync(PUZZLE_SAFE_WORDS_PATH, 'utf8').split('\n');
        console.log(`Loaded ${allWords.length} words.\n`);
        
        // Find words with anagrams
        console.log('Checking for words with anagrams...');
        const wordsToRemove = new Set();
        const wordsWithAnagrams = [];
        
        for (const line of allWords) {
            const word = line.trim().toUpperCase();
            // Check all words (not just 5-letter words)
            if (word.length >= 3 && word.length <= 8 && /^[A-Z]+$/.test(word)) {
                const normalized = normalizeWordForAnagram(word);
                const anagramGroup = anagramMap.get(normalized);
                if (anagramGroup && anagramGroup.length > 1) {
                    // Check if there are other words in the validation dictionary that are anagrams
                    const alternatives = anagramGroup.filter(w => w !== word);
                    if (alternatives.length > 0) {
                        wordsToRemove.add(line.trim()); // Use original case
                        wordsWithAnagrams.push({ word, alternatives });
                    }
                }
            }
        }
        
        console.log(`Found ${wordsWithAnagrams.length} words with anagrams.\n`);
        
        if (wordsWithAnagrams.length === 0) {
            console.log('No words to remove! ✓');
            return;
        }
        
        // Show some examples
        console.log('Examples of words that will be removed:');
        wordsWithAnagrams.slice(0, 10).forEach(({ word, alternatives }) => {
            console.log(`  ${word}: ${alternatives.slice(0, 5).join(', ')}${alternatives.length > 5 ? ` (+${alternatives.length - 5} more)` : ''}`);
        });
        if (wordsWithAnagrams.length > 10) {
            console.log(`  ... and ${wordsWithAnagrams.length - 10} more`);
        }
        console.log();
        
        // Create backup
        console.log('Creating backup...');
        fs.copyFileSync(PUZZLE_SAFE_WORDS_PATH, BACKUP_PATH);
        console.log(`Backup created: ${BACKUP_PATH}\n`);
        
        // Remove words with anagrams
        const filteredWords = allWords.filter(line => {
            const word = line.trim();
            return !wordsToRemove.has(word);
        });
        
        // Write filtered words back
        fs.writeFileSync(PUZZLE_SAFE_WORDS_PATH, filteredWords.join('\n'));
        
        const removedCount = allWords.length - filteredWords.length;
        console.log(`✓ Removed ${removedCount} words with anagrams`);
        console.log(`✓ Kept ${filteredWords.length} words`);
        console.log(`\nOriginal: ${allWords.length} words`);
        console.log(`After removal: ${filteredWords.length} words`);
        console.log(`\nBackup saved to: ${BACKUP_PATH}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
