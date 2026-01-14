# puzzle-core.js API Documentation

Core puzzle game logic for creating tiles, slots, and puzzle DOM structure.

## Overview

This module provides functions for creating the fundamental DOM elements of the puzzle game: tiles, slots, and the overall puzzle structure.

## Functions

### `createTile(letter, index, isLocked, handlers)`

Creates a draggable tile element with letter and Scrabble score display.

**Parameters:**
- `letter` (string): The letter to display on the tile (case-insensitive)
- `index` (number): Unique index for the tile (used for `data-tile-index` attribute)
- `isLocked` (boolean, optional): If `true`, tile cannot be dragged or interacted with. Default: `false`
- `handlers` (Object, optional): Event handler functions to attach to the tile
  - `onDragStart` (Function): Handler for `dragstart` event
  - `onDragEnd` (Function): Handler for `dragend` event
  - `onClick` (Function): Handler for `click` event
  - `onTouchStart` (Function): Handler for `touchstart` event
  - `onTouchMove` (Function): Handler for `touchmove` event
  - `onTouchEnd` (Function): Handler for `touchend` event
  - `onTouchCancel` (Function): Handler for `touchcancel` event
  - `onKeyDown` (Function): Handler for `keydown` event (defaults to `handleTileKeyDown` if not provided)

**Returns:**
- `HTMLElement`: The created tile element with appropriate classes, attributes, and event listeners

**Example:**
```javascript
import { createTile } from './js/puzzle-core.js';

const tile = createTile('A', 0, false, {
    onDragStart: (e) => console.log('Dragging tile'),
    onClick: (e) => console.log('Clicked tile')
});

// Add to container
container.appendChild(tile);
```

**Attributes Added:**
- `draggable`: Set to `'true'` unless locked
- `data-letter`: The letter value
- `data-tile-index`: The index value
- `data-locked`: Set to `'true'` if locked
- `role`: `'button'`
- `tabindex`: `'0'` (for keyboard navigation)
- `aria-label`: Descriptive label with letter and score

**Classes Added:**
- `tile`: Base tile class
- `bg-indigo-600 text-white`: Visual styling
- `rounded-lg p-3 w-12 h-14`: Size and spacing
- `flex flex-col items-center justify-center`: Layout
- `shadow-md transition-shadow`: Visual effects
- `locked`: If tile is locked
- `hover:shadow-lg`: Hover effect (if not locked)

---

### `createSlot(wordIndex, slotIndex, isLocked, handlers)`

Creates a droppable slot element where tiles can be placed to form words.

**Parameters:**
- `wordIndex` (number): Index of the word this slot belongs to (0 or 1)
- `slotIndex` (number): Index of the slot within the word (0-based)
- `isLocked` (boolean, optional): If `true`, slot cannot accept tiles. Default: `false`
- `handlers` (Object, optional): Event handler functions to attach to the slot
  - `onDragOver` (Function): Handler for `dragover` event
  - `onDrop` (Function): Handler for `drop` event
  - `onDragLeave` (Function): Handler for `dragleave` event
  - `onClick` (Function): Handler for `click` event
  - `onKeyDown` (Function): Handler for `keydown` event
  - `onFocus` (Function): Handler for `focus` event
  - `onBlur` (Function): Handler for `blur` event

**Returns:**
- `HTMLElement`: The created slot element with appropriate classes, attributes, and event listeners

**Example:**
```javascript
import { createSlot } from './js/puzzle-core.js';

const slot = createSlot(0, 0, false, {
    onDrop: (e) => handleDrop(e),
    onKeyDown: (e) => handleSlotKeyDown(e)
});

// Add to word container
wordContainer.appendChild(slot);
```

**Attributes Added:**
- `data-word-index`: The word index
- `data-slot-index`: The slot index
- `droppable`: Set to `'true'`
- `data-locked`: Set to `'true'` if locked
- `aria-label`: Descriptive label
- `role`: `'button'`
- `tabindex`: `'0'` (if not locked, for keyboard navigation)

