// Drag & drop system for puzzle tiles

import { 
    getDraggedTile, 
    setDraggedTile, 
    clearDraggedTile,
    getSelectedTile,
    clearSelectedTile
} from './puzzle-state.js';
import { createTile, updatePlaceholderTile } from './puzzle-core.js';
import { deselectTile } from './keyboard.js';
import { handleTileKeyDown } from './keyboard.js';
import { updateScoreDisplay, updateSubmitButton } from './scoring.js';

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
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.currentTarget.classList.remove('drag-over');
    
    const draggedTile = getDraggedTile();
    if (draggedTile && placeTileCallback) {
        placeTileCallback(draggedTile, e.currentTarget);
    }
    
    return false;
}

// Click handlers for accessibility
export function handleTileClick(e, placeTileCallback) {
    const tile = e.currentTarget;
    // Don't allow clicking locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    const activeSlot = document.querySelector('.slot.drag-over:not([data-locked="true"])') || 
                       document.querySelector('.slot:not(.filled):not([data-locked="true"])');
    if (activeSlot && placeTileCallback) {
        placeTileCallback(tile, activeSlot);
    }
}

export function handleSlotClick(e, removeTileCallback) {
    const slot = e.currentTarget;
    // Don't allow clicking locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    if (slot.classList.contains('filled')) {
        // Remove tile from slot
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
        
        // Check if over a valid drop target
        if (elementBelow) {
            const slot = elementBelow.closest('.slot');
            if (slot && slot.getAttribute('data-locked') !== 'true') {
                slot.classList.add('drag-over');
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
        
        // Find drop target
        let dropTarget = null;
        if (touch) {
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            if (elementBelow) {
                const slot = elementBelow.closest('.slot');
                if (slot && slot.getAttribute('data-locked') !== 'true') {
                    dropTarget = slot;
                }
                
                // Also check if dropped on tiles container
                const container = elementBelow.closest('#tiles-container, #archive-tiles-container');
                if (container && !dropTarget) {
                    // Return tile to container if it came from a slot
                    const slot = touchDragState.tile.closest('.slot');
                    if (slot && touchDragState.removeTileCallback) {
                        touchDragState.removeTileCallback(slot);
                    }
                }
            }
        }
        
        // Place tile if valid drop target found
        if (dropTarget && touchDragState.placeTileCallback) {
            touchDragState.placeTileCallback(touchDragState.tile, dropTarget);
        }
    }
    
    // Clean up drag state (idempotent - safe to call multiple times)
    cleanupTouchDrag();
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
    
    // Clear state
    clearDraggedTile();
    touchDragState.isDragging = false;
    touchDragState.tile = null;
    touchDragState.placeTileCallback = null;
    touchDragState.removeTileCallback = null;
}

// Handle touch cancel (e.g., system gesture interrupts)
export function handleTouchCancel(e) {
    cleanupTouchDrag();
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
    const isKeyboardNavigation = context.isKeyboardNavigation || false;
    try {
        // Validate inputs
        if (!tile || !slot) {
            console.error('placeTileInSlot: Invalid tile or slot');
            return;
        }
        
        // Don't allow placing tiles in locked slots
        if (slot.getAttribute('data-locked') === 'true') {
            return;
        }
        
        // Don't allow placing locked tiles
        if (tile.getAttribute('data-locked') === 'true') {
            return;
        }
        
        // Validate tile exists before proceeding
        if (!validateTileExists(tile)) {
            console.error('placeTileInSlot: Tile does not exist in DOM');
            ensureTilePreserved(tile, context);
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
            swapTiles(tile, existingTile, slot, { ...context, isKeyboardNavigation });
            return;
        }

        // Check if tile is already in a slot (being moved from one slot to another or back to container)
        const isFromSlot = tile.closest('.slot');
        const isFromContainer = tile.closest('#tiles-container');
        const isFromArchiveContainer = tile.closest('#archive-tiles-container');
        const isArchivePuzzle = slot.closest('#archive-word-slots') !== null || context.isArchive;
        
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
        if (!isLocked) {
            clonedTile.addEventListener('dragstart', handleDragStart);
            clonedTile.addEventListener('dragend', handleDragEnd);
            clonedTile.addEventListener('click', (e) => {
                if (context.removeTileCallback) {
                    context.removeTileCallback(slot);
                }
            });
            // Add touch handlers if available in context
            if (context.handlers) {
                if (context.handlers.onTouchStart) {
                    clonedTile.addEventListener('touchstart', context.handlers.onTouchStart, { passive: true });
                }
                if (context.handlers.onTouchMove) {
                    clonedTile.addEventListener('touchmove', context.handlers.onTouchMove, { passive: false });
                }
                if (context.handlers.onTouchEnd) {
                    clonedTile.addEventListener('touchend', context.handlers.onTouchEnd, { passive: true });
                }
                if (context.handlers.onTouchCancel) {
                    clonedTile.addEventListener('touchcancel', context.handlers.onTouchCancel, { passive: true });
                }
            } else {
                // Fallback: create touch handlers with callbacks from context
                const placeTileCallback = context.placeTileCallback || ((tile, slot) => placeTileInSlot(tile, slot, context));
                const removeTileCallback = context.removeTileCallback;
                clonedTile.addEventListener('touchstart', (e) => handleTouchStart(e, placeTileCallback, removeTileCallback), { passive: true });
                clonedTile.addEventListener('touchmove', handleTouchMove, { passive: false });
                clonedTile.addEventListener('touchend', handleTouchEnd, { passive: true });
                clonedTile.addEventListener('touchcancel', handleTouchCancel, { passive: true });
            }
            clonedTile.addEventListener('keydown', handleTileKeyDown);
        }

        // Place cloned tile in slot first
        slot.appendChild(clonedTile);
        slot.classList.add('filled');
        slot.classList.remove('drag-over');

        // SAFEGUARD: Only remove original tile AFTER successful placement
        // Validate tile still exists before removing
        if (validateTileExists(tile)) {
            tile.remove();
            
            // If tile was from container, update placeholder
            if (isFromContainer) {
                updatePlaceholderTile('tiles-container');
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

        // Update score and submit button state
        if (isArchivePuzzle && context.updateArchiveScoreDisplay) {
            context.updateArchiveScoreDisplay();
            if (context.updateArchiveSubmitButton) {
                context.updateArchiveSubmitButton();
            }
        } else {
            updateScoreDisplay();
            updateSubmitButton();
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
        // Recovery: ensure tile is preserved
        ensureTilePreserved(tile, context);
    }
}

// Swap two tiles between slots or container
function swapTiles(draggedTile, existingTile, targetSlot, context = {}) {
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
        
        // Validate tiles exist before proceeding
        if (!validateTileExists(draggedTile)) {
            console.error('swapTiles: Dragged tile does not exist in DOM');
            ensureTilePreserved(draggedTile, context);
            return;
        }
        if (!validateTileExists(existingTile)) {
            console.error('swapTiles: Existing tile does not exist in DOM');
            ensureTilePreserved(existingTile, context);
            return;
        }
        
        const draggedSlot = draggedTile.closest('.slot');
        const draggedLetter = draggedTile.getAttribute('data-letter');
        const draggedIndex = draggedTile.getAttribute('data-tile-index');
        const existingLetter = existingTile.getAttribute('data-letter');
        const existingIndex = existingTile.getAttribute('data-tile-index');
        
        // Clear selected tile if either tile is selected
        if (getSelectedTile() === draggedTile || getSelectedTile() === existingTile) {
            deselectTile();
        }
        
        const isDraggedFromContainer = draggedTile.closest('#tiles-container');
        const isDraggedFromArchiveContainer = draggedTile.closest('#archive-tiles-container');
        const isArchivePuzzle = targetSlot.closest('#archive-word-slots') !== null || context.isArchive;
        
        // Helper function to attach handlers to cloned tile
        const attachHandlersToTile = (clonedTile, removeCallbackSlot) => {
            clonedTile.addEventListener('dragstart', handleDragStart);
            clonedTile.addEventListener('dragend', handleDragEnd);
            clonedTile.addEventListener('click', (e) => {
                if (context.removeTileCallback) {
                    context.removeTileCallback(removeCallbackSlot);
                }
            });
            // Add touch handlers if available in context
            if (context.handlers) {
                if (context.handlers.onTouchStart) {
                    clonedTile.addEventListener('touchstart', context.handlers.onTouchStart, { passive: true });
                }
                if (context.handlers.onTouchMove) {
                    clonedTile.addEventListener('touchmove', context.handlers.onTouchMove, { passive: false });
                }
                if (context.handlers.onTouchEnd) {
                    clonedTile.addEventListener('touchend', context.handlers.onTouchEnd, { passive: true });
                }
                if (context.handlers.onTouchCancel) {
                    clonedTile.addEventListener('touchcancel', context.handlers.onTouchCancel, { passive: true });
                }
            } else {
                // Fallback: create touch handlers with callbacks from context
                const placeTileCallback = context.placeTileCallback || ((tile, slot) => placeTileInSlot(tile, slot, context));
                const removeTileCallback = context.removeTileCallback;
                clonedTile.addEventListener('touchstart', (e) => handleTouchStart(e, placeTileCallback, removeTileCallback), { passive: true });
                clonedTile.addEventListener('touchmove', handleTouchMove, { passive: false });
                clonedTile.addEventListener('touchend', handleTouchEnd, { passive: true });
                clonedTile.addEventListener('touchcancel', handleTouchCancel, { passive: true });
            }
            clonedTile.addEventListener('keydown', handleTileKeyDown);
        };
        
        // SAFEGUARD: Clone both tiles BEFORE removing originals
        const clonedDraggedTile = draggedTile.cloneNode(true);
        clonedDraggedTile.setAttribute('draggable', 'true');
        clonedDraggedTile.classList.remove('dragging');
        clonedDraggedTile.style.opacity = ''; // Reset any inline styles from drag
        attachHandlersToTile(clonedDraggedTile, targetSlot);
        
        const clonedExistingTile = existingTile.cloneNode(true);
        clonedExistingTile.setAttribute('draggable', 'true');
        clonedExistingTile.classList.remove('dragging');
        clonedExistingTile.style.opacity = ''; // Reset any inline styles from drag
        
        // Place cloned tiles first
        // If dragged tile was from a slot, place existing tile there
        if (draggedSlot) {
            attachHandlersToTile(clonedExistingTile, draggedSlot);
            draggedSlot.appendChild(clonedExistingTile);
            draggedSlot.classList.add('filled');
        } else {
            // If dragged tile was from container, return existing tile to container
            // Check if archive mode: either target slot is in archive OR dragged tile is from archive container
            const shouldUseArchiveReturn = (isArchivePuzzle || isDraggedFromArchiveContainer) && context.returnArchiveTileToContainer;
            if (shouldUseArchiveReturn) {
                context.returnArchiveTileToContainer(existingLetter, existingIndex);
            } else {
                returnTileToContainer(existingLetter, existingIndex, context.handlers || {}, isKeyboardNavigation);
            }
        }
        
        // Place dragged tile in target slot
        targetSlot.appendChild(clonedDraggedTile);
        targetSlot.classList.add('filled');
        targetSlot.classList.remove('drag-over');
        
        // SAFEGUARD: Only remove original tiles AFTER successful placement
        // Validate tiles still exist before removing
        if (validateTileExists(draggedTile)) {
            draggedTile.remove();
        } else {
            console.warn('swapTiles: Dragged tile was already removed');
        }
        
        if (validateTileExists(existingTile)) {
            existingTile.remove();
        } else {
            console.warn('swapTiles: Existing tile was already removed');
        }
        
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
        } else {
            updateScoreDisplay();
            updateSubmitButton();
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
        // Recovery: ensure both tiles are preserved
        ensureTilePreserved(draggedTile, context);
        ensureTilePreserved(existingTile, context);
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
        
        // Remove from slot
        tile.remove();
        slot.classList.remove('filled');

        // Add back to tiles container (creates new tile, so safe)
        if (isArchivePuzzle && context.returnArchiveTileToContainer) {
            // Pass isKeyboardNavigation to archive return function
            context.returnArchiveTileToContainer(letter, originalIndex, isKeyboardNavigation);
        } else {
            returnTileToContainer(letter, originalIndex, context.handlers || {}, isKeyboardNavigation);
        }
    } catch (error) {
        console.error('removeTileFromSlot error:', error);
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
                    returnTileToContainer(letter, originalIndex, context.handlers || {}, isKeyboardNavigation);
                }
            }
        }
    }
}

