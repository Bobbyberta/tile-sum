# Code Style Guide

This document outlines the coding standards and conventions for the Sum Tile project.

## JavaScript Style

### General Principles

- Use modern ES6+ syntax
- Prefer `const` over `let`; only use `let` when reassignment is needed
- Use arrow functions for callbacks and short functions
- Use template literals for string interpolation
- Use descriptive variable and function names (camelCase)

### Variable Declarations

```javascript
// ✅ Good
const puzzleNumber = 1;
const tiles = document.querySelectorAll('.tile');
let hintsRemaining = 3; // Only use let when reassignment is needed

// ❌ Bad
var puzzleNumber = 1;
let tiles = document.querySelectorAll('.tile'); // Should be const
```

### Function Declarations

```javascript
// ✅ Good - Arrow functions for callbacks
const handleClick = (e) => {
    // ...
};

// ✅ Good - Named functions for exports
export function createTile(letter, index) {
    // ...
}

// ❌ Bad
function handleClick(e) { // Use arrow for callbacks
    // ...
}
```

### Template Literals

```javascript
// ✅ Good
const message = `Puzzle ${day} loaded`;
const elementId = `${prefix}tiles-container`;

// ❌ Bad
const message = 'Puzzle ' + day + ' loaded';
```

## Function Naming

### Conventions

- Use **camelCase**: `initCalendar()`, `updateCountdown()`, `handleTileClick()`
- Prefix event handlers with `handle`: `handleSubmit()`, `handleTileDrag()`
- Prefix initialization functions with `init`: `initCalendar()`, `initPuzzle()`
- Prefix update functions with `update`: `updateCountdown()`, `updateScore()`
- Prefix getter functions with `get`: `getHintsRemaining()`, `getSelectedTile()`
- Prefix setter functions with `set`: `setHintsRemaining()`, `setSelectedTile()`

### Examples

```javascript
// Event handlers
export function handleTileClick(e) { }
export function handleDragStart(e) { }
export function handleKeyDown(e) { }

// Initialization
export function initPuzzle(day) { }
export function initCalendar() { }

// Updates
export function updateScoreDisplay() { }
export function updateCountdown() { }

// Getters/Setters
export function getHintsRemaining() { }
export function setHintsRemaining(count) { }
```

## Code Organization

### Module Structure

Each module should:
- Have a single, focused responsibility
- Export only what's needed
- Import dependencies at the top
- Group related functions together

```javascript
// ✅ Good module structure
// Imports
import { SCRABBLE_SCORES } from '../puzzle-data-encoded.js';
import { handleTileKeyDown } from './keyboard.js';

// Internal state (if needed)
let internalState = null;

// Helper functions (not exported)
function helperFunction() {
    // ...
}

// Exported functions
export function createTile(letter, index) {
    // ...
}

export function createSlot(wordIndex, slotIndex) {
    // ...
}
```

### Function Organization

Within a module:
1. Imports
2. Internal state/constants
3. Helper functions (not exported)
4. Exported functions

## Comments

### When to Comment

- **Complex logic**: Explain "why" not "what"
- **Non-obvious behavior**: Document edge cases
- **Test mode behavior**: Document test-specific code
- **API functions**: Use JSDoc for exported functions

### Comment Style

```javascript
// ✅ Good - Explains why
// Check for test mode via URL parameter to enable development features
if (isTestMode()) {
    // ...
}

// ✅ Good - JSDoc for exported functions
/**
 * Creates a draggable tile element with letter and Scrabble score display.
 * 
 * @param {string} letter - The letter to display on the tile
 * @param {number} index - Unique index for the tile
 * @returns {HTMLElement} The created tile element
 */
export function createTile(letter, index) {
    // ...
}

// ❌ Bad - States the obvious
// Create a tile
export function createTile(letter, index) {
    // ...
}
```

## Error Handling

### Early Returns

Use early returns to reduce nesting:

```javascript
// ✅ Good
export function updateScore(prefix) {
    const container = document.getElementById(`${prefix}container`);
    if (!container) return;
    
    // Continue with logic
}

// ❌ Bad
export function updateScore(prefix) {
    const container = document.getElementById(`${prefix}container`);
    if (container) {
        // Nested logic
    }
}
```

### Element Existence Checks

Always check for element existence before DOM manipulation:

```javascript
// ✅ Good
const element = document.getElementById('my-element');
if (!element) return;
element.textContent = 'Updated';

// ❌ Bad
document.getElementById('my-element').textContent = 'Updated'; // May throw error
```

### Input Validation

Validate user input before processing:

```javascript
// ✅ Good
export function checkSolution(day, word1, word2) {
    if (!day || !word1 || !word2) {
        return false;
    }
    // Validate solution
}

// ❌ Bad
export function checkSolution(day, word1, word2) {
    // No validation - may fail with invalid input
}
```

## DOM Manipulation

### Element Queries

Prefer `getElementById` for single elements, `querySelector` for complex queries:

```javascript
// ✅ Good
const container = document.getElementById('tiles-container');
const tiles = container.querySelectorAll('.tile');

// ✅ Good - Scoped queries
const wordSlots = container.querySelectorAll('[data-word-index="0"] .slot');

// ❌ Bad - Global queries when scoped is better
const tiles = document.querySelectorAll('.tile'); // May select wrong elements
```

