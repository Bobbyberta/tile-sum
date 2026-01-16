// Shared tile interaction logic for clicks and taps

import { getSelectedTile } from './puzzle-state.js';
import { deselectTile, selectTile } from './keyboard.js';
import { debugLog as debugLogUtil } from './utils.js';
import { 
    getInteractionState,
    getIsProcessing, 
    getLastClickTime, 
    getLastClickedTile, 
    setLastClickTime, 
    setLastClickedTile,
    getTouchInteractionActive,
    getLastTouchTime
} from './interaction-state.js';
import { validateTileExists, findTileInContainer } from './tile-validation.js';

// Debug logging function that only logs in development mode
function debugLog(...args) {
    debugLogUtil('[Input]', ...args);
}

// Handle double-click or double-tap
export function handleDoubleClickOrTap(tile, placeTileCallback, removeTileCallback, context = {}) {
    debugLog('handleDoubleClickOrTap: Double-click/tap detected');
    const isInSlot = tile.closest('.slot');
    const isInContainer = tile.closest('#tiles-container, #archive-tiles-container, #daily-tiles-container');
    
    if (isInSlot) {
        // Double-click/tap on tile in slot - return to container
        debugLog('handleDoubleClickOrTap: Double-click/tap on tile in slot, returning to container');
        const slot = tile.closest('.slot');
        if (slot && removeTileCallback) {
            // Clear selection if this tile was selected
            if (getSelectedTile() === tile) {
                deselectTile();
            }
            removeTileCallback(slot);
            // Reset double-click tracking to prevent triple-click issues
            setLastClickedTile(null);
            return true;
        }
    } else if (isInContainer) {
        // Double-click/tap on tile in container - place in next available slot
        debugLog('handleDoubleClickOrTap: Double-click/tap on tile in container, placing in next slot');
        const allSlots = document.querySelectorAll('.slot:not([data-locked="true"])');
        let targetSlot = null;
        
        // Find first empty slot
        for (const slot of allSlots) {
            if (!slot.classList.contains('filled')) {
                targetSlot = slot;
                break;
            }
        }
        
        if (targetSlot && placeTileCallback) {
            // Clear selection if this tile was selected
            if (getSelectedTile() === tile) {
                deselectTile();
            }
            placeTileCallback(tile, targetSlot);
            // Reset double-click tracking to prevent triple-click issues
            setLastClickedTile(null);
            return true;
        } else {
            debugLog('handleDoubleClickOrTap: No available slot found for double-click/tap');
        }
    }
    return false;
}

// Handle tile selection logic (shared between click and tap)
export function handleTileSelection(tile, placeTileCallback, context = {}) {
    const selectedTile = getSelectedTile();
    
    // If this tile is already selected, deselect it
    if (selectedTile === tile) {
        debugLog('handleTileSelection: Tile already selected, deselecting');
        deselectTile();
        return true; // Handled
    }
    
    // If another tile is selected, swap them
    if (selectedTile && selectedTile !== tile) {
        debugLog('handleTileSelection: Another tile selected, swapping');
        
        // Validate selected tile exists before using
        let actualSelectedTile = selectedTile;
        if (!validateTileExists(selectedTile)) {
            // Try to find actual tile in container
            const letter = selectedTile.getAttribute('data-letter');
            const index = selectedTile.getAttribute('data-tile-index');
            if (letter && index !== null) {
                const foundTile = findTileInContainer(letter, index, context);
                if (foundTile) {
                    actualSelectedTile = foundTile;
                    debugLog('handleTileSelection: Found actual tile in container, using it');
                } else {
                    // Tile doesn't exist anywhere, clear selection and return
                    debugLog('handleTileSelection: Selected tile not found, clearing selection');
                    deselectTile();
                    selectTile(tile);
                    return true; // Handled
                }
            } else {
                // No letter/index, clear selection and return
                debugLog('handleTileSelection: Selected tile has no data, clearing selection');
                deselectTile();
                selectTile(tile);
                return true; // Handled
            }
        }
        
        const clickedSlot = tile.closest('.slot');
        const selectedSlot = actualSelectedTile.closest('.slot');
        
        // If clicked tile is in a slot, place selected tile there (will swap)
        if (clickedSlot && placeTileCallback) {
            placeTileCallback(actualSelectedTile, clickedSlot);
            deselectTile();
            return true; // Handled
        }
        
        // If selected tile is in a slot and clicked tile is in container, place clicked tile in selected slot (will swap)
        if (selectedSlot && placeTileCallback) {
            placeTileCallback(tile, selectedSlot);
            deselectTile();
            return true; // Handled
        }
        
        // Both in containers - just select the new tile
        selectTile(tile);
        return true; // Handled
    }
    
    // No tile selected - select this tile
    debugLog('handleTileSelection: No tile selected, selecting this tile');
    selectTile(tile);
    return true; // Handled
}

