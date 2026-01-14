# modals.js API Documentation

Modal dialog management for help, success, and error messages.

## Overview

This module provides functions for showing and managing modal dialogs, including help, success, and error modals. It handles scroll locking, focus management, and accessibility.

## Functions

### `showSuccessModal(day, word1Score, word2Score, word1MaxScore, word2MaxScore, prefix, hintsUsed, solutionShown)`

Shows the success modal when a puzzle is solved correctly.

**Parameters:**
- `day` (number): The puzzle number/day
- `word1Score` (number): Score for word 1
- `word2Score` (number): Score for word 2
- `word1MaxScore` (number): Maximum possible score for word 1
- `word2MaxScore` (number): Maximum possible score for word 2
- `prefix` (string, optional): Prefix for element IDs. Default: `''`
- `hintsUsed` (number, optional): Number of hints used. Default: `0`
- `solutionShown` (boolean, optional): Whether solution was shown. Default: `false`

**Returns:**
- `void`

**Example:**
```javascript
import { showSuccessModal } from './js/modals.js';

showSuccessModal(
  1,           // day
  10,          // word1Score
  12,          // word2Score
  14,          // word1MaxScore
  15,          // word2MaxScore
  '',          // prefix
  1,           // hintsUsed
  false        // solutionShown
);
```

**Behavior:**
1. Locks body scroll
2. Shows success modal
3. Displays scores and statistics
4. Generates share message
5. Saves puzzle completion
6. Manages focus and keyboard navigation

---

### `closeSuccessModal(prefix)`

Closes the success modal.

**Parameters:**
- `prefix` (string, optional): Prefix for element IDs. Default: `''`

**Returns:**
- `void`

**Example:**
```javascript
import { closeSuccessModal } from './js/modals.js';

closeSuccessModal();
```

---

### `showErrorModal(message)`

Shows the error modal when solution is incorrect.

**Parameters:**
- `message` (string, optional): Error message to display. Default: `'Incorrect solution. Please try again!'`

**Returns:**
- `void`

**Example:**
```javascript
import { showErrorModal } from './js/modals.js';

showErrorModal('Incorrect solution. Please try again!');
```

**Behavior:**
1. Locks body scroll
2. Shows error modal with message
3. Manages focus and keyboard navigation

---

### `closeErrorModal()`

Closes the error modal.

**Returns:**
- `void`

**Example:**
```javascript
import { closeErrorModal } from './js/modals.js';

closeErrorModal();
```

---

### `showHelpModal()`

Shows the help modal with game instructions.

**Returns:**
- `void`

**Example:**
```javascript
import { showHelpModal } from './js/modals.js';

showHelpModal();
```

**Behavior:**
1. Locks body scroll
2. Shows help modal
3. Marks help as seen
4. Manages focus and keyboard navigation

---

### `closeHelpModal()`

Closes the help modal.

**Returns:**
- `void`

**Example:**
```javascript
import { closeHelpModal } from './js/modals.js';

closeHelpModal();
```

## Scroll Locking

The module manages body scroll locking to prevent background scrolling when modals are open.

### Features

- **Mobile Compatible**: Works on touch devices
- **Multiple Modals**: Tracks modal count (supports nested modals)
- **Scroll Position**: Saves and restores scroll position
- **Touch Events**: Prevents touch scrolling on background

### Implementation

```javascript
// Lock scroll when modal opens
lockBodyScroll();

// Unlock scroll when modal closes
unlockBodyScroll();
```

## Focus Management

### Focus Trapping

Modals trap focus within the modal:
- Tab navigation stays within modal
- Focus returns to triggering element on close
- First focusable element receives focus on open

### Keyboard Navigation

- **Escape**: Closes modal
- **Tab**: Navigates within modal
- **Enter/Space**: Activates buttons

## Usage Patterns

### Success Modal

```javascript
import { showSuccessModal, closeSuccessModal } from './js/modals.js';

// After puzzle is solved
function onPuzzleSolved(day, word1Score, word2Score, word1MaxScore, word2MaxScore) {
  showSuccessModal(day, word1Score, word2Score, word1MaxScore, word2MaxScore);
}

// Close button handler
closeBtn.addEventListener('click', () => {
  closeSuccessModal();
});
```

### Error Modal

```javascript
import { showErrorModal, closeErrorModal } from './js/modals.js';

// When solution is incorrect
function onIncorrectSolution() {
  showErrorModal('Incorrect solution. Please try again!');
}

// Close button handler
closeBtn.addEventListener('click', () => {
  closeErrorModal();
});
```

### Help Modal

```javascript
import { showHelpModal, closeHelpModal } from './js/modals.js';
import { hasSeenHelp } from './js/completion.js';

// Show help on first visit
if (!hasSeenHelp()) {
  showHelpModal();
}

// Help button handler
helpBtn.addEventListener('click', () => {
  showHelpModal();
});
```

## Modal Structure

### Success Modal

```html
<div id="success-modal" class="modal">
  <div class="modal-content">
    <h2>Congratulations!</h2>
    <p>Scores and statistics</p>
    <button>Close</button>
  </div>
</div>
```

### Error Modal

```html
<div id="error-modal" class="modal">
  <div class="modal-content">
    <h2>Incorrect Solution</h2>
    <p>Error message</p>
    <button>Close</button>
  </div>
</div>
```

### Help Modal

```html
<div id="help-modal" class="modal">
  <div class="modal-content">
    <h2>How to Play</h2>
    <div class="help-content">
      <!-- Instructions -->
    </div>
    <button>Close</button>
  </div>
</div>
```

## Accessibility

### ARIA Attributes

Modals include proper ARIA attributes:
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` for title
- `aria-describedby` for content

### Keyboard Support

- **Escape**: Closes modal
- **Tab**: Focuses next element
- **Shift+Tab**: Focuses previous element
- **Enter/Space**: Activates focused button

## See Also

- [completion.js](./completion.md) - Marks help as seen, saves puzzle completion
- [feedback.js](../architecture/module-interactions.md#solution-validation) - Triggers modals
- [scoring.js](./scoring.md) - Calls success modal after validation
- [keyboard.js](../architecture/module-interactions.md#keyboard-navigation) - Keyboard navigation in modals

## Notes

- Modals lock body scroll when open
- Focus is trapped within modal
- Focus returns to triggering element on close
- Multiple modals are supported (counted)
- Mobile touch scrolling is prevented
- Help modal is marked as seen automatically