// Return tile to the starting container
export function returnTileToContainer(letter, originalIndex, handlers = {}, isKeyboardNavigation = false) {
    // Try regular container first
    let tilesContainer = document.getElementById('tiles-container');
    let containerId = 'tiles-container';
    let isArchive = false;
    
    // Fallback: check for archive container if regular container not found
    if (!tilesContainer) {
        tilesContainer = document.getElementById('archive-tiles-container');
        if (tilesContainer) {
            containerId = 'archive-tiles-container';
            isArchive = true;
        }
    }
    
    if (!tilesContainer) {
        console.error('Neither tiles-container nor archive-tiles-container found - cannot return tile to container');
        return;
    }
    
    const newTile = createTile(letter, originalIndex, false, handlers);
    tilesContainer.appendChild(newTile);

    // Update placeholder visibility
    updatePlaceholderTile(containerId);

    // Update score and submit button state (only for regular puzzles, archive handles its own)
    if (!isArchive) {
        updateScoreDisplay();
        updateSubmitButton();
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
            const isArchivePuzzle = slot.closest('#archive-word-slots') !== null;
            const isArchiveContainer = e.currentTarget.id === 'archive-tiles-container';
            
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
                returnTileToContainer(letter, originalIndex, context.handlers || {});
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
                    const isArchivePuzzle = slot.closest('#archive-word-slots') !== null;
                    const isArchiveContainer = e.currentTarget && e.currentTarget.id === 'archive-tiles-container';
                    if ((isArchivePuzzle || isArchiveContainer) && context.returnArchiveTileToContainer) {
                        context.returnArchiveTileToContainer(letter, originalIndex);
                    } else {
                        returnTileToContainer(letter, originalIndex, context.handlers || {});
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

