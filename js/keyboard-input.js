// Keyboard typing input handler - allows users to type letters to place tiles

import { SCRABBLE_SCORES } from '../puzzle-data-encoded.js';
import { selectTile, deselectTile } from './keyboard.js';
import { getSelectedTile } from './puzzle-state.js';

// Context storage for keyboard input handlers
let keyboardContext = null;

// Initialize keyboard input system
export function initKeyboardInput(context) {
    keyboardContext = context;
}

// Get stored keyboard context
export function getKeyboardContext() {
    return keyboardContext;
}

// Get available letters from tiles container and placed slots
function getAvailableLetters(prefix = '') {
    const letters = new Set();
    
    // Get letters from tiles container
    let containerId = 'tiles-container';
    if (prefix === 'daily-') {
        containerId = 'daily-tiles-container';
    } else if (prefix === 'archive-') {
        containerId = 'archive-tiles-container';
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        const tiles = container.querySelectorAll('.tile:not([data-locked="true"])');
        tiles.forEach(tile => {
            const letter = tile.getAttribute('data-letter')?.toUpperCase();
            if (letter) letters.add(letter);
        });
    }
    
    // Get letters from placed tiles in slots
    const slots = getAllSlotsInOrder(prefix);
    slots.forEach(slot => {
        const tile = slot.querySelector('.tile:not([data-locked="true"])');
        if (tile) {
            const letter = tile.getAttribute('data-letter')?.toUpperCase();
            if (letter) letters.add(letter);
        }
    });
    
    return Array.from(letters);
}

// Find first available tile with matching letter (checks container first, then slots)
function findTileByLetter(letter, prefix = '') {
    const normalizedLetter = letter.toUpperCase();
    
    // First, check tiles in container
    let containerId = 'tiles-container';
    if (prefix === 'daily-') {
        containerId = 'daily-tiles-container';
    } else if (prefix === 'archive-') {
        containerId = 'archive-tiles-container';
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        const tiles = container.querySelectorAll('.tile:not([data-locked="true"])');
        for (const tile of tiles) {
            const tileLetter = tile.getAttribute('data-letter')?.toUpperCase();
            if (tileLetter === normalizedLetter) {
                return tile;
            }
        }
    }
    
    // If not found in container, check tiles placed in slots
    const slots = getAllSlotsInOrder(prefix);
    for (const slot of slots) {
        const tile = slot.querySelector('.tile:not([data-locked="true"])');
        if (tile) {
            const tileLetter = tile.getAttribute('data-letter')?.toUpperCase();
            if (tileLetter === normalizedLetter) {
                return tile;
            }
        }
    }
    
    return null;
}

// Get all slots in reading order (word 0 slots, then word 1 slots)
function getAllSlotsInOrder(prefix = '') {
    // Determine word slots container ID
    let wordSlotsContainerId = 'word-slots';
    if (prefix === 'daily-') {
        wordSlotsContainerId = 'daily-word-slots';
    } else if (prefix === 'archive-') {
        wordSlotsContainerId = 'archive-word-slots';
    }
    
    const wordSlotsContainer = document.getElementById(wordSlotsContainerId);
    if (!wordSlotsContainer) return [];
    
    const slots = [];
    
    // Get slots from word 0, then word 1
    // Try two approaches: query by data-word-index (word container) or data-word-slots (slots container)
    for (let wordIndex = 0; wordIndex < 2; wordIndex++) {
        // First try: find word container by data-word-index, then get slots within it
        let wordSlots = [];
        const wordContainer = wordSlotsContainer.querySelector(`[data-word-index="${wordIndex}"]`);
        if (wordContainer) {
            wordSlots = wordContainer.querySelectorAll('.slot:not([data-locked="true"])');
        }
        
        // Fallback: if no slots found, try querying by data-word-slots directly
        if (wordSlots.length === 0) {
            const slotsContainer = wordSlotsContainer.querySelector(`[data-word-slots="${wordIndex}"]`);
            if (slotsContainer) {
                wordSlots = slotsContainer.querySelectorAll('.slot:not([data-locked="true"])');
            }
        }
        
        slots.push(...Array.from(wordSlots));
    }
    
    return slots;
}

