# Puzzle Data Management

This guide explains how puzzle data is structured, managed, and protected in the Sum Tile project.

## Overview

Puzzle data contains:
- Puzzle definitions (words, solutions)
- Scrabble scores for letters
- Validation functions
- Date calculations

## File Structure

### Source File: `puzzle-data.js`

This is the **source file** you edit during development. It contains:
- Puzzle definitions in plain JavaScript
- Scrabble score mappings
- Helper functions
- All data in readable format

### Encoded File: `puzzle-data-encoded.js`

This is the **generated file** used in production. It contains:
- Encoded/obfuscated puzzle data
- Same functionality as source file
- Harder to read in browser dev tools

**Important**: Never edit this file directly. Always edit `puzzle-data.js` and rebuild.

## Puzzle Data Structure

### Puzzle Definition

Each puzzle is defined with a number (day) as the key:

```javascript
551: {
    words: ['WORD1', 'WORD2'],
    solution: ['WORD1', 'WORD2']
}
```

**Fields:**
- `words`: Array of two words (the puzzle words)
- `solution`: Array of the correct solution (same as words, but can be in different order)

**Example:**
```javascript
1: {
    words: ['SNOW', 'MAN'],
    solution: ['SNOW', 'MAN']
}
```

### Scrabble Scores

Scrabble scores are defined in `SCRABBLE_SCORES`:

```javascript
const SCRABBLE_SCORES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1,
    'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    // ... etc
};
```

## Adding a New Puzzle

### Step 1: Edit Source File

Open `puzzle-data.js` and add your puzzle:

```javascript
// Find the last puzzle number
// Add new puzzle with next number
552: {
    words: ['NEW', 'WORD'],
    solution: ['NEW', 'WORD']
}
```

### Step 2: Validate Puzzle

Ensure:
- Both words are valid
- Words are anagrams of the letters
- Words are in the word list (if applicable)

### Step 3: Rebuild Encoded Data

```bash
npm run build:data
```

This generates `puzzle-data-encoded.js` from `puzzle-data.js`.

### Step 4: Test

1. Start local server
2. Navigate to puzzle: `http://localhost:8000/puzzle.html?day=552`
3. Verify puzzle loads correctly
4. Test solving the puzzle

## Editing Existing Puzzles

### Step 1: Edit Source File

Open `puzzle-data.js` and find the puzzle:

```javascript
1: {
    words: ['SNOW', 'MAN'],
    solution: ['SNOW', 'MAN']
}
```

### Step 2: Make Changes

```javascript
1: {
    words: ['SNOW', 'MAN'],
    solution: ['MAN', 'SNOW'] // Changed order
}
```

### Step 3: Rebuild

```bash
npm run build:data
```

### Step 4: Test

Test the puzzle to ensure changes work correctly.

## Puzzle Data Protection

### Why Protection?

Puzzle data is encoded to make it harder for users to:
- View solutions in browser dev tools
- Cheat by reading puzzle data
- Access future puzzles

**Note**: This is not absolute security. Determined users can still access the data. It serves as a deterrent for casual cheating.

### Encoding Process

The encoding uses multiple layers:

1. **Base64 Encoding**: Makes data non-human-readable
2. **XOR Cipher**: Additional encryption with puzzle-number-based keys
3. **Chunked Loading**: Data split into chunks that decode only when needed
4. **Code Obfuscation**: Short, meaningless variable names

### Build Script

The encoding is done by `scripts/encode-puzzle-data.js`:

```bash
npm run build:data
```

This script:
1. Reads `puzzle-data.js`
2. Encodes the data
3. Generates `puzzle-data-encoded.js`
4. Preserves all functionality

## Validation

### Anagram Validation

Ensure puzzle words are valid anagrams:

```bash
npm run validate:anagrams
```

This checks that:
- Words use only the provided letters
- Words are valid anagrams
- No letters are missing or extra

### Score Validation

Validate Scrabble scores:

```bash
npm run validate:scores
```

This checks that:
- Scores match expected values
- No duplicate scores
- Scores are correct

## Best Practices

### 1. Always Edit Source File

✅ **Good**: Edit `puzzle-data.js`, then rebuild
```bash
# Edit puzzle-data.js
npm run build:data
```

❌ **Bad**: Edit `puzzle-data-encoded.js` directly
```bash
# Don't do this!
# Editing puzzle-data-encoded.js
```

### 2. Validate Before Rebuilding

Check your puzzle data:
- Words are valid
- Solution is correct
- Letters match

### 3. Test After Changes

Always test puzzles after:
- Adding new puzzles
- Editing existing puzzles
- Rebuilding data

### 4. Commit Both Files

Commit both:
- `puzzle-data.js` (source)
- `puzzle-data-encoded.js` (generated)

The encoded file is needed for production.

### 5. Backup Before Major Changes

Before making major changes:
```bash
cp puzzle-data.js puzzle-data.js.backup
```

## Troubleshooting

### Puzzle Not Loading

**Check:**
- Did you rebuild? Run `npm run build:data`
- Is puzzle number correct?
- Are words valid?

### Changes Not Appearing

**Check:**
- Did you rebuild? Run `npm run build:data`
- Did you refresh browser? (Hard refresh: Cmd+Shift+R)
- Is correct puzzle number in URL?

### Build Errors

**Check:**
- Is `puzzle-data.js` valid JavaScript?
- Are puzzle definitions correct?
- Are there syntax errors?

### Validation Errors

**Check:**
- Are words valid anagrams?
- Do words use correct letters?
- Are scores correct?

## Advanced Topics

### Custom Validation

Add custom validation in `puzzle-data.js`:

```javascript
// Custom validation function
function validatePuzzle(puzzle) {
    // Your validation logic
    return true;
}
```

### Puzzle Metadata

Add metadata to puzzles:

```javascript
1: {
    words: ['SNOW', 'MAN'],
    solution: ['SNOW', 'MAN'],
    difficulty: 'easy',
    theme: 'winter'
}
```

### Dynamic Puzzles

Generate puzzles dynamically:

```javascript
function generatePuzzle(day) {
    // Generate puzzle based on day
    return {
        words: [...],
        solution: [...]
    };
}
```

## Related Documentation

- [Development Workflow](workflow.md)
- [Build Scripts](../../README.md#build-scripts)
- [Architecture Overview](../architecture/overview.md)
