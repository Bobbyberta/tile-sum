# Validation Scripts Documentation

This document describes the validation scripts used to check and fix puzzle data.

## Overview

Validation scripts are located in `scripts/validation/` and are used to:
- Validate puzzle data integrity
- Check anagram validity
- Verify Scrabble scores
- Fix duplicate scores
- Apply score replacements

## Scripts

### `check-anagrams.js`

Validates that puzzle words are valid anagrams of the provided letters.

**Usage:**
```bash
npm run validate:anagrams
```

**What it does:**
1. Loads word dictionary (from local file or GitHub)
2. For each puzzle, checks if words are valid anagrams
3. Verifies words use only provided letters
4. Reports any issues found

**Output:**
- Lists puzzles with anagram issues
- Shows which words are problematic
- Suggests fixes if possible

**Dictionary:**
- Uses five-letter word dictionary from GitHub
- Cached locally in `scripts/validation/sgb-words.txt`
- Automatically downloads if not present

**Example Output:**
```
Checking anagrams for all puzzles...
Puzzle 1: ✓ Valid
Puzzle 2: ✗ Invalid - word "TEST" is not a valid anagram
```

---

### `check-scores.js`

Validates Scrabble scores for puzzle words.

**Usage:**
```bash
npm run validate:scores
```

**What it does:**
1. Loads puzzle data
2. Calculates expected scores for each word
3. Compares with actual scores in puzzle data
4. Reports mismatches

**Output:**
- Lists puzzles with score issues
- Shows expected vs actual scores
- Identifies duplicate scores

**Example Output:**
```
Checking scores for all puzzles...
Puzzle 1: ✓ Scores correct
Puzzle 2: ✗ Score mismatch - expected 10, got 12
```

---

### `fix-duplicate-scores.js`

Fixes duplicate scores in puzzle data.

**Usage:**
```bash
npm run fix:scores
```

**What it does:**
1. Finds puzzles with duplicate scores
2. Identifies which scores are duplicates
3. Suggests fixes
4. Can apply fixes automatically (with confirmation)

**Output:**
- Lists puzzles with duplicate scores
- Shows duplicate score values
- Applies fixes if confirmed

**Example Output:**
```
Found duplicate scores:
Puzzle 5: Both words have score 10
Fix: Change word 2 score to 12
Apply fix? (y/n)
```

---

### `apply-score-replacements.js`

Applies score replacements from `score-replacements.json`.

**Usage:**
```bash
npm run apply:scores
```

**What it does:**
1. Reads `score-replacements.json`
2. Applies replacements to puzzle data
3. Updates `puzzle-data.js`

**Replacement File Format:**
```json
{
  "puzzleNumber": {
    "wordIndex": newScore
  }
}
```

**Example:**
```json
{
  "5": {
    "1": 12
  }
}
```

This replaces score for word 1 in puzzle 5 with 12.

---

### `find-replacements.js`

Finds potential score replacements needed.

**Usage:**
```bash
node scripts/validation/find-replacements.js
```

**What it does:**
1. Analyzes puzzle data
2. Identifies score issues
3. Generates replacement suggestions
4. Outputs to `replacements.json`

**Output:**
- Creates `replacements.json` with suggested fixes
- Can be reviewed before applying

---

### `apply-replacements.js`

Applies replacements from `replacements.json`.

**Usage:**
```bash
node scripts/validation/apply-replacements.js
```

**What it does:**
1. Reads `replacements.json`
2. Applies replacements to puzzle data
3. Updates `puzzle-data.js`

## Validation Workflow

### Standard Validation

```bash
# Check anagrams
npm run validate:anagrams

# Check scores
npm run validate:scores
```

### Fixing Issues

```bash
# Fix duplicate scores
npm run fix:scores

# Apply score replacements
npm run apply:scores
```

### Complete Validation

```bash
# Run all validations
npm run validate:anagrams
npm run validate:scores

# Fix any issues
npm run fix:scores

# Rebuild data
npm run build:data
```

## File Structure

```
scripts/validation/
├── check-anagrams.js          # Anagram validation
├── check-scores.js            # Score validation
├── fix-duplicate-scores.js    # Fix duplicate scores
├── find-replacements.js       # Find replacements
├── apply-replacements.js      # Apply replacements
├── apply-score-replacements.js # Apply score replacements
├── replacements.json          # Replacement data
├── score-replacements.json     # Score replacement data
└── sgb-words.txt              # Word dictionary (cached)
```

## Dictionary

### Word Dictionary

The validation scripts use a five-letter word dictionary:
- **Source**: GitHub (charlesreid1/five-letter-words)
- **File**: `sgb-words.txt`
- **Format**: One word per line, uppercase
- **Cached**: Downloaded and cached locally

### Dictionary Loading

```javascript
// Loads from local file if available
// Otherwise downloads from GitHub
const words = await loadWordList();
```

## Best Practices

### 1. Validate Before Committing

```bash
npm run validate:anagrams
npm run validate:scores
```

### 2. Fix Issues Before Building

```bash
# Fix issues
npm run fix:scores

# Rebuild
npm run build:data
```

### 3. Review Replacements

```bash
# Generate replacements
node scripts/validation/find-replacements.js

# Review replacements.json
# Then apply
node scripts/validation/apply-replacements.js
```

## Troubleshooting

### Dictionary Not Found

If dictionary file is missing:
- Script will attempt to download from GitHub
- Check internet connection
- Verify GitHub URL is accessible

### Validation Errors

If validation fails:
- Review error messages
- Check puzzle data structure
- Verify word validity
- Check score calculations

### Replacement Issues

If replacements don't apply:
- Check JSON format
- Verify puzzle numbers exist
- Check file permissions
- Review replacement data

## Next Steps

- [Build Scripts](./build-scripts.md)
- [Puzzle Data Management](../development/puzzle-data.md)
