// Utility functions

// Get day suffix (1st, 2nd, 3rd, etc.)
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

// Check if any test mode is enabled via URL parameter
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

// Check if advent test mode is enabled
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

