#!/usr/bin/env node

/**
 * Script to apply word categories to puzzle-data.js
 * Reads word-categories.json and updates each puzzle with a categories array
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Paths
const puzzleDataPath = path.join(rootDir, 'puzzle-data.js');
const categoriesPath = path.join(rootDir, 'scripts', 'validation', 'word-categories.json');

// Load categories mapping
if (!fs.existsSync(categoriesPath)) {
    console.error(`Error: Categories file not found: ${categoriesPath}`);
    console.error('Please run scripts/add-categories.js first to generate word-categories.json');
    process.exit(1);
}

const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
console.log(`Loaded ${Object.keys(categoriesData).length} word categories\n`);

// Read puzzle data file
let puzzleDataCode = fs.readFileSync(puzzleDataPath, 'utf8');

// Extract PUZZLE_DATA to get puzzle structure
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

// Process each puzzle and add categories
let updatedCount = 0;
let missingCount = 0;

// Sort puzzle numbers to process in order
const puzzleNumbers = Object.keys(PUZZLE_DATA).map(Number).sort((a, b) => a - b);

for (const puzzleNum of puzzleNumbers) {
    const puzzle = PUZZLE_DATA[puzzleNum];
    
    if (!puzzle.words || !Array.isArray(puzzle.words) || puzzle.words.length !== 2) {
        console.warn(`Warning: Puzzle ${puzzleNum} has invalid words array, skipping`);
        continue;
    }
    
    // Get categories for both words
    const word1 = puzzle.words[0].toUpperCase();
    const word2 = puzzle.words[1].toUpperCase();
    
    const category1 = categoriesData[word1] || '';
    const category2 = categoriesData[word2] || '';
    
    // Build the categories line
    const categoriesLine = `        categories: [${category1 ? `'${category1}'` : "''"}, ${category2 ? `'${category2}'` : "''"}]\n`;
    
    // Find the puzzle entry - look for pattern: puzzleNum: { ... solution: [...] }
    // We need to match the entire puzzle object including the closing brace
    const puzzleStartPattern = new RegExp(`(${puzzleNum}\\s*:\\s*\\{)`, 'm');
    const match = puzzleStartPattern.exec(puzzleDataCode);
    
    if (!match) {
        console.warn(`Warning: Could not find puzzle ${puzzleNum} in source code, skipping`);
        continue;
    }
    
    const startPos = match.index;
    const afterBrace = startPos + match[0].length;
    
    // Find the matching closing brace for this puzzle object
    let braceCount = 1;
    let pos = afterBrace;
    let endPos = -1;
    
    while (pos < puzzleDataCode.length && braceCount > 0) {
        const char = puzzleDataCode[pos];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (braceCount === 0) {
            endPos = pos;
            break;
        }
        pos++;
    }
    
    if (endPos === -1) {
        console.warn(`Warning: Could not find closing brace for puzzle ${puzzleNum}, skipping`);
        continue;
    }
    
    // Extract the puzzle entry
    const puzzleEntry = puzzleDataCode.substring(startPos, endPos + 1);
    
    // Check if categories already exist
    if (/categories\s*:\s*\[/.test(puzzleEntry)) {
        // Update existing categories
        const updatedEntry = puzzleEntry.replace(
            /categories\s*:\s*\[[^\]]*\]/,
            `categories: [${category1 ? `'${category1}'` : "''"}, ${category2 ? `'${category2}'` : "''"}]`
        );
        puzzleDataCode = puzzleDataCode.substring(0, startPos) + updatedEntry + puzzleDataCode.substring(endPos + 1);
    } else {
        // Add categories after solution line
        // Find the solution line and add categories after it
        const solutionMatch = puzzleEntry.match(/(solution:\s*\[[^\]]+\])(\s*)/);
        if (solutionMatch) {
            const beforeSolution = puzzleEntry.substring(0, solutionMatch.index);
            const solutionLine = solutionMatch[1];
            const afterSolution = puzzleEntry.substring(solutionMatch.index + solutionMatch[0].length);
            
            // Insert categories after solution, before closing brace
            const updatedEntry = beforeSolution + solutionLine + ',\n' + categoriesLine + afterSolution;
            puzzleDataCode = puzzleDataCode.substring(0, startPos) + updatedEntry + puzzleDataCode.substring(endPos + 1);
        } else {
            console.warn(`Warning: Could not find solution line for puzzle ${puzzleNum}, skipping`);
            continue;
        }
    }
    
    updatedCount++;
    
    if (!category1 || !category2) {
        missingCount++;
    }
}

// Write updated file
fs.writeFileSync(puzzleDataPath, puzzleDataCode, 'utf8');

console.log(`\n✓ Updated ${updatedCount} puzzles with categories`);
if (missingCount > 0) {
    console.log(`  Note: ${missingCount} puzzles have at least one missing category (kept blank)`);
}
console.log(`\nFile updated: ${path.relative(rootDir, puzzleDataPath)}`);
