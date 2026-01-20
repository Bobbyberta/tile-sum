#!/usr/bin/env node

/**
 * Build script to encode puzzle-data.js for obfuscation
 * Reads puzzle-data.js, encodes PUZZLE_DATA using multiple layers,
 * and generates puzzle-data-encoded.js with lazy-loading decoder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Simple XOR cipher function
function xorCipher(data, key) {
    const keyStr = String(key);
    return data.split('').map((char, i) => {
        const keyChar = keyStr.charCodeAt(i % keyStr.length);
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar);
    }).join('');
}

// Encode a string with multiple layers
function encodeData(data, seed) {
    // Layer 1: XOR cipher with seed-based key
    const key = `pz${seed}lk${seed * 7}xy`;
    let encoded = xorCipher(data, key);
    
    // Layer 2: Base64 encode
    encoded = Buffer.from(encoded, 'utf8').toString('base64');
    
    return encoded;
}

// Base64 encode (Node.js compatible)
function base64Encode(str) {
    return Buffer.from(str, 'utf8').toString('base64');
}

// Decode function (reverse process) - browser compatible
function generateDecodeFunction() {
    return `
function _d(s, k) {
    const k2 = \`pz\${k}lk\${k * 7}xy\`;
    let d = atob(s);
    const k3 = String(k2);
    return d.split('').map((c, i) => {
        const kc = k3.charCodeAt(i % k3.length);
        return String.fromCharCode(c.charCodeAt(0) ^ kc);
    }).join('');
}`;
}

// Read source file
const sourcePath = path.join(rootDir, 'puzzle-data.js');
const sourceCode = fs.readFileSync(sourcePath, 'utf8');

// Extract PUZZLE_DATA and SCRABBLE_SCORES using regex
// This is a simple approach - in production you might want to use a proper parser
const puzzleDataMatch = sourceCode.match(/export const PUZZLE_DATA = \{[\s\S]*?\};/);
const scrabbleScoresMatch = sourceCode.match(/export const SCRABBLE_SCORES = \{[\s\S]*?\};/);

if (!puzzleDataMatch || !scrabbleScoresMatch) {
    console.error('Could not extract PUZZLE_DATA or SCRABBLE_SCORES from source file');
    process.exit(1);
}

// Extract the object content
const puzzleDataStr = puzzleDataMatch[0].replace(/export const PUZZLE_DATA = /, '').replace(/;$/, '');
const scrabbleScoresStr = scrabbleScoresMatch[0].replace(/export const SCRABBLE_SCORES = /, '').replace(/;$/, '');

// Parse to get the actual objects
let PUZZLE_DATA, SCRABBLE_SCORES;
try {
    // Use eval in a safe way to parse the objects (they're from our own source file)
    PUZZLE_DATA = eval(`(${puzzleDataStr})`);
    SCRABBLE_SCORES = eval(`(${scrabbleScoresStr})`);
} catch (e) {
    console.error('Error parsing puzzle data:', e.message);
    process.exit(1);
}

// Get all puzzle numbers
const puzzleNumbers = Object.keys(PUZZLE_DATA).map(Number).sort((a, b) => a - b);
const maxPuzzle = Math.max(...puzzleNumbers);
const chunkSize = 50; // Puzzles per chunk

// Determine today's puzzle number and chunk
// Use the same logic as in puzzle-data.js
const PUZZLE_START_DATE = new Date(2025, 11, 1); // December 1, 2025
function getPuzzleNumberForDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const puzzleDate = new Date(date);
    puzzleDate.setHours(0, 0, 0, 0);
    const startDate = new Date(PUZZLE_START_DATE);
    startDate.setHours(0, 0, 0, 0);
    const timeDiff = puzzleDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff + 1;
}

const todayPuzzleNum = getPuzzleNumberForDate(new Date());
const todayChunkIdx = Math.floor(todayPuzzleNum / chunkSize);
const todayChunkKey = `c${todayChunkIdx}`;

console.log(`Today's puzzle: #${todayPuzzleNum} (chunk: ${todayChunkKey})`);

// Split puzzles into chunks
const chunks = {};
const todayChunks = {};
const archiveChunks = {};

for (let i = 0; i <= maxPuzzle; i += chunkSize) {
    const chunkStart = i;
    const chunkEnd = Math.min(i + chunkSize - 1, maxPuzzle);
    const chunkKey = `c${Math.floor(i / chunkSize)}`;
    
    // Extract puzzles for this chunk
    const chunkData = {};
    for (let j = chunkStart; j <= chunkEnd; j++) {
        if (PUZZLE_DATA[j]) {
            chunkData[j] = PUZZLE_DATA[j];
        }
    }
    
    // Encode this chunk
    const chunkJson = JSON.stringify(chunkData);
    const seed = Math.floor(i / chunkSize) + 1;
    const encoded = encodeData(chunkJson, seed);
    
    chunks[chunkKey] = encoded;
    
    // Split into today vs archive
    if (chunkKey === todayChunkKey) {
        todayChunks[chunkKey] = encoded;
    } else {
        archiveChunks[chunkKey] = encoded;
    }
}

// Extract utility functions from source (everything after PUZZLE_DATA)
const utilityStart = sourceCode.indexOf('// Get all letters');
const utilityCode = utilityStart >= 0 ? sourceCode.substring(utilityStart) : '';

// Helper function to generate chunk metadata
function generateChunkMetadata(chunksObj, chunkSize, maxPuzzle) {
    return Object.entries(chunksObj).map(([key, encoded], idx) => {
        const chunkIdx = parseInt(key.substring(1));
        const start = chunkIdx * chunkSize;
        const end = Math.min(start + chunkSize - 1, maxPuzzle);
        return `    ${key}: { start: ${start}, end: ${end}, seed: ${chunkIdx + 1} }`;
    }).join(',\n');
}

// Helper function to generate chunk data object
function generateChunkData(chunksObj) {
    return Object.entries(chunksObj).map(([key, encoded]) => `    ${key}: ${JSON.stringify(encoded)}`).join(',\n');
}

// Generate today's puzzle data file
const todayContent = `// Today's puzzle data - generated by build script
// Do not edit this file directly - edit puzzle-data.js and run: npm run build:data
// Contains puzzle #${todayPuzzleNum} (chunk ${todayChunkKey})

${generateDecodeFunction()}

// Encoded SCRABBLE_SCORES (small, so encode directly)
const _sc = ${JSON.stringify(encodeData(JSON.stringify(SCRABBLE_SCORES), 999))};
const _scDecoded = JSON.parse(_d(_sc, 999));
export const SCRABBLE_SCORES = _scDecoded;

// Chunk metadata (today's chunk only)
const _chunks = {
${generateChunkMetadata(todayChunks, chunkSize, maxPuzzle)}
};

// Decoded chunks cache
const _cache = {};

// Chunk data lookup object (today's chunk only)
const _chunkData = {
${generateChunkData(todayChunks)}
};

// Get chunk for a puzzle number
function _getChunk(puzzleNum) {
    const chunkIdx = Math.floor(puzzleNum / ${chunkSize});
    const chunkKey = \`c\${chunkIdx}\`;
    const chunkInfo = _chunks[chunkKey];
    
    if (!chunkInfo) return null;
    
    // Check cache first
    if (_cache[chunkKey]) {
        return _cache[chunkKey];
    }
    
    // Decode chunk
    const encoded = _chunkData[chunkKey];
    if (!encoded) return null;
    const decoded = JSON.parse(_d(encoded, chunkInfo.seed));
    _cache[chunkKey] = decoded;
    
    return decoded;
}

// Proxy object for PUZZLE_DATA that lazily decodes chunks
// This will be extended by archive data loader
const _puzzleDataProxy = new Proxy({}, {
    get(target, prop) {
        const puzzleNum = Number(prop);
        if (isNaN(puzzleNum)) {
            // Handle special properties like 'length', Symbol.iterator, etc.
            return target[prop];
        }
        
        const chunk = _getChunk(puzzleNum);
        return chunk ? chunk[puzzleNum] : undefined;
    },
    has(target, prop) {
        const puzzleNum = Number(prop);
        if (isNaN(puzzleNum)) return prop in target;
        const chunk = _getChunk(puzzleNum);
        return chunk && puzzleNum in chunk;
    },
    ownKeys(target) {
        // Return all puzzle numbers (0 to maxPuzzle) - archive loader will extend this
        return Array.from({ length: ${maxPuzzle + 1} }, (_, i) => String(i));
    },
    getOwnPropertyDescriptor(target, prop) {
        const puzzleNum = Number(prop);
        if (isNaN(puzzleNum)) return undefined;
        const value = _puzzleDataProxy[puzzleNum];
        return value ? { enumerable: true, configurable: true, value } : undefined;
    }
});

export const PUZZLE_DATA = _puzzleDataProxy;

// Export internal functions for archive loader to extend the proxy
export const _extendPuzzleData = (archiveChunks, archiveChunkData) => {
    // Merge archive chunks into _chunks
    Object.assign(_chunks, archiveChunks);
    
    // Merge archive chunk data into _chunkData
    Object.assign(_chunkData, archiveChunkData);
};

${utilityCode}
`;

// Generate archive puzzle data file
const archiveContent = `// Archive puzzle data - generated by build script
// Do not edit this file directly - edit puzzle-data.js and run: npm run build:data
// Contains all puzzles except today's puzzle (chunk ${todayChunkKey})

${generateDecodeFunction()}

// Archive chunk metadata
export const _archiveChunks = {
${generateChunkMetadata(archiveChunks, chunkSize, maxPuzzle)}
};

// Archive chunk data lookup object
export const _archiveChunkData = {
${generateChunkData(archiveChunks)}
};
`;

// Write today's puzzle data file
const todayPath = path.join(rootDir, 'puzzle-data-today.js');
fs.writeFileSync(todayPath, todayContent, 'utf8');

// Write archive puzzle data file
const archivePath = path.join(rootDir, 'puzzle-data-archive.js');
fs.writeFileSync(archivePath, archiveContent, 'utf8');

// Also write the combined file for backward compatibility (can be removed later)
const encodedContent = `// Encoded puzzle data - generated by build script
// Do not edit this file directly - edit puzzle-data.js and run: npm run build:data
// NOTE: This file is kept for backward compatibility. New code should use puzzle-data-today.js

${generateDecodeFunction()}

// Encoded SCRABBLE_SCORES (small, so encode directly)
const _sc = ${JSON.stringify(encodeData(JSON.stringify(SCRABBLE_SCORES), 999))};
const _scDecoded = JSON.parse(_d(_sc, 999));
export const SCRABBLE_SCORES = _scDecoded;

// Chunk metadata
const _chunks = {
${generateChunkMetadata(chunks, chunkSize, maxPuzzle)}
};

// Decoded chunks cache
const _cache = {};

// Chunk data lookup object
const _chunkData = {
${generateChunkData(chunks)}
};

// Get chunk for a puzzle number
function _getChunk(puzzleNum) {
    const chunkIdx = Math.floor(puzzleNum / ${chunkSize});
    const chunkKey = \`c\${chunkIdx}\`;
    const chunkInfo = _chunks[chunkKey];
    
    if (!chunkInfo) return null;
    
    // Check cache first
    if (_cache[chunkKey]) {
        return _cache[chunkKey];
    }
    
    // Decode chunk
    const encoded = _chunkData[chunkKey];
    if (!encoded) return null;
    const decoded = JSON.parse(_d(encoded, chunkInfo.seed));
    _cache[chunkKey] = decoded;
    
    return decoded;
}

// Proxy object for PUZZLE_DATA that lazily decodes chunks
const _puzzleDataProxy = new Proxy({}, {
    get(target, prop) {
        const puzzleNum = Number(prop);
        if (isNaN(puzzleNum)) {
            // Handle special properties like 'length', Symbol.iterator, etc.
            return target[prop];
        }
        
        const chunk = _getChunk(puzzleNum);
        return chunk ? chunk[puzzleNum] : undefined;
    },
    has(target, prop) {
        const puzzleNum = Number(prop);
        if (isNaN(puzzleNum)) return prop in target;
        const chunk = _getChunk(puzzleNum);
        return chunk && puzzleNum in chunk;
    },
    ownKeys(target) {
        // Return all puzzle numbers (0 to maxPuzzle)
        return Array.from({ length: ${maxPuzzle + 1} }, (_, i) => String(i));
    },
    getOwnPropertyDescriptor(target, prop) {
        const puzzleNum = Number(prop);
        if (isNaN(puzzleNum)) return undefined;
        const value = _puzzleDataProxy[puzzleNum];
        return value ? { enumerable: true, configurable: true, value } : undefined;
    }
});

export const PUZZLE_DATA = _puzzleDataProxy;

${utilityCode}
`;

const outputPath = path.join(rootDir, 'puzzle-data-encoded.js');
fs.writeFileSync(outputPath, encodedContent, 'utf8');

console.log(`✓ Puzzle data files generated:`);
console.log(`  - ${path.relative(rootDir, todayPath)} (${(todayContent.length / 1024).toFixed(2)} KB)`);
console.log(`  - ${path.relative(rootDir, archivePath)} (${(archiveContent.length / 1024).toFixed(2)} KB)`);
console.log(`  - ${path.relative(rootDir, outputPath)} (${(encodedContent.length / 1024).toFixed(2)} KB - backward compatibility)`);
console.log(`  - Today's puzzle: #${todayPuzzleNum} in chunk ${todayChunkKey}`);
console.log(`  - Archive chunks: ${Object.keys(archiveChunks).join(', ')}`);
