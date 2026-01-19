// Core tile operations: place, swap, remove, return

import { getSelectedTile, clearSelectedTile } from './puzzle-state.js';
import { deselectTile } from './keyboard.js';
import { createTile, updatePlaceholderTile } from './puzzle-core.js';
import { handleTileKeyDown } from './keyboard.js';
import { getKeyboardContext } from './keyboard-input.js';
import { updateScoreDisplay, updateSubmitButton } from './scoring.js';
import { checkAutoComplete, areAllSlotsFilled } from './auto-complete.js';
import { debugLog as debugLogUtil } from './utils.js';
import { 
    getIsProcessing, 
    setIsProcessing 
} from './interaction-state.js';
import { 
    validateTileExists, 
    findTileInContainer, 
    ensureTilePreserved 
} from './tile-validation.js';
import { handleDragStart, handleDragEnd } from './mouse-drag.js';
import { handleTileDragOver, handleTileDragLeave, handleTileDrop } from './mouse-drag.js';
import { handleTileClick } from './tile-interactions.js';
import { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel } from './touch-drag.js';

// Debug logging function that only logs in development mode
function debugLog(...args) {
    debugLogUtil('[Input]', ...args);
}

// Helper functions to manage slot and tile interactivity for accessibility
// Pattern: Only ONE element is interactive at a time to avoid nested interactive elements
// - Empty slots: Slot is interactive (role="button", tabindex="0")
// - Filled slots: Tile is interactive (role="button", tabindex="0"), slot is NON-interactive
// - Tiles in containers: Always interactive (role="button", tabindex="0")

function makeSlotNonInteractive(slot) {
    // Remove interactive properties from slot when it's filled
    // The tile inside will be interactive instead
    // Note: Removing role/tabindex only affects keyboard navigation and screen readers
    // Click event handlers remain attached and functional - slots are still clickable
    slot.removeAttribute('role');
    slot.removeAttribute('tabindex');
}

function makeSlotInteractive(slot) {
    // Restore interactive properties to slot when it becomes empty
    // Only restore if slot is not locked
    const isLocked = slot.getAttribute('data-locked') === 'true';
    if (!isLocked) {
        slot.setAttribute('role', 'button');
        slot.setAttribute('tabindex', '0');
    }
}

function makeTileNonInteractive(tile) {
    // Remove interactive properties to prevent nested interactive elements
    // Note: This is kept for potential future use, but currently tiles remain interactive in slots
    tile.removeAttribute('role');
    tile.removeAttribute('tabindex');
}

function makeTileInteractive(tile) {
    // Restore interactive properties only if tile is not locked
    const isLocked = tile.getAttribute('data-locked') === 'true';
    if (!isLocked) {
        tile.setAttribute('role', 'button');
        tile.setAttribute('tabindex', '0');
    }
}

// Helper function to attach handlers to a tile
export function attachTileHandlers(tile, context, isInSlot = false) {
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
    
    // Attach keyboard handler - always use keyboard context
    // The keyboard context is the source of truth for keyboard operations
    // This ensures tiles placed in slots or swapped back to container can be selected and moved via keyboard
    // Use capture phase to ensure tile handler runs before slot handler
    const keyboardCtx = getKeyboardContext();
    if (keyboardCtx) {
        // Use keyboard context which has placeTileCallback and removeTileCallback
        // Use capture phase (true) so tile handler runs before slot handler
        tile.addEventListener('keydown', (e) => {
            handleTileKeyDown(e, keyboardCtx);
        }, true);
    } else {
        // Fallback: log warning but still try to use passed context
        // This maintains backward compatibility if keyboard context isn't initialized
        console.warn('attachTileHandlers: Keyboard context not available, using passed context');
        tile.addEventListener('keydown', (e) => {
            handleTileKeyDown(e, context);
        }, true);
    }
}

