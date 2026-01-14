# Unit Testing Guide

This guide explains how to write unit tests for the Sum Tile project using Vitest.

## Overview

Unit tests verify individual functions and modules work correctly in isolation. They use Vitest with jsdom to simulate a browser environment.

## Test File Structure

Unit tests are located in `tests/unit/` and follow this naming pattern:
- `[module-name].test.js`

**Example:** `tests/unit/utils.test.js`

## Basic Test Structure

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { functionToTest } from '../../js/module-name.js';

describe('module-name.js', () => {
  describe('functionToTest', () => {
    beforeEach(() => {
      // Setup before each test
    });

    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Testing Pure Functions

Pure functions (no side effects) are easiest to test:

```javascript
import { describe, it, expect } from 'vitest';
import { getDaySuffix } from '../../js/utils.js';

describe('getDaySuffix', () => {
  it('should return "st" for day 1', () => {
    expect(getDaySuffix(1)).toBe('st');
  });

  it('should return "nd" for day 2', () => {
    expect(getDaySuffix(2)).toBe('nd');
  });

  it('should handle edge cases', () => {
    expect(getDaySuffix(11)).toBe('th'); // Special case
    expect(getDaySuffix(21)).toBe('st');
  });
});
```

## Testing DOM Functions

For functions that manipulate the DOM, use test helpers:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTile } from '../../js/puzzle-core.js';
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('createTile', () => {
  beforeEach(() => {
    createMockPuzzleDOM();
  });

  it('should create a tile element', () => {
    const tile = createTile('A', 0);
    
    expect(tile).toBeInstanceOf(HTMLElement);
    expect(tile.getAttribute('data-letter')).toBe('A');
    expect(tile.getAttribute('data-tile-index')).toBe('0');
  });

  it('should set draggable attribute', () => {
    const tile = createTile('A', 0, false);
    expect(tile.getAttribute('draggable')).toBe('true');
    
    const lockedTile = createTile('A', 0, true);
    expect(lockedTile.getAttribute('draggable')).toBe('false');
  });
});
```

## Testing State Management

For state management functions, test state changes:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  setHintsRemaining,
  getHintsRemaining,
  decrementHintsRemaining
} from '../../js/puzzle-state.js';

describe('puzzle-state.js', () => {
  beforeEach(() => {
    // Reset state before each test
    setHintsRemaining(3);
  });

  it('should get and set hints remaining', () => {
    setHintsRemaining(2);
    expect(getHintsRemaining()).toBe(2);
  });

  it('should decrement hints remaining', () => {
    setHintsRemaining(3);
    decrementHintsRemaining();
    expect(getHintsRemaining()).toBe(2);
  });

  it('should not go below 0', () => {
    setHintsRemaining(0);
    decrementHintsRemaining();
    expect(getHintsRemaining()).toBe(0);
  });
});
```

## Testing with Mocks

Use mocks for external dependencies:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debugLog } from '../../js/utils.js';

describe('debugLog', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should log in test mode', () => {
    // Mock window.location for test mode
    Object.defineProperty(window, 'location', {
      value: { search: '?test=archive' },
      writable: true
    });

    debugLog('Test message');
    expect(consoleSpy).toHaveBeenCalledWith('Test message');
  });
});
```

## Testing Event Handlers

For event handlers, simulate events:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTile } from '../../js/puzzle-core.js';

describe('Tile event handlers', () => {
  let tile;
  let clickHandler;

  beforeEach(() => {
    clickHandler = vi.fn();
    tile = createTile('A', 0, false, {
      onClick: clickHandler
    });
    document.body.appendChild(tile);
  });

  it('should call onClick handler when clicked', () => {
    tile.click();
    expect(clickHandler).toHaveBeenCalled();
  });
});
```

## Testing with localStorage

The test setup provides a localStorage mock:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { markPuzzleCompleted, isPuzzleCompleted } from '../../js/completion.js';

