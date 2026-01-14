// Hints system

import { PUZZLE_DATA } from '../puzzle-data-encoded.js';
import { 
    getHintsRemaining, 
    decrementHintsRemaining,
    getArchiveHintsRemaining,
    decrementArchiveHintsRemaining,
    setSolutionShown,
    setArchiveSolutionShown
} from './puzzle-state.js';
import { createTile, updatePlaceholderTile } from './puzzle-core.js';
import { updateScoreDisplay, updateSubmitButton } from './scoring.js';
import { checkAutoComplete, areAllSlotsFilled } from './auto-complete.js';
import { showFeedback } from './feedback.js';
import { returnTileToContainer } from './drag-drop.js';

// Update hint button text based on remaining hints
export function updateHintButtonText(buttonId = 'hint-btn', hintsRemaining) {
    const hintBtn = document.getElementById(buttonId);
    if (!hintBtn) return;
    
    if (hintsRemaining <= 0) {
        hintBtn.disabled = false;
        hintBtn.textContent = 'Show Solution?';
    } else {
        hintBtn.textContent = `Get Hint (${hintsRemaining} left)`;
    }
}

// Provide hint - places 1 tile in correct position and locks it
export function provideHint(day, context = {}) {
    const prefix = context.prefix || '';
    const stateManager = context.stateManager || createStateManager(prefix);
    const isArchive = prefix === 'archive-';
    const hintsRemaining = stateManager.getHintsRemaining();
    const tilesContainerId = prefix ? `${prefix}tiles-container` : 'tiles-container';
    const returnTileCallback = isArchive && context.returnArchiveTileToContainer ? context.returnArchiveTileToContainer : returnTileToContainer;
    const updateScoreCallback = updateScoreDisplay;
    const updateSubmitCallback = updateSubmitButton;
    
    // Check if hints are available
    if (hintsRemaining <= 0) {
        return;
    }
    
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return;

    const solution = puzzle.solution;
    // Scope slot queries to the prefix word-slots container
    const wordSlotsContainerId = isArchive ? 'archive-word-slots' : (prefix ? `${prefix}word-slots` : 'word-slots');
    const wordSlotsContainer = document.getElementById(wordSlotsContainerId);
    const word1Slots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll(`[data-word-slots="0"] .slot`) : [];
    const word2Slots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll(`[data-word-slots="1"] .slot`) : [];
    
    // Find tiles that need to be placed correctly
    const hintsToPlace = [];
    
    // Check word 1
    solution[0].split('').forEach((correctLetter, index) => {
        const slot = word1Slots[index];
        const currentTile = slot.querySelector('.tile');
        const currentLetter = currentTile ? currentTile.getAttribute('data-letter') : null;
        
        // If slot is empty or has wrong letter, and not already locked
        if ((!currentTile || currentLetter !== correctLetter) && slot.getAttribute('data-locked') !== 'true') {
            hintsToPlace.push({
                wordIndex: 0,
                slotIndex: index,
                letter: correctLetter
            });
        }
    });
    
    // Check word 2
    solution[1].split('').forEach((correctLetter, index) => {
        const slot = word2Slots[index];
        const currentTile = slot.querySelector('.tile');
        const currentLetter = currentTile ? currentTile.getAttribute('data-letter') : null;
        
        // If slot is empty or has wrong letter, and not already locked
        if ((!currentTile || currentLetter !== correctLetter) && slot.getAttribute('data-locked') !== 'true') {
            hintsToPlace.push({
                wordIndex: 1,
                slotIndex: index,
                letter: correctLetter
            });
        }
    });
    
    if (hintsToPlace.length === 0) {
        const feedbackId = isArchive ? 'archive-feedback' : (prefix ? `${prefix}feedback` : 'feedback');
        showFeedback('All tiles are already correct!', 'success', feedbackId);
        return;
    }
    
    // Randomly select 1 hint from available slots
    const randomIndex = Math.floor(Math.random() * hintsToPlace.length);
    const hint = hintsToPlace[randomIndex];
    
    const slots = hint.wordIndex === 0 ? word1Slots : word2Slots;
    const targetSlot = slots[hint.slotIndex];
    
    // Remove existing tile if present
    const existingTile = targetSlot.querySelector('.tile');
    if (existingTile && existingTile.getAttribute('data-locked') !== 'true') {
        const letter = existingTile.getAttribute('data-letter');
        const index = existingTile.getAttribute('data-tile-index');
        existingTile.remove();
        targetSlot.classList.remove('filled');
        if (returnTileCallback) {
            // Pass full context to ensure handlers are properly attached
            if (isArchive && context.returnArchiveTileToContainer) {
                // Archive uses its own return function
                returnTileCallback(letter, index);
            } else if (context.handlers) {
                // Regular puzzles: pass handlers, isKeyboardNavigation (false), prefix, and full context
                returnTileCallback(letter, index, context.handlers, false, prefix, context);
            } else {
                // Fallback: use default returnTileToContainer signature
                returnTileCallback(letter, index);
            }
        }
    }
    
    // Find the correct tile in the container or slots
    const tilesContainer = document.getElementById(tilesContainerId);
    let sourceTile = null;
    
    // First check container
    if (tilesContainer) {
        const containerTiles = tilesContainer.querySelectorAll('.tile:not([data-locked="true"])');
        for (let tile of containerTiles) {
            if (tile.getAttribute('data-letter') === hint.letter) {
                sourceTile = tile;
                break;
            }
        }
    }
    
    // If not in container, check other slots
    if (!sourceTile) {
        const allSlots = document.querySelectorAll('.slot:not([data-locked="true"])');
        for (let slot of allSlots) {
            const tile = slot.querySelector('.tile:not([data-locked="true"])');
            if (tile && tile.getAttribute('data-letter') === hint.letter) {
                sourceTile = tile;
                break;
            }
        }
    }
    
    if (sourceTile) {
        // Remove source tile
        const letter = sourceTile.getAttribute('data-letter');
        const originalIndex = sourceTile.getAttribute('data-tile-index');
        const sourceSlot = sourceTile.closest('.slot');
        const isFromContainer = sourceTile.closest(`#${tilesContainerId}`);
        
        sourceTile.remove();
        if (sourceSlot) {
            sourceSlot.classList.remove('filled');
        }
        
        // If tile was from container, update placeholder
        if (isFromContainer) {
            updatePlaceholderTile(tilesContainerId);
        }
        
        // Create locked tile in target slot
        const lockedTile = createTile(letter, originalIndex, true);
        targetSlot.appendChild(lockedTile);
        targetSlot.classList.add('filled');
        targetSlot.setAttribute('data-locked', 'true');
    }
    
    // Decrement hint counter and update button
    stateManager.decrementHintsRemaining();
    const hintBtnId = prefix ? `${prefix}hint-btn` : 'hint-btn';
    updateHintButtonText(hintBtnId, stateManager.getHintsRemaining());
    
    // Update score display - ensure DOM is fully updated before calculating score
    if (updateScoreCallback) {
        // Use requestAnimationFrame to ensure DOM is fully updated before score calculation
        requestAnimationFrame(() => {
            // Double-check that the tile is in the DOM
            if (targetSlot && targetSlot.querySelector('.tile')) {
                updateScoreCallback(prefix);
            }
        });
    }
    if (updateSubmitCallback) {
        updateSubmitCallback();
    }
    
    // Check if solution is automatically complete
    // Use requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(() => {
        if (areAllSlotsFilled()) {
            checkAutoComplete(day, prefix);
        }
    });
}