### Attribute Access

Use `getAttribute` and `setAttribute` for data attributes:

```javascript
// ✅ Good
const letter = tile.getAttribute('data-letter');
tile.setAttribute('data-locked', 'true');

// ❌ Bad
const letter = tile.dataset.letter; // Less explicit
```

## Event Handlers

### Handler Naming

Prefix with `handle`:

```javascript
// ✅ Good
export function handleTileClick(e) { }
export function handleDragStart(e) { }
export function handleKeyDown(e) { }
```

### Event Handler Structure

```javascript
// ✅ Good
export function handleTileClick(e) {
    const tile = e.currentTarget;
    if (!tile) return;
    
    const letter = tile.getAttribute('data-letter');
    // Handle click
}

// ❌ Bad - No checks
export function handleTileClick(e) {
    const letter = e.currentTarget.getAttribute('data-letter');
    // May fail if currentTarget is null
}
```

## Prefix System

When working with multiple puzzle instances, use prefixes:

```javascript
// ✅ Good - Support prefixes
export function initFeature(prefix = '') {
    const container = document.getElementById(`${prefix}container`);
    const button = document.getElementById(`${prefix}button`);
    // ...
}

// ❌ Bad - Hard-coded IDs
export function initFeature() {
    const container = document.getElementById('container'); // Only works for one instance
}
```

## Imports and Exports

### Import Style

Group imports logically:

```javascript
// ✅ Good - Grouped by source
// Puzzle data (must be first)
import { PUZZLE_DATA, calculateWordScore } from './puzzle-data-encoded.js';

// Core modules
import { createTile, createSlot } from './js/puzzle-core.js';
import { updateScoreDisplay } from './js/scoring.js';

// Utility modules
import { debugLog } from './js/utils.js';
```

### Export Style

Export at function declaration:

```javascript
// ✅ Good
export function createTile(letter, index) {
    // ...
}

// ❌ Bad
function createTile(letter, index) {
    // ...
}
export { createTile };
```

## Code Formatting

### Indentation

- Use 4 spaces (not tabs)
- Be consistent within files

### Line Length

- Aim for 80-100 characters per line
- Break long lines logically

### Spacing

```javascript
// ✅ Good - Consistent spacing
export function createTile(letter, index, isLocked = false) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    return tile;
}

// ❌ Bad - Inconsistent spacing
export function createTile(letter,index,isLocked=false){
    const tile=document.createElement('div');
    tile.className='tile';
    return tile;
}
```

## Best Practices

### 1. Single Responsibility

Each function should do one thing:

```javascript
// ✅ Good
export function createTile(letter, index) {
    // Only creates tile
}

export function attachHandlers(tile, handlers) {
    // Only attaches handlers
}

// ❌ Bad
export function createTileWithHandlers(letter, index, handlers) {
    // Does too much
}
```

### 2. Avoid Side Effects

Minimize side effects in pure functions:

```javascript
// ✅ Good - Pure function
export function calculateScore(word) {
    return word.split('').reduce((sum, letter) => {
        return sum + (SCRABBLE_SCORES[letter] || 0);
    }, 0);
}

// ❌ Bad - Side effect
export function calculateScore(word) {
    const score = word.split('').reduce((sum, letter) => {
        return sum + (SCRABBLE_SCORES[letter] || 0);
    }, 0);
    document.getElementById('score').textContent = score; // Side effect
    return score;
}
```

### 3. Use Descriptive Names

```javascript
// ✅ Good
const hintsRemaining = getHintsRemaining();
const selectedTile = getSelectedTile();

// ❌ Bad
const h = getHintsRemaining();
const t = getSelectedTile();
```

### 4. Avoid Magic Numbers

```javascript
// ✅ Good
const MAX_HINTS = 3;
const hintsRemaining = MAX_HINTS - hintsUsed;

// ❌ Bad
const hintsRemaining = 3 - hintsUsed; // What is 3?
```

## Testing Considerations

### Testable Code

Write code that's easy to test:

```javascript
// ✅ Good - Pure function, easy to test
export function calculateWordScore(word) {
    return word.split('').reduce((sum, letter) => {
        return sum + (SCRABBLE_SCORES[letter.toUpperCase()] || 0);
    }, 0);
}

// ❌ Bad - Hard to test (DOM dependency)
export function updateScore() {
    const word = document.getElementById('word').textContent;
    const score = calculateWordScore(word);
    document.getElementById('score').textContent = score;
}
```

## Accessibility

### ARIA Attributes

Add appropriate ARIA attributes:

```javascript
// ✅ Good
tile.setAttribute('role', 'button');
tile.setAttribute('aria-label', `Tile with letter ${letter}`);
tile.setAttribute('tabindex', '0');

// ❌ Bad - Missing accessibility
tile.className = 'tile';
```

### Keyboard Support

Ensure all interactive elements are keyboard accessible:

```javascript
// ✅ Good
tile.addEventListener('keydown', handleKeyDown);
tile.setAttribute('tabindex', '0');

// ❌ Bad - No keyboard support
tile.addEventListener('click', handleClick);
```

## Summary

- Use modern ES6+ syntax
- Follow naming conventions
- Add JSDoc comments for exported functions
- Use early returns for error handling
- Check element existence before DOM manipulation
- Support prefixes for multiple instances
- Write testable code
- Maintain accessibility
