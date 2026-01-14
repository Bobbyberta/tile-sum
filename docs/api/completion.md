# completion.js API Documentation

Puzzle completion tracking using localStorage.

## Overview

This module handles saving and checking puzzle completion status using the browser's localStorage API. Completion is tracked per puzzle per date.

## Functions

### `savePuzzleCompletion(puzzleNumber, date)`

Saves puzzle completion status to localStorage.

**Parameters:**
- `puzzleNumber` (number): The puzzle number/day
- `date` (Date, optional): The date of completion. If not provided, uses the puzzle's date from puzzle data

**Returns:**
- `void`

**Example:**
```javascript
import { savePuzzleCompletion } from './js/completion.js';

// Save completion for today
savePuzzleCompletion(1);

// Save completion for specific date
const date = new Date(2024, 11, 1); // December 1, 2024
savePuzzleCompletion(1, date);
```

**Storage Key Format:**
- `puzzle-completed-{puzzleNumber}-{dateString}`
- Example: `puzzle-completed-1-2024-12-01`

**Error Handling:**
- Catches and logs localStorage errors
- Does not throw errors (graceful failure)

---

### `isPuzzleCompletedToday(puzzleNumber)`

Checks if puzzle is completed today.

**Parameters:**
- `puzzleNumber` (number): The puzzle number/day

**Returns:**
- `boolean`: `true` if puzzle is completed today, `false` otherwise

**Example:**
```javascript
import { isPuzzleCompletedToday } from './js/completion.js';

if (isPuzzleCompletedToday(1)) {
  console.log('Puzzle 1 is completed today');
}
```

**Behavior:**
- Uses today's date
- Checks localStorage for completion key
- Returns `false` on error

---

### `isPuzzleCompletedForDate(puzzleNumber, date)`

Checks if puzzle is completed for a specific date.

**Parameters:**
- `puzzleNumber` (number): The puzzle number/day
- `date` (Date): The date to check

**Returns:**
- `boolean`: `true` if puzzle is completed for the date, `false` otherwise

**Example:**
```javascript
import { isPuzzleCompletedForDate } from './js/completion.js';

const date = new Date(2024, 11, 1); // December 1, 2024
if (isPuzzleCompletedForDate(1, date)) {
  console.log('Puzzle 1 was completed on Dec 1, 2024');
}
```

**Behavior:**
- Returns `false` if date is not provided
- Checks localStorage for completion key with specific date
- Returns `false` on error

---

### `hasSeenHelp()`

Checks if user has seen the help modal before.

**Returns:**
- `boolean`: `true` if help has been seen, `false` otherwise

**Example:**
```javascript
import { hasSeenHelp } from './js/completion.js';

if (!hasSeenHelp()) {
  // Show help modal
  showHelpModal();
}
```

**Storage Key:**
- `has-seen-help`

---

### `markHelpAsSeen()`

Marks the help modal as seen.

**Returns:**
- `void`

**Example:**
```javascript
import { markHelpAsSeen } from './js/completion.js';

helpModal.addEventListener('close', () => {
  markHelpAsSeen();
});
```

**Storage Key:**
- `has-seen-help`

## Usage Patterns

### Saving Completion

```javascript
import { savePuzzleCompletion } from './js/completion.js';

// After puzzle is solved
function onPuzzleSolved(day) {
  savePuzzleCompletion(day);
  // Puzzle is now marked as completed
}
```

### Checking Completion Status

```javascript
import { isPuzzleCompletedToday, isPuzzleCompletedForDate } from './js/completion.js';

// Check if today's puzzle is completed
const todayCompleted = isPuzzleCompletedToday(1);

// Check if specific date's puzzle is completed
const date = new Date(2024, 11, 1);
const dateCompleted = isPuzzleCompletedForDate(1, date);
```

### Calendar Display

```javascript
import { isPuzzleCompletedForDate } from './js/completion.js';

// Check completion for each day in calendar
for (let day = 1; day <= 25; day++) {
  const date = getDateForPuzzleNumber(day);
  const completed = isPuzzleCompletedForDate(day, date);
  
  if (completed) {
    // Show checkmark on calendar
    markDayAsCompleted(day);
  }
}
```

### Help Modal

```javascript
import { hasSeenHelp, markHelpAsSeen } from './js/completion.js';

// Show help modal only if not seen before
if (!hasSeenHelp()) {
  showHelpModal();
  markHelpAsSeen();
}
```

## Storage Schema

### Completion Data

```javascript
{
  "puzzle-completed-1-2024-12-01": "true",
  "puzzle-completed-2-2024-12-02": "true",
  // ...
}
```

### Help Status

```javascript
{
  "has-seen-help": "true"
}
```

## Error Handling

All functions handle localStorage errors gracefully:

```javascript
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.error('Error saving to localStorage:', error);
  // Function returns without throwing
}
```

**Common Errors:**
- QuotaExceededError: localStorage is full
- SecurityError: localStorage is disabled
- These are caught and logged, not thrown

## See Also

- [puzzle-state.js](./puzzle-state.md) - Session state (non-persistent)
- [modals.js](./modals.md) - Uses completion status for UI
- [ui.js](../architecture/module-interactions.md#completion-tracking) - Displays completion status
- [Data Structures](../architecture/data-structures.md#localstorage-structure) - Storage schema

## Notes

- Completion is tracked per puzzle per date
- Uses ISO date format: `YYYY-MM-DD`
- Functions are safe to call even if localStorage fails
- Help status is global (not per puzzle)
- Completion persists across browser sessions
