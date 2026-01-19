import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'load' });
    // Wait for tiles container to exist first, then wait for tiles to be created
    await page.waitForSelector('#tiles-container', { timeout: 5000 });
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
    
    // Tile should have pink selection classes
    await expect(tile).toHaveClass(/ring-pink-500/);
    await expect(tile).toHaveClass(/tile-selected/);
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
    
    // Focus the tile inside the slot (slot becomes non-interactive when filled)
    const tileInSlot = slot.locator('.tile');
    await tileInSlot.focus();
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
    
    // Verify tile is selected (has pink selection classes)
    await expect(firstTile).toHaveClass(/tile-selected/);
    
    // Press Tab to navigate to next tile
    await page.keyboard.press('Tab');
    
    // Verify focus moved to next tile (not the selected tile)
    const secondTile = page.locator('.tile').nth(1);
    await expect(secondTile).toBeFocused();
    
    // Verify first tile is still selected
    await expect(firstTile).toHaveClass(/tile-selected/);
  });

  test('should select placed tile with Enter', async ({ page }) => {
    // Place a tile in slot via drag
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await tile.dragTo(slot);
    
    // Wait for tile to be placed
    await expect(slot.locator('.tile')).toBeVisible();
    
    // Focus the tile in the slot
    const tileInSlot = slot.locator('.tile');
    await tileInSlot.focus();
    
    // Press Enter to select the placed tile
    await page.keyboard.press('Enter');
    
    // Verify tile is selected (has pink selection classes)
    await expect(tileInSlot).toHaveClass(/tile-selected/);
  });

  test('should swap tiles when placing selected tile on placed tile', async ({ page }) => {
    // Select first tile
    const firstTile = page.locator('.tile').first();
    await firstTile.focus();
    await page.keyboard.press('Enter');
    
    // Verify first tile is selected
    await expect(firstTile).toHaveClass(/tile-selected/);
    
    // Get the letter of the first tile
    const firstTileLetter = await firstTile.getAttribute('data-letter');
    
    // Place second tile in slot via drag
    const secondTile = page.locator('.tile').nth(1);
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await secondTile.dragTo(slot);
    
    // Wait for tile to be placed
    await expect(slot.locator('.tile')).toBeVisible();
    
    // Get the letter of the second tile
    const secondTileLetter = await secondTile.getAttribute('data-letter');
    
    // Focus the tile in the slot
    const tileInSlot = slot.locator('.tile');
    await tileInSlot.focus();
    
    // Press Enter to place selected tile (should swap)
    await page.keyboard.press('Enter');
    
    // Wait for swap to complete
    await page.waitForTimeout(100);
    
    // Verify the first tile is now in the slot
    const tileInSlotAfter = slot.locator('.tile');
    const tileInSlotLetter = await tileInSlotAfter.getAttribute('data-letter');
    expect(tileInSlotLetter).toBe(firstTileLetter);
    
    // Verify first tile is no longer selected
    await expect(firstTile).not.toHaveClass(/tile-selected/);
  });

  test('should select tile in slot when Enter pressed on slot with tile', async ({ page }) => {
    // Place a tile in slot via drag
    const tile = page.locator('.tile').first();
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await tile.dragTo(slot);
    
    // Wait for tile to be placed
    await expect(slot.locator('.tile')).toBeVisible();
    
    // When a slot has a tile, the slot becomes non-interactive and the tile is focusable
    // Focus the tile in the slot (not the slot itself, as it's non-interactive)
    const tileInSlot = slot.locator('.tile');
    await tileInSlot.focus();
    
    // Press Enter to select the tile
    await page.keyboard.press('Enter');
    
    // Verify tile is selected (has pink selection classes)
    await expect(tileInSlot).toHaveClass(/tile-selected/);
  });

  test('should deselect tile when Enter pressed on already selected tile', async ({ page }) => {
    // Select first tile
    const tile = page.locator('.tile').first();
    await tile.focus();
    await page.keyboard.press('Enter');
    
    // Verify tile is selected
    await expect(tile).toHaveClass(/tile-selected/);
    
    // Press Enter again on the same tile
    await page.keyboard.press('Enter');
    
    // Verify tile is no longer selected
    await expect(tile).not.toHaveClass(/tile-selected/);
  });

  test('should navigate between words with Arrow Up/Down', async ({ page }) => {
    // Focus first tile in container
    const firstTile = page.locator('.tile').first();
    await firstTile.focus();
    
    // Press ArrowDown to navigate to first word
    await page.keyboard.press('ArrowDown');
    
    // Should focus first slot in word 0
    const firstSlot = page.locator('[data-word-slots="0"] .slot').first();
    await expect(firstSlot).toBeFocused();
    
    // Press ArrowDown again to navigate to second word
    await page.keyboard.press('ArrowDown');
    
    // Should focus first slot in word 1
    const firstSlotWord1 = page.locator('[data-word-slots="1"] .slot').first();
    await expect(firstSlotWord1).toBeFocused();
    
    // Press ArrowUp to go back to word 0
    await page.keyboard.press('ArrowUp');
    await expect(firstSlot).toBeFocused();
    
    // Press ArrowUp again to go back to tiles container
    await page.keyboard.press('ArrowUp');
    await expect(firstTile).toBeFocused();
  });

  test('should navigate within row with Arrow Left/Right', async ({ page }) => {
    // Focus first tile in container
    const firstTile = page.locator('.tile').first();
    await firstTile.focus();
    
    // Press ArrowRight to navigate to next tile in container
    await page.keyboard.press('ArrowRight');
    
    // Should focus second tile
    const secondTile = page.locator('.tile').nth(1);
    await expect(secondTile).toBeFocused();
    
    // Press ArrowLeft to go back
    await page.keyboard.press('ArrowLeft');
    await expect(firstTile).toBeFocused();
  });

  test('should show pink border on selected tile', async ({ page }) => {
    // Select first tile
    const tile = page.locator('.tile').first();
    await tile.focus();
    await page.keyboard.press('Enter');
    
    // Verify tile has pink selection border (ring-pink-500 and tile-selected classes)
    await expect(tile).toHaveClass(/ring-pink-500/);
    await expect(tile).toHaveClass(/tile-selected/);
  });

  test('should remove pink border when tile is placed', async ({ page }) => {
    // Select first tile
    const tile = page.locator('.tile').first();
    await tile.focus();
    await page.keyboard.press('Enter');
    
    // Verify tile has pink border
    await expect(tile).toHaveClass(/tile-selected/);
    
    // Place tile in slot
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await slot.focus();
    await page.keyboard.press('Enter');
    
    // Wait for placement
    await page.waitForTimeout(100);
    
    // Verify tile no longer has pink border (selection cleared)
    await expect(tile).not.toHaveClass(/tile-selected/);
  });

  test('should move pink border when another tile is selected', async ({ page }) => {
    // Select first tile
    const firstTile = page.locator('.tile').first();
    await firstTile.focus();
    await page.keyboard.press('Enter');
    
    // Verify first tile has pink border
    await expect(firstTile).toHaveClass(/tile-selected/);
    
    // Select second tile
    const secondTile = page.locator('.tile').nth(1);
    await secondTile.focus();
    await page.keyboard.press('Enter');
    
    // Verify first tile no longer has pink border
    await expect(firstTile).not.toHaveClass(/tile-selected/);
    
    // Verify second tile has pink border
    await expect(secondTile).toHaveClass(/tile-selected/);
  });

  test('should navigate to hint and submit buttons with Tab', async ({ page }) => {
    // Focus last slot
    const slots = page.locator('.slot');
    const lastSlot = slots.last();
    await lastSlot.focus();
    
    // Press Tab to navigate to hint button
    await page.keyboard.press('Tab');
    
    // Should focus hint button (if not disabled)
    const hintBtn = page.locator('#hint-btn');
    const isDisabled = await hintBtn.getAttribute('disabled');
    if (!isDisabled) {
      await expect(hintBtn).toBeFocused();
      
      // Press Tab again to navigate to submit button
      await page.keyboard.press('Tab');
      const submitBtn = page.locator('#submit-btn');
      await expect(submitBtn).toBeFocused();
    } else {
      // If hint is disabled, Tab should go directly to submit button
      const submitBtn = page.locator('#submit-btn');
      await expect(submitBtn).toBeFocused();
    }
  });

  test('should move placed tile to another slot using keyboard', async ({ page }) => {
    // Wait for tiles to be ready
    await page.waitForSelector('.tile', { timeout: 5000 });
    
    // Get the letter of the first tile before placing it
    const firstTile = page.locator('.tile').first();
    const firstTileLetter = await firstTile.getAttribute('data-letter');
    expect(firstTileLetter).toBeTruthy();
    
    // Place first tile in first slot via drag
    const firstSlot = page.locator('[data-word-slots="0"] .slot').first();
    await firstTile.dragTo(firstSlot);
    
    // Wait for tile to be placed
    await expect(firstSlot.locator('.tile')).toBeVisible({ timeout: 2000 });
    
    // Focus the tile in the slot
    const tileInSlot = firstSlot.locator('.tile');
    await tileInSlot.focus();
    
    // Press Enter to select the placed tile
    await page.keyboard.press('Enter');
    
    // Verify tile is selected
    await expect(tileInSlot).toHaveClass(/tile-selected/);
    
    // Navigate to second slot (empty) - use Tab to navigate
    const secondSlot = page.locator('[data-word-slots="0"] .slot').nth(1);
    await secondSlot.focus();
    
    // Press Enter to place the selected tile in the second slot
    await page.keyboard.press('Enter');
    
    // Wait for move to complete
    await page.waitForTimeout(200);
    
    // Verify the tile is now in the second slot
    const tileInSecondSlot = secondSlot.locator('.tile');
    await expect(tileInSecondSlot).toBeVisible({ timeout: 2000 });
    const tileInSecondSlotLetter = await tileInSecondSlot.getAttribute('data-letter');
    expect(tileInSecondSlotLetter).toBe(firstTileLetter);
    
    // Verify the first slot is now empty
    await expect(firstSlot.locator('.tile')).not.toBeVisible();
    
    // Verify tile is no longer selected
    await expect(tileInSecondSlot).not.toHaveClass(/tile-selected/);
  });

  test('should select tile swapped back to container with Enter', async ({ page }) => {
    // Place a tile in slot via drag
    const firstTile = page.locator('.tile').first();
    const firstTileLetter = await firstTile.getAttribute('data-letter');
    const slot = page.locator('[data-word-slots="0"] .slot').first();
    await firstTile.dragTo(slot);
    
    // Wait for tile to be placed
    await expect(slot.locator('.tile')).toBeVisible();
    
    // Place another tile in the same slot to swap (this will return first tile to container)
    const secondTile = page.locator('.tile').first(); // First tile is now the second one after drag
    await secondTile.dragTo(slot);
    
    // Wait for swap to complete
    await page.waitForTimeout(200);
    
    // Verify first tile is back in container
    const tilesInContainer = page.locator('#tiles-container .tile');
    const tileBackInContainer = tilesInContainer.filter({ hasText: firstTileLetter }).first();
    await expect(tileBackInContainer).toBeVisible();
    
    // Focus the tile that was swapped back
    await tileBackInContainer.focus();
    
    // Press Enter to select the tile
    await page.keyboard.press('Enter');
    
    // Verify tile is selected (has pink selection classes)
    await expect(tileBackInContainer).toHaveClass(/tile-selected/);
  });

  test('should navigate to all slots with arrow keys after tiles are moved', async ({ page }) => {
    // Place a tile in first slot
    const firstTile = page.locator('.tile').first();
    const firstSlot = page.locator('[data-word-slots="0"] .slot').first();
    await firstTile.dragTo(firstSlot);
    await expect(firstSlot.locator('.tile')).toBeVisible();
    
    // Place another tile in second slot
    const secondTile = page.locator('.tile').first();
    const secondSlot = page.locator('[data-word-slots="0"] .slot').nth(1);
    await secondTile.dragTo(secondSlot);
    await expect(secondSlot.locator('.tile')).toBeVisible();
    
    // Remove tile from first slot (this makes it empty and should restore interactivity)
    const tileInFirstSlot = firstSlot.locator('.tile');
    await tileInFirstSlot.focus();
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(200);
    
    // Now first slot should be empty and second slot should still have the tile
    await expect(firstSlot.locator('.tile')).not.toBeVisible();
    await expect(secondSlot.locator('.tile')).toBeVisible();
    
    // Focus the tile in second slot
    const tileInSecondSlot = secondSlot.locator('.tile');
    await tileInSecondSlot.focus();
    
    // Press ArrowLeft to navigate to first slot (should navigate to empty slot)
    await page.keyboard.press('ArrowLeft');
    
    // First slot should be focused (even though it's empty)
    // The fix ensures empty slots are made interactive so they can be focused
    await expect(firstSlot).toBeFocused();
    
    // Press ArrowRight to navigate back to second slot tile
    await page.keyboard.press('ArrowRight');
    await expect(tileInSecondSlot).toBeFocused();
    
    // Press ArrowDown to navigate to same slot index in word 2
    await page.keyboard.press('ArrowDown');
    // Should navigate to slot 2 of word 2 (same index as current slot)
    const secondSlotWord2 = page.locator('[data-word-slots="1"] .slot').nth(1);
    await expect(secondSlotWord2).toBeFocused();
    
    // Press ArrowUp to navigate back to second slot tile in word 1
    await page.keyboard.press('ArrowUp');
    await expect(tileInSecondSlot).toBeFocused();
    
    // Press ArrowLeft again to navigate to first slot (empty)
    await page.keyboard.press('ArrowLeft');
    await expect(firstSlot).toBeFocused();
  });
});
