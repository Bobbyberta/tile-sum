// Core puzzle game logic - tile/slot creation and placeholder management

import { SCRABBLE_SCORES } from '../puzzle-data-today.js';
import { handleTileKeyDown } from './keyboard.js';

/**
 * Creates a draggable tile element with letter and Scrabble score display.
 * 
 * @param {string} letter - The letter to display on the tile (case-insensitive)
 * @param {number} index - Unique index for the tile (used for data-tile-index attribute)
 * @param {boolean} [isLocked=false] - If true, tile cannot be dragged or interacted with
 * @param {Object} [handlers={}] - Event handler functions to attach to the tile
 * @param {Function} [handlers.onDragStart] - Handler for dragstart event
 * @param {Function} [handlers.onDragEnd] - Handler for dragend event
 * @param {Function} [handlers.onClick] - Handler for click event
 * @param {Function} [handlers.onTouchStart] - Handler for touchstart event
 * @param {Function} [handlers.onTouchMove] - Handler for touchmove event
 * @param {Function} [handlers.onTouchEnd] - Handler for touchend event
 * @param {Function} [handlers.onTouchCancel] - Handler for touchcancel event
 * @param {Function} [handlers.onKeyDown] - Handler for keydown event (defaults to handleTileKeyDown)
 * @returns {HTMLElement} The created tile element with appropriate classes, attributes, and event listeners
 * 
 * @example
 * const tile = createTile('A', 0, false, {
 *   onDragStart: (e) => console.log('Dragging'),
 *   onClick: (e) => console.log('Clicked')
 * });
 */
export function createTile(letter, index, isLocked = false, handlers = {}) {
    const tile = document.createElement('div');
    tile.className = `tile bg-tile-bg border border-tile-border text-text-primary rounded-[12px] p-3 w-[60px] h-[60px] flex items-center justify-center shadow-md transition-shadow font-inter relative ${isLocked ? 'locked' : 'hover:shadow-lg'}`;
    tile.setAttribute('draggable', isLocked ? 'false' : 'true');
    tile.setAttribute('data-letter', letter);
    tile.setAttribute('data-tile-index', index);
    if (isLocked) {
        tile.setAttribute('data-locked', 'true');
    }
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', `Tile with letter ${letter}, score ${SCRABBLE_SCORES[letter.toUpperCase()] || 0}${isLocked ? ' (locked)' : ''}`);

    // Create a wrapper for the letter that will be centered
    const letterWrapper = document.createElement('div');
    letterWrapper.className = 'relative inline-block';
    
    const letterDisplay = document.createElement('div');
    letterDisplay.className = 'font-bold font-inter';
    letterDisplay.style.fontSize = '36px';
    letterDisplay.style.lineHeight = '44px';
    letterDisplay.textContent = letter;

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'opacity-90 font-inter absolute';
    scoreDisplay.style.fontSize = '16px';
    scoreDisplay.style.lineHeight = '20px';
    scoreDisplay.style.bottom = '0px';
    scoreDisplay.style.left = 'calc(100% + 2px)';
    scoreDisplay.textContent = SCRABBLE_SCORES[letter.toUpperCase()] || 0;

    letterWrapper.appendChild(letterDisplay);
    letterWrapper.appendChild(scoreDisplay);
    tile.appendChild(letterWrapper);

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
            tile.addEventListener('touchstart', handlers.onTouchStart, { passive: false });
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
        // Use custom keyboard handler if provided, otherwise use default
        if (handlers.onKeyDown) {
            tile.addEventListener('keydown', handlers.onKeyDown);
        } else {
            tile.addEventListener('keydown', handleTileKeyDown);
        }
    }

    return tile;
}

/**
 * Creates a droppable slot element where tiles can be placed to form words.
 * 
 * @param {number} wordIndex - Index of the word this slot belongs to (0 or 1)
 * @param {number} slotIndex - Index of the slot within the word (0-based)
 * @param {boolean} [isLocked=false] - If true, slot cannot accept tiles
 * @param {Object} [handlers={}] - Event handler functions to attach to the slot
 * @param {Function} [handlers.onDragOver] - Handler for dragover event
 * @param {Function} [handlers.onDrop] - Handler for drop event
 * @param {Function} [handlers.onDragLeave] - Handler for dragleave event
 * @param {Function} [handlers.onClick] - Handler for click event
 * @param {Function} [handlers.onKeyDown] - Handler for keydown event
 * @param {Function} [handlers.onFocus] - Handler for focus event
 * @param {Function} [handlers.onBlur] - Handler for blur event
 * @returns {HTMLElement} The created slot element with appropriate classes, attributes, and event listeners
 * 
 * @example
 * const slot = createSlot(0, 0, false, {
 *   onDrop: (e) => handleDrop(e),
 *   onKeyDown: (e) => handleSlotKeyDown(e)
 * });
 */