**Classes Added:**
- `slot`: Base slot class
- `w-12 h-14`: Size matching tiles
- `rounded-lg`: Rounded corners
- `flex items-center justify-center`: Layout
- `locked`: If slot is locked

---

### `updatePlaceholderTile(containerId)`

Updates the visibility of a placeholder tile in the tiles container. Shows placeholder when no tiles are present, hides it when tiles exist. The placeholder maintains layout spacing when the container is empty.

**Parameters:**
- `containerId` (string, optional): ID of the tiles container element. Default: `'tiles-container'`

**Returns:**
- `void`

**Example:**
```javascript
import { updatePlaceholderTile } from './js/puzzle-core.js';

// Update placeholder for regular puzzle
updatePlaceholderTile('tiles-container');

// Update placeholder for daily puzzle
updatePlaceholderTile('daily-tiles-container');
```

**Behavior:**
- If container has no actual tiles: Creates and shows placeholder
- If container has tiles: Removes placeholder if it exists
- Placeholder is invisible but maintains layout spacing

---

### `createPuzzleDOMStructure(containerElement, prefix, titleText)`

Creates the complete DOM structure for a puzzle game dynamically. This includes header, tiles container, word slots, and action buttons.

**Parameters:**
- `containerElement` (HTMLElement): The parent container element to populate
- `prefix` (string): Prefix for element IDs (e.g., `'daily-'`, `'archive-'`, or `''`)
- `titleText` (string): Text to display in the puzzle title

**Returns:**
- `Object`: Object containing references to created elements:
  - `header` (HTMLElement): The header element
  - `puzzleTitle` (HTMLElement): The h1 title element
  - `tilesContainer` (HTMLElement): The container for draggable tiles
  - `wordSlotsContainer` (HTMLElement): The container for word slots
  - `hintBtn` (HTMLElement): The hint button element
  - `submitBtn` (HTMLElement): The submit button element

**Example:**
```javascript
import { createPuzzleDOMStructure } from './js/puzzle-core.js';

const container = document.getElementById('puzzle-container');
const elements = createPuzzleDOMStructure(container, 'daily-', 'Daily Puzzle');

// Now you can use the elements
elements.tilesContainer.appendChild(tile);
elements.hintBtn.addEventListener('click', handleHint);
```

**Structure Created:**
```
container
├── header
│   └── puzzle-title (h1)
├── tiles-wrapper
│   └── tiles-container (div)
├── slots-wrapper
│   └── word-slots-container (div)
└── buttons-container
    ├── hint-btn (button)
    └── submit-btn (button)
```

**Element IDs:**
- `${prefix}puzzle-title`
- `${prefix}tiles-container`
- `${prefix}word-slots`
- `${prefix}hint-btn`
- `${prefix}submit-btn`

## Dependencies

- `puzzle-data-encoded.js`: For `SCRABBLE_SCORES`
- `keyboard.js`: For default `handleTileKeyDown` handler

## Usage Patterns

### Creating a Complete Puzzle

This example shows how to create a complete puzzle with tiles and slots:

```javascript
import { createPuzzleDOMStructure, createTile, createSlot } from './js/puzzle-core.js';
import { handleDragStart, handleDrop } from './js/drag-drop.js';
import { handleTileClick } from './js/tile-interactions.js';

// 1. Create puzzle DOM structure
const container = document.getElementById('puzzle-container');
const elements = createPuzzleDOMStructure(container, '', 'Puzzle #1');

// 2. Get puzzle letters (from puzzle data)
const puzzleDay = 1;
const letters = getPuzzleLetters(puzzleDay); // ['S', 'N', 'O', 'W', 'M', 'A', 'N']

// 3. Create tiles for each letter
letters.forEach((letter, index) => {
    const tile = createTile(letter, index, false, {
        onDragStart: handleDragStart,
        onClick: (e) => handleTileClick(e, placeTileCallback, removeTileCallback),
        onKeyDown: handleTileKeyDown
    });
    elements.tilesContainer.appendChild(tile);
});

// 4. Create word containers and slots
const puzzle = PUZZLE_DATA[puzzleDay];
const word1Length = puzzle.solution[0].length; // 4 for "SNOW"
const word2Length = puzzle.solution[1].length; // 3 for "MAN"

// Create word 1 container
const word1Container = document.createElement('div');
word1Container.setAttribute('data-word-index', '0');
word1Container.setAttribute('data-max-score', calculateWordScore(puzzle.solution[0]).toString());
word1Container.className = 'word-container';

// Create slots for word 1
const slots1Container = document.createElement('div');
slots1Container.setAttribute('data-word-slots', '0');
for (let i = 0; i < word1Length; i++) {
    const slot = createSlot(0, i, false, {
        onDrop: handleDrop,
        onKeyDown: handleSlotKeyDown
    });
    slots1Container.appendChild(slot);
}
word1Container.appendChild(slots1Container);
elements.wordSlotsContainer.appendChild(word1Container);

// Create word 2 container and slots similarly
// ... (similar code for word 2)

// 5. Update placeholder tile visibility
updatePlaceholderTile('tiles-container');
```

