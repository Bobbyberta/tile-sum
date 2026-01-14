#!/usr/bin/env node

/**
 * Script to insert new puzzles randomly throughout existing puzzles
 * while maintaining sequential numbering
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUZZLE_DATA } from '../../puzzle-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUZZLE_DATA_PATH = path.join(__dirname, '../../puzzle-data.js');

// New puzzles to insert
const newPuzzles = [
    { words: ['BEE', 'ANALYSE'], solution: ['BEE', 'ANALYSE'] },
    { words: ['BOX', 'ABANDON'], solution: ['BOX', 'ABANDON'] },
    { words: ['CRY', 'ADDRESS'], solution: ['CRY', 'ADDRESS'] },
    { words: ['DRY', 'AMAZING'], solution: ['DRY', 'AMAZING'] },
    { words: ['DUE', 'ACHIEVE'], solution: ['DUE', 'ACHIEVE'] },
    { words: ['DVD', 'ACCOUNT'], solution: ['DVD', 'ACCOUNT'] },
    { words: ['EGG', 'ALCOHOL'], solution: ['EGG', 'ALCOHOL'] },
    { words: ['FEE', 'AVERAGE'], solution: ['FEE', 'AVERAGE'] },
    { words: ['FIT', 'ANXIOUS'], solution: ['FIT', 'ANXIOUS'] },
    { words: ['FIX', 'AIRLINE'], solution: ['FIX', 'AIRLINE'] },
    { words: ['FLY', 'ATTEMPT'], solution: ['FLY', 'ATTEMPT'] },
    { words: ['FRY', 'APPROVE'], solution: ['FRY', 'APPROVE'] },
    { words: ['JOY', 'ANGRILY'], solution: ['JOY', 'ANGRILY'] },
    { words: ['KID', 'ARRIVAL'], solution: ['KID', 'ARRIVAL'] },
    { words: ['OFF', 'ADVANCE'], solution: ['OFF', 'ADVANCE'] },
    { words: ['PUB', 'BELIEVE'], solution: ['PUB', 'BELIEVE'] },
    { words: ['SHY', 'BALANCE'], solution: ['SHY', 'BALANCE'] },
    { words: ['SKY', 'ATTRACT'], solution: ['SKY', 'ATTRACT'] },
    { words: ['WIN', 'BILLION'], solution: ['WIN', 'BILLION'] },
    { words: ['WOW', 'BATTERY'], solution: ['WOW', 'BATTERY'] },
    { words: ['YOU', 'BIOLOGY'], solution: ['YOU', 'BIOLOGY'] },
    { words: ['AWAY', 'ACTUAL'], solution: ['AWAY', 'ACTUAL'] },
    { words: ['BACK', 'AUTHOR'], solution: ['BACK', 'AUTHOR'] },
    { words: ['BALL', 'BEHIND'], solution: ['BALL', 'BEHIND'] },
    { words: ['BAND', 'NOBODY'], solution: ['BAND', 'NOBODY'] },
    { words: ['BEND', 'BROKEN'], solution: ['BEND', 'BROKEN'] },
    { words: ['BILL', 'FINISH'], solution: ['BILL', 'FINISH'] },
    { words: ['BITE', 'HEALTH'], solution: ['BITE', 'HEALTH'] },
    { words: ['BOND', 'COLUMN'], solution: ['BOND', 'COLUMN'] },
    { words: ['BOOT', 'BEFORE'], solution: ['BOOT', 'BEFORE'] },
    { words: ['BURN', 'FRIDAY'], solution: ['BURN', 'FRIDAY'] },
    { words: ['CAKE', 'CHANCE'], solution: ['CAKE', 'CHANCE'] },
    { words: ['CALL', 'FORMAL'], solution: ['CALL', 'FORMAL'] },
    { words: ['CELL', 'CHANGE'], solution: ['CELL', 'CHANGE'] },
    { words: ['CHEF', 'ACCESS'], solution: ['CHEF', 'ACCESS'] },
    { words: ['CITY', 'CRISIS'], solution: ['CITY', 'CRISIS'] },
    { words: ['CLUB', 'EXCUSE'], solution: ['CLUB', 'EXCUSE'] },
    { words: ['COPY', 'BELONG'], solution: ['COPY', 'BELONG'] },
    { words: ['CREW', 'CHEESE'], solution: ['CREW', 'CHEESE'] },
    { words: ['DEBT', 'BUTTER'], solution: ['DEBT', 'BUTTER'] },
    { words: ['DISH', 'DRIVER'], solution: ['DISH', 'DRIVER'] },
    { words: ['DOWN', 'MEMORY'], solution: ['DOWN', 'MEMORY'] },
    { words: ['DRUG', 'NARROW'], solution: ['DRUG', 'NARROW'] },
    { words: ['DUTY', 'BEAUTY'], solution: ['DUTY', 'BEAUTY'] },
    { words: ['FACT', 'BUTTON'], solution: ['FACT', 'BUTTON'] }
];

/**
 * Main execution function
 */