// Place tile in slot
export function placeTileInSlot(tile, slot, context = {}) {
    // Guard: prevent concurrent executions
    if (getIsProcessing()) {
        debugLog('placeTileInSlot: Already processing, ignoring duplicate call');
        return;
    }
    
    setIsProcessing(true);
    
    const isKeyboardNavigation = context.isKeyboardNavigation || false;
    try {
        // Validate inputs first before accessing attributes
        if (!tile || !slot) {
            console.error('placeTileInSlot: Invalid tile or slot');
            return;
        }
        
        debugLog('placeTileInSlot: Starting', {
            tile: tile.getAttribute('data-letter'),
            slot: slot.getAttribute('data-slot-index'),
            word: slot.getAttribute('data-word-index')
        });
        
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
                    ensureTilePreserved(tile, context, returnTileToContainer);
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
        
        // Ensure tile is interactive (has tabindex and role for keyboard navigation)
        // cloneNode copies attributes, but we need to ensure they're set correctly
        if (!isLocked) {
            clonedTile.setAttribute('role', 'button');
            clonedTile.setAttribute('tabindex', '0');
        }
        
        // Attach handlers using helper function (tile will be in slot)
        attachTileHandlers(clonedTile, context, true);

        // Place cloned tile in slot first
        slot.appendChild(clonedTile);
        slot.classList.add('filled');
        slot.classList.remove('drag-over');
        // Make slot non-interactive to prevent nested interactive elements (accessibility)
        // Tile remains interactive and handles clicks/keyboard navigation
        makeSlotNonInteractive(slot);

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
            
            // If tile was in a slot, restore slot interactivity
            // Slot becomes empty, so it should be interactive again
            if (isFromSlot) {
                isFromSlot.classList.remove('filled');
                makeSlotInteractive(isFromSlot);
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
        ensureTilePreserved(tile, context, returnTileToContainer);
    } finally {
        setIsProcessing(false);
    }
}

// Swap two tiles between slots or container
function swapTiles(draggedTile, existingTile, targetSlot, context = {}) {
    // Guard: prevent concurrent executions
    // Note: This may be called from placeTileInSlot which already set isProcessing,
    // so we check and only set if not already processing
    const wasAlreadyProcessing = getIsProcessing();
    if (wasAlreadyProcessing) {
        debugLog('swapTiles: Called from placeTileInSlot, proceeding with swap');
    }
    
    if (!wasAlreadyProcessing) {
        setIsProcessing(true);
    }
    
    const isKeyboardNavigation = context.isKeyboardNavigation || false;
    try {
        // Validate inputs
        if (!draggedTile || !existingTile || !targetSlot) {
            console.error('swapTiles: Invalid tiles or slot');
            // Ensure tiles are preserved
            if (draggedTile) ensureTilePreserved(draggedTile, context, returnTileToContainer);
            if (existingTile) ensureTilePreserved(existingTile, context, returnTileToContainer);
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
                    ensureTilePreserved(draggedTile, context, returnTileToContainer);
                    return;
                }
            } else {
                ensureTilePreserved(draggedTile, context, returnTileToContainer);
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
                    ensureTilePreserved(existingTile, context, returnTileToContainer);
                    return;
                }
            } else {
                ensureTilePreserved(existingTile, context, returnTileToContainer);
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
            // Make slot non-interactive to prevent nested interactive elements (accessibility)
            // Tile remains interactive and handles clicks/keyboard navigation
            makeSlotNonInteractive(draggedSlot);
        } else {
            // If dragged tile was from container, return existing tile to container
            // First, restore interactivity of the slot that existing tile was in (if any)
            const existingTileSlot = actualExistingTile.closest('.slot');
            if (existingTileSlot) {
                existingTileSlot.classList.remove('filled');
                makeSlotInteractive(existingTileSlot);
            }
            
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
        // Make slot non-interactive to prevent nested interactive elements (accessibility)
        // Tile remains interactive and handles clicks/keyboard navigation
        makeSlotNonInteractive(targetSlot);
        
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
        ensureTilePreserved(actualDraggedTile, context, returnTileToContainer);
        ensureTilePreserved(actualExistingTile, context, returnTileToContainer);
    } finally {
        // Only clear isProcessing if we set it (not if called from placeTileInSlot)
        if (!wasAlreadyProcessing) {
            setIsProcessing(false);
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
        // Restore slot interactivity when emptied (accessibility)
        makeSlotInteractive(slot);

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
        setIsProcessing(false);
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
