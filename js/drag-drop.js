// Drag & drop system for puzzle tiles

import { 
    getDraggedTile, 
    setDraggedTile, 
    clearDraggedTile,
    getSelectedTile,
    clearSelectedTile
} from './puzzle-state.js';
import { createTile, updatePlaceholderTile } from './puzzle-core.js';
import { deselectTile, selectTile } from './keyboard.js';
import { handleTileKeyDown } from './keyboard.js';
import { updateScoreDisplay, updateSubmitButton } from './scoring.js';
import { checkAutoComplete, areAllSlotsFilled } from './auto-complete.js';
import { debugLog as debugLogUtil } from './utils.js';

// Debug logging function that only logs in development mode
function debugLog(...args) {
    debugLogUtil('[Input]', ...args);
}

// Interaction state management to prevent duplicate actions and race conditions
let interactionState = {
    isProcessing: false,
    lastTouchTime: 0,
    touchInteractionActive: false,
    CLICK_DELAY_AFTER_TOUCH: 300, // ms
    lastClickTime: 0,
    lastClickedTile: null,
    DOUBLE_CLICK_THRESHOLD: 300 // ms
};

// Touch drag state
let touchDragState = {
    isDragging: false,
    tile: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    threshold: 10, // pixels to move before drag starts
    dragGhost: null,
    placeTileCallback: null,
    removeTileCallback: null,
    documentTouchMoveHandler: null,
    documentTouchEndHandler: null
};

// Export handlers for use in puzzle-core
export function handleDragStart(e) {
    // Don't allow dragging locked tiles
    if (this.getAttribute('data-locked') === 'true') {
        e.preventDefault();
        return false;
    }
    setDraggedTile(this);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

export function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('drag-over');
    });
}

export function handleDragOver(e) {
    // Don't allow dropping on locked slots
    if (e.currentTarget.getAttribute('data-locked') === 'true') {
        return false;
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.currentTarget.classList.add('drag-over');
    return false;
}

export function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

export function handleDrop(e, placeTileCallback) {
    // Check if this drop was already handled by a tile drop handler
    // (tiles are children of slots, so tile drop handlers fire first in capture phase)
    if (e.defaultPrevented) {
        debugLog('handleDrop: Drop already handled by tile handler, ignoring');
        return false;
    }
    
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.currentTarget.classList.remove('drag-over');
    
    const draggedTile = getDraggedTile();
    if (draggedTile && placeTileCallback) {
        // Check if we're dropping on a slot that contains a tile (should have been handled by tile handler)
        const existingTile = e.currentTarget.querySelector('.tile');
        if (existingTile && existingTile !== draggedTile) {
            debugLog('handleDrop: Slot has tile, but drop should have been handled by tile handler');
            // Still proceed, but this shouldn't normally happen
        }
        
        // Clear dragged tile state before placing
        clearDraggedTile();
        placeTileCallback(draggedTile, e.currentTarget);
    }
    
    return false;
}

// Handle drag over tile (for dropping on tiles in slots)
export function handleTileDragOver(e) {
    // Don't allow dropping on locked tiles
    const tile = e.currentTarget;
    if (tile.getAttribute('data-locked') === 'true') {
        return false;
    }
    
    // Only allow dropping if tile is in a slot
    const slot = tile.closest('.slot');
    if (!slot || slot.getAttribute('data-locked') === 'true') {
        return false;
    }
    
    // Don't allow dropping tile on itself
    const draggedTile = getDraggedTile();
    if (draggedTile === tile) {
        return false;
    }
    
    if (e.preventDefault) {
        e.preventDefault();
    }
    if (e.stopPropagation) {
        e.stopPropagation(); // Prevent slot handler from firing
    }
    
    // Add visual feedback to both tile and slot
    tile.classList.add('drag-over');
    slot.classList.add('drag-over');
    
    return false;
}

// Handle drag leave tile
export function handleTileDragLeave(e) {
    const tile = e.currentTarget;
    tile.classList.remove('drag-over');
    // Also remove from slot if it was added
    const slot = tile.closest('.slot');
    if (slot) {
        slot.classList.remove('drag-over');
    }
}

// Handle drop on tile (for swapping tiles)
export function handleTileDrop(e, placeTileCallback) {
    // Prevent event from bubbling to slot and prevent default
    if (e.preventDefault) {
        e.preventDefault();
    }
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation(); // Prevent other handlers on same element
    }
    
    const targetTile = e.currentTarget;
    const slot = targetTile.closest('.slot');
    
    // Remove drag-over classes
    targetTile.classList.remove('drag-over');
    if (slot) {
        slot.classList.remove('drag-over');
    }
    
    // If tile is in a slot, drop on the slot instead
    if (slot && placeTileCallback) {
        const draggedTile = getDraggedTile();
        if (!draggedTile) {
            debugLog('handleTileDrop: No dragged tile found');
            return false;
        }
        
        if (draggedTile === targetTile) {
            debugLog('handleTileDrop: Cannot drop tile on itself');
            return false;
        }
        
        debugLog('handleTileDrop: Dropping on tile in slot, swapping', {
            dragged: draggedTile.getAttribute('data-letter'),
            target: targetTile.getAttribute('data-letter'),
            draggedSlot: draggedTile.closest('.slot')?.getAttribute('data-slot-index'),
            targetSlot: slot.getAttribute('data-slot-index')
        });
        
        // Clear dragged tile state before placing (placeTileCallback will handle the swap)
        clearDraggedTile();
        
        // Call the place callback which will handle the swap
        placeTileCallback(draggedTile, slot);
    }
    
    return false;
}