// Show solution - places ALL remaining tiles in correct positions and locks them
export function showSolution(day, context = {}) {
    const isArchive = context.isArchive || false;
    const prefix = context.prefix || '';
    const tilesContainerId = isArchive ? 'archive-tiles-container' : (prefix ? `${prefix}tiles-container` : 'tiles-container');
    const returnTileCallback = isArchive ? context.returnArchiveTileToContainer : returnTileToContainer;
    const updateScoreCallback = isArchive ? context.updateArchiveScoreDisplay : updateScoreDisplay;
    const updateSubmitCallback = isArchive ? context.updateArchiveSubmitButton : updateSubmitButton;
    
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return;

    const solution = puzzle.solution;
    // Scope slot queries to the prefix word-slots container
    const wordSlotsContainerId = isArchive ? 'archive-word-slots' : (prefix ? `${prefix}word-slots` : 'word-slots');
    const wordSlotsContainer = document.getElementById(wordSlotsContainerId);
    const word1Slots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll(`[data-word-slots="0"] .slot`) : [];
    const word2Slots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll(`[data-word-slots="1"] .slot`) : [];
    
    // Find all tiles that need to be placed correctly
    const tilesToPlace = [];
    
    // Check word 1
    solution[0].split('').forEach((correctLetter, index) => {
        const slot = word1Slots[index];
        const currentTile = slot.querySelector('.tile');
        const currentLetter = currentTile ? currentTile.getAttribute('data-letter') : null;
        
        // If slot is empty or has wrong letter, and not already locked
        if ((!currentTile || currentLetter !== correctLetter) && slot.getAttribute('data-locked') !== 'true') {
            tilesToPlace.push({
                wordIndex: 0,
                slotIndex: index,
                letter: correctLetter
            });
        }
    });
    
    // Check word 2
    solution[1].split('').forEach((correctLetter, index) => {
        const slot = word2Slots[index];
        const currentTile = slot.querySelector('.tile');
        const currentLetter = currentTile ? currentTile.getAttribute('data-letter') : null;
        
        // If slot is empty or has wrong letter, and not already locked
        if ((!currentTile || currentLetter !== correctLetter) && slot.getAttribute('data-locked') !== 'true') {
            tilesToPlace.push({
                wordIndex: 1,
                slotIndex: index,
                letter: correctLetter
            });
        }
    });
    
    if (tilesToPlace.length === 0) {
        const feedbackId = prefix ? `${prefix}feedback` : 'feedback';
        showFeedback('All tiles are already correct!', 'success', feedbackId);
        return;
    }
    
    // Place all remaining tiles
    tilesToPlace.forEach(hint => {
        const slots = hint.wordIndex === 0 ? word1Slots : word2Slots;
        const targetSlot = slots[hint.slotIndex];
        
        // Remove existing tile if present
        const existingTile = targetSlot.querySelector('.tile');
        if (existingTile && existingTile.getAttribute('data-locked') !== 'true') {
            const letter = existingTile.getAttribute('data-letter');
            const index = existingTile.getAttribute('data-tile-index');
            existingTile.remove();
            targetSlot.classList.remove('filled');
            if (returnTileCallback) {
                // Pass full context to ensure handlers are properly attached
                if (isArchive && context.returnArchiveTileToContainer) {
                    // Archive uses its own return function
                    returnTileCallback(letter, index);
                } else if (context.handlers) {
                    // Regular puzzles: pass handlers, isKeyboardNavigation (false), prefix, and full context
                    returnTileCallback(letter, index, context.handlers, false, prefix, context);
                } else {
                    // Fallback: use default returnTileToContainer signature
                    returnTileCallback(letter, index);
                }
            }
        }
        
        // Find the correct tile in the container or slots
        const tilesContainer = document.getElementById(tilesContainerId);
        let sourceTile = null;
        
        // First check container
        if (tilesContainer) {
            const containerTiles = tilesContainer.querySelectorAll('.tile:not([data-locked="true"])');
            for (let tile of containerTiles) {
                if (tile.getAttribute('data-letter') === hint.letter) {
                    sourceTile = tile;
                    break;
                }
            }
        }
        
        // If not in container, check other slots
        if (!sourceTile) {
            const allSlots = document.querySelectorAll('.slot:not([data-locked="true"])');
            for (let slot of allSlots) {
                const tile = slot.querySelector('.tile:not([data-locked="true"])');
                if (tile && tile.getAttribute('data-letter') === hint.letter) {
                    sourceTile = tile;
                    break;
                }
            }
        }
        
        if (sourceTile) {
            // Remove source tile
            const letter = sourceTile.getAttribute('data-letter');
            const originalIndex = sourceTile.getAttribute('data-tile-index');
            const sourceSlot = sourceTile.closest('.slot');
            const isFromContainer = sourceTile.closest(`#${tilesContainerId}`);
            
            sourceTile.remove();
            if (sourceSlot) {
                sourceSlot.classList.remove('filled');
            }
            
            // If tile was from container, update placeholder
            if (isFromContainer) {
                updatePlaceholderTile(tilesContainerId);
            }
            
            // Create locked tile in target slot
            const lockedTile = createTile(letter, originalIndex, true);
            targetSlot.appendChild(lockedTile);
            targetSlot.classList.add('filled');
            targetSlot.setAttribute('data-locked', 'true');
        }
    });
    
    // Mark solution as shown
    stateManager.setSolutionShown(true);
    
    // Update score display
    if (updateScoreCallback) {
        updateScoreCallback(prefix);
    }
    if (updateSubmitCallback) {
        updateSubmitCallback();
    }
    
    // Check if solution is automatically complete
    // Use requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(() => {
        if (areAllSlotsFilled()) {
            checkAutoComplete(day, prefix);
        }
    });
}