describe('completion.js', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should mark puzzle as completed', () => {
    markPuzzleCompleted(1);
    expect(isPuzzleCompleted(1)).toBe(true);
  });
});
```

## Test Patterns

### Testing Multiple Cases

```javascript
describe('getDaySuffix', () => {
  const testCases = [
    [1, 'st'],
    [2, 'nd'],
    [3, 'rd'],
    [4, 'th'],
    [11, 'th'], // Special case
    [21, 'st']
  ];

  testCases.forEach(([day, expected]) => {
    it(`should return "${expected}" for day ${day}`, () => {
      expect(getDaySuffix(day)).toBe(expected);
    });
  });
});
```

### Testing Error Cases

```javascript
describe('functionWithValidation', () => {
  it('should handle invalid input', () => {
    expect(() => functionWithValidation(null)).toThrow();
  });

  it('should return null for missing element', () => {
    const result = functionThatQueriesDOM('non-existent-id');
    expect(result).toBeNull();
  });
});
```

### Testing Async Functions

```javascript
describe('asyncFunction', () => {
  it('should resolve with correct value', async () => {
    const result = await asyncFunction();
    expect(result).toBe('expected');
  });

  it('should reject on error', async () => {
    await expect(asyncFunctionWithError()).rejects.toThrow();
  });
});
```

## Using Test Helpers

### DOM Setup Helper

```javascript
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Puzzle DOM', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM('daily-');
  });

  it('should create puzzle structure', () => {
    expect(elements.tilesContainer).toBeTruthy();
    expect(elements.wordSlots).toBeTruthy();
  });
});
```

### Mock Data Helper

```javascript
import { createMockPuzzle } from '../helpers/mock-data.js';

describe('Puzzle processing', () => {
  it('should process puzzle data', () => {
    const puzzle = createMockPuzzle(1);
    expect(puzzle.words).toHaveLength(2);
  });
});
```

## Best Practices

### 1. Test One Thing

```javascript
// ✅ Good - One assertion per test
it('should return "st" for day 1', () => {
  expect(getDaySuffix(1)).toBe('st');
});

// ❌ Bad - Multiple unrelated assertions
it('should handle all suffixes', () => {
  expect(getDaySuffix(1)).toBe('st');
  expect(getDaySuffix(2)).toBe('nd');
  expect(getDaySuffix(3)).toBe('rd');
});
```

### 2. Use Descriptive Names

```javascript
// ✅ Good
it('should return "th" for days 11, 12, 13', () => {
  // ...
});

// ❌ Bad
it('should work', () => {
  // ...
});
```

### 3. Arrange-Act-Assert

```javascript
it('should calculate word score', () => {
  // Arrange
  const word = 'WORD';
  
  // Act
  const score = calculateWordScore(word);
  
  // Assert
  expect(score).toBe(8);
});
```

### 4. Clean Up

```javascript
beforeEach(() => {
  // Setup
  document.body.innerHTML = '';
  localStorage.clear();
});

afterEach(() => {
  // Cleanup (if needed)
  vi.clearAllMocks();
});
```

### 5. Test Edge Cases

```javascript
describe('getDaySuffix', () => {
  it('should handle normal cases', () => {
    // Test 1-10, 20-31
  });

  it('should handle special cases (11, 12, 13)', () => {
    expect(getDaySuffix(11)).toBe('th');
    expect(getDaySuffix(12)).toBe('th');
    expect(getDaySuffix(13)).toBe('th');
  });

  it('should handle boundary values', () => {
    expect(getDaySuffix(1)).toBe('st');
    expect(getDaySuffix(31)).toBe('st');
  });
});
```

## Running Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Run specific test file
npm test tests/unit/utils.test.js

# Run with coverage
npm run test:coverage
```

## Common Issues

### Tests Not Finding Modules

- Check import paths (relative to test file)
- Ensure module exports are correct
- Check `vitest.config.js` for path aliases

### DOM Not Available

- Ensure `jsdom` environment is set (in `vitest.config.js`)
- Use `createMockPuzzleDOM()` helper for DOM setup
- Check `tests/setup.js` for DOM configuration

### localStorage Issues

- Use `localStorage.clear()` in `beforeEach`
- Check `tests/setup.js` for localStorage mock
- Ensure localStorage mock is working

## Next Steps

- [Integration Testing Guide](./integration-testing.md)
- [E2E Testing Guide](./e2e-testing.md)
- [Test Utilities](./test-utilities.md)
