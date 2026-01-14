# puzzle-state.js API Documentation

Shared state management for puzzle game.

## Overview

This module manages shared state across the puzzle game, including dragged tiles, selected tiles, hints, and solution visibility. It supports prefix-based state isolation for multiple puzzle instances.

## State Variables

The module maintains the following internal state:

- `draggedTile`: Currently dragged tile element (null if none)
- `selectedTile`: Currently selected tile for keyboard navigation (null if none)
- `hintsRemaining`: Number of hints remaining for regular puzzles (0-3)
- `archiveHintsRemaining`: Number of hints remaining for archive puzzles (0-3)
- `solutionShown`: Whether solution was shown for regular puzzles (boolean)
- `archiveSolutionShown`: Whether solution was shown for archive puzzles (boolean)

## Functions

### Dragged Tile Management

#### `getDraggedTile()`

Gets the currently dragged tile element.

**Returns:**
- `HTMLElement|null`: The dragged tile element, or `null` if none

**Example:**
```javascript
import { getDraggedTile } from './js/puzzle-state.js';

const dragged = getDraggedTile();
if (dragged) {
    console.log('Dragging:', dragged.getAttribute('data-letter'));
}
```

---

#### `setDraggedTile(tile)`

Sets the currently dragged tile element.

**Parameters:**
- `tile` (HTMLElement|null): The tile element being dragged

**Returns:**
- `void`

**Example:**
```javascript
import { setDraggedTile } from './js/puzzle-state.js';

tile.addEventListener('dragstart', (e) => {
    setDraggedTile(e.currentTarget);
});
```

---

#### `clearDraggedTile()`

Clears the currently dragged tile (sets to null).

**Returns:**
- `void`

**Example:**
```javascript
import { clearDraggedTile } from './js/puzzle-state.js';

tile.addEventListener('dragend', () => {
    clearDraggedTile();
});
```

---

### Selected Tile Management

#### `getSelectedTile()`

Gets the currently selected tile (for keyboard navigation).

**Returns:**
- `HTMLElement|null`: The selected tile element, or `null` if none

**Example:**
```javascript
import { getSelectedTile } from './js/puzzle-state.js';

const selected = getSelectedTile();
if (selected) {
    console.log('Selected:', selected.getAttribute('data-letter'));
}
```

---

#### `setSelectedTile(tile)`

Sets the currently selected tile (for keyboard navigation).

**Parameters:**
- `tile` (HTMLElement|null): The tile element to select

**Returns:**
- `void`

**Example:**
```javascript
import { setSelectedTile } from './js/puzzle-state.js';

tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        setSelectedTile(e.currentTarget);
    }
});
```

---

#### `clearSelectedTile()`

Clears the currently selected tile (sets to null).

**Returns:**
- `void`

**Example:**
```javascript
import { clearSelectedTile } from './js/puzzle-state.js';

slot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        placeTile(getSelectedTile(), e.currentTarget);
        clearSelectedTile();
    }
});
```

---

### Hints Management (Regular Puzzles)

#### `getHintsRemaining()`

Gets the number of hints remaining for regular puzzles.

**Returns:**
- `number`: Number of hints remaining (0-3)

**Example:**
```javascript
import { getHintsRemaining } from './js/puzzle-state.js';

const hints = getHintsRemaining();
if (hints > 0) {
    provideHint();
}
```

---

#### `setHintsRemaining(count)`

Sets the number of hints remaining for regular puzzles.

**Parameters:**
- `count` (number): Number of hints remaining (typically 0-3)

**Returns:**
- `void`

**Example:**
```javascript
import { setHintsRemaining } from './js/puzzle-state.js';

// Reset hints
setHintsRemaining(3);
```

---

#### `decrementHintsRemaining()`

Decrements the number of hints remaining for regular puzzles. Prevents going below 0.

**Returns:**
- `void`

**Example:**
```javascript
import { decrementHintsRemaining, getHintsRemaining } from './js/puzzle-state.js';

function provideHint() {
    if (getHintsRemaining() > 0) {
        // Show hint
        decrementHintsRemaining();
    }
}
```

---

### Hints Management (Archive Puzzles)

#### `getArchiveHintsRemaining()`

Gets the number of hints remaining for archive puzzles.

**Returns:**
- `number`: Number of hints remaining (0-3)

---

#### `setArchiveHintsRemaining(count)`

Sets the number of hints remaining for archive puzzles.

**Parameters:**
- `count` (number): Number of hints remaining (typically 0-3)

**Returns:**
- `void`

---

#### `decrementArchiveHintsRemaining()`

Decrements the number of hints remaining for archive puzzles. Prevents going below 0.

**Returns:**
- `void`

---

### Solution Shown State (Regular Puzzles)

#### `getSolutionShown()`

Gets whether the solution has been shown for regular puzzles.

**Returns:**
- `boolean`: `true` if solution was shown, `false` otherwise

**Example:**
```javascript
import { getSolutionShown } from './js/puzzle-state.js';

if (getSolutionShown()) {
    // Solution already shown, disable hint button
    hintBtn.disabled = true;
}
```

---

#### `setSolutionShown(value)`

Sets whether the solution has been shown for regular puzzles.