// Find next empty slot in reading order
function findNextEmptySlot(prefix = '', startFromSlot = null) {
    const allSlots = getAllSlotsInOrder(prefix);
    
    if (allSlots.length === 0) return null;
    
    // If startFromSlot provided, find its index and start from there
    let startIndex = 0;
    if (startFromSlot) {
        const slotIndex = allSlots.indexOf(startFromSlot);
        if (slotIndex !== -1) {
            startIndex = slotIndex + 1;
        }
    }
    
    // Search from startIndex, wrapping around if needed
    for (let i = 0; i < allSlots.length; i++) {
        const index = (startIndex + i) % allSlots.length;
        const slot = allSlots[index];
        
        // Check if slot is empty (no .filled class and no tile child)
        if (!slot.classList.contains('filled') && !slot.querySelector('.tile')) {
            return slot;
        }
    }
    
    // If no empty slot found, return first slot (for replacement)
    return allSlots[0] || null;
}

// Get all tiles in order (both in container and in slots)
function getAllTilesInOrder(prefix = '') {
    const tiles = [];
    
    // First, get tiles from container (unplaced tiles)
    let containerId = 'tiles-container';
    if (prefix === 'daily-') {
        containerId = 'daily-tiles-container';
    } else if (prefix === 'archive-') {
        containerId = 'archive-tiles-container';
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        const containerTiles = container.querySelectorAll('.tile:not([data-locked="true"])');
        tiles.push(...Array.from(containerTiles));
    }
    
    // Then, get tiles from slots (placed tiles) - maintain reading order
    const slots = getAllSlotsInOrder(prefix);
    slots.forEach(slot => {
        const tile = slot.querySelector('.tile:not([data-locked="true"])');
        if (tile) {
            tiles.push(tile);
        }
    });
    
    return tiles;
}

// Handle typing a letter
function handleTypeLetter(letter, currentElement, context) {
    const normalizedLetter = letter.toUpperCase();
    const prefix = context.prefix || '';
    
    // Check if letter is available
    const availableLetters = getAvailableLetters(prefix);
    if (!availableLetters.includes(normalizedLetter)) {
        // Letter not available, ignore
        return;
    }
    
    // Find tile with matching letter (checks container first, then slots)
    const tile = findTileByLetter(normalizedLetter, prefix);
    if (!tile) {
        return;
    }
    
    // Determine target slot
    let targetSlot = null;
    
    // If current element is a slot (filled or empty)
    if (currentElement.classList.contains('slot')) {
        targetSlot = currentElement;
    } else {
        // If current element is a tile in a slot, use that slot
        const slot = currentElement.closest('.slot');
        if (slot) {
            targetSlot = slot;
        } else {
            // Current element is a tile in container, find next empty slot
            targetSlot = findNextEmptySlot(prefix);
        }
    }
    
    if (!targetSlot) {
        return;
    }
    
    // Check if the tile we found is already in the target slot
    const tileCurrentSlot = tile.closest('.slot');
    if (tileCurrentSlot === targetSlot) {
        // Tile is already in this slot, do nothing
        return;
    }
    
    // Check if target slot has a tile that's the same as the one we're trying to place
    if (targetSlot.classList.contains('filled')) {
        const existingTile = targetSlot.querySelector('.tile');
        // If the existing tile is the same as the one we're trying to place, do nothing
        if (existingTile === tile) {
            return;
        }
        // If target slot is filled with a different tile, placeTileCallback will handle the swap
        // Don't manually remove it here - let placeTileCallback handle it via swapTiles
    }
    
    // Place tile in slot (placeTileCallback handles moving from container or swapping from another slot)
    // It will automatically handle swapping if target slot is filled
    if (context.placeTileCallback && targetSlot) {
        if (document.contains(tile) && document.contains(targetSlot)) {
            context.placeTileCallback(tile, targetSlot);
            
            // Focus next empty slot after placement
            setTimeout(() => {
                const nextSlot = findNextEmptySlot(prefix, targetSlot);
                if (nextSlot && document.contains(nextSlot)) {
                    nextSlot.focus();
                } else if (targetSlot && document.contains(targetSlot)) {
                    targetSlot.focus();
                }
            }, 50);
        }
    }
}

