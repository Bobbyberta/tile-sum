#!/usr/bin/env node

/**
 * Script to remove words from puzzle-safe-words.txt that have anagrams
 * in the validation-words.txt dictionary.
 * 
 * NOTE: This script now uses validation-words.txt (via check-anagrams.js).
 * For consistency, consider using remove-anagram-words-from-validation.js instead.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadWordList, buildAnagramMap, normalizeWordForAnagram } from './check-anagrams.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUZZLE_SAFE_WORDS_PATH = path.join(__dirname, 'puzzle-safe-words.txt');
const BACKUP_PATH = path.join(__dirname, 'puzzle-safe-words.txt.backup');

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Removing words with anagrams from puzzle-safe-words.txt...\n');
        
        // Load validation-words.txt dictionary
        console.log('Loading validation-words.txt dictionary...');
        const validationWords = await loadWordList();
        const anagramMap = buildAnagramMap(validationWords);
        console.log(`Loaded ${validationWords.length} words and found ${anagramMap.size} anagram groups.\n`);
        
        // Load puzzle-safe-words.txt
        console.log('Loading puzzle-safe-words.txt...');
        const allWords = fs.readFileSync(PUZZLE_SAFE_WORDS_PATH, 'utf8').split('\n');
        console.log(`Loaded ${allWords.length} words.\n`);
        
        // Find words with anagrams (only check 5-letter words)
        console.log('Checking for words with anagrams...');
        const wordsToRemove = new Set();
        const wordsWithAnagrams = [];
        
        for (const line of allWords) {
            const word = line.trim().toUpperCase();
            // Check words in validation dictionary range (3-8 letters)
            if (word.length >= 3 && word.length <= 8 && /^[A-Z]+$/.test(word)) {
                const normalized = normalizeWordForAnagram(word);
                const anagramGroup = anagramMap.get(normalized);
                if (anagramGroup && anagramGroup.length > 1) {
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
            console.log(`  ${word}: ${alternatives.join(', ')}`);
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
