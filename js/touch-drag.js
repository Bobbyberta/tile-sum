// Touch drag handlers for mobile devices

import { setDraggedTile, clearDraggedTile } from './puzzle-state.js';
import { debugLog as debugLogUtil } from './utils.js';
import { 
    getTouchDragState, 
    setTouchDragState, 
    resetTouchDragState,
    setTouchInteractionActive,
    setLastTouchTime,
    getInteractionState
} from './interaction-state.js';
import { handleTileInteraction } from './tile-interactions.js';

// Debug logging function that only logs in development mode
function debugLog(...args) {
    debugLogUtil('[Input]', ...args);
}

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
    
    // Prevent scrolling immediately when tile is touched
    e.preventDefault();
    
    const touch = e.touches[0];
    
    // Mark touch interaction as active to prevent click events
    setTouchInteractionActive(true);
    setLastTouchTime(Date.now());
    
    debugLog('handleTouchStart: Touch started on tile', tile.getAttribute('data-letter'));
    
    // Store original body overflow style and disable scrolling
    const body = document.body;
    const originalOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    
    // Initialize touch drag state
    const rect = tile.getBoundingClientRect();
    setTouchDragState({
        tile: tile,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isDragging: false,
        placeTileCallback: placeTileCallback,
        removeTileCallback: removeTileCallback,
        dragGhost: null,
        originalLeft: rect.left,
        originalTop: rect.top,
        originalBodyOverflow: originalOverflow
    });
    
    // Attach document-level touch handlers immediately to prevent scrolling
    // This ensures scrolling is prevented even if user drags quickly before threshold
    const documentTouchMoveHandler = (e) => {
        // Always prevent scrolling while tile is being touched
        e.preventDefault();
        // Handle the drag logic
        handleTouchMove(e);
    };
    
    const documentTouchEndHandler = (e) => {
        handleTouchEnd(e);
    };
    
    setTouchDragState({
        documentTouchMoveHandler: documentTouchMoveHandler,
        documentTouchEndHandler: documentTouchEndHandler
    });
    
    document.addEventListener('touchmove', documentTouchMoveHandler, { passive: false });
    document.addEventListener('touchend', documentTouchEndHandler, { passive: false });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
}

export function handleTouchMove(e) {
    // Only handle single touch
    if (e.touches.length !== 1) {
        return;
    }
    
    const touchDragState = getTouchDragState();
    if (!touchDragState.tile) {
        return;
    }
    
    // Prevent scrolling immediately when tile is being touched (even before threshold)
    e.preventDefault();
    
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
        
        // Document-level handlers are already attached in handleTouchStart
        // No need to attach them again here
    }
    
    // If actively dragging, update position and check drop targets
    if (touchDragState.isDragging) {
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
    const touchDragState = getTouchDragState();
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
        // This was a tap (not a drag) - use shared interaction logic
        handleTileInteraction(
            touchDragState.tile, 
            touchDragState.placeTileCallback, 
            touchDragState.removeTileCallback,
            { prefix: '' } // Context - could be enhanced if needed
        );
    }
    
    // Clean up drag state (idempotent - safe to call multiple times)
    cleanupTouchDrag();
    
    // Reset touch interaction flag after a delay to allow click events to be processed
    const interactionState = getInteractionState();
    setTimeout(() => {
        setTouchInteractionActive(false);
    }, interactionState.CLICK_DELAY_AFTER_TOUCH);
}

// Clean up touch drag state
function cleanupTouchDrag() {
    const touchDragState = getTouchDragState();
    
    // Restore body overflow style
    if (touchDragState.originalBodyOverflow !== null) {
        document.body.style.overflow = touchDragState.originalBodyOverflow;
    }
    
    // Remove document-level listeners
    if (touchDragState.documentTouchMoveHandler) {
        document.removeEventListener('touchmove', touchDragState.documentTouchMoveHandler);
    }
    if (touchDragState.documentTouchEndHandler) {
        document.removeEventListener('touchend', touchDragState.documentTouchEndHandler);
    }
    document.removeEventListener('touchcancel', handleTouchCancel);
    
    // Remove ghost element
    if (touchDragState.dragGhost) {
        touchDragState.dragGhost.remove();
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
    resetTouchDragState();
}

// Handle touch cancel (e.g., system gesture interrupts)
export function handleTouchCancel(e) {
    debugLog('handleTouchCancel: Touch cancelled');
    cleanupTouchDrag();
    // Reset touch interaction flag
    const interactionState = getInteractionState();
    setTimeout(() => {
        setTouchInteractionActive(false);
    }, interactionState.CLICK_DELAY_AFTER_TOUCH);
}
