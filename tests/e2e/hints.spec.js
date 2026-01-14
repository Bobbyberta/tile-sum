import { test, expect } from '@playwright/test';

test.describe('Hints System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'networkidle' });
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
    const word1ScoreDisplay = page.locator('#word1-score-display');
    const word2ScoreDisplay = page.locator('#word2-score-display');
    const initialWord1Score = await word1ScoreDisplay.textContent();
    const initialWord2Score = await word2ScoreDisplay.textContent();
    
    // Use hint
    await page.click('#hint-btn');
    
    // Wait for hint to be placed and score to update
    await page.waitForTimeout(500);
    
    // Wait for either score to change from initial value (hint can place in word 1 or word 2)
    await page.waitForFunction(
      ({ initial1, initial2 }) => {
        const element1 = document.querySelector('#word1-score-display');
        const element2 = document.querySelector('#word2-score-display');
        return (element1 && element1.textContent !== initial1) || 
               (element2 && element2.textContent !== initial2);
      },
      { initial1: initialWord1Score, initial2: initialWord2Score },
      { timeout: 3000 }
    );
    
    // Verify at least one score has changed
    const newWord1Score = await word1ScoreDisplay.textContent();
    const newWord2Score = await word2ScoreDisplay.textContent();
    const word1Changed = newWord1Score !== initialWord1Score;
    const word2Changed = newWord2Score !== initialWord2Score;
    
    expect(word1Changed || word2Changed).toBe(true);
    
    // Verify the changed score shows at least 1 point (hint places a tile with score >= 1)
    if (word1Changed) {
      const scoreMatch = newWord1Score.match(/(\d+)\s*\/\s*\d+\s*points/);
      expect(scoreMatch).not.toBeNull();
      const currentScore = parseInt(scoreMatch[1]);
      expect(currentScore).toBeGreaterThan(0);
    }
    if (word2Changed) {
      const scoreMatch = newWord2Score.match(/(\d+)\s*\/\s*\d+\s*points/);
      expect(scoreMatch).not.toBeNull();
      const currentScore = parseInt(scoreMatch[1]);
      expect(currentScore).toBeGreaterThan(0);
    }
  });
});
