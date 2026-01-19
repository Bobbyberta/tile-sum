// Keyboard accessibility handlers

import { getSelectedTile, setSelectedTile, clearSelectedTile } from './puzzle-state.js';
import { SCRABBLE_SCORES } from '../puzzle-data-encoded.js';
import { handleTileKeyDown as handleTileKeyDownInput, handleSlotKeyDown as handleSlotKeyDownInput, handleButtonKeyDown as handleButtonKeyDownInput, getKeyboardContext } from './keyboard-input.js';

/**
 * Keyboard handler for tiles - delegates to keyboard-input module.
 * Handles keyboard events on tile elements for accessibility.
 * 
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} [context] - Optional context object with callbacks and prefix
 * @returns {void}
 * 
 * @example
 * tile.addEventListener('keydown', (e) => handleTileKeyDown(e, keyboardContext));
 */
export function handleTileKeyDown(e, context) {
    // Use provided context or fall back to stored context
    const activeContext = context || getKeyboardContext();
    // Delegate to keyboard-input module
    handleTileKeyDownInput(e, activeContext);
}

// Keyboard handler for slots - delegates to keyboard-input module
export function handleSlotKeyDown(e, placeTileCallback, removeTileCallback) {
    // Build context - use stored context as base, merge with callbacks and detected prefix
    const baseContext = getKeyboardContext() || {};
    const context = {
        ...baseContext,
        placeTileCallback: placeTileCallback || baseContext.placeTileCallback,
        removeTileCallback: removeTileCallback || baseContext.removeTileCallback,
        prefix: baseContext.prefix || '' // Will be determined from slot's container if needed
    };
    
    // Try to detect prefix from slot's container
    const slot = e.currentTarget;
    const wordSlotsContainer = slot.closest('#word-slots, #daily-word-slots, #archive-word-slots');
    if (wordSlotsContainer) {
        const containerId = wordSlotsContainer.id;
        if (containerId === 'daily-word-slots') {
            context.prefix = 'daily-';
        } else if (containerId === 'archive-word-slots') {
            context.prefix = 'archive-';
        }
    }
    
    // Delegate to keyboard-input module
    handleSlotKeyDownInput(e, context);
}

// Handle slot focus for visual feedback
export function handleSlotFocus(e) {
    const slot = e.currentTarget;
    if (slot.getAttribute('data-locked') !== 'true') {
        slot.classList.add('focus:ring-2', 'focus:ring-indigo-500', 'focus:outline-none');
    }
}

// Handle slot blur
export function handleSlotBlur(e) {
    const slot = e.currentTarget;
    // Focus styles are handled by Tailwind focus: classes
}

// Select a tile for keyboard placement
export function selectTile(tile) {
    // Deselect previous tile if any
    const currentSelected = getSelectedTile();
    if (currentSelected && currentSelected !== tile) {
        deselectTile();
    }
    
    setSelectedTile(tile);
    // Add pink border with bolder outline - separate from focus state
    tile.classList.add('ring-4', 'ring-pink-500', 'ring-offset-2', 'tile-selected');
    const currentLabel = (tile.getAttribute('aria-label') || '').replace(' (selected)', '');
    tile.setAttribute('aria-label', currentLabel + ' (selected)');
    
    // Don't force focus - allow focus to move independently while keeping selection
    // Focus will be managed by navigation, selection state persists
    
    // Announce selection to screen readers
    const letter = tile.getAttribute('data-letter');
    const score = SCRABBLE_SCORES[letter.toUpperCase()] || 0;
    announceToScreenReader(`Selected tile ${letter} with score ${score}. Tab to a slot and press Enter to place.`);
}

// Deselect the currently selected tile
export function deselectTile() {
    const selected = getSelectedTile();
    if (selected) {
        // Remove pink border styling
        selected.classList.remove('ring-4', 'ring-pink-500', 'ring-offset-2', 'tile-selected');
        const ariaLabel = (selected.getAttribute('aria-label') || '').replace(' (selected)', '');
        selected.setAttribute('aria-label', ariaLabel);
        
        // Maintain focus on the tile when deselected (user can continue tabbing)
        // Only refocus if the tile is still the active element and is in the container (not in a slot)
        const wasFocused = document.activeElement === selected;
        const isInSlot = selected.closest('.slot') !== null;
        clearSelectedTile();
        
        // If the tile was focused and it's still in the container (not placed in a slot),
        // keep focus on it so user can continue tabbing
        // Don't refocus tiles that are in slots - let placeTileInSlot handle focus for placed tiles
        if (wasFocused && !isInSlot && document.contains(selected)) {
            // Use setTimeout to ensure focus happens after any DOM changes
            setTimeout(() => {
                if (document.contains(selected) && selected.closest('.slot') === null) {
                    selected.focus();
                }
            }, 0);
        }
    }
}

// Announce to screen readers
export function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
        }
    }, 1000);
}

// Generic focus trap handler for any modal
export function handleModalKeyDown(e, modalId, closeCallback) {
    const modal = document.getElementById(modalId);
    if (!modal || modal.classList.contains('hidden')) return;
    
    // Handle ESC key to close modal
    if (e.key === 'Escape') {
        e.preventDefault();
        if (closeCallback) {
            closeCallback();
        } else if (modal._closeCallback) {
            modal._closeCallback();
        }
        return;
    }
    
    // Only handle Tab key for focus trapping
    if (e.key !== 'Tab') return;
    
    // Get all focusable elements within the modal
    const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(modal.querySelectorAll(focusableSelectors))
        .filter(el => {
            // Filter out disabled and hidden elements
            return !el.disabled && 
                   !el.hasAttribute('hidden') && 
                   el.offsetParent !== null;
        });
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // If Shift+Tab on first element, wrap to last
    if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
    }
    // If Tab on last element, wrap to first
    else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
    }
}

// Focus trap handler for help modal (backward compatibility)
export function handleHelpModalKeyDown(e) {
    handleModalKeyDown(e, 'help-modal');
}

// Keyboard handler for buttons - delegates to keyboard-input module
export function handleButtonKeyDown(e, context) {
    // Use provided context or fall back to stored context
    const activeContext = context || getKeyboardContext();
    // Delegate to keyboard-input module
    handleButtonKeyDownInput(e, activeContext);
}