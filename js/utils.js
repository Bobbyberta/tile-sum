// Utility functions

/**
 * Gets the ordinal suffix for a day number (st, nd, rd, th).
 * 
 * @param {number} day - The day number (1-31)
 * @returns {string} The suffix ('st', 'nd', 'rd', or 'th')
 * 
 * @example
 * getDaySuffix(1);  // 'st'
 * getDaySuffix(2);  // 'nd'
 * getDaySuffix(3);  // 'rd'
 * getDaySuffix(11); // 'th' (special case)
 * getDaySuffix(21); // 'st'
 */
export function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Checks if any test mode is enabled via URL parameter.
 * Test modes: 'archive' or 'advent'
 * 
 * @returns {boolean} True if test mode is enabled, false otherwise
 * 
 * @example
 * // URL: ?test=archive
 * isTestMode(); // true
 */
export function isTestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const testValue = urlParams.get('test');
    return testValue === 'archive' || testValue === 'advent';
}

// Check if archive test mode is enabled
export function isArchiveTestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('test') === 'archive';
}

/**
 * Checks if advent test mode is enabled via URL parameter.
 * 
 * @returns {boolean} True if advent test mode is enabled, false otherwise
 * 
 * @example
 * // URL: ?test=advent
 * isAdventTestMode(); // true
 */
export function isAdventTestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('test') === 'advent';
}

// Get test mode parameter string for URLs
export function getTestModeParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const testValue = urlParams.get('test');
    if (testValue === 'archive' || testValue === 'advent') {
        return `?test=${testValue}`;
    }
    return '';
}

// Get test mode parameter string for URLs (with existing params)
export function getTestModeParamWithAmpersand() {
    const urlParams = new URLSearchParams(window.location.search);
    const testValue = urlParams.get('test');
    if (testValue === 'archive' || testValue === 'advent') {
        return `&test=${testValue}`;
    }
    return '';
}

// Check if we're in development/debug mode
// Returns true if running on localhost or if test mode is enabled
function isDebugMode() {
    // Enable debug in development (localhost) or when test mode is active
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           isTestMode();
}

/**
 * Debug logging function that only logs in development/debug mode.
 * Logs when running on localhost, 127.0.0.1, or when test mode is enabled.
 * 
 * @param {...any} args - Arguments to log (same as console.log)
 * @returns {void}
 * 
 * @example
 * debugLog('Puzzle loaded:', puzzleNumber);
 * debugLog('State:', { hints: 3, completed: false });
 */
export function debugLog(...args) {
    if (isDebugMode()) {
        console.log(...args);
    }
}

