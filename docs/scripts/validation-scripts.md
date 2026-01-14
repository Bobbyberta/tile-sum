# Validation Scripts Documentation

This document describes the validation scripts used to check and fix puzzle data.

## Overview

Validation scripts are located in `scripts/validation/` and are used to:
- Validate puzzle data integrity
- Check anagram validity
- Verify Scrabble scores
- Check for alternative solutions
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
1. Loads word dictionary from local file (`validation-words.txt`)
2. For each puzzle, checks if words are valid anagrams
3. Verifies words use only provided letters
4. Reports any issues found

**Output:**
- Lists puzzles with anagram issues
- Shows which words are problematic
- Suggests fixes if possible

**Dictionary:**
- Uses local word dictionary file `scripts/validation/validation-words.txt`
- Contains words of length 3-8 letters
- Must exist locally (no automatic download)

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

### `check-alternative-solutions.js`

Checks if any puzzles have alternative solutions - i.e., different word pairs that use the same letters, have the same Scrabble scores, and same number of letters. Currently checks only puzzles where both words are 5 letters (matching the available dictionary).

**Usage:**
```bash
npm run validate:alternatives
```

**What it does:**
1. Loads word dictionary (from local file or GitHub)
2. Filters puzzles where both words are 5 letters
3. Groups dictionary words by Scrabble score for efficient lookup
4. For each puzzle, finds alternative word pairs that:
   - Use the same letters (anagram of combined letters)
   - Have the same Scrabble scores
   - Have the same word lengths
5. Exports results to `alternative-solutions.json`

**Output:**
- Console output showing puzzles with alternative solutions
- JSON file (`alternative-solutions.json`) with detailed results including:
  - Timestamp
  - Total puzzles checked
  - Count of puzzles with alternatives
  - Detailed results for each puzzle with alternatives

**Note:**
This script checks if the **combined letters** from both words can form different word pairs. This is different from `check-anagrams.js`, which checks if individual words have anagrams. A puzzle may have no individual word anagrams but still have alternative solutions when letters are combined.

**Example Output:**
```
Checking for alternative solutions (3-8 letter words)...

Loading dictionary...
Loaded words from validation-words.txt.

Found puzzles with words in validation dictionary range (3-8 letters).

✗ Found puzzle(s) with alternative solutions:

Puzzle 29:
  Original: [PULSE, LOADS] (scores: 7, 6)
  Alternatives (13):
    - [POLES, LAUDS] (scores: 7, 6)
    - [SLOPE, DUALS] (scores: 7, 6)
    ...
```

**Output File:**
Results are saved to `scripts/validation/alternative-solutions.json` with structured data for programmatic analysis.

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
2. Applies word replacements to puzzle data (replaces old words with new words)
3. Updates `puzzle-data.js`

**Replacement File Format:**
The file contains a mapping of old words to new words (both must be anagrams with different scores):
```json
{
  "OLDWORD": "NEWWORD"
}
```

**Example:**
```json
{
  "HELLO": "HOLLE",
  "WORLD": "WROLD"
}
```

This replaces all instances of "HELLO" with "HOLLE" and "WORLD" with "WROLD" throughout the puzzle data. The replacement words must be anagrams of the original words but have different Scrabble scores to fix duplicate score issues.

## Validation Workflow

### Standard Validation

```bash
# Check anagrams
npm run validate:anagrams

# Check scores
npm run validate:scores

# Check for alternative solutions
npm run validate:alternatives
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
npm run validate:alternatives

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
├── check-alternative-solutions.js # Check for alternative solutions
├── fix-duplicate-scores.js    # Fix duplicate scores
├── apply-score-replacements.js # Apply score replacements
├── generate-puzzles.js        # Generate new puzzles
├── remove-alternative-puzzles.js # Remove puzzles with alternatives
├── utils.js                   # Shared utility functions
├── score-replacements.json     # Score replacement data (generated by fix-duplicate-scores.js)
├── alternative-solutions.json  # Alternative solutions results (generated by check-alternative-solutions.js)
├── validation-words.txt       # Word dictionary (3-8 letter words)
└── puzzle-safe-words.txt      # Safe words list for puzzle generation
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

Before applying score replacements, review the generated `score-replacements.json` file to ensure the suggested fixes are correct.

## Troubleshooting

### Dictionary Not Found

If dictionary file is missing:
- Ensure `validation-words.txt` exists in `scripts/validation/` directory
- The file should contain one word per line (uppercase, 3-8 letters)
- Scripts will fail with an error if the file is not found

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