// Click handlers for accessibility
export function handleTileClick(e, placeTileCallback, removeTileCallback) {
    const tile = e.currentTarget;
    
    // Don't allow clicking locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Prevent click if interaction is already processing
    if (interactionState.isProcessing) {
        debugLog('handleTileClick: Already processing, ignoring');
        return;
    }
    
    // Prevent click if recent touch interaction occurred (mobile tap-to-click prevention)
    const timeSinceTouch = Date.now() - interactionState.lastTouchTime;
    if (interactionState.touchInteractionActive && timeSinceTouch < interactionState.CLICK_DELAY_AFTER_TOUCH) {
        debugLog('handleTileClick: Recent touch interaction, preventing click');
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    
    // Stop propagation to prevent slot click handler from firing
    e.stopPropagation();
    
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - interactionState.lastClickTime;
    const isDoubleClick = interactionState.lastClickedTile === tile && 
                         timeSinceLastClick < interactionState.DOUBLE_CLICK_THRESHOLD;
    
    // Update last click tracking
    interactionState.lastClickTime = currentTime;
    interactionState.lastClickedTile = tile;
    
    // Handle double-click
    if (isDoubleClick) {
        debugLog('handleTileClick: Double-click detected');
        const isInSlot = tile.closest('.slot');
        const isInContainer = tile.closest('#tiles-container, #archive-tiles-container, #daily-tiles-container');
        
        if (isInSlot) {
            // Double-click on tile in slot - return to container
            debugLog('handleTileClick: Double-click on tile in slot, returning to container');
            const slot = tile.closest('.slot');
            if (slot && removeTileCallback) {
                // Clear selection if this tile was selected
                if (getSelectedTile() === tile) {
                    deselectTile();
                }
                removeTileCallback(slot);
                // Reset double-click tracking to prevent triple-click issues
                interactionState.lastClickedTile = null;
                return;
            }
        } else if (isInContainer) {
            // Double-click on tile in container - place in next available slot
            debugLog('handleTileClick: Double-click on tile in container, placing in next slot');
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
                interactionState.lastClickedTile = null;
                return;
            } else {
                debugLog('handleTileClick: No available slot found for double-click');
            }
        }
    }
    
    // Single-click logic (selection)
    const selectedTile = getSelectedTile();
    
    // If this tile is already selected, deselect it
    if (selectedTile === tile) {
        debugLog('handleTileClick: Tile already selected, deselecting');
        deselectTile();
        return;
    }
    
    // If another tile is selected, swap them
    if (selectedTile && selectedTile !== tile) {
        debugLog('handleTileClick: Another tile selected, swapping');
        const clickedSlot = tile.closest('.slot');
        const selectedSlot = selectedTile.closest('.slot');
        
        // If clicked tile is in a slot, place selected tile there (will swap)
        if (clickedSlot && placeTileCallback) {
            placeTileCallback(selectedTile, clickedSlot);
            deselectTile();
            return;
        }
        
        // If selected tile is in a slot and clicked tile is in container, place clicked tile in selected slot (will swap)
        if (selectedSlot && placeTileCallback) {
            placeTileCallback(tile, selectedSlot);
            deselectTile();
            return;
        }
        
        // Both in containers - just select the new tile
        selectTile(tile);
        return;
    }
    
    // No tile selected - select this tile
    debugLog('handleTileClick: No tile selected, selecting this tile');
    selectTile(tile);
}