// Unified handler for tile interactions (clicks and taps)
export function handleTileInteraction(tile, placeTileCallback, removeTileCallback, context = {}, event = null) {
    // Don't allow clicking locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Prevent interaction if already processing
    if (getIsProcessing()) {
        debugLog('handleTileInteraction: Already processing, ignoring');
        return;
    }
    
    const isInSlot = tile.closest('.slot');
    const selectedTile = getSelectedTile();
    
    // For click events, prevent if recent touch interaction occurred (mobile tap-to-click prevention)
    if (event && event.type === 'click') {
        const interactionState = getInteractionState();
        const timeSinceTouch = Date.now() - getLastTouchTime();
        if (getTouchInteractionActive() && timeSinceTouch < interactionState.CLICK_DELAY_AFTER_TOUCH) {
            debugLog('handleTileInteraction: Recent touch interaction, preventing click');
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // Only stop propagation if tile is in container, not if it's in a slot
        // This allows slot click handler to fire when clicking a tile in a slot (if not handled above)
        if (!isInSlot && event.stopPropagation) {
            event.stopPropagation();
        }
    }
    
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - getLastClickTime();
    const interactionState = getInteractionState();
    const isDoubleClick = getLastClickedTile() === tile && 
                         timeSinceLastClick < interactionState.DOUBLE_CLICK_THRESHOLD;
    
    // Update last click tracking
    setLastClickTime(currentTime);
    setLastClickedTile(tile);
    
    // Handle double-click/tap
    if (isDoubleClick) {
        if (handleDoubleClickOrTap(tile, placeTileCallback, removeTileCallback, context)) {
            return; // Handled by double-click/tap
        }
    }
    
    // Handle single-click/tap logic (selection)
    handleTileSelection(tile, placeTileCallback, context);
}

// Click handler for tiles (wraps handleTileInteraction)
export function handleTileClick(e, placeTileCallback, removeTileCallback) {
    const tile = e.currentTarget;
    handleTileInteraction(tile, placeTileCallback, removeTileCallback, {}, e);
}

// Slot click handler
export function handleSlotClick(e, placeTileCallback, removeTileCallback) {
    const slot = e.currentTarget;
    // Don't allow clicking locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // If click target is a tile (not the slot itself), let the tile handler deal with it
    // This prevents the slot handler from interfering with tile selection
    const clickedElement = e.target;
    if (clickedElement && (clickedElement.classList?.contains('tile') || clickedElement.closest?.('.tile'))) {
        // Tile click handler will handle this - don't interfere
        return;
    }
    
    const selectedTile = getSelectedTile();
    
    // If a tile is selected, place it in this slot (or swap if slot is filled)
    if (selectedTile && placeTileCallback) {
        debugLog('handleSlotClick: Tile selected, placing in slot');
        placeTileCallback(selectedTile, slot);
        deselectTile();
        return;
    }
    
    // No tile selected - if slot is filled, remove tile (existing behavior)
    // Only remove if clicking on the slot itself, not on the tile
    if (slot.classList.contains('filled')) {
        const tile = slot.querySelector('.tile');
        if (tile && tile.getAttribute('data-locked') !== 'true' && removeTileCallback) {
            removeTileCallback(slot);
        }
    }
}
