# Integration Testing Guide

This guide explains how to write integration tests for the Sum Tile project.

## Overview

Integration tests verify that multiple modules work together correctly. They test interactions between modules, data flow, and combined functionality.

## Test File Structure

Integration tests are located in `tests/integration/` and follow this naming pattern:
- `[feature-name].test.js`

**Example:** `tests/integration/drag-drop.test.js`

## Basic Test Structure

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTile } from '../../js/puzzle-core.js';
import { placeTileInSlot } from '../../js/tile-operations.js';
import { updateScoreDisplay } from '../../js/scoring.js';
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Feature Integration', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM();
  });

  it('should integrate multiple modules', () => {
    // Test module interactions
  });
});
```

## Testing Module Interactions

### Drag and Drop Integration

Test that drag-drop, tile operations, and scoring work together:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTile } from '../../js/puzzle-core.js';
import { placeTileInSlot } from '../../js/tile-operations.js';
import { updateScoreDisplay } from '../../js/scoring.js';
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Drag and Drop Integration', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM();
  });

  it('should place tile and update score', () => {
    // Create tile
    const tile = createTile('S', 0, false, {
      onDragStart: () => {},
      onClick: () => {}
    });
    elements.tilesContainer.appendChild(tile);

    // Place tile in slot
    const slot = elements.slots1[0];
    placeTileInSlot(tile, slot, {
      prefix: '',
      handlers: {}
    });

    // Verify tile is in slot
    expect(slot.querySelector('.tile')).toBeTruthy();
    expect(slot.querySelector('.tile').getAttribute('data-letter')).toBe('S');

    // Update score
    updateScoreDisplay();

    // Verify score was updated
    const scoreDisplay = document.getElementById('word1-score-display');
    expect(scoreDisplay).toBeTruthy();
    expect(scoreDisplay.textContent).toContain('points');
  });
});
```

### State Management Integration

Test that state management works across modules:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { setDraggedTile, getDraggedTile, clearDraggedTile } from '../../js/puzzle-state.js';
import { createTile } from '../../js/puzzle-core.js';
import { placeTileInSlot } from '../../js/tile-operations.js';

describe('State Management Integration', () => {
  let tile;
  let slot;

  beforeEach(() => {
    const elements = createMockPuzzleDOM();
    tile = createTile('A', 0);
    slot = elements.slots1[0];
  });

  it('should track dragged tile across operations', () => {
    // Set dragged tile
    setDraggedTile(tile);
    expect(getDraggedTile()).toBe(tile);

    // Place tile
    placeTileInSlot(tile, slot, { prefix: '', handlers: {} });

    // Clear dragged tile
    clearDraggedTile();
    expect(getDraggedTile()).toBeNull();
  });
});
```

### Scoring Integration

Test that scoring integrates with tile placement:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTile } from '../../js/puzzle-core.js';
import { placeTileInSlot } from '../../js/tile-operations.js';
import { updateScoreDisplay, checkSolution } from '../../js/scoring.js';
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Scoring Integration', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM();
    // Create score displays
    const score1 = document.createElement('div');
    score1.id = 'word1-score-display';
    document.body.appendChild(score1);
    
    const score2 = document.createElement('div');
    score2.id = 'word2-score-display';
    document.body.appendChild(score2);
  });

  it('should update scores when tiles are placed', () => {
    // Place tiles for word 1
    const tiles = ['S', 'N', 'O', 'W'].map((letter, i) => {
      const tile = createTile(letter, i);
      elements.tilesContainer.appendChild(tile);
      return tile;
    });

    tiles.forEach((tile, i) => {
      placeTileInSlot(tile, elements.slots1[i], { prefix: '', handlers: {} });
    });

    // Update score
    updateScoreDisplay();

    // Verify score was calculated
    const scoreDisplay = document.getElementById('word1-score-display');
    expect(scoreDisplay.textContent).toContain('points');
  });
});
```

## Testing Event Flow

### Complete User Flow

