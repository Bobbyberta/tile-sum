# hints.js API Documentation

Hint system implementation for providing hints to players.

## Overview

This module provides functionality for the hint system, allowing players to get hints that reveal correct tile placements. Hints place tiles in correct positions and lock them.

## Functions

### `updateHintButtonText(buttonId, hintsRemaining)`

Updates the hint button text based on remaining hints.

**Parameters:**
- `buttonId` (string, optional): ID of the hint button element. Default: `'hint-btn'`
- `hintsRemaining` (number): Number of hints remaining

**Returns:**
- `void`

**Example:**
```javascript
import { updateHintButtonText } from './js/hints.js';

updateHintButtonText('hint-btn', 2);
// Button text: "Get Hint (2 left)"

updateHintButtonText('hint-btn', 0);
// Button text: "Show Solution?"
```

**Button States:**
- If `hintsRemaining > 0`: `"Get Hint (X left)"`
- If `hintsRemaining <= 0`: `"Show Solution?"`

---

### `provideHint(day, context)`

Provides a hint by placing one tile in the correct position and locking it.

**Parameters:**
- `day` (number): The puzzle number/day
- `context` (Object, optional): Context object with configuration
  - `prefix` (string, optional): Prefix for element IDs. Default: `''`
  - `stateManager` (Object, optional): State manager object. Default: Created from prefix
  - `returnArchiveTileToContainer` (Function, optional): Custom callback for returning tiles (archive puzzles)

**Returns:**
- `void`

**Example:**
```javascript
import { provideHint } from './js/hints.js';
import { createStateManager } from './js/puzzle-state.js';

// Regular puzzle
provideHint(1, {
  prefix: '',
  stateManager: createStateManager('')
});

// Archive puzzle
provideHint(1, {
  prefix: 'archive-',
  stateManager: createStateManager('archive-')
});
```

**Behavior:**
1. Checks if hints are available
2. Finds slots that need correct tiles
3. Selects the best slot to fill deterministically:
   - Highest Scrabble letter value first
   - If tied, the letter that appears earliest in the initial jumble (lowest `data-tile-index`)
   - If still tied, earliest slot (Word 1 left-to-right, then Word 2)
4. Finds the correct tile in the tiles container
5. Places tile in correct position
6. Locks the tile and slot
7. Decrements hints remaining
8. Updates score display
9. Updates hint button text

**Hint Selection:**
- Only places hints for slots that are empty or have wrong tiles
- Skips already locked slots
- Deterministically selects the highest-value letter first (with jumble-order and slot-order tie-breaks)

---

### `showSolution(day, context)`

Shows the complete solution by placing all tiles in correct positions and locking them.

**Parameters:**
- `day` (number): The puzzle number/day
- `context` (Object, optional): Context object with configuration
  - `prefix` (string, optional): Prefix for element IDs. Default: `''`
  - `stateManager` (Object, optional): State manager object. Default: Created from prefix
  - `returnArchiveTileToContainer` (Function, optional): Custom callback for returning tiles (archive puzzles)

**Returns:**
- `void`

**Example:**
```javascript
import { showSolution } from './js/hints.js';

showSolution(1, {
  prefix: '',
  stateManager: createStateManager('')
});
```

**Behavior:**
1. Checks if solution was already shown
2. Places all tiles in correct positions
3. Locks all tiles and slots
4. Marks solution as shown
5. Updates score display
6. Updates hint button (disables it)

**Note:** This is called when the user clicks "Show Solution?" after using all hints.

## Usage Patterns

### Basic Hint System

```javascript
import { provideHint, updateHintButtonText } from './js/hints.js';
import { getHintsRemaining } from './js/puzzle-state.js';

const hintBtn = document.getElementById('hint-btn');
hintBtn.addEventListener('click', () => {
  const hintsRemaining = getHintsRemaining();
  
  if (hintsRemaining > 0) {
    provideHint(puzzleDay, { prefix: '' });
    updateHintButtonText('hint-btn', hintsRemaining - 1);
  } else {
    showSolution(puzzleDay, { prefix: '' });
  }
});
```

### With State Manager

```javascript
import { provideHint, updateHintButtonText } from './js/hints.js';
import { createStateManager } from './js/puzzle-state.js';

const stateManager = createStateManager('archive-');

function handleHintClick() {
  const hintsRemaining = stateManager.getHintsRemaining();
  
  if (hintsRemaining > 0) {
    provideHint(puzzleDay, {
      prefix: 'archive-',
      stateManager: stateManager
    });
    updateHintButtonText('archive-hint-btn', hintsRemaining - 1);
  }
}
```

### Updating Button Text

```javascript
import { updateHintButtonText } from './js/hints.js';
import { getHintsRemaining } from './js/puzzle-state.js';

// Update button text when hints change
function updateHintUI() {
  const hintsRemaining = getHintsRemaining();
  updateHintButtonText('hint-btn', hintsRemaining);
}

// Call after providing hint
provideHint(day, context);
updateHintUI();
```

## Integration

### With Puzzle State

The hint system integrates with `puzzle-state.js`:

```javascript
import { getHintsRemaining, decrementHintsRemaining } from './js/puzzle-state.js';
import { provideHint } from './js/hints.js';

// Check hints before providing
if (getHintsRemaining() > 0) {
  provideHint(day, context);
  // Hint decrements internally
}
```

### With Scoring

Hints automatically update scores:

```javascript
import { provideHint } from './js/hints.js';
import { updateScoreDisplay } from './js/scoring.js';

// Hint automatically calls updateScoreDisplay internally
provideHint(day, context);
// Score is updated automatically
```

### With Auto-Complete

Hints trigger auto-complete check:

```javascript
// After providing hint, auto-complete is checked
// If all slots are filled, auto-submit may trigger
```

## See Also

- [puzzle-state.js](./puzzle-state.md) - Manages hints remaining state
- [puzzle-core.js](./puzzle-core.md) - Creates and locks tiles/slots
- [scoring.js](./scoring.md) - Updates scores after hints
- [completion.js](./completion.md) - Tracks puzzle completion

## Notes

- Hints lock tiles and slots (cannot be moved)
- Hints are selected deterministically to be consistent across players
- Solution showing locks all tiles permanently
- Hint count is tracked per puzzle instance (prefix-based)
- Hints decrement automatically when provided
