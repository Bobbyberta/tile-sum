/**
 * Accessibility testing helpers for Playwright tests
 * Provides reusable functions for common accessibility checks
 */

import AxeBuilder from '@axe-core/playwright';

/**
 * Default WCAG tags for compliance
 */
export const DEFAULT_WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];

/**
 * Checks for accessibility violations using AxeBuilder
 * @param {Page} page - Playwright page object
 * @param {string|null} selector - Optional CSS selector to scope the check (use include/exclude)
 * @param {object} options - Axe configuration options
 * @returns {Promise<object>} Axe scan results with violations array
 */
export async function checkAccessibility(page, selector = null, options = {}) {
  const builder = new AxeBuilder({ page });
  
  if (selector) {
    builder.include(selector);
  }
  
  if (options.tags) {
    builder.withTags(options.tags);
  } else {
    builder.withTags(DEFAULT_WCAG_TAGS);
  }
  
  if (options.rules) {
    builder.withRules(options.rules);
  }
  
  if (options.exclude) {
    builder.exclude(options.exclude);
  }
  
  return await builder.analyze();
}

/**
 * Asserts that there are no accessibility violations
 * @param {Page} page - Playwright page object
 * @param {string|null} selector - Optional CSS selector to scope the check
 * @param {object} options - Axe configuration options
 */
export async function expectNoViolations(page, selector = null, options = {}) {
  const results = await checkAccessibility(page, selector, options);
  expect(results.violations).toEqual([]);
}

/**
 * Checks for specific accessibility rules
 * @param {Page} page - Playwright page object
 * @param {Array<string>} ruleIds - Array of axe rule IDs to check
 * @param {string|null} selector - Optional CSS selector to scope the check
 */
export async function checkSpecificRules(page, ruleIds, selector = null) {
  const builder = new AxeBuilder({ page });
  
  if (selector) {
    builder.include(selector);
  }
  
  builder.withRules(ruleIds);
  
  return await builder.analyze();
}

/**
 * Checks color contrast specifically
 * @param {Page} page - Playwright page object
 * @param {string|null} selector - Optional CSS selector to scope the check
 */
export async function checkColorContrast(page, selector = null) {
  return checkSpecificRules(page, ['color-contrast'], selector);
}

/**
 * Checks keyboard accessibility
 * @param {Page} page - Playwright page object
 * @param {string|null} selector - Optional CSS selector to scope the check
 */
export async function checkKeyboardAccessibility(page, selector = null) {
  const ruleIds = [
    'keyboard',
    'focus-order-semantics',
    'focusable-content',
    'tabindex'
  ];
  
  return checkSpecificRules(page, ruleIds, selector);
}

/**
 * Checks ARIA attributes
 * @param {Page} page - Playwright page object
 * @param {string|null} selector - Optional CSS selector to scope the check
 */
export async function checkARIA(page, selector = null) {
  const ruleIds = [
    'aria-allowed-attr',
    'aria-hidden-body',
    'aria-hidden-focus',
    'aria-input-field-name',
    'aria-required-attr',
    'aria-roles',
    'aria-valid-attr-value',
    'aria-valid-attr'
  ];
  
  return checkSpecificRules(page, ruleIds, selector);
}