export function handleSlotClick(e, placeTileCallback, removeTileCallback) {
    const slot = e.currentTarget;
    // Don't allow clicking locked slots
    if (slot.getAttribute('data-locked') === 'true') {
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
    if (slot.classList.contains('filled')) {
        const tile = slot.querySelector('.tile');
        if (tile && tile.getAttribute('data-locked') !== 'true' && removeTileCallback) {
            removeTileCallback(slot);
        }
    }
}

// Touch drag handlers for mobile devices
export function handleTouchStart(e, placeTileCallback, removeTileCallback) {
    const tile = e.currentTarget;
    
    // Don't allow dragging locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Only handle the first touch
    if (e.touches.length !== 1) {
        return;
    }
    
    const touch = e.touches[0];
    
    // Mark touch interaction as active to prevent click events
    interactionState.touchInteractionActive = true;
    interactionState.lastTouchTime = Date.now();
    
    debugLog('handleTouchStart: Touch started on tile', tile.getAttribute('data-letter'));
    
    // Initialize touch drag state
    touchDragState.tile = tile;
    touchDragState.startX = touch.clientX;
    touchDragState.startY = touch.clientY;
    touchDragState.currentX = touch.clientX;
    touchDragState.currentY = touch.clientY;
    touchDragState.isDragging = false;
    touchDragState.placeTileCallback = placeTileCallback;
    touchDragState.removeTileCallback = removeTileCallback;
    touchDragState.dragGhost = null;
    
    // Store original tile position for visual feedback
    const rect = tile.getBoundingClientRect();
    touchDragState.originalLeft = rect.left;
    touchDragState.originalTop = rect.top;
}

export function handleTouchMove(e) {
    // Only handle single touch
    if (e.touches.length !== 1) {
        return;
    }
    
    if (!touchDragState.tile) {
        return;
    }
    
    const touch = e.touches[0];
    touchDragState.currentX = touch.clientX;
    touchDragState.currentY = touch.clientY;
    
    // Calculate distance moved
    const deltaX = Math.abs(touchDragState.currentX - touchDragState.startX);
    const deltaY = Math.abs(touchDragState.currentY - touchDragState.startY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // If threshold exceeded and not yet dragging, start drag
    if (!touchDragState.isDragging && distance > touchDragState.threshold) {
        touchDragState.isDragging = true;
        
        // Prevent scrolling during drag
        e.preventDefault();
        
        // Set dragged tile state
        setDraggedTile(touchDragState.tile);
        touchDragState.tile.classList.add('dragging');
        
        // Create visual ghost element
        const ghost = touchDragState.tile.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '10000';
        ghost.style.opacity = '0.7';
        ghost.style.transform = 'scale(1.1)';
        ghost.style.transition = 'none';
        document.body.appendChild(ghost);
        touchDragState.dragGhost = ghost;
        
        // Hide original tile slightly
        touchDragState.tile.style.opacity = '0.5';
        
        // Attach document-level touch handlers for dragging outside tile bounds
        touchDragState.documentTouchMoveHandler = handleTouchMove;
        touchDragState.documentTouchEndHandler = handleTouchEnd;
        document.addEventListener('touchmove', touchDragState.documentTouchMoveHandler, { passive: false });
        document.addEventListener('touchend', touchDragState.documentTouchEndHandler, { passive: false });
        document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    }
    
    // If actively dragging, update position and check drop targets
    if (touchDragState.isDragging) {
        e.preventDefault(); // Prevent scrolling
        
        // Update ghost position
        if (touchDragState.dragGhost) {
            touchDragState.dragGhost.style.left = (touch.clientX - touchDragState.dragGhost.offsetWidth / 2) + 'px';
            touchDragState.dragGhost.style.top = (touch.clientY - touchDragState.dragGhost.offsetHeight / 2) + 'px';
        }
        
        // Find element under touch point
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Clear previous drag-over highlights
        document.querySelectorAll('.slot.drag-over').forEach(slot => {
            slot.classList.remove('drag-over');
        });
        document.querySelectorAll('.tile.drag-over').forEach(tile => {
            tile.classList.remove('drag-over');
        });
        
        // Check if over a valid drop target
        if (elementBelow) {
            // Check if over a tile in a slot (for swapping)
            const tile = elementBelow.closest('.tile');
            if (tile && tile.getAttribute('data-locked') !== 'true') {
                const slot = tile.closest('.slot');
                if (slot && slot.getAttribute('data-locked') !== 'true') {
                    tile.classList.add('drag-over');
                    slot.classList.add('drag-over');
                }
            } else {
                // Check if over a slot
                const slot = elementBelow.closest('.slot');
                if (slot && slot.getAttribute('data-locked') !== 'true') {
                    slot.classList.add('drag-over');
                }
            }
        }
    }
}

export function handleTouchEnd(e) {
    if (!touchDragState.tile) {
        return; // Already cleaned up or never started
    }
    
    // Only handle if we have a touch (or if drag was active)
    const touch = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null;
    
    if (touchDragState.isDragging) {
        // Note: preventDefault not needed here - scrolling is already prevented during drag via touchmove
        // and touchend listeners may be passive, so we can't call preventDefault anyway
        
        debugLog('handleTouchEnd: Drag ended, finding drop target');
        
        // Find drop target
        let dropTarget = null;
        if (touch) {
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elementBelow) {
                // First check if dropped on a tile (for swapping)
                const tile = elementBelow.closest('.tile');
                if (tile && tile.getAttribute('data-locked') !== 'true') {
                    const slot = tile.closest('.slot');
                    if (slot && slot.getAttribute('data-locked') !== 'true') {
                        dropTarget = slot;
                        debugLog('handleTouchEnd: Dropped on tile, will swap');
                    }
                }
                
                // If not dropped on tile, check for slot
                if (!dropTarget) {
                    const slot = elementBelow.closest('.slot');
                    if (slot && slot.getAttribute('data-locked') !== 'true') {
                        dropTarget = slot;
                    }
                }
                
                // Also check if dropped on tiles container (check for daily- prefix too)
                const container = elementBelow.closest('#tiles-container, #archive-tiles-container, #daily-tiles-container');
                if (container && !dropTarget) {
                    // Return tile to container if it came from a slot
                    const slot = touchDragState.tile.closest('.slot');
                    if (slot && touchDragState.removeTileCallback) {
                        debugLog('handleTouchEnd: Dropped on container, returning tile');
                        touchDragState.removeTileCallback(slot);
                    }
                }
            }
        }
        
        // Place tile if valid drop target found
        if (dropTarget && touchDragState.placeTileCallback) {
            debugLog('handleTouchEnd: Dropped on slot, placing tile');
            touchDragState.placeTileCallback(touchDragState.tile, dropTarget);
        }
    } else {
        // This was a tap (not a drag) - handle it like a click with selection logic
        const tile = touchDragState.tile;
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - interactionState.lastClickTime;
        const isDoubleTap = interactionState.lastClickedTile === tile && 
                           timeSinceLastClick < interactionState.DOUBLE_CLICK_THRESHOLD;
        
        // Update last click tracking (shared with mouse clicks)
        interactionState.lastClickTime = currentTime;
        interactionState.lastClickedTile = tile;
        
        // Handle double-tap
        if (isDoubleTap) {
            debugLog('handleTouchEnd: Double-tap detected');
            const isInSlot = tile.closest('.slot');
            const isInContainer = tile.closest('#tiles-container, #archive-tiles-container, #daily-tiles-container');
            
            if (isInSlot) {
                // Double-tap on tile in slot - return to container
                debugLog('handleTouchEnd: Double-tap on tile in slot, returning to container');
                const slot = tile.closest('.slot');
                if (slot && touchDragState.removeTileCallback) {
                    // Clear selection if this tile was selected
                    if (getSelectedTile() === tile) {
                        deselectTile();
                    }
                    touchDragState.removeTileCallback(slot);
                    // Reset double-tap tracking to prevent triple-tap issues
                    interactionState.lastClickedTile = null;
                    return;
                }
            } else if (isInContainer) {
                // Double-tap on tile in container - place in next available slot
                debugLog('handleTouchEnd: Double-tap on tile in container, placing in next slot');
                const allSlots = document.querySelectorAll('.slot:not([data-locked="true"])');
                let targetSlot = null;
                
                // Find first empty slot
                for (const slot of allSlots) {
                    if (!slot.classList.contains('filled')) {
                        targetSlot = slot;
                        break;
                    }
                }
                
                if (targetSlot && touchDragState.placeTileCallback) {
                    // Clear selection if this tile was selected
                    if (getSelectedTile() === tile) {
                        deselectTile();
                    }
                    touchDragState.placeTileCallback(tile, targetSlot);
                    // Reset double-tap tracking to prevent triple-tap issues
                    interactionState.lastClickedTile = null;
                    return;
                } else {
                    debugLog('handleTouchEnd: No available slot found for double-tap');
                }
            }
        }
        
        // Single-tap logic (selection)
        const selectedTile = getSelectedTile();
        
        // If this tile is already selected, deselect it
        if (selectedTile === tile) {
            debugLog('handleTouchEnd: Tile already selected, deselecting');
            deselectTile();
            return;
        }
        
        // If another tile is selected, swap them
        if (selectedTile && selectedTile !== tile) {
            debugLog('handleTouchEnd: Another tile selected, swapping');
            
            // Validate selected tile exists before using
            let actualSelectedTile = selectedTile;
            if (!validateTileExists(selectedTile)) {
                // Try to find actual tile in container
                const letter = selectedTile.getAttribute('data-letter');
                const index = selectedTile.getAttribute('data-tile-index');
                if (letter && index !== null) {
                    // Try to get context from touchDragState or use empty context
                    const context = touchDragState.placeTileCallback ? { prefix: '' } : {};
                    const foundTile = findTileInContainer(letter, index, context);
                    if (foundTile) {
                        actualSelectedTile = foundTile;
                        debugLog('handleTouchEnd: Found actual tile in container, using it');
                    } else {
                        // Tile doesn't exist anywhere, clear selection and return
                        debugLog('handleTouchEnd: Selected tile not found, clearing selection');
                        deselectTile();
                        selectTile(tile);
                        return;
                    }
                } else {
                    // No letter/index, clear selection and return
                    debugLog('handleTouchEnd: Selected tile has no data, clearing selection');
                    deselectTile();
                    selectTile(tile);
                    return;
                }
            }
            
            const clickedSlot = tile.closest('.slot');
            const selectedSlot = actualSelectedTile.closest('.slot');
            
            // If clicked tile is in a slot, place selected tile there (will swap)
            if (clickedSlot && touchDragState.placeTileCallback) {
                touchDragState.placeTileCallback(actualSelectedTile, clickedSlot);
                deselectTile();
                return;
            }
            
            // If selected tile is in a slot and clicked tile is in container, place clicked tile in selected slot (will swap)
            if (selectedSlot && touchDragState.placeTileCallback) {
                touchDragState.placeTileCallback(tile, selectedSlot);
                deselectTile();
                return;
            }
            
            // Both in containers - just select the new tile
            selectTile(tile);
            return;
        }
        
        // No tile selected - select this tile
        debugLog('handleTouchEnd: No tile selected, selecting this tile');
        selectTile(tile);
    }
    
    // Clean up drag state (idempotent - safe to call multiple times)
    cleanupTouchDrag();
    
    // Reset touch interaction flag after a delay to allow click events to be processed
    setTimeout(() => {
        interactionState.touchInteractionActive = false;
    }, interactionState.CLICK_DELAY_AFTER_TOUCH);
}

// Clean up touch drag state
function cleanupTouchDrag() {
    // Remove document-level listeners
    if (touchDragState.documentTouchMoveHandler) {
        document.removeEventListener('touchmove', touchDragState.documentTouchMoveHandler);
        touchDragState.documentTouchMoveHandler = null;
    }
    if (touchDragState.documentTouchEndHandler) {
        document.removeEventListener('touchend', touchDragState.documentTouchEndHandler);
        touchDragState.documentTouchEndHandler = null;
    }
    document.removeEventListener('touchcancel', handleTouchCancel);
    
    // Remove ghost element
    if (touchDragState.dragGhost) {
        touchDragState.dragGhost.remove();
        touchDragState.dragGhost = null;
    }
    
    // Restore original tile
    if (touchDragState.tile) {
        touchDragState.tile.classList.remove('dragging');
        touchDragState.tile.style.opacity = '';
    }
    
    // Clear drag-over highlights
    document.querySelectorAll('.slot.drag-over').forEach(slot => {
        slot.classList.remove('drag-over');
    });
    document.querySelectorAll('.tile.drag-over').forEach(tile => {
        tile.classList.remove('drag-over');
    });
    
    // Clear state
    clearDraggedTile();
    touchDragState.isDragging = false;
    touchDragState.tile = null;
    touchDragState.placeTileCallback = null;
    touchDragState.removeTileCallback = null;
}

// Handle touch cancel (e.g., system gesture interrupts)
export function handleTouchCancel(e) {
    debugLog('handleTouchCancel: Touch cancelled');
    cleanupTouchDrag();
    // Reset touch interaction flag
    setTimeout(() => {
        interactionState.touchInteractionActive = false;
    }, interactionState.CLICK_DELAY_AFTER_TOUCH);
}

// Helper function to attach handlers to a tile
function attachTileHandlers(tile, context, isInSlot = false) {
    const isLocked = tile.getAttribute('data-locked') === 'true';
    
    if (isLocked) {
        return; // No handlers for locked tiles
    }
    
    debugLog('attachTileHandlers: Attaching handlers to tile', tile.getAttribute('data-letter'), 'isInSlot:', isInSlot);
    
    // Attach drag handlers
    tile.addEventListener('dragstart', handleDragStart);
    tile.addEventListener('dragend', handleDragEnd);
    
    // Get callbacks from context
    const placeTileCallback = context.placeTileCallback || ((tile, slot) => placeTileInSlot(tile, slot, context));
    const removeTileCallback = context.removeTileCallback;
    
    // If tile is in a slot, make it a drop target for swapping
    if (isInSlot) {
        // Make tile droppable
        tile.setAttribute('droppable', 'true');
        debugLog('attachTileHandlers: Making tile droppable', tile.getAttribute('data-letter'));
        // Use capture phase to handle before slot handlers
        tile.addEventListener('dragover', (e) => {
            debugLog('Tile dragover event fired', tile.getAttribute('data-letter'));
            handleTileDragOver(e);
        }, true);
        tile.addEventListener('dragleave', (e) => {
            debugLog('Tile dragleave event fired', tile.getAttribute('data-letter'));
            handleTileDragLeave(e);
        }, true);
        tile.addEventListener('drop', (e) => {
            debugLog('Tile drop event fired', tile.getAttribute('data-letter'));
            handleTileDrop(e, placeTileCallback);
        }, true); // Use capture phase to handle before slot
        
        // Tile in slot: clicking uses selection logic
        tile.addEventListener('click', (e) => {
            handleTileClick(e, placeTileCallback, removeTileCallback);
        });
    } else {
        // Tile in container: clicking places it
        tile.addEventListener('click', (e) => {
            handleTileClick(e, placeTileCallback, removeTileCallback);
        });
    }
    
    // Attach touch handlers if available in context
    if (context.handlers) {
        if (context.handlers.onTouchStart) {
            tile.addEventListener('touchstart', context.handlers.onTouchStart, { passive: true });
        }
        if (context.handlers.onTouchMove) {
            tile.addEventListener('touchmove', context.handlers.onTouchMove, { passive: false });
        }
        if (context.handlers.onTouchEnd) {
            tile.addEventListener('touchend', context.handlers.onTouchEnd, { passive: true });
        }
        if (context.handlers.onTouchCancel) {
            tile.addEventListener('touchcancel', context.handlers.onTouchCancel, { passive: true });
        }
    } else {
        // Fallback: create touch handlers with callbacks from context
        tile.addEventListener('touchstart', (e) => handleTouchStart(e, placeTileCallback, removeTileCallback), { passive: true });
        tile.addEventListener('touchmove', handleTouchMove, { passive: false });
        tile.addEventListener('touchend', handleTouchEnd, { passive: true });
        tile.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    }
    
    // Attach keyboard handler with context
    tile.addEventListener('keydown', (e) => handleTileKeyDown(e, context));
}

// Validation helpers to ensure tiles are never deleted
function validateTileExists(tile) {
    // Check if tile is still in the DOM
    return tile && tile.parentNode !== null && document.contains(tile);
}

function ensureTilePreserved(tile, context = {}) {
    // Recovery function: if tile is not in DOM, recreate it in container
    if (!validateTileExists(tile)) {
        const letter = tile.getAttribute('data-letter');
        const originalIndex = tile.getAttribute('data-tile-index');
        const isArchivePuzzle = context.isArchive;
        
        if (letter && originalIndex !== null) {
            console.warn('Tile was lost, recovering to container:', letter, originalIndex);
            if (isArchivePuzzle && context.returnArchiveTileToContainer) {
                context.returnArchiveTileToContainer(letter, originalIndex);
            } else {
                returnTileToContainer(letter, originalIndex, context.handlers || {});
            }
            return true; // Recovery attempted
        }
    }
    return false; // No recovery needed or possible
}

// Place tile in slot
export function placeTileInSlot(tile, slot, context = {}) {
    // Guard: prevent concurrent executions
    if (interactionState.isProcessing) {
        debugLog('placeTileInSlot: Already processing, ignoring duplicate call');
        return;
    }
    
    interactionState.isProcessing = true;
    
    const isKeyboardNavigation = context.isKeyboardNavigation || false;
    try {
        debugLog('placeTileInSlot: Starting', {
            tile: tile.getAttribute('data-letter'),
            slot: slot.getAttribute('data-slot-index'),
            word: slot.getAttribute('data-word-index')
        });
        
        // Validate inputs
        if (!tile || !slot) {
            console.error('placeTileInSlot: Invalid tile or slot');
            return;
        }
        
        // Don't allow placing tiles in locked slots
        if (slot.getAttribute('data-locked') === 'true') {
            debugLog('placeTileInSlot: Slot is locked, aborting');
            return;
        }
        
        // Don't allow placing locked tiles
        if (tile.getAttribute('data-locked') === 'true') {
            debugLog('placeTileInSlot: Tile is locked, aborting');
            return;
        }
        
        // Validate tile exists before proceeding
        if (!validateTileExists(tile)) {
            console.error('placeTileInSlot: Tile does not exist in DOM');
            
            // Try to find existing tile in container before recovery
            const letter = tile.getAttribute('data-letter');
            const originalIndex = tile.getAttribute('data-tile-index');
            if (letter && originalIndex !== null) {
                const existingTile = findTileInContainer(letter, originalIndex, context);
                if (existingTile) {
                    debugLog('placeTileInSlot: Found existing tile in container, using it');
                    // Use the existing tile instead
                    tile = existingTile;
                } else {
                    // Tile truly doesn't exist, attempt recovery
                    ensureTilePreserved(tile, context);
                    return;
                }
            } else {
                // No letter/index, can't recover
                console.error('placeTileInSlot: Tile has no letter/index, cannot recover');
                return;
            }
        }
        
        // Check if tile is already in this slot (prevent duplicate placement)
        const existingTileInSlot = slot.querySelector('.tile');
        if (existingTileInSlot === tile) {
            debugLog('placeTileInSlot: Tile already in this slot, ignoring');
            return;
        }
        
        // Clear selected tile if this is the selected one
        if (getSelectedTile() === tile) {
            deselectTile();
        }
        
        const existingTile = slot.querySelector('.tile');
        
        // Check if slot already has a tile - if so, swap them (but not if existing is locked)
        if (existingTile) {
            if (existingTile.getAttribute('data-locked') === 'true') {
                return; // Can't swap with locked tile
            }
            // Call swapTiles - it will handle isProcessing flag correctly
            swapTiles(tile, existingTile, slot, { ...context, isKeyboardNavigation });
            return;
        }

        // Check if tile is already in a slot (being moved from one slot to another or back to container)
        const isFromSlot = tile.closest('.slot');
        const prefix = context?.prefix || '';
        const tilesContainerId = prefix ? `${prefix}tiles-container` : 'tiles-container';
        const isFromContainer = tile.closest(`#${tilesContainerId}`);
        const isFromArchiveContainer = tile.closest('#archive-tiles-container');
        const wordSlotsContainerId = prefix ? `${prefix}word-slots` : 'word-slots';
        const isArchivePuzzle = slot.closest('#archive-word-slots') !== null || context.isArchive;
        const isDailyPuzzle = !isArchivePuzzle && prefix === 'daily-';
        
        // SAFEGUARD: Clone tile BEFORE removing original
        const clonedTile = tile.cloneNode(true);
        const isLocked = slot.getAttribute('data-locked') === 'true';
        clonedTile.setAttribute('draggable', isLocked ? 'false' : 'true');
        if (isLocked) {
            clonedTile.setAttribute('data-locked', 'true');
            clonedTile.classList.add('locked');
        }
        clonedTile.classList.remove('dragging');
        // Reset any inline styles that might have been set during drag
        clonedTile.style.opacity = '';
        
        // Attach handlers using helper function (tile will be in slot)
        attachTileHandlers(clonedTile, context, true);

        // Place cloned tile in slot first
        slot.appendChild(clonedTile);
        slot.classList.add('filled');
        slot.classList.remove('drag-over');

        // SAFEGUARD: Only remove original tile AFTER successful placement
        // Validate tile still exists before removing
        if (validateTileExists(tile)) {
            tile.remove();
            debugLog('placeTileInSlot: Original tile removed');
            
            // If tile was from container, update placeholder
            if (isFromContainer) {
                updatePlaceholderTile(tilesContainerId);
            } else if (isFromArchiveContainer) {
                updatePlaceholderTile('archive-tiles-container');
            }
            
            // If tile was in a slot, remove filled class
            if (isFromSlot) {
                isFromSlot.classList.remove('filled');
            }
        } else {
            // Tile was already removed - this shouldn't happen but handle gracefully
            console.warn('placeTileInSlot: Original tile was already removed');
        }

        debugLog('placeTileInSlot: Successfully placed tile');

        // Update score and submit button state
        if (isArchivePuzzle && context.updateArchiveScoreDisplay) {
            context.updateArchiveScoreDisplay();
            if (context.updateArchiveSubmitButton) {
                context.updateArchiveSubmitButton();
            }
            // Check if solution is automatically complete (archive puzzle)
            // Only check if all slots are filled (optimization)
            // Use requestAnimationFrame to ensure DOM is fully updated
            requestAnimationFrame(() => {
                if (areAllSlotsFilled()) {
                    checkAutoComplete();
                }
            });
        } else {
            // Pass prefix to updateScoreDisplay for daily puzzle support
            updateScoreDisplay(prefix);
            updateSubmitButton();
            // Check if solution is automatically complete
            // Only check if all slots are filled (optimization)
            // Use requestAnimationFrame to ensure DOM is fully updated
            // checkAutoComplete uses stored values from initAutoComplete
            requestAnimationFrame(() => {
                debugLog('placeTileInSlot: Checking if all slots filled after tile placement');
                if (areAllSlotsFilled()) {
                    debugLog('placeTileInSlot: All slots filled, calling checkAutoComplete');
                    checkAutoComplete(null, prefix);
                } else {
                    debugLog('placeTileInSlot: Not all slots filled yet, skipping auto-complete check');
                }
            });
        }
        
        // Focus the slot after placement only for keyboard navigation
        // Don't focus for drag/touch interactions
        if (isKeyboardNavigation) {
            setTimeout(() => {
                if (document.contains(slot)) {
                    slot.focus();
                }
            }, 0);
        }
    } catch (error) {
        console.error('placeTileInSlot error:', error);
        debugLog('placeTileInSlot: Error occurred', error);
        // Recovery: ensure tile is preserved
        ensureTilePreserved(tile, context);
    } finally {
        interactionState.isProcessing = false;
    }
}

// Swap two tiles between slots or container
function swapTiles(draggedTile, existingTile, targetSlot, context = {}) {
    // Guard: prevent concurrent executions
    // Note: This may be called from placeTileInSlot which already set isProcessing,
    // so we check and only set if not already processing
    const wasAlreadyProcessing = interactionState.isProcessing;
    if (wasAlreadyProcessing) {
        debugLog('swapTiles: Called from placeTileInSlot, proceeding with swap');
    }
    
    if (!wasAlreadyProcessing) {
        interactionState.isProcessing = true;
    }
    
    const isKeyboardNavigation = context.isKeyboardNavigation || false;
    try {
        // Validate inputs
        if (!draggedTile || !existingTile || !targetSlot) {
            console.error('swapTiles: Invalid tiles or slot');
            // Ensure tiles are preserved
            if (draggedTile) ensureTilePreserved(draggedTile, context);
            if (existingTile) ensureTilePreserved(existingTile, context);
            return;
        }
        
        // Validate tiles exist before proceeding, and find actual tiles if needed
        let actualDraggedTile = draggedTile;
        if (!validateTileExists(draggedTile)) {
            console.error('swapTiles: Dragged tile does not exist in DOM');
            // Try to find existing tile in container before recovery
            const draggedLetter = draggedTile.getAttribute('data-letter');
            const draggedIndex = draggedTile.getAttribute('data-tile-index');
            if (draggedLetter && draggedIndex !== null) {
                const foundDraggedTile = findTileInContainer(draggedLetter, draggedIndex, context);
                if (foundDraggedTile) {
                    debugLog('swapTiles: Found existing dragged tile in container, using it');
                    actualDraggedTile = foundDraggedTile;
                } else {
                    ensureTilePreserved(draggedTile, context);
                    return;
                }
            } else {
                ensureTilePreserved(draggedTile, context);
                return;
            }
        }
        
        let actualExistingTile = existingTile;
        if (!validateTileExists(existingTile)) {
            console.error('swapTiles: Existing tile does not exist in DOM');
            // Try to find existing tile in container before recovery
            const existingLetter = existingTile.getAttribute('data-letter');
            const existingIndex = existingTile.getAttribute('data-tile-index');
            if (existingLetter && existingIndex !== null) {
                const foundExistingTile = findTileInContainer(existingLetter, existingIndex, context);
                if (foundExistingTile) {
                    debugLog('swapTiles: Found existing tile in container, using it');
                    actualExistingTile = foundExistingTile;
                } else {
                    ensureTilePreserved(existingTile, context);
                    return;
                }
            } else {
                ensureTilePreserved(existingTile, context);
                return;
            }
        }
        
        debugLog('swapTiles: Starting swap', {
            dragged: actualDraggedTile.getAttribute('data-letter'),
            existing: actualExistingTile.getAttribute('data-letter'),
            slot: targetSlot.getAttribute('data-slot-index')
        });
        
        // Prevent swapping tile with itself
        if (actualDraggedTile === actualExistingTile) {
            debugLog('swapTiles: Cannot swap tile with itself');
            return;
        }
        
        const draggedSlot = actualDraggedTile.closest('.slot');
        const draggedLetter = actualDraggedTile.getAttribute('data-letter');
        const draggedIndex = actualDraggedTile.getAttribute('data-tile-index');
        const existingLetter = actualExistingTile.getAttribute('data-letter');
        const existingIndex = actualExistingTile.getAttribute('data-tile-index');
        
        // Clear selected tile if either tile is selected
        if (getSelectedTile() === actualDraggedTile || getSelectedTile() === actualExistingTile) {
            deselectTile();
        }
        
        const isDraggedFromContainer = actualDraggedTile.closest('#tiles-container');
        const isDraggedFromArchiveContainer = actualDraggedTile.closest('#archive-tiles-container');
        const isArchivePuzzle = targetSlot.closest('#archive-word-slots') !== null || context.isArchive;
        const prefix = context?.prefix || '';
        
        // SAFEGUARD: Clone both tiles BEFORE removing originals
        const clonedDraggedTile = actualDraggedTile.cloneNode(true);
        clonedDraggedTile.setAttribute('draggable', 'true');
        clonedDraggedTile.classList.remove('dragging');
        clonedDraggedTile.style.opacity = ''; // Reset any inline styles from drag
        // Attach handlers - dragged tile will be in target slot
        attachTileHandlers(clonedDraggedTile, context, true);
        
        const clonedExistingTile = actualExistingTile.cloneNode(true);
        clonedExistingTile.setAttribute('draggable', 'true');
        clonedExistingTile.classList.remove('dragging');
        clonedExistingTile.style.opacity = ''; // Reset any inline styles from drag
        
        // Place cloned tiles first
        // If dragged tile was from a slot, place existing tile there
        if (draggedSlot) {
            // Attach handlers - existing tile will be in dragged slot
            attachTileHandlers(clonedExistingTile, context, true);
            draggedSlot.appendChild(clonedExistingTile);
            draggedSlot.classList.add('filled');
        } else {
            // If dragged tile was from container, return existing tile to container
            // Check if archive mode: either target slot is in archive OR dragged tile is from archive container
            const shouldUseArchiveReturn = (isArchivePuzzle || isDraggedFromArchiveContainer) && context.returnArchiveTileToContainer;
            if (shouldUseArchiveReturn) {
                context.returnArchiveTileToContainer(existingLetter, existingIndex);
            } else {
                returnTileToContainer(existingLetter, existingIndex, context.handlers || {}, isKeyboardNavigation, prefix, context);
            }
        }
        
        // Place dragged tile in target slot
        targetSlot.appendChild(clonedDraggedTile);
        targetSlot.classList.add('filled');
        targetSlot.classList.remove('drag-over');
        
        // SAFEGUARD: Only remove original tiles AFTER successful placement
        // Validate tiles still exist before removing
        if (validateTileExists(actualDraggedTile)) {
            actualDraggedTile.remove();
            debugLog('swapTiles: Dragged tile removed');
        } else {
            console.warn('swapTiles: Dragged tile was already removed');
        }
        
        if (validateTileExists(actualExistingTile)) {
            actualExistingTile.remove();
            debugLog('swapTiles: Existing tile removed');
        } else {
            console.warn('swapTiles: Existing tile was already removed');
        }

        debugLog('swapTiles: Successfully swapped tiles');

        // If dragged tile was from container, update placeholder
        if (isDraggedFromContainer) {
            updatePlaceholderTile('tiles-container');
        } else if (isDraggedFromArchiveContainer) {
            updatePlaceholderTile('archive-tiles-container');
        }
        
        // Update score and submit button state
        if (isArchivePuzzle && context.updateArchiveScoreDisplay) {
            context.updateArchiveScoreDisplay();
            if (context.updateArchiveSubmitButton) {
                context.updateArchiveSubmitButton();
            }
            // Check if solution is automatically complete (archive puzzle)
            // Only check if all slots are filled (optimization)
            // Use requestAnimationFrame to ensure DOM is fully updated
            requestAnimationFrame(() => {
                if (areAllSlotsFilled()) {
                    checkAutoComplete();
                }
            });
        } else {
            // Pass prefix to updateScoreDisplay for daily puzzle support
            updateScoreDisplay(prefix);
            updateSubmitButton();
            // Check if solution is automatically complete
            // Only check if all slots are filled (optimization)
            // Use requestAnimationFrame to ensure DOM is fully updated
            requestAnimationFrame(() => {
                if (areAllSlotsFilled()) {
                    checkAutoComplete(null, prefix);
                }
            });
        }
        
        // Focus the target slot after swap only for keyboard navigation
        // Don't focus for drag/touch interactions
        // The existing tile returned to container will get focus from returnTileToContainer() if keyboard nav
        if (isKeyboardNavigation) {
            setTimeout(() => {
                if (document.contains(targetSlot)) {
                    targetSlot.focus();
                }
            }, 0);
        }
    } catch (error) {
        console.error('swapTiles error:', error);
        debugLog('swapTiles: Error occurred', error);
        // Recovery: ensure both tiles are preserved
        ensureTilePreserved(actualDraggedTile, context);
        ensureTilePreserved(actualExistingTile, context);
    } finally {
        // Only clear isProcessing if we set it (not if called from placeTileInSlot)
        if (!wasAlreadyProcessing) {
            interactionState.isProcessing = false;
        }
    }
}

// Remove tile from slot
export function removeTileFromSlot(slot, context = {}) {
    const isKeyboardNavigation = context.isKeyboardNavigation || false;
    try {
        const tile = slot.querySelector('.tile');
        if (!tile) return;
        
        // Don't allow removing locked tiles
        if (tile.getAttribute('data-locked') === 'true') {
            return;
        }

        // SAFEGUARD: Extract tile data BEFORE removing
        const letter = tile.getAttribute('data-letter');
        const originalIndex = tile.getAttribute('data-tile-index');
        const prefix = context?.prefix || '';
        const wordSlotsContainerId = prefix ? `${prefix}word-slots` : 'word-slots';
        const isArchivePuzzle = slot.closest('#archive-word-slots') !== null || context.isArchive;
        
        // Validate we have the necessary data
        if (!letter || originalIndex === null) {
            console.error('removeTileFromSlot: Missing tile data');
            return;
        }
        
        // Validate tile exists before removing
        if (!validateTileExists(tile)) {
            console.error('removeTileFromSlot: Tile does not exist in DOM');
            return;
        }
        
        // Clear selected tile if it matches the removed tile
        if (getSelectedTile() === tile) {
            clearSelectedTile();
        }
        
        // Remove from slot
        tile.remove();
        slot.classList.remove('filled');

        debugLog('removeTileFromSlot: Successfully removed tile');

        // Update score display before returning tile to container
        if (isArchivePuzzle && context.updateArchiveScoreDisplay) {
            context.updateArchiveScoreDisplay();
            if (context.updateArchiveSubmitButton) {
                context.updateArchiveSubmitButton();
            }
        } else {
            updateScoreDisplay(prefix);
            updateSubmitButton();
        }

        // Add back to tiles container (creates new tile, so safe)
        if (isArchivePuzzle && context.returnArchiveTileToContainer) {
            // Pass isKeyboardNavigation to archive return function
            context.returnArchiveTileToContainer(letter, originalIndex, isKeyboardNavigation);
        } else {
            returnTileToContainer(letter, originalIndex, context.handlers || {}, isKeyboardNavigation, prefix, context);
        }
    } catch (error) {
        console.error('removeTileFromSlot error:', error);
        debugLog('removeTileFromSlot: Error occurred', error);
        // Recovery: try to preserve tile if still in slot
        const tile = slot.querySelector('.tile');
        if (tile && validateTileExists(tile)) {
            const letter = tile.getAttribute('data-letter');
            const originalIndex = tile.getAttribute('data-tile-index');
            if (letter && originalIndex !== null) {
                const isArchivePuzzle = slot.closest('#archive-word-slots') !== null || context.isArchive;
                if (isArchivePuzzle && context.returnArchiveTileToContainer) {
                    context.returnArchiveTileToContainer(letter, originalIndex, isKeyboardNavigation);
                } else {
                    returnTileToContainer(letter, originalIndex, context.handlers || {}, isKeyboardNavigation, '', context);
                }
            }
        }
    } finally {
        interactionState.isProcessing = false;
    }
}

// Return tile to the starting container
export function returnTileToContainer(letter, originalIndex, handlers = {}, isKeyboardNavigation = false, prefix = '', context = null) {
    // Try to detect which container to use
    let tilesContainer = null;
    let containerId = '';
    let isArchive = false;
    let detectedPrefix = prefix;
    
    // If prefix provided, use it
    if (prefix) {
        containerId = `${prefix}tiles-container`;
        tilesContainer = document.getElementById(containerId);
    }
    
    // Try regular container if prefix container not found
    if (!tilesContainer) {
        tilesContainer = document.getElementById('tiles-container');
        if (tilesContainer) {
            containerId = 'tiles-container';
            detectedPrefix = '';
        }
    }
    
    // Fallback: check for archive container if regular container not found
    if (!tilesContainer) {
        tilesContainer = document.getElementById('archive-tiles-container');
        if (tilesContainer) {
            containerId = 'archive-tiles-container';
            isArchive = true;
        }
    }
    
    // Fallback: check for daily container
    if (!tilesContainer) {
        tilesContainer = document.getElementById('daily-tiles-container');
        if (tilesContainer) {
            containerId = 'daily-tiles-container';
            detectedPrefix = 'daily-';
        }
    }
    
    if (!tilesContainer) {
        console.error('No tiles container found - cannot return tile to container');
        return;
    }
    
    let newTile;
    
    // If context is provided, use attachTileHandlers to ensure proper handler attachment
    // This fixes the issue where tiles returned to container weren't moveable
    if (context) {
        // Create tile without handlers first (createTile will still set up basic attributes)
        newTile = createTile(letter, originalIndex, false, {});
        // Then attach handlers using attachTileHandlers which properly sets up click/touch handlers
        attachTileHandlers(newTile, context, false);
    } else {
        // Fallback: use handlers parameter if no context provided (for backward compatibility)
        newTile = createTile(letter, originalIndex, false, handlers);
    }
    
    tilesContainer.appendChild(newTile);

    // Update placeholder visibility
    updatePlaceholderTile(containerId);

    // Update score and submit button state (only for regular puzzles, archive handles its own)
    if (!isArchive) {
        updateScoreDisplay(detectedPrefix);
        updateSubmitButton();
        // Check if solution is automatically complete
        // Only check if all slots are filled (optimization)
        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
            if (areAllSlotsFilled()) {
                checkAutoComplete(null, detectedPrefix);
            }
        });
    }
    
    // Focus the new tile only for keyboard navigation
    // Don't focus for drag/touch interactions
    if (isKeyboardNavigation) {
        setTimeout(() => {
            newTile.focus();
        }, 50);
    }
}