**Parameters:**
- `value` (boolean): `true` if solution was shown, `false` otherwise

**Returns:**
- `void`

**Example:**
```javascript
import { setSolutionShown } from './js/puzzle-state.js';

function showSolution() {
    // Show solution
    setSolutionShown(true);
}
```

---

### Solution Shown State (Archive Puzzles)

#### `getArchiveSolutionShown()`

Gets whether the solution has been shown for archive puzzles.

**Returns:**
- `boolean`: `true` if solution was shown, `false` otherwise

---

#### `setArchiveSolutionShown(value)`

Sets whether the solution has been shown for archive puzzles.

**Parameters:**
- `value` (boolean): `true` if solution was shown, `false` otherwise

**Returns:**
- `void`

---

### State Manager Factory

#### `createStateManager(prefix)`

Creates a state manager object with appropriate getters/setters based on prefix. This allows different puzzle instances (regular, daily, archive) to have separate state.

**Parameters:**
- `prefix` (string, optional): Prefix to determine which state to use
  - `'archive-'`: Uses archive-specific state
  - `''` or other: Uses regular puzzle state
  - Default: `''`

**Returns:**
- `Object`: State manager object with methods:
  - `getHintsRemaining()`: Get hints remaining
  - `setHintsRemaining(count)`: Set hints remaining
  - `decrementHintsRemaining()`: Decrement hints remaining
  - `getSolutionShown()`: Get solution shown state
  - `setSolutionShown(value)`: Set solution shown state

**Example:**
```javascript
import { createStateManager } from './js/puzzle-state.js';

// Regular puzzle state
const regularState = createStateManager('');
regularState.setHintsRemaining(3);
const hints = regularState.getHintsRemaining(); // 3

// Archive puzzle state (isolated)
const archiveState = createStateManager('archive-');
archiveState.setHintsRemaining(2);
const archiveHints = archiveState.getHintsRemaining(); // 2

// Regular state unchanged
const regularHints = regularState.getHintsRemaining(); // Still 3
```

## Usage Patterns

### Drag and Drop

Basic usage for tracking dragged tiles:

```javascript
import { setDraggedTile, getDraggedTile, clearDraggedTile } from './js/puzzle-state.js';
import { placeTileInSlot } from './js/tile-operations.js';

// On drag start
tile.addEventListener('dragstart', (e) => {
    setDraggedTile(e.currentTarget);
});

// On drop
slot.addEventListener('drop', (e) => {
    const dragged = getDraggedTile();
    if (dragged) {
        placeTileInSlot(dragged, e.currentTarget, context);
        clearDraggedTile();
    }
});
```

### Real-World Example: Complete Drag and Drop Handler

```javascript
import { setDraggedTile, getDraggedTile, clearDraggedTile } from './js/puzzle-state.js';
import { placeTileInSlot, removeTileFromSlot } from './js/tile-operations.js';
import { updateScoreDisplay } from './js/scoring.js';

function setupDragAndDrop(prefix = '') {
    const context = { prefix, handlers: {} };
    
    // Handle drag start
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('tile')) {
            setDraggedTile(e.target);
            e.target.style.opacity = '0.5';
        }
    });
    
    // Handle drag end
    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('tile')) {
            e.target.style.opacity = '1';
            clearDraggedTile();
        }
    });
    
    // Handle drop on slot
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        const slot = e.target.closest('.slot');
        if (!slot) return;
        
        const dragged = getDraggedTile();
        if (dragged) {
            // Check if slot already has a tile
            const existingTile = slot.querySelector('.tile');
            if (existingTile) {
                // Return existing tile to container
                removeTileFromSlot(slot, context);
            }
            
            // Place dragged tile
            placeTileInSlot(dragged, slot, context);
            clearDraggedTile();
            
            // Update score
            updateScoreDisplay(prefix);
        }
    });
}
```

### Keyboard Navigation

```javascript
import { setSelectedTile, getSelectedTile, clearSelectedTile } from './js/puzzle-state.js';

// Select tile
tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        setSelectedTile(e.currentTarget);
    }
});

// Place selected tile
slot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const selected = getSelectedTile();
        if (selected) {
            placeTile(selected, e.currentTarget);
            clearSelectedTile();
        }
    }
});
```

### Hint System with State Manager

```javascript
import { createStateManager } from './js/puzzle-state.js';

function initPuzzle(prefix) {
    const state = createStateManager(prefix);
    
    // Reset hints
    state.setHintsRemaining(3);
    
    // Provide hint
    function provideHint() {
        if (state.getHintsRemaining() > 0) {
            // Show hint
            state.decrementHintsRemaining();
            updateHintButton(state.getHintsRemaining());
        }
    }
    
    hintBtn.addEventListener('click', provideHint);
}
```

## See Also

- [puzzle-core.js](./puzzle-core.md) - Creates tiles and slots that use state
- [hints.js](./hints.md) - Uses state for hints remaining
- [completion.js](./completion.md) - Persistent state in localStorage
- [Module Interactions](../architecture/module-interactions.md#state-management) - How state flows between modules

## Notes

- State is module-level (not global), but shared across imports
- Archive puzzles have separate state from regular puzzles
- State persists for the lifetime of the page
- State is not persisted to localStorage (use `completion.js` for persistence)
