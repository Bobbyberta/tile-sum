# scoring.js API Documentation

Score calculation and solution validation functions.

## Overview

This module handles score calculation and solution validation for puzzles. It reads tiles from slots, calculates scores, and validates solutions against the puzzle data.

## Dependencies

- `puzzle-data-encoded.js`: For `calculateWordScore()` and `validateSolution()`

## Functions

### `updateScoreDisplay(prefix)`

Updates the score display for both words in the puzzle. Calculates current scores based on tiles in slots and displays them alongside the maximum possible scores.

**Parameters:**
- `prefix` (string, optional): Prefix for element IDs
  - `'daily-'`: Daily puzzle
  - `'archive-'`: Archive puzzle (uses `'archive-word-slots'` container)
  - `''`: Regular puzzle
  - Default: `''`

**Returns:**
- `void`

**Example:**
```javascript
import { updateScoreDisplay } from './js/scoring.js';

// Update scores for regular puzzle
updateScoreDisplay();

// Update scores for daily puzzle
updateScoreDisplay('daily-');

// Update scores for archive puzzle
updateScoreDisplay('archive-');
```

**Behavior:**
1. Finds the word slots container based on prefix
2. Reads tiles from slots for both words
3. Calculates scores using `calculateWordScore()` from puzzle data
4. Gets maximum scores from `data-max-score` attributes
5. Updates score display elements (`${prefix}word1-score-display`, `${prefix}word2-score-display`)

**Element IDs:**
- Word slots container: `${prefix}word-slots` (or `archive-word-slots` for archive)
- Score displays: `${prefix}word1-score-display`, `${prefix}word2-score-display`

**Display Format:**
- `"X / Y points"` where X is current score, Y is maximum score

---

### `updateSubmitButton()`

Updates submit button state.

**Note**: Currently the button is always enabled. This function is kept for consistency and potential future use.

**Returns:**
- `void`

**Example:**
```javascript
import { updateSubmitButton } from './js/scoring.js';

// Called after tile placement
updateSubmitButton();
```

---

### `checkSolution(day, showErrorModalCallback, showSuccessModalCallback, triggerConfettiCallback)`

Checks if the current puzzle solution is correct. Validates that all slots are filled and the words match the solution.

**Parameters:**
- `day` (number): The puzzle number/day to validate
- `showErrorModalCallback` (Function, optional): Callback to show error modal if solution is incorrect or incomplete
  - Called with no arguments
- `showSuccessModalCallback` (Function, optional): Callback to show success modal with scores if solution is correct
  - Called with: `(day, word1Score, word2Score, word1MaxScore, word2MaxScore)`
- `triggerConfettiCallback` (Function, optional): Callback to trigger celebration animation
  - Called with no arguments

**Returns:**
- `void`

**Example:**
```javascript
import { checkSolution } from './js/scoring.js';
import { showErrorModal, showSuccessModal } from './js/modals.js';
import { triggerSnowflakeConfetti } from './js/feedback.js';

submitBtn.addEventListener('click', () => {
    checkSolution(
        puzzleDay,
        () => showErrorModal('Incorrect solution. Try again!'),
        (day, score1, score2, max1, max2) => {
            showSuccessModal(day, score1, score2, max1, max2);
        },
        () => triggerSnowflakeConfetti()
    );
});
```

**Validation Process:**
1. Collects tiles from slots for both words
2. Checks if all slots are filled
3. If incomplete: Calls `showErrorModalCallback`
4. If complete: Validates solution using `validateSolution()` from puzzle data
5. If valid: Calculates scores and calls `showSuccessModalCallback` and `triggerConfettiCallback`
6. If invalid: Calls `showErrorModalCallback`

**Word Collection:**
- Reads from `[data-word-slots="0"] .slot` for word 1
- Reads from `[data-word-slots="1"] .slot` for word 2
- Extracts `data-letter` attribute from tiles
- Converts to uppercase for validation

## Usage Patterns

### Updating Scores After Tile Movement

Basic usage:

