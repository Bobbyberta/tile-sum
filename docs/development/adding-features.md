# Adding New Features

This guide explains how to add new features to the Sum Tile project.

## Feature Development Checklist

Before starting:
- [ ] Understand the requirement
- [ ] Identify affected modules
- [ ] Plan the implementation
- [ ] Consider edge cases
- [ ] Consider accessibility
- [ ] Consider testing

## Step-by-Step Process

### 1. Plan the Feature

**Questions to Answer:**
- What is the feature supposed to do?
- Which modules are affected?
- Are there any dependencies?
- How does it interact with existing features?
- What are the edge cases?

**Example:**
> Feature: Add a "Shuffle Tiles" button
> - Affects: `puzzle-core.js` (tile creation), `ui.js` (button placement)
> - New module: `js/shuffle.js` (shuffle logic)
> - Edge cases: Empty tiles container, locked tiles

### 2. Create or Modify Modules

#### Option A: New Module

1. **Create new file** in `js/` directory:
   ```javascript
   // js/shuffle.js
   
   /**
    * Shuffles the tiles in the tiles container.
    * 
    * @param {string} [prefix=''] - Prefix for element IDs
    * @returns {void}
    */
   export function shuffleTiles(prefix = '') {
       const container = document.getElementById(`${prefix}tiles-container`);
       if (!container) return;
       
       const tiles = Array.from(container.querySelectorAll('.tile:not([data-locked])'));
       // Shuffle logic
   }
   ```

2. **Export functions** that other modules need

3. **Import in `script.js`**:
   ```javascript
   import { shuffleTiles } from './js/shuffle.js';
   ```

#### Option B: Modify Existing Module

1. **Add function** to existing module
2. **Export function** if needed by other modules
3. **Update JSDoc** comments

### 3. Update HTML (if needed)

If adding UI elements:

1. **Edit HTML file** (`index.html`, `puzzle.html`, or `archive.html`)
2. **Add element** with appropriate ID and classes:
   ```html
   <button id="shuffle-btn" class="px-4 py-2 bg-blue-500 text-white rounded">
       Shuffle Tiles
   </button>
   ```
3. **Use prefix** if needed for multiple instances:
   ```html
   <button id="${prefix}shuffle-btn" class="...">
   ```

### 4. Wire Up the Feature

In `script.js` or appropriate initialization function:

```javascript
// Import the function
import { shuffleTiles } from './js/shuffle.js';

// Wire up event handler
function initPuzzleWithPrefix(day, prefix = '') {
    // ... existing code ...
    
    // Add shuffle button handler
    const shuffleBtn = document.getElementById(`${prefix}shuffle-btn`);
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            shuffleTiles(prefix);
        });
    }
}
```

### 5. Add Error Handling

Handle edge cases and errors:

```javascript
export function shuffleTiles(prefix = '') {
    const container = document.getElementById(`${prefix}tiles-container`);
    if (!container) {
        console.warn(`Tiles container not found for prefix: ${prefix}`);
        return;
    }
    
    const tiles = Array.from(container.querySelectorAll('.tile:not([data-locked])'));
    if (tiles.length === 0) {
        return; // Nothing to shuffle
    }
    
    // Shuffle logic with error handling
    try {
        // ... shuffle implementation
    } catch (error) {
        console.error('Error shuffling tiles:', error);
    }
}
```

### 6. Add Accessibility

Ensure the feature is accessible:

```javascript
// Add ARIA attributes
button.setAttribute('aria-label', 'Shuffle tiles');
button.setAttribute('role', 'button');

// Ensure keyboard accessible
button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        shuffleTiles(prefix);
    }
});
```

### 7. Test the Feature

#### Manual Testing

1. **Test basic functionality**
2. **Test edge cases**:
   - Empty state
   - Error conditions
   - Multiple instances (prefixes)
3. **Test accessibility**:
   - Keyboard navigation
   - Screen reader
4. **Test in different browsers**

#### Automated Testing

Add unit tests:

```javascript
// tests/unit/shuffle.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { shuffleTiles } from '../../js/shuffle.js';
import { setupDOM } from '../helpers/dom-setup.js';

describe('shuffleTiles', () => {
    beforeEach(() => {
        setupDOM();
    });
    
    it('should shuffle tiles in container', () => {
        // Test implementation
    });
    
    it('should handle empty container', () => {
        // Test edge case
    });
});
```

### 8. Update Documentation

- **JSDoc comments** for exported functions
- **API documentation** if it's a significant feature
- **README** if it affects setup or usage

## Common Patterns

### Adding a Button

