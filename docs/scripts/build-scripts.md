# Build Scripts Documentation

This document describes the build scripts used in the Sum Tile project.

## Overview

Build scripts are located in `scripts/` and handle:
- Puzzle data encoding
- Cursor rules generation
- Data validation

## Build Scripts

### `encode-puzzle-data.js`

Encodes puzzle data from `puzzle-data.js` to `puzzle-data-encoded.js` for obfuscation.

**Usage:**
```bash
npm run build:data
```

**What it does:**
1. Reads `puzzle-data.js` (source file)
2. Encodes `PUZZLE_DATA` using multiple layers:
   - XOR cipher with puzzle-number-based keys
   - Base64 encoding
   - Chunked loading (lazy evaluation)
3. Generates `puzzle-data-encoded.js` with:
   - Encoded data
   - Decoder functions
   - Obfuscated variable names

**Encoding Layers:**
1. **XOR Cipher**: Encrypts data with seed-based key
2. **Base64**: Encodes encrypted data
3. **Chunking**: Splits data into chunks for lazy loading

**Output:**
- `puzzle-data-encoded.js`: Encoded puzzle data file used in production

**Important:**
- Never edit `puzzle-data-encoded.js` directly
- Always edit `puzzle-data.js` and rebuild
- Encoded file must be committed to repository

### `update-cursor-rules.js`

Generates Cursor rules from `CURSOR_RULES_SOURCE.md`.

**Usage:**
```bash
npm run update-rules
# or
npm run validate-rules
```

**What it does:**
1. Reads `CURSOR_RULES_SOURCE.md`
2. Parses rule sections (marked with `[GLOBAL]` or `[FRONTEND]`)
3. Generates `.mdc` files in `.cursor/rules/`:
   - `global/` - Global project rules
   - `frontend/` - Frontend-specific rules

**Rule Format:**
```markdown
## [GLOBAL] Rule Title

**File:** `.cursor/rules/global/rule-name.mdc`
**Description:** Rule description
**Always Apply:** true/false

### Rule Content
...
```

**Output:**
- `.cursor/rules/global/*.mdc` - Global rules
- `.cursor/rules/frontend/*.mdc` - Frontend rules

## Validation Scripts

Located in `scripts/validation/`:

### `check-anagrams.js`

Validates that puzzle words are valid anagrams.

**Usage:**
```bash
npm run validate:anagrams
```

**What it checks:**
- Words use only provided letters
- Words are valid anagrams
- No missing or extra letters

### `check-scores.js`

Validates Scrabble scores.

**Usage:**
```bash
npm run validate:scores
```

**What it checks:**
- Scores match expected values
- No duplicate scores
- Scores are correct

### `fix-duplicate-scores.js`

Fixes duplicate scores in puzzle data.

**Usage:**
```bash
npm run fix:scores
```

**What it does:**
- Finds duplicate scores
- Suggests fixes
- Can apply fixes automatically

### `apply-score-replacements.js`

Applies score replacements from `score-replacements.json`.

**Usage:**
```bash
npm run apply:scores
```

**What it does:**
- Reads `score-replacements.json`
- Applies score replacements to puzzle data
- Updates `puzzle-data.js`

## Script Structure

### Common Pattern

```javascript
#!/usr/bin/env node

/**
 * Script description
 * 
 * Usage: node scripts/script-name.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Script implementation
```

### File Operations

```javascript
// Read file
const content = fs.readFileSync(filePath, 'utf-8');

// Write file
fs.writeFileSync(filePath, content, 'utf-8');

// Check if file exists
if (fs.existsSync(filePath)) {
  // ...
}
```

### Error Handling

```javascript
try {
  // Script logic
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
```

## Running Scripts

### Via npm

```bash
# Build scripts
npm run build:data          # Encode puzzle data
npm run update-rules         # Update Cursor rules

# Validation scripts
npm run validate:anagrams   # Check anagrams
npm run validate:scores     # Check scores
npm run fix:scores          # Fix duplicate scores
npm run apply:scores        # Apply score replacements
```

### Directly

```bash
# Node.js
node scripts/encode-puzzle-data.js
node scripts/update-cursor-rules.js

# With shebang (if executable)
./scripts/encode-puzzle-data.js
```

## Development Workflow

### Editing Puzzle Data

1. Edit `puzzle-data.js`
2. Run `npm run build:data`
3. Test changes
4. Commit both files

### Updating Cursor Rules

1. Edit `CURSOR_RULES_SOURCE.md`
2. Run `npm run update-rules`
3. Verify generated rules
4. Commit changes

### Validating Data

1. Run validation scripts:
   ```bash
   npm run validate:anagrams
   npm run validate:scores
   ```
2. Fix any issues
3. Rebuild if needed

## Troubleshooting

### Script Not Found

- Check script exists in `scripts/`
- Verify npm script in `package.json`
- Check Node.js version (v14+)

### Encoding Errors

- Check `puzzle-data.js` is valid JavaScript
- Verify puzzle data structure
- Check for syntax errors

### Validation Errors

- Review error messages
- Fix data issues
- Re-run validation

## Best Practices

### 1. Always Rebuild After Changes

```bash
# After editing puzzle-data.js
npm run build:data
```

### 2. Validate Before Committing

```bash
npm run validate:anagrams
npm run validate:scores
```

### 3. Test After Rebuilding

- Test puzzle loads correctly
- Verify functionality works
- Check for errors

### 4. Commit Generated Files

- Commit `puzzle-data-encoded.js`
- Commit generated Cursor rules
- These are needed for production

## Next Steps

- [Validation Scripts](./validation-scripts.md)
- [Development Workflow](../development/workflow.md)
- [Puzzle Data Management](../development/puzzle-data.md)