// Handle delete/backspace key
function handleDelete(currentElement, context) {
    const prefix = context.prefix || '';
    
    // If focused on a slot with a tile, remove it
    if (currentElement.classList.contains('slot')) {
        const tile = currentElement.querySelector('.tile');
        if (tile && tile.getAttribute('data-locked') !== 'true') {
            if (context.removeTileCallback) {
                context.removeTileCallback(currentElement);
                
                // Focus the tile that was returned to container
                setTimeout(() => {
                    const letter = tile.getAttribute('data-letter');
                    if (letter) {
                        const returnedTile = findTileByLetter(letter, prefix);
                        if (returnedTile && document.contains(returnedTile)) {
                            returnedTile.focus();
                        }
                    }
                }, 100);
            }
        }
    }
    // If focused on a tile in a slot, remove it
    else {
        const slot = currentElement.closest('.slot');
        if (slot) {
            const tile = currentElement;
            if (tile.getAttribute('data-locked') !== 'true') {
                if (context.removeTileCallback) {
                    context.removeTileCallback(slot);
                    
                    // Focus the tile that was returned to container
                    setTimeout(() => {
                        const letter = tile.getAttribute('data-letter');
                        if (letter) {
                            const returnedTile = findTileByLetter(letter, prefix);
                            if (returnedTile && document.contains(returnedTile)) {
                                returnedTile.focus();
                            }
                        }
                    }, 100);
                }
            }
        }
    }
}

// Handle Tab navigation
function handleTabNavigation(e, currentElement, context) {
    const prefix = context.prefix || '';
    const isShiftTab = e.shiftKey;
    
    // Prevent default Tab behavior first
    e.preventDefault();
    
    // Get all focusable elements in order: tiles first, then slots, then buttons
    const tiles = getAllTilesInOrder(prefix);
    const slots = getAllSlotsInOrder(prefix);
    
    // Get hint and submit buttons
    const hintBtnId = prefix ? `${prefix}hint-btn` : 'hint-btn';
    const submitBtnId = prefix ? `${prefix}submit-btn` : 'submit-btn';
    const hintBtn = document.getElementById(hintBtnId);
    const submitBtn = document.getElementById(submitBtnId);
    
    const buttons = [];
    // Only include hint button if it exists and is not disabled
    if (hintBtn && !hintBtn.disabled) {
        buttons.push(hintBtn);
    }
    // Include submit button if it exists
    if (submitBtn) {
        buttons.push(submitBtn);
    }
    
    const allFocusable = [...tiles, ...slots, ...buttons];
    
    if (allFocusable.length === 0) return;
    
    // Find current index
    let currentIndex = allFocusable.indexOf(currentElement);
    if (currentIndex === -1) {
        // Current element not found, start from beginning or end
        currentIndex = isShiftTab ? allFocusable.length - 1 : 0;
    }
    
    // Calculate next index
    let nextIndex;
    if (isShiftTab) {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : allFocusable.length - 1;
    } else {
        nextIndex = currentIndex < allFocusable.length - 1 ? currentIndex + 1 : 0;
    }
    
    // Focus next element
    const nextElement = allFocusable[nextIndex];
    if (nextElement && document.contains(nextElement)) {
        // Use requestAnimationFrame for more reliable focus timing
        requestAnimationFrame(() => {
            if (document.contains(nextElement)) {
                nextElement.focus();
                // Verify focus was successful (for debugging)
                if (document.activeElement !== nextElement) {
                    // Fallback: try again on next frame if focus didn't work
                    requestAnimationFrame(() => {
                        if (document.contains(nextElement)) {
                            nextElement.focus();
                        }
                    });
                }
            }
        });
    }
}

// Get navigation rows: tiles container (row 0), word 0 slots (row 1), word 1 slots (row 2)
function getNavigationRows(prefix = '') {
    // Get tiles from container only (unplaced tiles)
    let containerId = 'tiles-container';
    if (prefix === 'daily-') {
        containerId = 'daily-tiles-container';
    } else if (prefix === 'archive-') {
        containerId = 'archive-tiles-container';
    }
    
    const container = document.getElementById(containerId);
    const tiles = container ? Array.from(container.querySelectorAll('.tile:not([data-locked="true"])')) : [];
    
    // Get slots grouped by word
    const slots = getAllSlotsInOrder(prefix);
    const slotsByWord = [[], []];
    slots.forEach(slot => {
        const wordIndex = parseInt(slot.getAttribute('data-word-index') || '0');
        if (wordIndex < 2) {
            slotsByWord[wordIndex].push(slot);
        }
    });
    
    return {
        tiles: tiles,           // Row 0
        word0: slotsByWord[0],  // Row 1
        word1: slotsByWord[1]   // Row 2
    };
}

