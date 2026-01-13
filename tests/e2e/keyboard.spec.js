import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/puzzle.html?day=1&test=archive');
    await page.waitForSelector('.tile', { timeout: 5000 });
  });

  test('should navigate tiles with arrow keys', async ({ page }) => {
    // Focus first tile
    await page.locator('.tile').first().focus();
    
    // Press right arrow
    await page.keyboard.press('ArrowRight');
    
    // Second tile should be focused
    const secondTile = page.locator('.tile').nth(1);
    await expect(secondTile).toBeFocused();
  });

  test('should select tile with Enter key', async ({ page }) => {
    // Focus first tile
    const tile = page.locator('.tile').first();
    await tile.focus();
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    
    // Tile should have selected class
    await expect(tile).toHaveClass(/ring-4/);
  });

  test('should place selected tile in slot with Enter', async ({ page }) => {
    // Select first tile
    const tile = page.locator('.tile').first();
    await tile.focus();
    await page.keyboard.press('Enter');
    
    // Focus first slot
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await slot.focus();
    
    // Press Enter to place tile
    await page.keyboard.press('Enter');
    
    // Verify tile is in slot
    await expect(slot.locator('.tile')).toBeVisible();
  });

  test('should navigate slots with Tab key', async ({ page }) => {
    // Focus first slot
    const firstSlot = page.locator('[data-word-slots="0"] .slot').first();
    await firstSlot.focus();
    
    // Press Tab
    await page.keyboard.press('Tab');
    
    // Second slot should be focused
    const secondSlot = page.locator('[data-word-slots="0"] .slot').nth(1);
    await expect(secondSlot).toBeFocused();
  });

  test('should remove tile from slot with Backspace', async ({ page }) => {
    // Place tile in slot via drag
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await tile.dragTo(slot);
    
    // Verify tile is in slot
    await expect(slot.locator('.tile')).toBeVisible();
    
    // Focus slot and press Backspace
    await slot.focus();
    await page.keyboard.press('Backspace');
    
    // Verify tile is removed
    await expect(slot.locator('.tile')).not.toBeVisible();
  });

  test('should navigate between tiles and slots', async ({ page }) => {
    // Focus first tile
    const firstTile = page.locator('.tile').first();
    await firstTile.focus();
    
    // Press Enter to select tile
    await page.keyboard.press('Enter');
    
    // Verify tile is selected (has ring-4 class)
    await expect(firstTile).toHaveClass(/ring-4/);
    
    // Navigate to first slot using Tab
    await page.keyboard.press('Tab');
    
    // Verify tile remains focused (not the slot)
    await expect(firstTile).toBeFocused();
    
    // Verify tile is still selected
    await expect(firstTile).toHaveClass(/ring-4/);
  });
});
