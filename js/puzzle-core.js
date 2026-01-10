// Core puzzle game logic - tile/slot creation and placeholder management

import { SCRABBLE_SCORES } from '../puzzle-data-encoded.js';
import { handleTileKeyDown } from './keyboard.js';

// Create a tile element
export function createTile(letter, index, isLocked = false, handlers = {}) {
    const tile = document.createElement('div');
    tile.className = `tile bg-indigo-600 text-white rounded-lg p-3 w-14 h-14 flex flex-col items-center justify-center shadow-md transition-shadow ${isLocked ? 'locked' : 'hover:shadow-lg'}`;
    tile.setAttribute('draggable', isLocked ? 'false' : 'true');
    tile.setAttribute('data-letter', letter);
    tile.setAttribute('data-tile-index', index);
    if (isLocked) {
        tile.setAttribute('data-locked', 'true');
    }
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', `Tile with letter ${letter}, score ${SCRABBLE_SCORES[letter.toUpperCase()] || 0}${isLocked ? ' (locked)' : ''}`);

    const letterDisplay = document.createElement('div');
    letterDisplay.className = 'text-2xl font-bold';
    letterDisplay.textContent = letter;

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'text-xs mt-1 opacity-90';
    scoreDisplay.textContent = SCRABBLE_SCORES[letter.toUpperCase()] || 0;

    tile.appendChild(letterDisplay);
    tile.appendChild(scoreDisplay);

    // Drag and drop handlers only if not locked
    if (!isLocked) {
        if (handlers.onDragStart) {
            tile.addEventListener('dragstart', handlers.onDragStart);
        }
        if (handlers.onDragEnd) {
            tile.addEventListener('dragend', handlers.onDragEnd);
        }
        if (handlers.onClick) {
            tile.addEventListener('click', handlers.onClick);
        }
        // Touch handlers for mobile drag support
        if (handlers.onTouchStart) {
            tile.addEventListener('touchstart', handlers.onTouchStart, { passive: true });
        }
        if (handlers.onTouchMove) {
            tile.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
        }
        if (handlers.onTouchEnd) {
            tile.addEventListener('touchend', handlers.onTouchEnd, { passive: true });
        }
        if (handlers.onTouchCancel) {
            tile.addEventListener('touchcancel', handlers.onTouchCancel, { passive: true });
        }
        tile.addEventListener('keydown', handleTileKeyDown);
    }

    return tile;
}

// Create a slot element
export function createSlot(wordIndex, slotIndex, isLocked = false, handlers = {}) {
    const slot = document.createElement('div');
    slot.className = `slot w-14 h-14 rounded-lg flex items-center justify-center ${isLocked ? 'locked' : ''}`;
    slot.setAttribute('data-word-index', wordIndex);
    slot.setAttribute('data-slot-index', slotIndex);
    slot.setAttribute('droppable', 'true');
    if (isLocked) {
        slot.setAttribute('data-locked', 'true');
    }
    slot.setAttribute('aria-label', `Slot ${slotIndex + 1} for word ${wordIndex + 1}${isLocked ? ' (locked)' : ''}`);
    slot.setAttribute('role', 'button');
    
    // Make slots keyboard accessible
    if (!isLocked) {
        slot.setAttribute('tabindex', '0');
    }

    // Drag and drop handlers only if not locked
    if (!isLocked) {
        if (handlers.onDragOver) {
            slot.addEventListener('dragover', handlers.onDragOver);
        }
        if (handlers.onDrop) {
            slot.addEventListener('drop', handlers.onDrop);
        }
        if (handlers.onDragLeave) {
            slot.addEventListener('dragleave', handlers.onDragLeave);
        }
        if (handlers.onClick) {
            slot.addEventListener('click', handlers.onClick);
        }
        if (handlers.onKeyDown) {
            slot.addEventListener('keydown', handlers.onKeyDown);
        }
        if (handlers.onFocus) {
            slot.addEventListener('focus', handlers.onFocus);
        }
        if (handlers.onBlur) {
            slot.addEventListener('blur', handlers.onBlur);
        }
    }

    return slot;
}

// Update placeholder tile visibility
export function updatePlaceholderTile(containerId = 'tiles-container') {
    const tilesContainer = document.getElementById(containerId);
    if (!tilesContainer) return;
    
    const actualTiles = tilesContainer.querySelectorAll('.tile:not([data-placeholder])');
    const placeholder = tilesContainer.querySelector('[data-placeholder]');
    
    if (actualTiles.length === 0) {
        // Show placeholder if no tiles
        if (!placeholder) {
            const placeholderTile = document.createElement('div');
            placeholderTile.className = 'tile bg-transparent text-transparent opacity-0 rounded-lg p-3 w-14 h-14 flex flex-col items-center justify-center pointer-events-none';
            placeholderTile.style.visibility = 'hidden';
            placeholderTile.setAttribute('data-placeholder', 'true');
            placeholderTile.setAttribute('aria-hidden', 'true');
            
            const letterDisplay = document.createElement('div');
            letterDisplay.className = 'text-2xl font-bold text-transparent';
            letterDisplay.textContent = 'A';
            
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'text-xs mt-1 text-transparent';
            scoreDisplay.textContent = '1';
            
            placeholderTile.appendChild(letterDisplay);
            placeholderTile.appendChild(scoreDisplay);
            tilesContainer.appendChild(placeholderTile);
        }
    } else {
        // Hide placeholder if tiles exist
        if (placeholder) {
            placeholder.remove();
        }
    }
}

