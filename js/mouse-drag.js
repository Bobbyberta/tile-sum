// Mouse drag & drop handlers for puzzle tiles

import { 
    getDraggedTile, 
    setDraggedTile,
    clearDraggedTile
} from './puzzle-state.js';
import { debugLog as debugLogUtil } from './utils.js';
import { validateTileExists } from './tile-validation.js';
import { returnTileToContainer } from './tile-operations.js';

// Debug logging function that only logs in development mode
function debugLog(...args) {
    debugLogUtil('[Input]', ...args);
}

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
                // Use returnTileToContainer from context if available, otherwise import dynamically
                if (context.returnTileToContainer) {
                    context.returnTileToContainer(letter, originalIndex, context.handlers || {}, false, detectedPrefix, context);
                } else {
                    // Dynamic import to avoid circular dependency
                    import('./tile-operations.js').then(({ returnTileToContainer }) => {
                        returnTileToContainer(letter, originalIndex, context.handlers || {}, false, detectedPrefix, context);
                    });
                }
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