Test a complete user interaction flow:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTile, createSlot } from '../../js/puzzle-core.js';
import { placeTileInSlot, removeTileFromSlot } from '../../js/tile-operations.js';
import { updateScoreDisplay } from '../../js/scoring.js';
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Complete User Flow', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM();
  });

  it('should handle complete puzzle solving flow', () => {
    // 1. Create tiles
    const tiles = ['S', 'N', 'O', 'W', 'M', 'A', 'N'].map((letter, i) => {
      const tile = createTile(letter, i);
      elements.tilesContainer.appendChild(tile);
      return tile;
    });

    // 2. Place tiles in word 1
    const word1Tiles = tiles.slice(0, 4);
    word1Tiles.forEach((tile, i) => {
      placeTileInSlot(tile, elements.slots1[i], { prefix: '', handlers: {} });
    });

    // 3. Place tiles in word 2
    const word2Tiles = tiles.slice(4);
    word2Tiles.forEach((tile, i) => {
      placeTileInSlot(tile, elements.slots2[i], { prefix: '', handlers: {} });
    });

    // 4. Update score
    updateScoreDisplay();

    // 5. Verify all tiles are placed
    const placedTiles1 = Array.from(elements.word1Container.querySelectorAll('.tile'));
    expect(placedTiles1).toHaveLength(4);

    const placedTiles2 = Array.from(elements.word2Container.querySelectorAll('.tile'));
    expect(placedTiles2).toHaveLength(3);

    // 6. Remove a tile
    removeTileFromSlot(elements.slots1[0], { prefix: '', handlers: {} });

    // 7. Verify tile was removed
    expect(elements.slots1[0].querySelector('.tile')).toBeNull();
  });
});
```

## Testing with Multiple Instances

### Prefix-Based Isolation

Test that multiple puzzle instances work independently:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createStateManager } from '../../js/puzzle-state.js';
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Multiple Instance Integration', () => {
  it('should isolate state between instances', () => {
    // Create state managers for different instances
    const regularState = createStateManager('');
    const archiveState = createStateManager('archive-');

    // Set different values
    regularState.setHintsRemaining(2);
    archiveState.setHintsRemaining(3);

    // Verify isolation
    expect(regularState.getHintsRemaining()).toBe(2);
    expect(archiveState.getHintsRemaining()).toBe(3);
  });
});
```

## Testing Error Handling

### Error Propagation

Test that errors are handled correctly across modules:

```javascript
import { describe, it, expect } from 'vitest';
import { updateScoreDisplay } from '../../js/scoring.js';

describe('Error Handling Integration', () => {
  it('should handle missing elements gracefully', () => {
    // No DOM setup - elements don't exist
    // Should not throw error
    expect(() => {
      updateScoreDisplay();
    }).not.toThrow();
  });
});
```

## Best Practices

### 1. Test Real Interactions

```javascript
// ✅ Good - Test actual module interactions
const tile = createTile('A', 0);
placeTileInSlot(tile, slot, context);
updateScoreDisplay();

// ❌ Bad - Mock everything
const mockTile = { letter: 'A' };
const mockPlace = vi.fn();
```

### 2. Use Real DOM

```javascript
// ✅ Good - Use DOM helpers
const elements = createMockPuzzleDOM();

// ❌ Bad - Mock DOM completely
const mockDOM = { querySelector: vi.fn() };
```

### 3. Test Complete Flows

```javascript
// ✅ Good - Test complete flow
// 1. Create
// 2. Place
// 3. Update
// 4. Verify

// ❌ Bad - Test only one step
// Just test placement
```

### 4. Verify Side Effects

```javascript
// ✅ Good - Verify all side effects
placeTileInSlot(tile, slot, context);
expect(slot.querySelector('.tile')).toBeTruthy();
expect(tilesContainer.querySelector('.tile')).toBeNull();
updateScoreDisplay();
expect(scoreDisplay.textContent).toContain('points');

// ❌ Bad - Only verify one thing
placeTileInSlot(tile, slot, context);
expect(slot.querySelector('.tile')).toBeTruthy();
```

## Running Integration Tests

```bash
# Run all integration tests
npm test tests/integration/

# Run specific test
npm test tests/integration/drag-drop.test.js

# Watch mode
npm run test:watch tests/integration/
```

## Common Patterns

### Testing Module Chains

```javascript
it('should chain module operations', () => {
  // Module A → Module B → Module C
  const resultA = moduleA.doSomething();
  const resultB = moduleB.process(resultA);
  const resultC = moduleC.finalize(resultB);
  
  expect(resultC).toBe(expected);
});
```

### Testing State Updates

```javascript
it('should update state across modules', () => {
  // Module A updates state
  moduleA.updateState(value);
  
  // Module B reads state
  const state = moduleB.getState();
  
  expect(state).toBe(value);
});
```

## Next Steps

- [Unit Testing Guide](./unit-testing.md)
- [E2E Testing Guide](./e2e-testing.md)
- [Test Utilities](./test-utilities.md)
