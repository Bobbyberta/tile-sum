#!/usr/bin/env node

/**
 * Script to export puzzle data to CSV format
 * Exports puzzle number, word1, word2, solution1, solution2, category1, category2
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

// Helper function to escape CSV values
function escapeCsv(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

// Generate CSV content
const csvRows = [];
// CSV header
csvRows.push('Puzzle Number,Word 1,Word 2,Solution 1,Solution 2,Category 1,Category 2');

// Sort puzzle numbers
const puzzleNumbers = Object.keys(PUZZLE_DATA).map(Number).sort((a, b) => a - b);

for (const puzzleNum of puzzleNumbers) {
    const puzzle = PUZZLE_DATA[puzzleNum];
    if (!puzzle) continue;
    
    const word1 = puzzle.words?.[0] || '';
    const word2 = puzzle.words?.[1] || '';
    const solution1 = puzzle.solution?.[0] || '';
    const solution2 = puzzle.solution?.[1] || '';
    const category1 = puzzle.categories?.[0] || '';
    const category2 = puzzle.categories?.[1] || '';
    
    const row = [
        puzzleNum,
        escapeCsv(word1),
        escapeCsv(word2),
        escapeCsv(solution1),
        escapeCsv(solution2),
        escapeCsv(category1),
        escapeCsv(category2)
    ].join(',');
    
    csvRows.push(row);
}

// Write CSV file
const csvContent = csvRows.join('\n');
const outputPath = path.join(rootDir, 'puzzle-data.csv');
fs.writeFileSync(outputPath, csvContent, 'utf8');

console.log(`✓ CSV file exported to: ${path.relative(rootDir, outputPath)}`);
console.log(`  - ${puzzleNumbers.length} puzzles exported`);