```javascript
// 1. Create handler function
export function handleShuffleClick(prefix) {
    shuffleTiles(prefix);
}

// 2. Wire up in initialization
const shuffleBtn = document.getElementById(`${prefix}shuffle-btn`);
if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => handleShuffleClick(prefix));
}
```

### Adding State Management

```javascript
// In puzzle-state.js or new module
let shuffleCount = 0;

export function getShuffleCount() {
    return shuffleCount;
}

export function incrementShuffleCount() {
    shuffleCount++;
}
```

### Adding to Multiple Pages

```javascript
// In script.js
if (document.getElementById('shuffle-btn')) {
    // Regular puzzle page
    const btn = document.getElementById('shuffle-btn');
    btn.addEventListener('click', () => handleShuffleClick(''));
}

if (document.getElementById('daily-shuffle-btn')) {
    // Daily puzzle
    const btn = document.getElementById('daily-shuffle-btn');
    btn.addEventListener('click', () => handleShuffleClick('daily-'));
}
```

### Using Prefixes

Always support prefixes for multiple instances:

```javascript
// ✅ Good - Supports prefixes
export function initFeature(prefix = '') {
    const element = document.getElementById(`${prefix}element`);
    // ...
}

// ❌ Bad - Hard-coded ID
export function initFeature() {
    const element = document.getElementById('element'); // Only one instance
}
```

## Example: Complete Feature

Let's add a "Clear All" feature:

### 1. Create Module

```javascript
// js/clear-all.js

/**
 * Clears all tiles from slots and returns them to the tiles container.
 * 
 * @param {string} [prefix=''] - Prefix for element IDs
 * @returns {void}
 */
export function clearAllTiles(prefix = '') {
    // Determine word slots container
    let wordSlotsContainerId;
    if (prefix === 'archive-') {
        wordSlotsContainerId = 'archive-word-slots';
    } else if (prefix) {
        wordSlotsContainerId = `${prefix}word-slots`;
    } else {
        wordSlotsContainerId = 'word-slots';
    }
    
    const wordSlotsContainer = document.getElementById(wordSlotsContainerId);
    const tilesContainer = document.getElementById(`${prefix}tiles-container`);
    
    if (!wordSlotsContainer || !tilesContainer) return;
    
    // Get all tiles in slots
    const slots = wordSlotsContainer.querySelectorAll('.slot');
    const tiles = Array.from(slots)
        .map(slot => slot.querySelector('.tile'))
        .filter(tile => tile !== null);
    
    // Return tiles to container
    tiles.forEach(tile => {
        tilesContainer.appendChild(tile);
    });
    
    // Update score display
    if (typeof updateScoreDisplay === 'function') {
        updateScoreDisplay(prefix);
    }
}
```

### 2. Add Button to HTML

```html
<!-- In puzzle.html -->
<button id="clear-all-btn" class="px-4 py-2 bg-red-500 text-white rounded">
    Clear All
</button>
```

### 3. Wire Up in script.js

```javascript
// Import
import { clearAllTiles } from './js/clear-all.js';

// In initPuzzleWithPrefix
const clearBtn = document.getElementById(`${prefix}clear-all-btn`);
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        clearAllTiles(prefix);
        updateScoreDisplay(prefix);
    });
}
```

### 4. Add Tests

```javascript
// tests/unit/clear-all.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { clearAllTiles } from '../../js/clear-all.js';
import { setupDOM } from '../helpers/dom-setup.js';

describe('clearAllTiles', () => {
    beforeEach(() => {
        setupDOM();
    });
    
    it('should return all tiles to container', () => {
        // Test implementation
    });
});
```

## Best Practices

1. **Start Small**: Build the feature incrementally
2. **Test Early**: Write tests as you develop
3. **Follow Patterns**: Use existing code patterns
4. **Document**: Add JSDoc comments
5. **Consider Edge Cases**: Handle errors and empty states
6. **Maintain Accessibility**: Ensure keyboard and screen reader support
7. **Use Prefixes**: Support multiple puzzle instances

## Troubleshooting

### Feature Not Working

- Check browser console for errors
- Verify element IDs match
- Check if prefix is correct
- Verify event handlers are attached

### Feature Not Appearing

- Check HTML is correct
- Verify CSS classes are applied
- Check if element is hidden
- Verify build process completed

### Multiple Instances Not Working

- Check prefix support
- Verify element IDs use prefix
- Check state management uses prefix

## Next Steps

After adding a feature:
1. Test thoroughly
2. Update documentation
3. Commit changes
4. Consider adding to changelog
