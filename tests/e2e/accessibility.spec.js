import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Increase timeout for accessibility tests (axe-core can be slow, especially in WebKit)
test.setTimeout(60000);

/**
 * Helper function to create an AxeBuilder with appropriate settings for the browser
 * Uses legacy mode for WebKit to avoid timeout issues
 */
function createAxeBuilder(page, browserName, options = {}) {
  const builder = new AxeBuilder({ page });
  
  // Use legacy mode for WebKit to avoid timeout issues
  if (browserName === 'webkit') {
    builder.setLegacyMode(true);
  }
  
  // Apply default tags if not specified
  if (!options.skipTags) {
    builder.withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
  }
  
  // Apply custom rules if specified
  if (options.rules) {
    builder.withRules(options.rules);
  }
  
  // Apply include selector if specified
  if (options.include) {
    builder.include(options.include);
  }
  
  return builder;
}

test.describe('Accessibility Tests', () => {
  test.describe('Home Page', () => {
    test('should have no accessibility violations on index page', async ({ page, browserName }) => {
      await page.goto('/index.html', { waitUntil: 'load' });
      
      const accessibilityScanResults = await createAxeBuilder(page, browserName).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Puzzle Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'load' });
      await page.waitForSelector('.tile', { timeout: 5000 });
    });

    test('should have no accessibility violations on initial load', async ({ page, browserName }) => {
      const accessibilityScanResults = await createAxeBuilder(page, browserName).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations after placing tiles', async ({ page, browserName }) => {
      // Place a tile using click-to-select and click-to-place
      const tile = page.locator('.tile').first();
      await tile.click(); // Select tile
      
      const slot = page.locator('[data-word-slots="0"] .slot').first();
      await slot.click(); // Place tile in slot
      
      // Wait for UI to update
      await page.waitForTimeout(200);
      
      const accessibilityScanResults = await createAxeBuilder(page, browserName).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations with selected tile', async ({ page, browserName }) => {
      // Select a tile via keyboard
      const tile = page.locator('.tile').first();
      await tile.focus();
      await page.keyboard.press('Enter');
      
      // Wait for selection state
      await page.waitForTimeout(100);
      
      const accessibilityScanResults = await createAxeBuilder(page, browserName).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations in success modal', async ({ page, browserName }) => {
      // Complete the puzzle
      const word1Letters = ['S', 'N', 'O', 'W'];
      const word1Slots = page.locator('[data-word-slots="0"] .slot');
      
      for (let i = 0; i < word1Letters.length; i++) {
        const letter = word1Letters[i];
        const tile = page.locator(`.tile[data-letter="${letter}"]`).first();
        const slot = word1Slots.nth(i);
        await tile.dragTo(slot);
        await page.waitForTimeout(100);
      }
      
      const word2Letters = ['F', 'L', 'A', 'K', 'E'];
      const word2Slots = page.locator('[data-word-slots="1"] .slot');
      
      for (let i = 0; i < word2Letters.length; i++) {
        const letter = word2Letters[i];
        const tile = page.locator(`.tile[data-letter="${letter}"]`).first();
        const slot = word2Slots.nth(i);
        await tile.dragTo(slot);
        await page.waitForTimeout(100);
      }
      
      // Wait for success modal
      await page.waitForSelector('#success-modal:not(.hidden)', { timeout: 2000 });
      
      // Check accessibility of modal
      const accessibilityScanResults = await createAxeBuilder(page, browserName, { include: '#success-modal' }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations in error modal', async ({ page, browserName }) => {
      // Place only some tiles and submit
      const tile = page.locator('.tile').first();
      const slot = page.locator('[data-word-slots="0"] .slot').first();
      await tile.dragTo(slot);
      
      await page.click('#submit-btn');
      
      // Wait for error modal
      await page.waitForSelector('#error-modal:not(.hidden)', { timeout: 2000 });
      
      // Check accessibility of modal
      const accessibilityScanResults = await createAxeBuilder(page, browserName, { include: '#error-modal' }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations in help modal', async ({ page, browserName }) => {
      // Open help modal
      await page.click('#help-btn');
      
      // Wait for help modal
      await page.waitForSelector('#help-modal:not(.hidden)', { timeout: 2000 });
      
      // Check accessibility of modal
      const accessibilityScanResults = await createAxeBuilder(page, browserName, { include: '#help-modal' }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Archive Page', () => {
    test('should have no accessibility violations on archive page', async ({ page, browserName }) => {
      await page.goto('/archive.html', { waitUntil: 'load' });
      await page.waitForSelector('#date-picker', { timeout: 5000 });
      
      const accessibilityScanResults = await createAxeBuilder(page, browserName).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have no accessibility violations on archive puzzle', async ({ page, browserName }) => {
      await page.goto('/archive.html', { waitUntil: 'load' });
      await page.waitForSelector('#date-picker', { timeout: 5000 });
      
      // Wait for puzzle content to load
      await page.waitForSelector('#archive-puzzle-content', { timeout: 5000 });
      await page.waitForSelector('.tile', { timeout: 5000 });
      
      const accessibilityScanResults = await createAxeBuilder(page, browserName).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'load' });
      await page.waitForSelector('.tile', { timeout: 5000 });
    });

    test('should have proper focus indicators', async ({ page }) => {
      // Focus a tile
      const tile = page.locator('.tile').first();
      await tile.focus();
      
      // Check that focus is visible (has focus ring)
      const hasFocusRing = await tile.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || 
               el.classList.toString().includes('focus:') ||
               el.classList.toString().includes('ring');
      });
      
      expect(hasFocusRing).toBeTruthy();
    });

    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      // Check tiles have aria-labels
      const firstTile = page.locator('.tile').first();
      const ariaLabel = await firstTile.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.length).toBeGreaterThan(0);
      
      // Check slots have aria-labels
      const firstSlot = page.locator('.slot').first();
      const slotAriaLabel = await firstSlot.getAttribute('aria-label');
      expect(slotAriaLabel).toBeTruthy();
    });

    test('should have proper semantic HTML structure', async ({ page }) => {
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
      expect(headings).toBeGreaterThan(0);
      
      // Check for main landmark
      const main = page.locator('main, [role="main"]');
      const mainCount = await main.count();
      expect(mainCount).toBeGreaterThan(0);
    });
  });

  test.describe('Color Contrast', () => {
    test('should pass color contrast checks', async ({ page, browserName }) => {
      await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'load' });
      await page.waitForSelector('.tile', { timeout: 5000 });
      
      // Check specifically for color contrast violations
      const accessibilityScanResults = await createAxeBuilder(page, browserName, { 
        skipTags: true,
        rules: ['color-contrast']
      }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Footer', () => {
    test('should have footer with portfolio link on index page', async ({ page }) => {
      await page.goto('/index.html', { waitUntil: 'load' });
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      const footerLink = footer.locator('a[href="https://bobbieallsop.co.uk"]');
      await expect(footerLink).toBeVisible();
      expect(await footerLink.textContent()).toBe('Bobbie Allsop');
      
      // Check link has proper attributes
      expect(await footerLink.getAttribute('target')).toBe('_blank');
      expect(await footerLink.getAttribute('rel')).toBe('noopener noreferrer');
      
      // Check link has underline styling
      const hasUnderline = await footerLink.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.textDecoration.includes('underline') || 
               styles.textDecorationLine.includes('underline') ||
               el.classList.contains('underline');
      });
      expect(hasUnderline).toBeTruthy();
    });

    test('should have footer with portfolio link on puzzle page', async ({ page }) => {
      await page.goto('/puzzle.html?day=1&test=archive', { waitUntil: 'load' });
      await page.waitForSelector('.tile', { timeout: 5000 });
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      const footerLink = footer.locator('a[href="https://bobbieallsop.co.uk"]');
      await expect(footerLink).toBeVisible();
      expect(await footerLink.textContent()).toBe('Bobbie Allsop');
      
      // Check link has proper attributes
      expect(await footerLink.getAttribute('target')).toBe('_blank');
      expect(await footerLink.getAttribute('rel')).toBe('noopener noreferrer');
    });

    test('should have footer with portfolio link on archive page', async ({ page }) => {
      await page.goto('/archive.html', { waitUntil: 'load' });
      await page.waitForSelector('#date-picker', { timeout: 5000 });
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      const footerLink = footer.locator('a[href="https://bobbieallsop.co.uk"]');
      await expect(footerLink).toBeVisible();
      expect(await footerLink.textContent()).toBe('Bobbie Allsop');
      
      // Check link has proper attributes
      expect(await footerLink.getAttribute('target')).toBe('_blank');
      expect(await footerLink.getAttribute('rel')).toBe('noopener noreferrer');
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/index.html', { waitUntil: 'load' });
      
      const footerLink = page.locator('footer a[href="https://bobbieallsop.co.uk"]');
      
      // Focus the link via keyboard navigation
      await footerLink.focus();
      await expect(footerLink).toBeFocused();
      
      // Check that focus is visible
      const hasFocusRing = await footerLink.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || 
               styles.outlineWidth !== '0px' ||
               el.classList.toString().includes('focus:') ||
               el.classList.toString().includes('ring');
      });
      expect(hasFocusRing).toBeTruthy();
    });
  });
});