// Find which row an element is in and its index within that row
function findCurrentRowAndIndex(element, rows) {
    // Check tiles (row 0)
    const tileIndex = rows.tiles.indexOf(element);
    if (tileIndex !== -1) {
        return { row: 0, index: tileIndex };
    }
    
    // Check word 0 slots (row 1)
    const word0Index = rows.word0.indexOf(element);
    if (word0Index !== -1) {
        return { row: 1, index: word0Index };
    }
    
    // Check word 1 slots (row 2)
    const word1Index = rows.word1.indexOf(element);
    if (word1Index !== -1) {
        return { row: 2, index: word1Index };
    }
    
    // Check if element is a tile in a slot
    const slot = element.closest('.slot');
    if (slot) {
        const wordIndex = parseInt(slot.getAttribute('data-word-index') || '0');
        const slotIndex = rows.word0.indexOf(slot);
        if (slotIndex !== -1 && wordIndex === 0) {
            return { row: 1, index: slotIndex };
        }
        const slotIndex1 = rows.word1.indexOf(slot);
        if (slotIndex1 !== -1 && wordIndex === 1) {
            return { row: 2, index: slotIndex1 };
        }
    }
    
    return null;
}

// Handle arrow key navigation for tiles and slots
// Navigates between words (Up/Down) and within rows (Left/Right)
function handleTileArrowNavigation(e, currentElement, context) {
    const prefix = context.prefix || '';
    const rows = getNavigationRows(prefix);
    
    // Find current position
    const currentPos = findCurrentRowAndIndex(currentElement, rows);
    if (!currentPos) return;
    
    const { row: currentRow, index: currentIndex } = currentPos;
    let nextElement = null;
    
    switch (e.key) {
        case 'ArrowLeft':
            // Move left within current row
            const currentRowElements = currentRow === 0 ? rows.tiles : 
                                      currentRow === 1 ? rows.word0 : rows.word1;
            if (currentIndex > 0) {
                nextElement = currentRowElements[currentIndex - 1];
            } else {
                // Wrap to end of row
                nextElement = currentRowElements[currentRowElements.length - 1];
            }
            break;
        case 'ArrowRight':
            // Move right within current row
            const currentRowElementsRight = currentRow === 0 ? rows.tiles : 
                                           currentRow === 1 ? rows.word0 : rows.word1;
            if (currentIndex < currentRowElementsRight.length - 1) {
                nextElement = currentRowElementsRight[currentIndex + 1];
            } else {
                // Wrap to beginning of row
                nextElement = currentRowElementsRight[0];
            }
            break;
        case 'ArrowUp':
            // Move to same index in previous row
            if (currentRow === 0) {
                // From tiles, wrap to last word (word 1)
                const targetRow = rows.word1.length > 0 ? rows.word1 : rows.word0;
                if (targetRow.length > 0) {
                    const targetIndex = Math.min(currentIndex, targetRow.length - 1);
                    nextElement = targetRow[targetIndex];
                }
            } else if (currentRow === 1) {
                // From word 0, move to tiles
                if (rows.tiles.length > 0) {
                    const targetIndex = Math.min(currentIndex, rows.tiles.length - 1);
                    nextElement = rows.tiles[targetIndex];
                } else {
                    // No tiles, wrap to word 1
                    if (rows.word1.length > 0) {
                        const targetIndex = Math.min(currentIndex, rows.word1.length - 1);
                        nextElement = rows.word1[targetIndex];
                    }
                }
            } else if (currentRow === 2) {
                // From word 1, move to word 0
                if (rows.word0.length > 0) {
                    const targetIndex = Math.min(currentIndex, rows.word0.length - 1);
                    nextElement = rows.word0[targetIndex];
                } else {
                    // No word 0, move to tiles
                    if (rows.tiles.length > 0) {
                        const targetIndex = Math.min(currentIndex, rows.tiles.length - 1);
                        nextElement = rows.tiles[targetIndex];
                    }
                }
            }
            break;
        case 'ArrowDown':
            // Move to same index in next row
            if (currentRow === 0) {
                // From tiles, move to word 0
                if (rows.word0.length > 0) {
                    const targetIndex = Math.min(currentIndex, rows.word0.length - 1);
                    nextElement = rows.word0[targetIndex];
                } else if (rows.word1.length > 0) {
                    // No word 0, move to word 1
                    const targetIndex = Math.min(currentIndex, rows.word1.length - 1);
                    nextElement = rows.word1[targetIndex];
                }
            } else if (currentRow === 1) {
                // From word 0, move to word 1
                if (rows.word1.length > 0) {
                    const targetIndex = Math.min(currentIndex, rows.word1.length - 1);
                    nextElement = rows.word1[targetIndex];
                } else {
                    // No word 1, wrap to tiles
                    if (rows.tiles.length > 0) {
                        const targetIndex = Math.min(currentIndex, rows.tiles.length - 1);
                        nextElement = rows.tiles[targetIndex];
                    }
                }
            } else if (currentRow === 2) {
                // From word 1, wrap to tiles
                if (rows.tiles.length > 0) {
                    const targetIndex = Math.min(currentIndex, rows.tiles.length - 1);
                    nextElement = rows.tiles[targetIndex];
                } else {
                    // No tiles, wrap to word 0
                    if (rows.word0.length > 0) {
                        const targetIndex = Math.min(currentIndex, rows.word0.length - 1);
                        nextElement = rows.word0[targetIndex];
                    }
                }
            }
            break;
        default:
            return;
    }
    
    // If next element is a slot, check if it has a tile and navigate to the tile
    // If slot is empty, ensure it's interactive (has tabindex) so it can be focused
    if (nextElement && nextElement.classList.contains('slot')) {
        const tileInSlot = nextElement.querySelector('.tile:not([data-locked="true"])');
        if (tileInSlot) {
            // Slot has a tile, navigate to the tile
            nextElement = tileInSlot;
        } else {
            // Slot is empty, ensure it's interactive so it can be focused
            // This handles cases where slots might have lost interactivity after swaps
            const isLocked = nextElement.getAttribute('data-locked') === 'true';
            if (!isLocked && !nextElement.hasAttribute('tabindex')) {
                nextElement.setAttribute('role', 'button');
                nextElement.setAttribute('tabindex', '0');
            }
        }
    }
    
    if (nextElement && document.contains(nextElement)) {
        e.preventDefault();
        nextElement.focus();
    }
}

