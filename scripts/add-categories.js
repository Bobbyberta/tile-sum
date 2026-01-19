#!/usr/bin/env node

/**
 * Script to fetch word categories (part-of-speech) from DictionaryAPI.dev
 * Extracts all unique words from puzzle-data.js and fetches their categories
 * Saves results to scripts/validation/word-categories.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import puzzle data
const puzzleDataPath = path.join(rootDir, 'puzzle-data.js');
const puzzleDataCode = fs.readFileSync(puzzleDataPath, 'utf8');

// Extract PUZZLE_DATA using eval (safe since it's our own source file)
const puzzleDataMatch = puzzleDataCode.match(/export const PUZZLE_DATA = \{[\s\S]*?\};/);
if (!puzzleDataMatch) {
    console.error('Could not extract PUZZLE_DATA from source file');
    process.exit(1);
}

const puzzleDataStr = puzzleDataMatch[0].replace(/export const PUZZLE_DATA = /, '').replace(/;$/, '');
let PUZZLE_DATA;
try {
    PUZZLE_DATA = eval(`(${puzzleDataStr})`);
} catch (e) {
    console.error('Error parsing puzzle data:', e.message);
    process.exit(1);
}

// Extract all unique words from puzzles
const uniqueWords = new Set();
for (const puzzle of Object.values(PUZZLE_DATA)) {
    if (puzzle.words && Array.isArray(puzzle.words)) {
        puzzle.words.forEach(word => {
            uniqueWords.add(word.toUpperCase());
        });
    }
    if (puzzle.solution && Array.isArray(puzzle.solution)) {
        puzzle.solution.forEach(word => {
            uniqueWords.add(word.toUpperCase());
        });
    }
}

const wordsArray = Array.from(uniqueWords).sort();
console.log(`Found ${wordsArray.length} unique words to categorize\n`);

// Category mapping from API to our categories
const POS_PRIORITY = ['noun', 'verb', 'adjective', 'adverb'];
const VALID_CATEGORIES = new Set(POS_PRIORITY);

/**
 * Map API part-of-speech to our category
 * @param {string} pos - Part of speech from API
 * @returns {string|null} - Mapped category or null if not valid
 */
function mapPosToCategory(pos) {
    const posLower = pos.toLowerCase();
    
    // Direct matches
    if (VALID_CATEGORIES.has(posLower)) {
        return posLower;
    }
    
    // Handle variations
    if (posLower.includes('noun')) return 'noun';
    if (posLower.includes('verb')) return 'verb';
    if (posLower.includes('adjective') || posLower.includes('adj')) return 'adjective';
    if (posLower.includes('adverb') || posLower.includes('adv')) return 'adverb';
    
    return null;
}

/**
 * Extract category from API response
 * @param {Array} meanings - Array of meaning objects from API
 * @returns {string} - Category string or empty string if not found
 */
function extractCategory(meanings) {
    if (!Array.isArray(meanings) || meanings.length === 0) {
        return '';
    }
    
    // Collect all POS tags from all meanings
    const foundCategories = new Set();
    
    for (const meaning of meanings) {
        if (meaning.partOfSpeech) {
            const category = mapPosToCategory(meaning.partOfSpeech);
            if (category) {
                foundCategories.add(category);
            }
        }
    }
    
    // If no valid categories found, return empty string
    if (foundCategories.size === 0) {
        return '';
    }
    
    // If multiple categories, prefer: noun > verb > adjective > adverb
    for (const priority of POS_PRIORITY) {
        if (foundCategories.has(priority)) {
            return priority;
        }
    }
    
    // Should not reach here, but return first found if somehow we do
    return Array.from(foundCategories)[0];
}

/**
 * Fetch category for a single word from DictionaryAPI.dev
 * @param {string} word - Word to look up (uppercase)
 * @returns {Promise<string>} - Category string or empty string if not found
 */
async function fetchCategory(word) {
    const wordLower = word.toLowerCase();
    const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${wordLower}`;
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                // Word not found in dictionary
                return '';
            }
            if (response.status === 429) {
                // Rate limited - return empty string, will need to retry later
                console.error(` (rate limited)`);
                return '';
            }
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // API returns an array of entries
        if (!Array.isArray(data) || data.length === 0) {
            return '';
        }
        
        // Get meanings from first entry
        const entry = data[0];
        if (!entry.meanings || !Array.isArray(entry.meanings)) {
            return '';
        }
        
        return extractCategory(entry.meanings);
    } catch (error) {
        console.error(`Error fetching category for "${word}":`, error.message);
        return '';
    }
}

/**
 * Main execution function
 */
async function main() {
    const categories = {};
    const outputPath = path.join(rootDir, 'scripts', 'validation', 'word-categories.json');
    
    console.log('Fetching categories from DictionaryAPI.dev...\n');
    console.log('This may take a while due to API rate limits...\n');
    
    // Process words with delay to respect rate limits
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < wordsArray.length; i++) {
        const word = wordsArray[i];
        process.stdout.write(`[${i + 1}/${wordsArray.length}] Fetching "${word}"... `);
        
        const category = await fetchCategory(word);
        categories[word] = category;
        
        if (category) {
            console.log(`✓ ${category}`);
        } else {
            console.log('✗ (not found)');
        }
        
        // Add delay between requests to avoid rate limiting (500ms delay)
        if (i < wordsArray.length - 1) {
            await delay(500);
        }
    }
    
    // Save results
    fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2), 'utf8');
    
    console.log(`\n✓ Categories saved to: ${path.relative(rootDir, outputPath)}`);
    
    // Print summary
    const categorized = Object.values(categories).filter(c => c !== '').length;
    const uncategorized = Object.values(categories).filter(c => c === '').length;
    
    console.log(`\nSummary:`);
    console.log(`  Total words: ${wordsArray.length}`);
    console.log(`  Categorized: ${categorized}`);
    console.log(`  Uncategorized: ${uncategorized}`);
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
