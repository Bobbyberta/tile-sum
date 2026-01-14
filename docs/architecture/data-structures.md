# Data Structures

This document describes the data structures used throughout the Sum Tile application.

## Puzzle Data Structure

### Puzzle Definition

Each puzzle is defined with a number (day) as the key:

```javascript
{
    [puzzleNumber]: {
        words: [string, string],      // The two puzzle words
        solution: [string, string]     // The correct solution (same as words)
    }
}
```

**Example:**
```javascript
1: {
    words: ['SNOW', 'MAN'],
    solution: ['SNOW', 'MAN']
}
```

**Fields:**
- `words`: Array of exactly 2 strings (the puzzle words)
- `solution`: Array of exactly 2 strings (the correct solution, typically same as words)

### Scrabble Scores

```javascript
const SCRABBLE_SCORES = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1,
    'F': 4, 'G': 2, 'H': 4, 'I': 1, 'J': 8,
    'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1,
    'P': 3, 'Q': 10, 'R': 1, 'S': 1, 'T': 1,
    'U': 1, 'V': 4, 'W': 4, 'X': 8, 'Y': 4,
    'Z': 10
};
```

## DOM Data Attributes

### Tile Attributes

Tiles have the following data attributes:

```html
<div
    class="tile ..."
    draggable="true"
    data-letter="A"              <!-- Letter on the tile -->
    data-tile-index="0"           <!-- Unique tile index -->
    data-locked="true"            <!-- Optional: if tile is locked -->
    role="button"
    tabindex="0"
    aria-label="Tile with letter A, score 1"
>
```

**Attributes:**
- `data-letter`: The letter value (string)
- `data-tile-index`: Unique index (number as string)
- `data-locked`: `'true'` if locked, absent if not locked
- `draggable`: `'true'` or `'false'` based on locked state

### Slot Attributes

Slots have the following data attributes:

```html
<div
    class="slot ..."
    data-word-index="0"           <!-- Word index (0 or 1) -->
    data-slot-index="0"           <!-- Slot index within word -->
    data-locked="true"            <!-- Optional: if slot is locked -->
    droppable="true"
    role="button"
    tabindex="0"
    aria-label="Slot 1 for word 1"
>
```

**Attributes:**
- `data-word-index`: Word index (0 or 1)
- `data-slot-index`: Slot index within word (0-based)
- `data-locked`: `'true'` if locked, absent if not locked
- `droppable`: Always `'true'`

### Word Container Attributes

Word containers have maximum score attributes:

```html
<div
    data-word-index="0"
    data-max-score="14"           <!-- Maximum possible score for this word -->
>
    <!-- Slots go here -->
</div>
```

**Attributes:**
- `data-word-index`: Word index (0 or 1)
- `data-max-score`: Maximum possible score (number as string)

## State Structures

### Dragged Tile State

```javascript
// In puzzle-state.js
let draggedTile = null;  // HTMLElement | null
```

**Type:** `HTMLElement | null`
- `null`: No tile is being dragged
- `HTMLElement`: The tile element currently being dragged

### Selected Tile State

```javascript
// In puzzle-state.js
let selectedTile = null;  // HTMLElement | null
```

**Type:** `HTMLElement | null`
- `null`: No tile is selected
- `HTMLElement`: The tile element currently selected (for keyboard navigation)

### Hints State

```javascript
// In puzzle-state.js
let hintsRemaining = 3;           // number (0-3)
let archiveHintsRemaining = 3;    // number (0-3)
```

**Type:** `number`
- Range: 0-3
- Separate state for regular and archive puzzles

### Solution Shown State

```javascript
// In puzzle-state.js
let solutionShown = false;            // boolean
let archiveSolutionShown = false;     // boolean
```

**Type:** `boolean`
- `true`: Solution has been shown
- `false`: Solution has not been shown
- Separate state for regular and archive puzzles

## LocalStorage Structure

### Completion Data

```javascript
{
    "completedPuzzles": {
        "1": "2024-12-01",      // Puzzle number: completion date
        "2": "2024-12-02",
        // ...
    }
}
```