// Handle arrow key navigation for slots
function handleSlotArrowNavigation(e, currentElement, context) {
    const prefix = context.prefix || '';
    const slots = getAllSlotsInOrder(prefix);
    
    if (slots.length === 0) return;
    
    const currentIndex = slots.indexOf(currentElement);
    if (currentIndex === -1) return;
    
    // Get word index and slot index for current slot
    const currentWordIndex = parseInt(currentElement.getAttribute('data-word-index') || '0');
    const currentSlotIndex = parseInt(currentElement.getAttribute('data-slot-index') || '0');
    
    // Group slots by word
    const slotsByWord = [[], []];
    slots.forEach(slot => {
        const wordIndex = parseInt(slot.getAttribute('data-word-index') || '0');
        if (wordIndex < 2) {
            slotsByWord[wordIndex].push(slot);
        }
    });
    
    let nextElement = null;
    
    switch (e.key) {
        case 'ArrowLeft':
            // Move left within current word
            if (currentSlotIndex > 0) {
                nextElement = slotsByWord[currentWordIndex][currentSlotIndex - 1];
            } else {
                // At start of word - move to tiles container (first tile)
                const tiles = getAllTilesInOrder(prefix);
                if (tiles.length > 0) {
                    nextElement = tiles[0];
                } else {
                    // No tiles, wrap to end of current word
                    nextElement = slotsByWord[currentWordIndex][slotsByWord[currentWordIndex].length - 1];
                }
            }
            break;
        case 'ArrowRight':
            // Move right within current word
            if (currentSlotIndex < slotsByWord[currentWordIndex].length - 1) {
                nextElement = slotsByWord[currentWordIndex][currentSlotIndex + 1];
            } else {
                // At end of word - move to tiles container (first tile)
                const tiles = getAllTilesInOrder(prefix);
                if (tiles.length > 0) {
                    nextElement = tiles[0];
                } else {
                    // No tiles, wrap to beginning of current word
                    nextElement = slotsByWord[currentWordIndex][0];
                }
            }
            break;
        case 'ArrowUp':
            // Move to same slot index in previous word (or wrap to last word)
            if (currentWordIndex > 0) {
                const prevWordSlots = slotsByWord[currentWordIndex - 1];
                if (currentSlotIndex < prevWordSlots.length) {
                    nextElement = prevWordSlots[currentSlotIndex];
                } else {
                    // If slot index doesn't exist in previous word, use last slot of previous word
                    nextElement = prevWordSlots[prevWordSlots.length - 1];
                }
            } else {
                // At first word - move to tiles container (first tile)
                const tiles = getAllTilesInOrder(prefix);
                if (tiles.length > 0) {
                    nextElement = tiles[0];
                } else {
                    // No tiles, wrap to last word, same slot index
                    const lastWordIndex = slotsByWord.length - 1;
                    const lastWordSlots = slotsByWord[lastWordIndex];
                    if (currentSlotIndex < lastWordSlots.length) {
                        nextElement = lastWordSlots[currentSlotIndex];
                    } else {
                        nextElement = lastWordSlots[lastWordSlots.length - 1];
                    }
                }
            }
            break;
        case 'ArrowDown':
            // Move to same slot index in next word (or wrap to first word)
            if (currentWordIndex < slotsByWord.length - 1) {
                const nextWordSlots = slotsByWord[currentWordIndex + 1];
                if (currentSlotIndex < nextWordSlots.length) {
                    nextElement = nextWordSlots[currentSlotIndex];
                } else {
                    // If slot index doesn't exist in next word, use last slot of next word
                    nextElement = nextWordSlots[nextWordSlots.length - 1];
                }
            } else {
                // At last word - move to tiles container (first tile)
                const tiles = getAllTilesInOrder(prefix);
                if (tiles.length > 0) {
                    nextElement = tiles[0];
                } else {
                    // No tiles, wrap to first word, same slot index
                    const firstWordSlots = slotsByWord[0];
                    if (currentSlotIndex < firstWordSlots.length) {
                        nextElement = firstWordSlots[currentSlotIndex];
                    } else {
                        nextElement = firstWordSlots[firstWordSlots.length - 1];
                    }
                }
            }
            break;
        default:
            return;
    }
    
    if (nextElement && document.contains(nextElement)) {
        e.preventDefault();
        nextElement.focus();
    }
}

