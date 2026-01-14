# Testing Overview

This document provides an overview of the testing strategy and structure for the Sum Tile project.

## Testing Philosophy

The Sum Tile project uses a comprehensive testing strategy with multiple layers:

1. **Unit Tests**: Test individual functions and modules in isolation
2. **Integration Tests**: Test interactions between modules
3. **E2E Tests**: Test complete user flows in real browsers

## Testing Frameworks

### Vitest (Unit & Integration Tests)

- **Purpose**: Fast unit and integration testing
- **Environment**: jsdom (simulated browser environment)
- **Location**: `tests/unit/` and `tests/integration/`
- **Config**: `vitest.config.js`

**Features:**
- Fast execution
- Built-in code coverage
- Watch mode for development
- jsdom for DOM simulation

### Playwright (E2E Tests)

- **Purpose**: End-to-end browser testing
- **Browsers**: Chromium, Firefox, WebKit (Safari)
- **Location**: `tests/e2e/`
- **Config**: `playwright.config.js`

**Features:**
- Real browser testing
- Multiple browser support
- Screenshots and videos on failure
- Automatic server startup

## Test Structure

```
tests/
├── setup.js                    # Vitest setup and mocks
├── unit/                       # Unit tests for individual modules
│   ├── puzzle-core.test.js
│   ├── puzzle-state.test.js
│   ├── scoring.test.js
│   ├── utils.test.js
│   └── ...
├── integration/                # Integration tests
│   ├── drag-drop.test.js
│   └── scoring.test.js
├── e2e/                        # End-to-end tests
│   ├── puzzle-flow.spec.js
│   ├── hints.spec.js
│   └── keyboard.spec.js
└── helpers/                    # Test utilities
    ├── dom-setup.js            # DOM setup utilities
    ├── mock-data.js            # Mock data generators
    └── puzzle-fixtures.js      # Puzzle test fixtures
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/puzzle-flow.spec.js
```

### All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Coverage

### Coverage Goals

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 60%
- **Statements**: 70%

### Coverage Report

Generate coverage report:

```bash
npm run test:coverage
```

View HTML report:
- Open `coverage/index.html` in browser

### Coverage Exclusions

The following are excluded from coverage:
- `node_modules/`
- `tests/`
- Config files (`*.config.js`)
- `scripts/`
- `puzzle-data-encoded.js`
- `puzzle-data.js`
- `script.js` (orchestration file)

## Test Categories

### Unit Tests

Test individual functions and modules in isolation:

- Pure functions (no side effects)
- DOM manipulation functions
- State management functions
- Utility functions

**Example:**
```javascript
// tests/unit/utils.test.js
import { getDaySuffix } from '../../js/utils.js';

describe('getDaySuffix', () => {
  it('should return "st" for day 1', () => {
    expect(getDaySuffix(1)).toBe('st');
  });
});
```

### Integration Tests

Test interactions between modules:

- Module communication
- Event handling
- State updates across modules
- Data flow

**Example:**
```javascript
// tests/integration/drag-drop.test.js
import { createTile } from '../../js/puzzle-core.js';
import { placeTileInSlot } from '../../js/tile-operations.js';

describe('Drag and Drop Integration', () => {
  it('should place tile and update score', () => {
    // Test tile placement and score update
  });
});
```

### E2E Tests

Test complete user flows in real browsers:

- Puzzle solving flow
- Hint system
- Keyboard navigation
- Form submission
- Error handling

**Example:**
```javascript
// tests/e2e/puzzle-flow.spec.js
test('should solve puzzle successfully', async ({ page }) => {
  await page.goto('/puzzle.html?day=1&test=archive');
  // Test complete flow
});
```

## Test Helpers

### DOM Setup

`tests/helpers/dom-setup.js` provides utilities for creating mock DOM structures:

```javascript
import { createMockPuzzleDOM } from '../helpers/dom-setup.js';

const { tilesContainer, wordSlots } = createMockPuzzleDOM();
```

### Mock Data

`tests/helpers/mock-data.js` provides mock puzzle data:

```javascript
import { createMockPuzzle } from '../helpers/mock-data.js';

const puzzle = createMockPuzzle(1);
```

### Puzzle Fixtures

`tests/helpers/puzzle-fixtures.js` provides test puzzle fixtures:

```javascript
import { PUZZLE_FIXTURES } from '../helpers/puzzle-fixtures.js';

const puzzle = PUZZLE_FIXTURES[1];
```

## Test Setup

### Vitest Setup

`tests/setup.js` configures:
- localStorage mock
- jsdom environment
- Global test utilities
- Cleanup between tests

### Playwright Setup

`playwright.config.js` configures:
- Test directory
- Browser projects
- Base URL
- Web server (auto-starts local server)
- Screenshots/videos on failure

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Test One Thing**: Each test should verify one behavior
3. **Descriptive Names**: Test names should describe what they test
4. **Isolation**: Tests should not depend on each other
5. **Cleanup**: Clean up after each test

### Test Organization

- Group related tests with `describe` blocks
- Use `beforeEach` and `afterEach` for setup/teardown
- Keep tests focused and readable

### Mocking

- Mock external dependencies
- Use real implementations when possible
- Mock localStorage for state-dependent tests
- Mock DOM for unit tests

## Continuous Integration

Tests run automatically in CI/CD:

- All tests must pass
- Coverage thresholds must be met
- E2E tests run on multiple browsers
- Tests run on pull requests

## Troubleshooting

### Tests Failing Locally

1. **Check Node version**: Requires Node.js v14+
2. **Install dependencies**: Run `npm install`
3. **Build assets**: Run `npm run build:all`
4. **Clear cache**: Delete `node_modules/.cache`

### E2E Tests Failing

1. **Check server**: Ensure local server is running
2. **Check browser**: Install Playwright browsers: `npx playwright install`
3. **Check test mode**: Use `?test=archive` for test puzzles

### Coverage Issues

1. **Check exclusions**: Verify files aren't excluded
2. **Run full suite**: Ensure all tests run
3. **Check thresholds**: Verify coverage meets goals

## Next Steps

- [Unit Testing Guide](./unit-testing.md): Detailed guide for writing unit tests
- [Integration Testing Guide](./integration-testing.md): Guide for integration tests
- [E2E Testing Guide](./e2e-testing.md): Guide for E2E tests
- [Test Utilities](./test-utilities.md): Documentation for test helpers
