# E2E Testing Guide

This guide explains how to write end-to-end (E2E) tests for the Sum Tile project using Playwright.

## Overview

E2E tests verify complete user flows in real browsers. They test the application as users would interact with it, including UI interactions, navigation, and real browser behavior.

## Test File Structure

E2E tests are located in `tests/e2e/` and use `.spec.js` extension:

- `puzzle-flow.spec.js` - Puzzle solving flow
- `hints.spec.js` - Hint system
- `keyboard.spec.js` - Keyboard navigation

## Basic Test Structure

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/puzzle.html?day=1&test=archive');
    await page.waitForSelector('.tile');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    const tile = page.locator('.tile').first();
    await expect(tile).toBeVisible();
  });
});
```

## Test Setup

### Before Each Test

```javascript
test.beforeEach(async ({ page }) => {
  // Navigate to puzzle page with test mode
  await page.goto('/puzzle.html?day=1&test=archive');
  
  // Wait for puzzle to load
  await page.waitForSelector('.tile', { timeout: 5000 });
});
```

### Using Test Mode

Always use `?test=archive` for E2E tests to:
- Enable test puzzles
- Bypass date restrictions
- Ensure consistent test environment

## Common Test Patterns

### Testing Element Visibility

```javascript
test('should display puzzle elements', async ({ page }) => {
  // Check tiles are visible
  const tiles = page.locator('.tile');
  await expect(tiles.first()).toBeVisible();
  await expect(tiles).toHaveCount(8); // Expected number of tiles
  
  // Check slots are visible
  const slots = page.locator('.slot');
  await expect(slots.first()).toBeVisible();
});
```

### Testing Drag and Drop

```javascript
test('should place tile in slot via drag and drop', async ({ page }) => {
  const tile = page.locator('.tile').first();
  const slot = page.locator('[data-word-slots="0"] .slot').first();
  
  // Drag tile to slot
  await tile.dragTo(slot);
  
  // Verify tile is in slot
  await expect(slot.locator('.tile')).toBeVisible();
  
  // Verify tile is removed from tiles container
  const tilesInContainer = await page.locator('#tiles-container .tile').count();
  expect(tilesInContainer).toBeLessThan(8); // One less tile
});
```

### Testing Click Interactions

```javascript
test('should place tile on click', async ({ page }) => {
  const tile = page.locator('.tile').first();
  const slot = page.locator('[data-word-slots="0"] .slot').first();
  
  // Click tile, then click slot
  await tile.click();
  await slot.click();
  
  // Verify tile is in slot
  await expect(slot.locator('.tile')).toBeVisible();
});
```

### Testing Form Submission

```javascript
test('should submit solution', async ({ page }) => {
  // Fill puzzle
  const tiles = page.locator('.tile');
  const slots = page.locator('.slot');
  
  // Place all tiles
  for (let i = 0; i < 8; i++) {
    await tiles.nth(i).dragTo(slots.nth(i));
  }
  
  // Submit
  await page.locator('#submit-btn').click();
  
  // Verify success modal
  await expect(page.locator('.success-modal')).toBeVisible();
});
```

### Testing Keyboard Navigation

```javascript
test('should navigate with keyboard', async ({ page }) => {
  // Focus first tile
  await page.locator('.tile').first().focus();
  
  // Press Enter to select
  await page.keyboard.press('Enter');
  
  // Tab to slot
  await page.keyboard.press('Tab');
  
  // Press Enter to place
  await page.keyboard.press('Enter');
  
  // Verify tile is placed
  const slot = page.locator('[data-word-slots="0"] .slot').first();
  await expect(slot.locator('.tile')).toBeVisible();
});
```

### Testing Hints

```javascript
test('should provide hint', async ({ page }) => {
  const hintBtn = page.locator('#hint-btn');
  const initialText = await hintBtn.textContent();
  
  // Click hint button
  await hintBtn.click();
  
  // Wait for hint to appear
  await page.waitForTimeout(500);
  
  // Verify hint button text changed
  const newText = await hintBtn.textContent();
  expect(newText).not.toBe(initialText);
  
  // Verify hint is displayed (check for revealed letter or position)
  const revealed = page.locator('.hint-revealed');
  await expect(revealed).toBeVisible();
});
```

### Testing Score Updates

```javascript
test('should update score when tiles are placed', async ({ page }) => {
  const scoreDisplay = page.locator('#word1-score-display');
  const initialScore = await scoreDisplay.textContent();
  
  // Place a tile
  const tile = page.locator('.tile').first();
  const slot = page.locator('[data-word-slots="0"] .slot').first();
  await tile.dragTo(slot);
  
  // Wait for score update
  await page.waitForTimeout(100);
  
  // Verify score changed
  const newScore = await scoreDisplay.textContent();
  expect(newScore).not.toBe(initialScore);
});
```

## Waiting for Elements

### Explicit Waits

```javascript
// Wait for element to appear
await page.waitForSelector('.tile', { timeout: 5000 });

