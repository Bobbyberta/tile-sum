import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Puzzle Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to puzzle page with test puzzle
    await page.goto('/puzzle.html?day=1&test=archive');
    // Wait for puzzle to load
    await page.waitForSelector('.tile', { timeout: 5000 });
  });

  test('should load puzzle and display tiles', async ({ page }) => {
    // Check that tiles are displayed
    const tiles = await page.locator('.tile').count();
    expect(tiles).toBeGreaterThan(0);
    
    // Check that slots are displayed
    const slots = await page.locator('.slot').count();
    expect(slots).toBeGreaterThan(0);
    
    // Quick accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should place tile in slot via drag and drop', async ({ page }) => {
    // Get first tile and first slot
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    
    // Drag tile to slot
    await tile.dragTo(slot);
    
    // Verify tile is in slot
    await expect(slot.locator('.tile')).toBeVisible();
  });

  test('should update score when tiles are placed', async ({ page }) => {
    // Get score display
    const scoreDisplay = page.locator('#word1-score-display');
    const initialScore = await scoreDisplay.textContent();
    
    // Place a tile
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await tile.dragTo(slot);
    
    // Wait for score update
    await page.waitForTimeout(100);
    
    // Score should have changed
    const newScore = await scoreDisplay.textContent();
    expect(newScore).not.toBe(initialScore);
  });

  test('should submit solution and show success modal', async ({ page }) => {
    // Place all tiles for word 1 (SNOW)
    const word1Letters = ['S', 'N', 'O', 'W'];
    const word1Slots = page.locator('[data-word-slots="0"] .slot');
    
    for (let i = 0; i < word1Letters.length; i++) {
      const letter = word1Letters[i];
      const tile = page.locator(`.tile[data-letter="${letter}"]`).first();
      const slot = word1Slots.nth(i);
      await tile.dragTo(slot);
      await page.waitForTimeout(100);
    }
    
    // Place all tiles for word 2 (FLAKE) except the last one
    // This prevents auto-complete from triggering before we can test submit button
    const word2Letters = ['F', 'L', 'A', 'K', 'E'];
    const word2Slots = page.locator('[data-word-slots="1"] .slot');
    
    for (let i = 0; i < word2Letters.length - 1; i++) {
      const letter = word2Letters[i];
      const tile = page.locator(`.tile[data-letter="${letter}"]`).first();
      const slot = word2Slots.nth(i);
      await tile.dragTo(slot);
      await page.waitForTimeout(100);
    }
    
    // Place the last tile
    const lastLetter = word2Letters[word2Letters.length - 1];
    const lastTile = page.locator(`.tile[data-letter="${lastLetter}"]`).first();
    const lastSlot = word2Slots.nth(word2Letters.length - 1);
    await lastTile.dragTo(lastSlot);
    await page.waitForTimeout(100);
    
    // Wait a bit for auto-complete check to complete (it may or may not trigger)
    await page.waitForTimeout(200);
    
    // If auto-complete triggered, the modal is already shown - verify it
    // Otherwise, click submit button
    const successModal = page.locator('#success-modal');
    const isModalVisible = await successModal.isVisible();
    
    if (!isModalVisible) {
      // Auto-complete didn't trigger, use submit button
      await page.click('#submit-btn');
    }
    
    // Wait for success modal
    await page.waitForSelector('#success-modal:not(.hidden)', { timeout: 2000 });
    
    // Verify success modal is visible
    await expect(successModal).toBeVisible();
  });

  test('should show error modal for incomplete solution', async ({ page }) => {
    // Place only some tiles
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await tile.dragTo(slot);
    
    // Click submit button
    await page.click('#submit-btn');
    
    // Wait for error modal
    await page.waitForSelector('#error-modal:not(.hidden)', { timeout: 2000 });
    
    // Verify error modal is visible
    const errorModal = page.locator('#error-modal');
    await expect(errorModal).toBeVisible();
  });

  test('should remove tile from slot when clicked', async ({ page }) => {
    // Place tile in slot
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await tile.dragTo(slot);
    
    // Verify tile is in slot
    await expect(slot.locator('.tile')).toBeVisible();
    
    // Double-click tile in slot to remove it
    await slot.locator('.tile').dblclick();
    
    // Verify tile is removed
    await expect(slot.locator('.tile')).not.toBeVisible();
  });
});
