# Test Utilities

This document describes the test utilities and helpers available for writing tests.

## Test Helpers Location

Test helpers are located in `tests/helpers/`:

- `dom-setup.js` - DOM setup utilities
- `mock-data.js` - Mock data generators
- `puzzle-fixtures.js` - Puzzle test fixtures

## DOM Setup Utilities

### `createMockPuzzleDOM(prefix)`

Creates a mock puzzle DOM structure for testing.

**Parameters:**
- `prefix` (string, optional): Prefix for element IDs. Default: `''`

**Returns:**
- `Object`: Object containing references to created elements:
  - `tilesContainer` (HTMLElement): Container for tiles
  - `wordSlots` (HTMLElement): Container for word slots
  - `word1Container` (HTMLElement): Container for word 1
  - `word2Container` (HTMLElement): Container for word 2
  - `slots1` (NodeList): Slots for word 1
  - `slots2` (NodeList): Slots for word 2

**Example:**
```javascript
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Puzzle DOM', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM('daily-');
  });

  it('should create puzzle structure', () => {
    expect(elements.tilesContainer.id).toBe('daily-tiles-container');
    expect(elements.wordSlots.id).toBe('daily-word-slots');
  });
});
```

**Structure Created:**
- Tiles container with ID `${prefix}tiles-container`
- Word slots container with ID `${prefix}word-slots` (or `word-slots` if no prefix)
- Two word containers with slots
- Slots for word 1 (4 slots for "SNOW")
- Slots for word 2 (4 slots for "MAN")

## Mock Data Utilities

### `createMockPuzzle(day)`

Creates mock puzzle data for testing.

**Parameters:**
- `day` (number): Puzzle number

**Returns:**
- `Object`: Mock puzzle object with `words` and `solution` arrays

**Example:**
```javascript
import { createMockPuzzle } from '../helpers/mock-data.js';

describe('Puzzle processing', () => {
  it('should process puzzle data', () => {
    const puzzle = createMockPuzzle(1);
    expect(puzzle.words).toHaveLength(2);
    expect(puzzle.solution).toHaveLength(2);
  });
});
```

## Puzzle Fixtures

### `PUZZLE_FIXTURES`

Pre-defined puzzle fixtures for testing.

**Example:**
```javascript
import { PUZZLE_FIXTURES } from '../helpers/puzzle-fixtures.js';

describe('Puzzle validation', () => {
  it('should validate puzzle fixture', () => {
    const puzzle = PUZZLE_FIXTURES[1];
    expect(puzzle.words).toEqual(['SNOW', 'MAN']);
  });
});
```

## Test Setup

### Vitest Setup (`tests/setup.js`)

The setup file provides:

#### localStorage Mock

```javascript
// localStorage is automatically mocked
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key'); // 'value'
```

#### DOM Cleanup

```javascript
// DOM is automatically cleaned after each test
afterEach(() => {
  document.body.innerHTML = '';
});
```

#### Mock Reset

```javascript
// Mocks are automatically reset before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
```

## Usage Patterns

### Setting Up DOM for Tests

```javascript
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

describe('Feature', () => {
  let elements;

  beforeEach(() => {
    elements = createMockPuzzleDOM();
    // Now you can test with real DOM structure
  });

  it('should work with DOM', () => {
    const tile = createTile('A', 0);
    elements.tilesContainer.appendChild(tile);
    expect(elements.tilesContainer.querySelector('.tile')).toBeTruthy();
  });
});
```

### Testing with Mock Data

```javascript
import { createMockPuzzle } from '../helpers/mock-data.js';

describe('Puzzle processing', () => {
  it('should process puzzle', () => {
    const puzzle = createMockPuzzle(1);
    const result = processPuzzle(puzzle);
    expect(result).toBeDefined();
  });
});
```

### Testing with Fixtures

```javascript
import { PUZZLE_FIXTURES } from '../helpers/puzzle-fixtures.js';

describe('Puzzle validation', () => {
  Object.keys(PUZZLE_FIXTURES).forEach(day => {
    it(`should validate puzzle ${day}`, () => {
      const puzzle = PUZZLE_FIXTURES[day];
      expect(validatePuzzle(puzzle)).toBe(true);
    });
  });
});
```

## Creating Custom Helpers

### Example: Custom DOM Helper

```javascript
// tests/helpers/custom-dom.js
export function createCustomDOM() {
  document.body.innerHTML = '';
  
  const container = document.createElement('div');
  container.id = 'custom-container';
  document.body.appendChild(container);
  
  return { container };
}
```

### Example: Custom Mock Data

```javascript
// tests/helpers/custom-mocks.js
export function createMockState() {
  return {
    hintsRemaining: 3,
    solutionShown: false,
    selectedTile: null
  };
}
```

## Best Practices

### 1. Use Helpers for Setup

```javascript
// ✅ Good - Use helper
const elements = createMockPuzzleDOM();

// ❌ Bad - Manual setup
document.body.innerHTML = '<div id="tiles-container"></div>';
```

### 2. Clean Up After Tests

```javascript
// ✅ Good - Cleanup is automatic via setup.js
// But you can also clean up manually if needed
afterEach(() => {
  document.body.innerHTML = '';
});
```

### 3. Use Fixtures for Consistent Data

```javascript
// ✅ Good - Use fixture
const puzzle = PUZZLE_FIXTURES[1];

// ❌ Bad - Hard-coded data
const puzzle = { words: ['TEST', 'DATA'] };
```

### 4. Test with Real DOM Structure

```javascript
// ✅ Good - Use DOM helper
const elements = createMockPuzzleDOM();
const tile = createTile('A', 0);
elements.tilesContainer.appendChild(tile);

// ❌ Bad - Mock everything
const tile = { element: 'div', letter: 'A' };
```

## Troubleshooting

### Helper Not Found

- Check import path (relative to test file)
- Verify helper file exists
- Check export statement in helper file

### DOM Not Set Up

- Call `createMockPuzzleDOM()` in `beforeEach`
- Check if DOM is cleared in `afterEach`
- Verify helper is working correctly

### Mock Data Issues

- Check mock data structure matches real data
- Verify mock data is valid
- Check if mock data needs updating

## Next Steps

- [Unit Testing Guide](./unit-testing.md)
- [Integration Testing Guide](./integration-testing.md)
- [E2E Testing Guide](./e2e-testing.md)
