// Keyboard typing input handler - allows users to type letters to place tiles

import { SCRABBLE_SCORES } from '../puzzle-data-encoded.js';

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
    for (let wordIndex = 0; wordIndex < 2; wordIndex++) {
        const wordContainer = wordSlotsContainer.querySelector(`[data-word-index="${wordIndex}"]`);
        if (wordContainer) {
            const wordSlots = wordContainer.querySelectorAll('.slot:not([data-locked="true"])');
            slots.push(...Array.from(wordSlots));
        }
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

// Get all tiles in container in order
function getAllTilesInOrder(prefix = '') {
    // Determine container ID based on prefix
    let containerId = 'tiles-container';
    if (prefix === 'daily-') {
        containerId = 'daily-tiles-container';
    } else if (prefix === 'archive-') {
        containerId = 'archive-tiles-container';
    }
    
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const tiles = container.querySelectorAll('.tile:not([data-locked="true"])');
    return Array.from(tiles);
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
    
    // Get all focusable elements in order: tiles first, then slots
    const tiles = getAllTilesInOrder(prefix);
    const slots = getAllSlotsInOrder(prefix);
    const allFocusable = [...tiles, ...slots];
    
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
        e.preventDefault();
        nextElement.focus();
    }
}

// Handle arrow key navigation for tiles
function handleTileArrowNavigation(e, currentElement, context) {
    const prefix = context.prefix || '';
    const tiles = getAllTilesInOrder(prefix);
    
    if (tiles.length === 0) return;
    
    const currentIndex = tiles.indexOf(currentElement);
    if (currentIndex === -1) return;
    
    let nextElement = null;
    
    switch (e.key) {
        case 'ArrowLeft':
            // Move left to previous tile
            const leftIndex = currentIndex > 0 ? currentIndex - 1 : tiles.length - 1;
            nextElement = tiles[leftIndex];
            break;
        case 'ArrowRight':
            // Move right to next tile
            const rightIndex = currentIndex < tiles.length - 1 ? currentIndex + 1 : 0;
            nextElement = tiles[rightIndex];
            break;
        case 'ArrowUp':
            // Move to slots (first slot of first word)
            const slots = getAllSlotsInOrder(prefix);
            if (slots.length > 0) {
                nextElement = slots[0];
            }
            break;
        case 'ArrowDown':
            // Move to slots (first slot of first word)
            const slotsDown = getAllSlotsInOrder(prefix);
            if (slotsDown.length > 0) {
                nextElement = slotsDown[0];
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
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        handleSlotArrowNavigation(e, slot, activeContext);
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
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // If tile is in a slot, use slot navigation
        const slot = tile.closest('.slot');
        if (slot) {
            handleSlotArrowNavigation(e, slot, activeContext);
        } else {
            // Tile is in container, use tile navigation
            handleTileArrowNavigation(e, tile, activeContext);
        }
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
    
    // Handle Escape (clear any selection if needed)
    if (e.key === 'Escape') {
        // Escape can be used to blur focus if needed
        // For now, do nothing special
        return;
    }
}
