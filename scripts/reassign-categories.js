#!/usr/bin/env node

/**
 * Script to reassign word categories using offline POS tagger (wink-pos-tagger)
 * Extracts all unique words from puzzle-data.js and categorizes them accurately
 * Saves results to scripts/validation/word-categories.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import posTagger from 'wink-pos-tagger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Initialize POS tagger
const tagger = posTagger();

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

// POS tag mapping to our categories
const POS_TO_CATEGORY = {
    // Nouns
    'NN': 'noun',      // Noun, singular or mass
    'NNS': 'noun',     // Noun, plural
    'NNP': 'noun',     // Proper noun, singular
    'NNPS': 'noun',    // Proper noun, plural
    // Verbs
    'VB': 'verb',      // Verb, base form
    'VBD': 'verb',     // Verb, past tense
    'VBG': 'verb',     // Verb, gerund or present participle
    'VBN': 'verb',     // Verb, past participle
    'VBP': 'verb',     // Verb, non-3rd person singular present
    'VBZ': 'verb',     // Verb, 3rd person singular present
    // Adjectives
    'JJ': 'adjective', // Adjective
    'JJR': 'adjective', // Adjective, comparative
    'JJS': 'adjective', // Adjective, superlative
    // Adverbs
    'RB': 'adverb',    // Adverb
    'RBR': 'adverb',   // Adverb, comparative
    'RBS': 'adverb'    // Adverb, superlative
};

/**
 * Map POS tag to our category
 * @param {string} posTag - POS tag from tagger
 * @returns {string} - Category string or empty string if not mapped
 */
function mapPosToCategory(posTag) {
    return POS_TO_CATEGORY[posTag] || '';
}

/**
 * Get category for a word using POS tagger
 * @param {string} word - Word to categorize (uppercase)
 * @returns {string} - Category string or empty string if not found
 */
function getCategory(word) {
    // POS tagger works better with lowercase
    const wordLower = word.toLowerCase();
    
    try {
        // Tag the word - tagger expects an array of tokens
        const tokens = tagger.tagRawTokens([wordLower]);
        
        if (!tokens || tokens.length === 0) {
            return '';
        }
        
        // Get the POS tag from the first token
        const token = tokens[0];
        if (!token || !token.pos) {
            return '';
        }
        
        const posTag = token.pos;
        return mapPosToCategory(posTag);
    } catch (error) {
        console.error(`Error tagging "${word}":`, error.message);
        return '';
    }
}

/**
 * Main execution function
 */
function main() {
    const categories = {};
    const outputPath = path.join(rootDir, 'scripts', 'validation', 'word-categories.json');
    
    console.log('Categorizing words using wink-pos-tagger...\n');
    
    let categorized = 0;
    let uncategorized = 0;
    
    for (let i = 0; i < wordsArray.length; i++) {
        const word = wordsArray[i];
        process.stdout.write(`[${i + 1}/${wordsArray.length}] Categorizing "${word}"... `);
        
        const category = getCategory(word);
        categories[word] = category;
        
        if (category) {
            console.log(`✓ ${category}`);
            categorized++;
        } else {
            console.log('✗ (not found)');
            uncategorized++;
        }
    }
    
    // Save results
    fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2), 'utf8');
    
    console.log(`\n✓ Categories saved to: ${path.relative(rootDir, outputPath)}`);
    console.log(`\nSummary:`);
    console.log(`  Total words: ${wordsArray.length}`);
    console.log(`  Categorized: ${categorized}`);
    console.log(`  Uncategorized: ${uncategorized}`);
}

// Run the script
main();