### Real-World Example: Initializing Puzzle with All Features

```javascript
import { createPuzzleDOMStructure, createTile, updatePlaceholderTile } from './js/puzzle-core.js';
import { initKeyboardInput } from './js/keyboard-input.js';
import { createStateManager } from './js/puzzle-state.js';
import { updateScoreDisplay } from './js/scoring.js';
import { getPuzzleLetters, PUZZLE_DATA, calculateWordScore } from './puzzle-data-encoded.js';

function initPuzzle(day, prefix = '') {
    // 1. Get puzzle data
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) {
        console.error(`Puzzle ${day} not found`);
        return;
    }
    
    // 2. Create state manager
    const stateManager = createStateManager(prefix);
    stateManager.setHintsRemaining(3);
    
    // 3. Create DOM structure
    const container = document.getElementById(`${prefix}puzzle-container`);
    const elements = createPuzzleDOMStructure(
        container, 
        prefix, 
        `Puzzle #${day}`
    );
    
    // 4. Create tiles
    const letters = getPuzzleLetters(day);
    const handlers = {
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onClick: handleTileClick,
        onKeyDown: handleTileKeyDown
    };
    
    letters.forEach((letter, index) => {
        const tile = createTile(letter, index, false, handlers);
        elements.tilesContainer.appendChild(tile);
    });
    
    // 5. Create slots (simplified - actual implementation is more complex)
    // ... create word containers and slots ...
    
    // 6. Initialize keyboard input
    const keyboardContext = {
        placeTileCallback: placeTileInSlot,
        removeTileCallback: removeTileFromSlot,
        prefix
    };
    initKeyboardInput(keyboardContext);
    
    // 7. Update placeholder
    updatePlaceholderTile(`${prefix}tiles-container`);
    
    // 8. Set up submit button
    elements.submitBtn.addEventListener('click', () => {
        checkSolution(day, showErrorModal, showSuccessModal, triggerConfetti);
    });
    
    // 9. Set up hint button
    elements.hintBtn.addEventListener('click', () => {
        provideHint(day, { prefix, stateManager });
        updateScoreDisplay(prefix);
    });
    
    // 10. Initial score update
    updateScoreDisplay(prefix);
}
```

### Using Prefixes

```javascript
// Daily puzzle
const dailyElements = createPuzzleDOMStructure(
    dailyContainer, 
    'daily-', 
    'Daily Puzzle'
);

// Archive puzzle
const archiveElements = createPuzzleDOMStructure(
    archiveContainer, 
    'archive-', 
    'Archive Puzzle'
);
```

## See Also

- [puzzle-state.js](./puzzle-state.md) - State management for tiles and slots
- [scoring.js](./scoring.md) - Score calculation after tile placement
- [drag-drop.js](../architecture/module-interactions.md#drag-and-drop) - How tiles are moved
- [Data Structures](../architecture/data-structures.md#dom-data-attributes) - DOM attribute reference

## Notes

- Tiles and slots are created with accessibility attributes (ARIA labels, roles, tabindex)
- Event handlers are only attached if not locked
- The module handles both mouse and touch interactions
- All elements use Tailwind CSS classes for styling