export function createSlot(wordIndex, slotIndex, isLocked = false, handlers = {}) {
    const slot = document.createElement('div');
    slot.className = `slot w-[60px] h-[60px] rounded-[8px] flex items-center justify-center ${isLocked ? 'locked' : ''}`;
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
            placeholderTile.className = 'tile bg-transparent text-transparent opacity-0 rounded-[12px] p-3 w-[60px] h-[60px] flex items-center justify-center pointer-events-none relative';
            placeholderTile.style.visibility = 'hidden';
            placeholderTile.setAttribute('data-placeholder', 'true');
            placeholderTile.setAttribute('aria-hidden', 'true');
            
            // Create a wrapper for the letter that will be centered
            const letterWrapper = document.createElement('div');
            letterWrapper.className = 'relative inline-block';
            
            const letterDisplay = document.createElement('div');
            letterDisplay.className = 'text-2xl font-bold text-transparent';
            letterDisplay.textContent = 'A';
            
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'text-xs text-transparent absolute';
            scoreDisplay.style.bottom = '0px';
            scoreDisplay.style.left = 'calc(100% + 2px)';
            scoreDisplay.textContent = '1';
            
            letterWrapper.appendChild(letterDisplay);
            letterWrapper.appendChild(scoreDisplay);
            placeholderTile.appendChild(letterWrapper);
            tilesContainer.appendChild(placeholderTile);
        }
    } else {
        // Hide placeholder if tiles exist
        if (placeholder) {
            placeholder.remove();
        }
    }
}

/**
 * Creates the complete DOM structure for a puzzle game dynamically.
 * This includes header, tiles container, word slots, and action buttons.
 * 
 * @param {HTMLElement} containerElement - The parent container element to populate
 * @param {string} prefix - Prefix for element IDs (e.g., 'daily-', 'archive-', or '')
 * @param {string} titleText - Text to display in the puzzle title
 * @returns {Object} Object containing references to created elements:
 *   - header: The header element
 *   - puzzleTitle: The h1 title element
 *   - tilesContainer: The container for draggable tiles
 *   - wordSlotsContainer: The container for word slots
 *   - hintBtn: The hint button element
 *   - submitBtn: The submit button element
 * 
 * @example
 * const container = document.getElementById('puzzle-container');
 * const elements = createPuzzleDOMStructure(container, 'daily-', 'Daily Puzzle');
 * // elements.tilesContainer, elements.hintBtn, etc. are now available
 */
export function createPuzzleDOMStructure(containerElement, prefix, titleText) {
    // Clear previous puzzle content
    containerElement.innerHTML = '';
    
    // Create header matching puzzle.html structure
    const header = document.createElement('header');
    header.className = 'mb-8';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex items-center justify-between mb-2';
    
    const puzzleTitle = document.createElement('h1');
    puzzleTitle.className = 'text-3xl md:text-4xl font-bold text-text-primary font-rem';
    puzzleTitle.style.fontSize = '48px';
    puzzleTitle.style.lineHeight = '60px';
    puzzleTitle.id = `${prefix}puzzle-title`;
    puzzleTitle.textContent = titleText;
    titleContainer.appendChild(puzzleTitle);
    
    header.appendChild(titleContainer);
    containerElement.appendChild(header);
    
    // Create tiles container wrapper matching puzzle.html structure
    const tilesWrapper = document.createElement('div');
    tilesWrapper.className = 'mb-8';
    
    const tilesHeading = document.createElement('h2');
    tilesHeading.className = 'sr-only';
    tilesHeading.textContent = 'Available Tiles';
    tilesWrapper.appendChild(tilesHeading);
    
    const tilesCenteringWrapper = document.createElement('div');
    tilesCenteringWrapper.className = 'flex justify-center';
    
    const tilesContainer = document.createElement('div');
    tilesContainer.id = `${prefix}tiles-container`;
    tilesContainer.className = 'flex flex-wrap gap-2 justify-center';
    tilesCenteringWrapper.appendChild(tilesContainer);
    
    tilesWrapper.appendChild(tilesCenteringWrapper);
    
    containerElement.appendChild(tilesWrapper);
    
    // Create word slots wrapper matching puzzle.html structure
    const slotsWrapper = document.createElement('div');
    slotsWrapper.className = 'mb-8';
    
    const slotsHeading = document.createElement('h2');
    slotsHeading.className = 'sr-only';
    slotsHeading.textContent = 'Word Slots';
    slotsWrapper.appendChild(slotsHeading);
    
    const wordSlotsContainer = document.createElement('div');
    wordSlotsContainer.id = `${prefix}word-slots`;
    wordSlotsContainer.className = 'grid grid-cols-1 md:grid-cols-2 md:flex md:flex-row md:justify-center md:gap-5 gap-6';
    slotsWrapper.appendChild(wordSlotsContainer);
    
    containerElement.appendChild(slotsWrapper);
    
    // Create buttons container matching puzzle.html structure
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'mb-8 flex flex-row gap-4 md:justify-center';
    
    const hintBtn = document.createElement('button');
    hintBtn.id = `${prefix}hint-btn`;
    hintBtn.className = 'flex-1 md:flex-none md:w-auto px-8 py-3 bg-hint-button text-white font-bold rounded-[24px] shadow-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-hint-button focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-rem';
    hintBtn.style.fontSize = '20px';
    hintBtn.style.lineHeight = '25px';
    hintBtn.textContent = 'Hint';
    buttonsContainer.appendChild(hintBtn);
    
    const submitBtn = document.createElement('button');
    submitBtn.id = `${prefix}submit-btn`;
    submitBtn.className = 'flex-1 md:flex-none md:w-auto px-8 py-3 bg-submit text-text-primary font-black rounded-[24px] shadow-button hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-submit focus:ring-offset-2 transition-colors font-rem';
    submitBtn.style.fontSize = '20px';
    submitBtn.style.lineHeight = '25px';
    submitBtn.textContent = 'Submit';
    buttonsContainer.appendChild(submitBtn);
    
    containerElement.appendChild(buttonsContainer);
    
    // Return references to created elements
    return {
        header,
        puzzleTitle,
        tilesContainer,
        wordSlotsContainer,
        hintBtn,
        submitBtn
    };
}