// Wait for element to be visible
await page.waitForSelector('.tile', { state: 'visible' });

// Wait for element to be hidden
await page.waitForSelector('.loading', { state: 'hidden' });
```

### Implicit Waits

```javascript
// Playwright auto-waits for most actions
await page.locator('.tile').click(); // Waits for element automatically
await page.locator('.tile').fill('text'); // Waits automatically
```

### Custom Waits

```javascript
// Wait for condition
await page.waitForFunction(() => {
  return document.querySelectorAll('.tile').length === 8;
});

// Wait for timeout (use sparingly)
await page.waitForTimeout(500);
```

## Assertions

### Element Assertions

```javascript
// Visibility
await expect(page.locator('.tile')).toBeVisible();
await expect(page.locator('.hidden')).toBeHidden();

// Count
await expect(page.locator('.tile')).toHaveCount(8);

// Text content
await expect(page.locator('h1')).toHaveText('Puzzle #1');

// Attributes
await expect(page.locator('.tile')).toHaveAttribute('data-letter', 'A');

// CSS classes
await expect(page.locator('.tile')).toHaveClass(/bg-indigo-600/);
```

### State Assertions

```javascript
// Check if element is enabled/disabled
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button:disabled')).toBeDisabled();

// Check if checkbox is checked
await expect(page.locator('input[type="checkbox"]')).toBeChecked();
```

## Multiple Browsers

Playwright runs tests on multiple browsers by default:

```javascript
// Tests run on:
// - Chromium (Chrome)
// - Firefox
// - WebKit (Safari)
```

To run on specific browser:

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Screenshots and Videos

Playwright automatically captures:
- Screenshots on failure
- Videos on failure (if configured)

View in `test-results/` directory.

## Debugging E2E Tests

### Playwright UI Mode

```bash
npm run test:e2e:ui
```

Interactive UI for:
- Running tests
- Debugging
- Time travel
- Element inspection

### Debug Mode

```javascript
test('debug test', async ({ page }) => {
  await page.pause(); // Pauses execution, opens inspector
});
```

### Screenshots

```javascript
test('take screenshot', async ({ page }) => {
  await page.goto('/puzzle.html?day=1&test=archive');
  await page.screenshot({ path: 'screenshot.png' });
});
```

## Best Practices

### 1. Use Test Mode

Always use `?test=archive` for consistent tests:

```javascript
await page.goto('/puzzle.html?day=1&test=archive');
```

### 2. Wait for Elements

Don't rely on fixed timeouts:

```javascript
// ✅ Good
await page.waitForSelector('.tile');

// ❌ Bad
await page.waitForTimeout(1000);
```

### 3. Use Locators

Use Playwright locators for reliable element selection:

```javascript
// ✅ Good
const tile = page.locator('.tile').first();

// ❌ Bad
const tile = await page.$('.tile');
```

### 4. Test User Flows

Test complete user journeys:

```javascript
test('should solve puzzle completely', async ({ page }) => {
  // Navigate
  await page.goto('/puzzle.html?day=1&test=archive');
  
  // Place tiles
  // ... place all tiles ...
  
  // Submit
  await page.locator('#submit-btn').click();
  
  // Verify success
  await expect(page.locator('.success-modal')).toBeVisible();
});
```

### 5. Isolate Tests

Each test should be independent:

```javascript
test.beforeEach(async ({ page }) => {
  // Reset state before each test
  await page.goto('/puzzle.html?day=1&test=archive');
});
```

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test tests/e2e/puzzle-flow.spec.js

# Run on specific browser
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed
```

## Common Issues

### Tests Timing Out

- Increase timeout: `test.setTimeout(30000)`
- Check if server is running
- Verify selectors are correct

### Elements Not Found

- Use `waitForSelector` before interacting
- Check selector is correct
- Verify element is visible (not hidden)

### Flaky Tests

- Use explicit waits instead of timeouts
- Wait for network requests to complete
- Check for race conditions

## Next Steps

- [Unit Testing Guide](./unit-testing.md)
- [Integration Testing Guide](./integration-testing.md)
- [Test Utilities](./test-utilities.md)