// Handle drag over tiles container
export function handleTilesContainerDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// Handle drop on tiles container
export function handleTilesContainerDrop(e, context = {}) {
    try {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        const draggedTile = getDraggedTile();
        if (!draggedTile) {
            return false;
        }
        
        // Validate tile exists
        if (!validateTileExists(draggedTile)) {
            console.error('handleTilesContainerDrop: Dragged tile does not exist in DOM');
            return false;
        }
        
        // Check if tile is from a slot
        const slot = draggedTile.closest('.slot');
        if (slot) {
            // SAFEGUARD: Extract tile data BEFORE removing
            const letter = draggedTile.getAttribute('data-letter');
            const originalIndex = draggedTile.getAttribute('data-tile-index');
            const prefix = context?.prefix || '';
            const containerId = e.currentTarget.id;
            const isArchivePuzzle = slot.closest('#archive-word-slots') !== null || context.isArchive;
            const isArchiveContainer = containerId === 'archive-tiles-container';
            const isDailyContainer = containerId === 'daily-tiles-container';
            
            // Validate we have the necessary data
            if (!letter || originalIndex === null) {
                console.error('handleTilesContainerDrop: Missing tile data');
                return false;
            }
            
            // Remove from slot
            draggedTile.remove();
            slot.classList.remove('filled');
            
            // Add back to container (creates new tile, so safe)
            if ((isArchivePuzzle || isArchiveContainer) && context.returnArchiveTileToContainer) {
                context.returnArchiveTileToContainer(letter, originalIndex);
            } else {
                const detectedPrefix = isDailyContainer ? 'daily-' : prefix;
                returnTileToContainer(letter, originalIndex, context.handlers || {}, false, detectedPrefix, context);
            }
        }
        
        return false;
    } catch (error) {
        console.error('handleTilesContainerDrop error:', error);
        // Recovery: try to preserve tile
        const draggedTile = getDraggedTile();
        if (draggedTile && validateTileExists(draggedTile)) {
            const slot = draggedTile.closest('.slot');
            if (slot) {
                const letter = draggedTile.getAttribute('data-letter');
                const originalIndex = draggedTile.getAttribute('data-tile-index');
                if (letter && originalIndex !== null) {
                    const prefix = context?.prefix || '';
                    const containerId = e.currentTarget?.id || '';
                    const isArchivePuzzle = slot.closest('#archive-word-slots') !== null || context.isArchive;
                    const isArchiveContainer = containerId === 'archive-tiles-container';
                    const isDailyContainer = containerId === 'daily-tiles-container';
                    if ((isArchivePuzzle || isArchiveContainer) && context.returnArchiveTileToContainer) {
                        context.returnArchiveTileToContainer(letter, originalIndex);
                    } else {
                        const detectedPrefix = isDailyContainer ? 'daily-' : prefix;
                        returnTileToContainer(letter, originalIndex, context.handlers || {}, false, detectedPrefix, context);
                    }
                }
            }
        }
        return false;
    }
}

// Handle drag leave tiles container
export function handleTilesContainerDragLeave(e) {
    // No visual feedback needed
}

