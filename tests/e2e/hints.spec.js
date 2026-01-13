import { test, expect } from '@playwright/test';

test.describe('Hints System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/puzzle.html?day=1&test=archive');
    await page.waitForSelector('.tile', { timeout: 5000 });
  });

  test('should display hint button with correct text', async ({ page }) => {
    const hintButton = page.locator('#hint-btn');
    await expect(hintButton).toBeVisible();
    const text = await hintButton.textContent();
    expect(text).toContain('Get Hint');
    expect(text).toContain('3 left');
  });

  test('should place a tile when hint is requested', async ({ page }) => {
    // Count initial locked tiles
    const initialLockedTiles = await page.locator('.tile[data-locked="true"]').count();
    
    // Click hint button
    await page.click('#hint-btn');
    
    // Wait for hint to be placed
    await page.waitForTimeout(500);
    
    // Should have one more locked tile
    const newLockedTiles = await page.locator('.tile[data-locked="true"]').count();
    expect(newLockedTiles).toBe(initialLockedTiles + 1);
  });

  test('should decrement hint counter after using hint', async ({ page }) => {
    const hintButton = page.locator('#hint-btn');
    const initialText = await hintButton.textContent();
    
    // Use a hint
    await page.click('#hint-btn');
    await page.waitForTimeout(500);
    
    // Button text should update
    const newText = await hintButton.textContent();
    expect(newText).toContain('2 left');
    expect(newText).not.toBe(initialText);
  });

  test('should show "Show Solution?" when hints are exhausted', async ({ page }) => {
    // Use all 3 hints
    for (let i = 0; i < 3; i++) {
      await page.click('#hint-btn');
      await page.waitForTimeout(500);
    }
    
    // Button should show "Show Solution?"
    const hintButton = page.locator('#hint-btn');
    const text = await hintButton.textContent();
    expect(text).toContain('Show Solution');
  });

  test('should show solution when clicked after hints exhausted', async ({ page }) => {
    // Use all hints
    for (let i = 0; i < 3; i++) {
      await page.click('#hint-btn');
      await page.waitForTimeout(500);
    }
    
    // Click to show solution
    await page.click('#hint-btn');
    await page.waitForTimeout(1000);
    
    // All slots should be filled with locked tiles
    const slots = page.locator('.slot');
    const slotCount = await slots.count();
    
    for (let i = 0; i < slotCount; i++) {
      const slot = slots.nth(i);
      const tile = slot.locator('.tile[data-locked="true"]');
      await expect(tile).toBeVisible();
    }
  });

  test('should update score after hint is placed', async ({ page }) => {
    const scoreDisplay = page.locator('#word1-score-display');
    const initialScore = await scoreDisplay.textContent();
    
    // Use hint
    await page.click('#hint-btn');
    
    // Wait for hint to be placed and score to update
    await page.waitForTimeout(500);
    
    // Wait for score to change from initial value
    await page.waitForFunction(
      ({ selector, initial }) => {
        const element = document.querySelector(selector);
        return element && element.textContent !== initial;
      },
      { selector: '#word1-score-display', initial: initialScore },
      { timeout: 3000 }
    );
    
    // Verify score has changed
    const newScore = await scoreDisplay.textContent();
    expect(newScore).not.toBe(initialScore);
    
    // Verify score shows at least 1 point (hint places a tile with score >= 1)
    const scoreMatch = newScore.match(/(\d+)\s*\/\s*\d+\s*points/);
    expect(scoreMatch).not.toBeNull();
    const currentScore = parseInt(scoreMatch[1]);
    expect(currentScore).toBeGreaterThan(0);
  });
});