function main() {
    try {
        console.log('Inserting puzzles randomly throughout existing puzzles...\n');
        
        // Get all existing puzzles as an array
        const existingPuzzles = [];
        for (const [puzzleNumStr, puzzle] of Object.entries(PUZZLE_DATA)) {
            const puzzleNum = parseInt(puzzleNumStr, 10);
            existingPuzzles.push({ puzzleNum, puzzle });
        }
        
        // Sort by puzzle number
        existingPuzzles.sort((a, b) => a.puzzleNum - b.puzzleNum);
        
        console.log(`Found ${existingPuzzles.length} existing puzzles`);
        console.log(`Adding ${newPuzzles.length} new puzzles\n`);
        
        // Create combined array with new puzzles marked
        const allPuzzles = existingPuzzles.map(p => ({ ...p, isNew: false }));
        const newPuzzleEntries = newPuzzles.map(p => ({ puzzle: p, isNew: true }));
        
        // Randomly insert new puzzles
        const combined = [...allPuzzles];
        for (const newPuzzle of newPuzzleEntries) {
            // Random position between 0 and current length
            const insertPos = Math.floor(Math.random() * (combined.length + 1));
            combined.splice(insertPos, 0, newPuzzle);
        }
        
        // Renumber sequentially starting from 0
        const renumbered = combined.map((item, index) => ({
            puzzleNum: index,
            puzzle: item.puzzle || item.puzzle,
            isNew: item.isNew || false
        }));
        
        console.log(`Total puzzles after insertion: ${renumbered.length}`);
        console.log(`New puzzles inserted at positions: ${renumbered.filter(p => p.isNew).map(p => p.puzzleNum).join(', ')}\n`);
        
        // Read the original file to preserve structure
        const puzzleData = fs.readFileSync(PUZZLE_DATA_PATH, 'utf8');
        
        // Find where PUZZLE_DATA starts and ends
        const dataStartMatch = puzzleData.match(/export const PUZZLE_DATA = \{/);
        if (!dataStartMatch) {
            throw new Error('Could not find PUZZLE_DATA declaration');
        }
        
        const dataStart = dataStartMatch.index + dataStartMatch[0].length;
        
        // Find the closing brace
        let braceCount = 1;
        let dataEnd = dataStart;
        for (let i = dataStart; i < puzzleData.length && braceCount > 0; i++) {
            if (puzzleData[i] === '{') braceCount++;
            if (puzzleData[i] === '}') braceCount--;
            if (braceCount === 0) {
                dataEnd = i;
                break;
            }
        }
        
        // Build new puzzle data content
        let newDataContent = '';
        for (const { puzzleNum, puzzle } of renumbered) {
            newDataContent += `    ${puzzleNum}: {\n`;
            newDataContent += `        words: [${puzzle.words.map(w => `'${w}'`).join(', ')}],\n`;
            newDataContent += `        solution: [${puzzle.solution.map(w => `'${w}'`).join(', ')}]\n`;
            newDataContent += `    },\n`;
        }
        // Remove trailing comma
        newDataContent = newDataContent.replace(/,\n$/, '\n');
        
        // Reconstruct the file
        const beforeData = puzzleData.substring(0, dataStart);
        const afterData = puzzleData.substring(dataEnd);
        
        const newContent = beforeData + '\n' + newDataContent + afterData;
        
        // Create backup
        const backupPath = PUZZLE_DATA_PATH + '.backup';
        fs.writeFileSync(backupPath, puzzleData);
        console.log(`✓ Backup created: ${backupPath}\n`);
        
        // Write updated file
        fs.writeFileSync(PUZZLE_DATA_PATH, newContent);
        console.log(`✓ Updated puzzle-data.js with ${renumbered.length} puzzles (${newPuzzles.length} new puzzles inserted randomly)`);
        console.log(`✓ Puzzles renumbered sequentially from 0 to ${renumbered.length - 1}\n`);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
