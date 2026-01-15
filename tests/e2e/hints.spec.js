import { test, expect } from '@playwright/test';

test.describe('Hints System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'load' });
    // Wait for tiles container to exist first, then wait for tiles to be created
    await page.waitForSelector('#tiles-container', { timeout: 5000 });
    await page.waitForSelector('.tile', { timeout: 5000 });
  });

  test('should display hint button with correct text', async ({ page }) => {
    const hintButton = page.locator('#hint-btn');
    await expect(hintButton).toBeVisible();
    const text = await hintButton.textContent();
    expect(text).toContain('Get Hint');
    expect(text).toContain('9 left'); // SNOW (4) + FLAKE (5) = 9
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
    expect(newText).toContain('8 left'); // 9 - 1 = 8
    expect(newText).not.toBe(initialText);
  });

  test('should show "All hints have been used" message when hint button clicked with no hints remaining', async ({ page }) => {
    // Use all 9 hints (SNOW + FLAKE = 9 letters)
    for (let i = 0; i < 9; i++) {
      await page.click('#hint-btn');
      await page.waitForTimeout(500);
    }
    
    // Button should show "Get Hint (0 left)" and be disabled
    const hintButton = page.locator('#hint-btn');
    const text = await hintButton.textContent();
    expect(text).toContain('Get Hint (0 left)');
    await expect(hintButton).toBeDisabled();
    
    // Click hint button again (should show feedback)
    await page.click('#hint-btn');
    await page.waitForTimeout(500);
    
    // Check for feedback message
    const feedback = page.locator('#feedback');
    await expect(feedback).toBeVisible();
    const feedbackText = await feedback.textContent();
    expect(feedbackText).toContain('All hints have been used');
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