```javascript
import { updateScoreDisplay } from './js/scoring.js';

// After placing a tile
function placeTile(tile, slot) {
    slot.appendChild(tile);
    updateScoreDisplay(); // Update scores
}

// After removing a tile
function removeTile(slot) {
    const tile = slot.querySelector('.tile');
    if (tile) {
        tile.remove();
        updateScoreDisplay(); // Update scores
    }
}
```

### Real-World Example: Complete Solution Validation with Error Handling

```javascript
import { checkSolution, updateScoreDisplay } from './js/scoring.js';
import { showErrorModal, showSuccessModal } from './js/modals.js';
import { triggerSnowflakeConfetti } from './js/feedback.js';
import { savePuzzleCompletion } from './js/completion.js';
import { updateScoreDisplay } from './js/scoring.js';

function setupSubmitButton(day, prefix = '') {
    const submitBtn = document.getElementById(`${prefix}submit-btn`);
    if (!submitBtn) return;
    
    submitBtn.addEventListener('click', () => {
        // Update scores before validation (in case user hasn't moved tiles recently)
        updateScoreDisplay(prefix);
        
        // Check solution
        checkSolution(
            day,
            // Error callback
            () => {
                showErrorModal('Incorrect solution. Please try again!');
            },
            // Success callback
            (puzzleDay, word1Score, word2Score, word1MaxScore, word2MaxScore) => {
                // Calculate total score
                const totalScore = word1Score + word2Score;
                const maxTotalScore = word1MaxScore + word2MaxScore;
                
                // Show success modal with scores
                showSuccessModal(
                    puzzleDay,
                    word1Score,
                    word2Score,
                    word1MaxScore,
                    word2MaxScore,
                    prefix
                );
                
                // Trigger celebration
                triggerSnowflakeConfetti();
                
                // Save completion
                savePuzzleCompletion(puzzleDay);
                
                // Optional: Track analytics
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'puzzle_completed', {
                        puzzle_day: puzzleDay,
                        score: totalScore,
                        max_score: maxTotalScore
                    });
                }
            },
            // Confetti callback
            () => {
                triggerSnowflakeConfetti();
            }
        );
    });
}
```

### Complete Solution Validation

```javascript
import { checkSolution } from './js/scoring.js';
import { showErrorModal, showSuccessModal } from './js/modals.js';
import { triggerSnowflakeConfetti } from './js/feedback.js';
import { markPuzzleCompleted } from './js/completion.js';

submitBtn.addEventListener('click', () => {
    checkSolution(
        currentPuzzleDay,
        () => {
            showErrorModal('Incorrect solution. Please try again!');
        },
        (day, score1, score2, max1, max2) => {
            showSuccessModal(day, score1, score2, max1, max2);
            markPuzzleCompleted(day);
            triggerSnowflakeConfetti();
        },
        () => {
            triggerSnowflakeConfetti();
        }
    );
});
```

### Using with Prefixes

```javascript
import { updateScoreDisplay, checkSolution } from './js/scoring.js';

// Daily puzzle
function initDailyPuzzle(day) {
    // ... setup ...
    
    // Update scores
    updateScoreDisplay('daily-');
    
    // Check solution
    const submitBtn = document.getElementById('daily-submit-btn');
    submitBtn.addEventListener('click', () => {
        checkSolution(day, showError, showSuccess, triggerConfetti);
    });
}
```

## See Also

- [puzzle-core.js](./puzzle-core.md) - Creates slots that hold tiles for scoring
- [completion.js](./completion.md) - Marks puzzle as completed after validation
- [feedback.js](../architecture/module-interactions.md#solution-validation) - Shows success/error feedback
- [Data Structures](../architecture/data-structures.md#word-container-attributes) - Score attribute format

## Notes

- Score calculation uses Scrabble scoring from puzzle data
- Validation is case-insensitive (converts to uppercase)
- Maximum scores are stored in `data-max-score` attributes on word containers
- The module doesn't handle completion tracking (use `completion.js` for that)
- Error handling is done via callbacks, not thrown errors
