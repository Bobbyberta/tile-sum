#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATED_PUZZLES_PATH = path.join(__dirname, 'generated-puzzles.json');
const PUZZLE_DATA_PATH = path.join(__dirname, '../../puzzle-data.js');

// Read generated puzzles
const generated = JSON.parse(fs.readFileSync(GENERATED_PUZZLES_PATH, 'utf8'));
const puzzleData = fs.readFileSync(PUZZLE_DATA_PATH, 'utf8');

// Find the last puzzle number in the file by parsing it
const puzzleDataMatch = puzzleData.match(/export const PUZZLE_DATA = \{[\s\S]*?\};/);
if (!puzzleDataMatch) {
    console.error('Could not find PUZZLE_DATA in file');
    process.exit(1);
}

// Extract puzzle numbers from the file
const puzzleNumMatches = puzzleData.matchAll(/^\s+(\d+):\s*\{/gm);
const existingNums = [];
for (const match of puzzleNumMatches) {
    existingNums.push(parseInt(match[1], 10));
}
const lastPuzzleNum = existingNums.length > 0 ? Math.max(...existingNums) : 25;
const startPuzzleNum = lastPuzzleNum + 1;

// Find where PUZZLE_DATA ends (the closing brace and semicolon)
const dataEndIndex = puzzleData.lastIndexOf('};');
if (dataEndIndex === -1) {
    console.error('Could not find end of PUZZLE_DATA');
    process.exit(1);
}

const beforeData = puzzleData.substring(0, dataEndIndex);
const afterData = puzzleData.substring(dataEndIndex + 2);

// Build new puzzle entries starting from the next available number
let newPuzzles = '';
generated.puzzles.forEach((puzzle, index) => {
    const puzzleNum = startPuzzleNum + index;
    newPuzzles += `    ${puzzleNum}: {\n`;
    newPuzzles += `        words: [${puzzle.words.map(w => `'${w}'`).join(', ')}],\n`;
    newPuzzles += `        solution: [${puzzle.solution.map(w => `'${w}'`).join(', ')}]\n`;
    if (index < generated.puzzles.length - 1) {
        newPuzzles += `    },\n`;
    } else {
        newPuzzles += `    }\n`;
    }
});

// Combine everything
const newContent = beforeData + ',\n' + newPuzzles + '};' + afterData;

// Write back to file
fs.writeFileSync(PUZZLE_DATA_PATH, newContent);
console.log(`✓ Added ${generated.puzzles.length} puzzles to puzzle-data.js (puzzles ${startPuzzleNum}-${startPuzzleNum + generated.puzzles.length - 1})`);