**Structure:**
- Key: `"completedPuzzles"`
- Value: Object mapping puzzle numbers (as strings) to completion dates (ISO date strings)

**Example:**
```javascript
localStorage.setItem('completedPuzzles', JSON.stringify({
    "1": "2024-12-01",
    "2": "2024-12-02"
}));
```

## Context Objects

### Keyboard Context

```javascript
{
    placeTileCallback: (tile, slot) => void,
    removeTileCallback: (slot) => void,
    prefix: string
}
```

**Fields:**
- `placeTileCallback`: Function to place a tile in a slot
- `removeTileCallback`: Function to remove a tile from a slot
- `prefix`: Element ID prefix (e.g., `'daily-'`, `'archive-'`, `''`)

### Drag-Drop Context

```javascript
{
    handlers: {
        onDragStart: (e) => void,
        onDragEnd: (e) => void,
        onTouchMove: (e) => void,
        onTouchEnd: (e) => void,
        onTouchCancel: (e) => void,
        onClick: (e) => void,
        onTouchStart: (e) => void,
        onKeyDown: (e) => void
    },
    prefix: string,
    isArchive: boolean
}
```

**Fields:**
- `handlers`: Object containing event handler functions
- `prefix`: Element ID prefix
- `isArchive`: Whether this is an archive puzzle

### State Manager Object

```javascript
{
    getHintsRemaining: () => number,
    setHintsRemaining: (count: number) => void,
    decrementHintsRemaining: () => void,
    getSolutionShown: () => boolean,
    setSolutionShown: (value: boolean) => void
}
```

**Methods:**
- `getHintsRemaining()`: Get hints remaining
- `setHintsRemaining(count)`: Set hints remaining
- `decrementHintsRemaining()`: Decrement hints remaining
- `getSolutionShown()`: Get solution shown state
- `setSolutionShown(value)`: Set solution shown state

## Element ID Patterns

### Prefix System

Elements use prefixes to support multiple puzzle instances:

**Pattern:** `${prefix}element-name`

**Examples:**
- Regular puzzle: `tiles-container`, `word-slots`, `hint-btn`
- Daily puzzle: `daily-tiles-container`, `daily-word-slots`, `daily-hint-btn`
- Archive puzzle: `archive-tiles-container`, `archive-word-slots`, `archive-hint-btn`

**Special Cases:**
- Archive word slots: Always `archive-word-slots` (not `archive-archive-word-slots`)

### Common Element IDs

```javascript
// Tiles container
`${prefix}tiles-container`

// Word slots container
`${prefix}word-slots`  // or 'archive-word-slots' for archive

// Buttons
`${prefix}hint-btn`
`${prefix}submit-btn`

// Score displays
`${prefix}word1-score-display`
`${prefix}word2-score-display`

// Puzzle title
`${prefix}puzzle-title`
```

## Puzzle Data Access

### Getting Puzzle Data

```javascript
import { PUZZLE_DATA } from './puzzle-data-encoded.js';

const puzzle = PUZZLE_DATA[day];
// {
//     words: ['WORD1', 'WORD2'],
//     solution: ['WORD1', 'WORD2']
// }
```

### Getting Puzzle Letters

```javascript
import { getPuzzleLetters } from './puzzle-data-encoded.js';

const letters = getPuzzleLetters(day);
// ['A', 'B', 'C', 'D', ...] - shuffled letters
```

### Calculating Scores

```javascript
import { calculateWordScore } from './puzzle-data-encoded.js';

const score = calculateWordScore('WORD');
// number - total Scrabble score
```

### Validating Solutions

```javascript
import { validateSolution } from './puzzle-data-encoded.js';

const isValid = validateSolution(day, 'WORD1', 'WORD2');
// boolean - true if solution is correct
```

## Notes

- All data attributes are strings (even numbers)
- State is module-level (shared across imports)
- LocalStorage uses JSON for serialization
- Element IDs follow consistent prefix patterns
- Puzzle data is encoded in production but structure remains the same