// Keyboard handler for slots
export function handleSlotKeyDown(e, context) {
    const slot = e.currentTarget;
    
    // Don't allow keyboard interaction with locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Use context from parameter or stored context
    const activeContext = context || keyboardContext;
    if (!activeContext) {
        console.warn('handleSlotKeyDown: No context available');
        return;
    }
    
    // Handle Tab navigation
    if (e.key === 'Tab') {
        handleTabNavigation(e, slot, activeContext);
        return;
    }
    
    // Handle Arrow key navigation
    // Use unified navigation that includes both tiles and slots
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Check if slot has a tile - if so, navigate from the tile; otherwise navigate from the slot
        const tileInSlot = slot.querySelector('.tile:not([data-locked="true"])');
        if (tileInSlot) {
            // Slot has a tile, use unified navigation from the tile
            handleTileArrowNavigation(e, tileInSlot, activeContext);
        } else {
            // Empty slot, use unified navigation from the slot
            handleTileArrowNavigation(e, slot, activeContext);
        }
        return;
    }
    
    // Handle Delete/Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete(slot, activeContext);
        return;
    }
    
    // Handle letter typing (a-z, A-Z)
    if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleTypeLetter(e.key, slot, activeContext);
        return;
    }
    
    // Handle Enter key - place selected tile in slot or select tile in slot
    if (e.key === 'Enter') {
        e.preventDefault();
        const selectedTile = getSelectedTile();
        
        if (selectedTile && activeContext.placeTileCallback) {
            // Tile is selected, place it in slot
            // Store reference before deselecting (deselect clears the stored reference)
            const tileToPlace = selectedTile;
            
            // Deselect tile first to avoid focus conflicts with placeTileInSlot's focus management
            deselectTile();
            
            // Place tile in slot (will swap if slot has a tile)
            // placeTileInSlot will handle focus with isKeyboardNavigation flag
            activeContext.placeTileCallback(tileToPlace, slot);
        } else {
            // No tile selected - select tile in slot if it exists
            const tileInSlot = slot.querySelector('.tile:not([data-locked="true"])');
            if (tileInSlot) {
                selectTile(tileInSlot);
            }
        }
        return;
    }
    
    // Handle Escape (clear any selection if needed)
    if (e.key === 'Escape') {
        // Escape can be used to blur focus if needed
        // For now, do nothing special
        return;
    }
}

