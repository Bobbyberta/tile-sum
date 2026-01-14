# utils.js API Documentation

Shared utility functions used across the application.

## Overview

This module provides utility functions for common tasks like date formatting, test mode detection, and debug logging.

## Functions

### `getDaySuffix(day)`

Gets the ordinal suffix for a day number (st, nd, rd, th).

**Parameters:**
- `day` (number): The day number (1-31)

**Returns:**
- `string`: The suffix (`'st'`, `'nd'`, `'rd'`, or `'th'`)

**Example:**
```javascript
import { getDaySuffix } from './js/utils.js';

getDaySuffix(1);   // 'st'
getDaySuffix(2);   // 'nd'
getDaySuffix(3);   // 'rd'
getDaySuffix(11);  // 'th' (special case: 11th, 12th, 13th)
getDaySuffix(21);  // 'st'
getDaySuffix(22);  // 'nd'
getDaySuffix(23);  // 'rd'
getDaySuffix(24);  // 'th'
```

**Special Cases:**
- Days 11, 12, 13 always use `'th'`
- Other days ending in 1 use `'st'`
- Other days ending in 2 use `'nd'`
- Other days ending in 3 use `'rd'`
- All other days use `'th'`

**Usage:**
```javascript
const day = 5;
const suffix = getDaySuffix(day);
const formatted = `${day}${suffix}`; // "5th"
```

---

### `isTestMode()`

Checks if any test mode is enabled via URL parameter. Test modes: `'archive'` or `'advent'`.

**Returns:**
- `boolean`: `true` if test mode is enabled, `false` otherwise

**Example:**
```javascript
import { isTestMode } from './js/utils.js';

// URL: ?test=archive
if (isTestMode()) {
    console.log('Test mode enabled');
}

// URL: ?test=advent
if (isTestMode()) {
    console.log('Test mode enabled');
}

// URL: (no test parameter)
if (isTestMode()) {
    // false
}
```

**Test Modes:**
- `?test=archive`: Archive test mode
- `?test=advent`: Advent test mode

---

### `isArchiveTestMode()`

Checks if archive test mode is enabled via URL parameter.

**Returns:**
- `boolean`: `true` if archive test mode is enabled, `false` otherwise

**Example:**
```javascript
import { isArchiveTestMode } from './js/utils.js';

// URL: ?test=archive
if (isArchiveTestMode()) {
    // Enable archive test features
}

// URL: ?test=advent or no test parameter
if (isArchiveTestMode()) {
    // false
}
```

---

### `isAdventTestMode()`

Checks if advent test mode is enabled via URL parameter.

**Returns:**
- `boolean`: `true` if advent test mode is enabled, `false` otherwise

**Example:**
```javascript
import { isAdventTestMode } from './js/utils.js';

// URL: ?test=advent
if (isAdventTestMode()) {
    // Enable advent test features
}

// URL: ?test=archive or no test parameter
if (isAdventTestMode()) {
    // false
}
```

---

### `getTestModeParam()`

Gets the test mode parameter string for URLs (with `?` prefix).

**Returns:**
- `string`: Test mode parameter string (e.g., `'?test=archive'`) or empty string if no test mode

**Example:**
```javascript
import { getTestModeParam } from './js/utils.js';

// URL: ?test=archive
const param = getTestModeParam(); // '?test=archive'

// URL: (no test parameter)
const param = getTestModeParam(); // ''

// Usage in links
const link = `/puzzle.html?day=1${getTestModeParam()}`;
```

---

### `getTestModeParamWithAmpersand()`

Gets the test mode parameter string for URLs (with `&` prefix, for use with existing query parameters).

**Returns:**
- `string`: Test mode parameter string (e.g., `'&test=archive'`) or empty string if no test mode

**Example:**
```javascript
import { getTestModeParamWithAmpersand } from './js/utils.js';

// URL: ?test=archive
const param = getTestModeParamWithAmpersand(); // '&test=archive'

// URL: (no test parameter)
const param = getTestModeParamWithAmpersand(); // ''

// Usage in links with existing params
const link = `/puzzle.html?day=1${getTestModeParamWithAmpersand()}`;
```

---

### `debugLog(...args)`

Debug logging function that only logs in development/debug mode. Logs when running on localhost, 127.0.0.1, or when test mode is enabled.

**Parameters:**
- `...args` (any): Arguments to log (same as `console.log`)

**Returns:**
- `void`

**Example:**
```javascript
import { debugLog } from './js/utils.js';

// Only logs in development
debugLog('Puzzle loaded:', puzzleNumber);
debugLog('State:', { hints: 3, completed: false });
debugLog('Tiles:', tiles.length);
```

**When It Logs:**
- Running on `localhost`
- Running on `127.0.0.1`
- Test mode is enabled (`?test=archive` or `?test=advent`)

**When It Doesn't Log:**
- Running on production domain
- No test mode enabled

**Usage Pattern:**
```javascript
function initPuzzle(day) {
    debugLog('Initializing puzzle:', day);
    
    const puzzle = PUZZLE_DATA[day];
    debugLog('Puzzle data:', puzzle);
    
    if (!puzzle) {
        debugLog('Puzzle not found:', day);
        return;
    }
    
    // ... initialization
    debugLog('Puzzle initialized successfully');
}
```

## Usage Patterns

### Date Formatting

```javascript
import { getDaySuffix } from './js/utils.js';

function formatDate(date) {
    const day = date.getDate();
    const suffix = getDaySuffix(day);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day}${suffix} ${month} ${year}`;
    // Example: "5th December 2024"
}
```

### Test Mode Detection

```javascript
import { isTestMode, isArchiveTestMode, isAdventTestMode } from './js/utils.js';

function initPage() {
    if (isTestMode()) {
        console.log('Test mode enabled');
        
        if (isArchiveTestMode()) {
            // Enable archive test features
            enableArchiveTestMode();
        }
        
        if (isAdventTestMode()) {
            // Enable advent test features
            enableAdventTestMode();
        }
    }
}
```

### URL Generation with Test Mode

```javascript
import { getTestModeParam, getTestModeParamWithAmpersand } from './js/utils.js';

// Generate link to puzzle
function getPuzzleLink(day) {
    return `/puzzle.html?day=${day}${getTestModeParamWithAmpersand()}`;
}

// Generate link to archive
function getArchiveLink() {
    return `/archive.html${getTestModeParam()}`;
}
```

### Debug Logging

```javascript
import { debugLog } from './js/utils.js';

function complexFunction(data) {
    debugLog('Function called with:', data);
    
    try {
        // Process data
        debugLog('Processing step 1');
        const result1 = processStep1(data);
        debugLog('Step 1 result:', result1);
        
        debugLog('Processing step 2');
        const result2 = processStep2(result1);
        debugLog('Step 2 result:', result2);
        
        return result2;
    } catch (error) {
        debugLog('Error occurred:', error);
        throw error;
    }
}
```

## See Also

- [puzzle-state.js](./puzzle-state.md) - State management utilities
- [Development Workflow](../development/workflow.md) - Using test modes
- [Testing Overview](../testing/overview.md) - Test mode usage in tests

## Notes

- Test mode functions check URL search parameters
- `debugLog()` is a no-op in production (no performance impact)
- All functions are pure (no side effects except `debugLog` which conditionally logs)
- Functions are designed to be imported individually (tree-shakeable)
