// Keyboard accessibility handlers

import { getSelectedTile, setSelectedTile, clearSelectedTile } from './puzzle-state.js';
import { SCRABBLE_SCORES } from '../puzzle-data.js';

// Keyboard handler for tiles
export function handleTileKeyDown(e) {
    const tile = e.currentTarget;
    
    // Don't allow keyboard interaction with locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        
        // If this tile is already selected, deselect it
        if (getSelectedTile() === tile) {
            deselectTile();
        } else {
            // Select this tile
            selectTile(tile);
        }
    } else if (e.key === 'Escape') {
        // Deselect if this tile is selected
        if (getSelectedTile() === tile) {
            deselectTile();
        }
    }
}

// Keyboard handler for slots
export function handleSlotKeyDown(e, placeTileCallback, removeTileCallback) {
    const slot = e.currentTarget;
    
    // Don't allow keyboard interaction with locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        
        if (slot.classList.contains('filled')) {
            // Remove tile from slot if it's filled and not locked
            const tile = slot.querySelector('.tile');
            if (tile && tile.getAttribute('data-locked') !== 'true') {
                if (removeTileCallback) {
                    // removeTileCallback will pass isKeyboardNavigation via context
                    removeTileCallback(slot);
                }
                // Focus the tile that was removed (will be in container)
                setTimeout(() => {
                    const tilesContainer = document.getElementById('tiles-container') || 
                                         document.getElementById('archive-tiles-container');
                    if (tilesContainer && tile) {
                        const removedTile = tilesContainer.querySelector(`[data-letter="${tile.getAttribute('data-letter')}"]`);
                        if (removedTile) removedTile.focus();
                    }
                }, 100);
            }
        } else if (getSelectedTile()) {
            // Place selected tile in this slot
            if (placeTileCallback) {
                placeTileCallback(getSelectedTile(), slot);
            }
            deselectTile();
            // Keep focus on the slot
            slot.focus();
        }
    } else if (e.key === 'Escape') {
        // Deselect tile if one is selected
        if (getSelectedTile()) {
            deselectTile();
        }
    }
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
    tile.classList.add('ring-4', 'ring-yellow-400', 'ring-offset-2');
    const currentLabel = tile.getAttribute('aria-label').replace(' (selected)', '');
    tile.setAttribute('aria-label', currentLabel + ' (selected)');
    
    // Ensure the selected tile maintains focus for keyboard navigation
    if (document.activeElement !== tile) {
        tile.focus();
    }
    
    // Announce selection to screen readers
    const letter = tile.getAttribute('data-letter');
    const score = SCRABBLE_SCORES[letter.toUpperCase()] || 0;
    announceToScreenReader(`Selected tile ${letter} with score ${score}. Tab to a slot and press Enter to place.`);
}

// Deselect the currently selected tile
export function deselectTile() {
    const selected = getSelectedTile();
    if (selected) {
        selected.classList.remove('ring-4', 'ring-yellow-400', 'ring-offset-2');
        const ariaLabel = selected.getAttribute('aria-label').replace(' (selected)', '');
        selected.setAttribute('aria-label', ariaLabel);
        
        // Maintain focus on the tile when deselected (user can continue tabbing)
        // Only refocus if the tile is still the active element
        const wasFocused = document.activeElement === selected;
        clearSelectedTile();
        
        // If the tile was focused, keep focus on it so user can continue tabbing
        if (wasFocused && document.contains(selected)) {
            // Use setTimeout to ensure focus happens after any DOM changes
            setTimeout(() => {
                if (document.contains(selected)) {
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