// Keyboard handler for tiles
export function handleTileKeyDown(e, context) {
    const tile = e.currentTarget;
    
    // Don't allow keyboard interaction with locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Use context from parameter or stored context
    const activeContext = context || keyboardContext;
    if (!activeContext) {
        console.warn('handleTileKeyDown: No context available');
        return;
    }
    
    // Handle Tab navigation
    if (e.key === 'Tab') {
        handleTabNavigation(e, tile, activeContext);
        return;
    }
    
    // Handle Arrow key navigation
    // Navigate between all tiles and slots seamlessly
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Use unified navigation that includes both tiles and slots
        handleTileArrowNavigation(e, tile, activeContext);
        return;
    }
    
    // Handle Delete/Backspace
    if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only handle if tile is in a slot (not in container)
        const slot = tile.closest('.slot');
        if (slot) {
            e.preventDefault();
            handleDelete(tile, activeContext);
        }
        // If tile is in container, do nothing (can't delete tiles from container)
        return;
    }
    
    // Handle letter typing (a-z, A-Z)
    if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        
        // If tile is in a slot, typing replaces it
        const slot = tile.closest('.slot');
        if (slot) {
            handleTypeLetter(e.key, tile, activeContext);
        } else {
            // Tile is in container, find next empty slot
            handleTypeLetter(e.key, tile, activeContext);
        }
        return;
    }
    
    // Handle Enter key - select tile or place selected tile
    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation(); // Prevent slot handler from also handling this event
        const selectedTile = getSelectedTile();
        const slot = tile.closest('.slot');
        
        // If this tile is already selected, deselect it
        if (selectedTile === tile) {
            deselectTile();
            return;
        }
        
        // If another tile is selected, handle placement/swapping
        if (selectedTile && selectedTile !== tile) {
            // Validate selected tile exists
            if (!document.contains(selectedTile)) {
                // Selected tile no longer exists, just select current tile
                selectTile(tile);
                return;
            }
            
            const selectedSlot = selectedTile.closest('.slot');
            
            // If current tile is in a slot, place selected tile there (will swap)
            if (slot && activeContext.placeTileCallback) {
                const tileToPlace = selectedTile;
                deselectTile();
                // Call placeTileCallback - it will handle swapping via placeTileInSlot -> swapTiles
                // placeTileInSlot detects existing tile and calls swapTiles automatically
                activeContext.placeTileCallback(tileToPlace, slot);
                return;
            }
            
            // If selected tile is in a slot and current tile is in container, place current tile in selected slot (will swap)
            if (selectedSlot && activeContext.placeTileCallback) {
                deselectTile();
                // placeTileInSlot detects existing tile and calls swapTiles automatically
                activeContext.placeTileCallback(tile, selectedSlot);
                return;
            }
            
            // Both in containers - just select the new tile (replace selection)
            selectTile(tile);
            return;
        }
        
        // No tile selected, select this tile (any non-locked tile, placed or unplaced)
        // Note: Locked tiles are already filtered out at handler level
        selectTile(tile);
        return;
    }
    
    // Handle Escape (clear any selection if needed)
    if (e.key === 'Escape') {
        // Escape can be used to blur focus if needed
        // For now, do nothing special
        return;
    }
}

// Keyboard handler for buttons (hint and submit)
export function handleButtonKeyDown(e, context) {
    // Use context from parameter or stored context
    const activeContext = context || keyboardContext;
    if (!activeContext) {
        console.warn('handleButtonKeyDown: No context available');
        return;
    }
    
    // Handle Tab navigation
    if (e.key === 'Tab') {
        handleTabNavigation(e, e.currentTarget, activeContext);
        return;
    }
    
    // Other keys (Enter, Space) are handled by default button behavior
    // No need to prevent default or handle them here
}
