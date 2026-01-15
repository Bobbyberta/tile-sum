// Hints system

import { PUZZLE_DATA, SCRABBLE_SCORES } from '../puzzle-data-encoded.js';
import { 
    getHintsRemaining, 
    decrementHintsRemaining,
    getArchiveHintsRemaining,
    decrementArchiveHintsRemaining,
    setSolutionShown,
    setArchiveSolutionShown,
    createStateManager
} from './puzzle-state.js';
import { createTile, updatePlaceholderTile } from './puzzle-core.js';
import { updateScoreDisplay, updateSubmitButton } from './scoring.js';
import { checkAutoComplete, areAllSlotsFilled } from './auto-complete.js';
import { showFeedback } from './feedback.js';
import { returnTileToContainer } from './drag-drop.js';

function getWordSlotsContainerId(prefix, isArchive) {
    return isArchive ? 'archive-word-slots' : (prefix ? `${prefix}word-slots` : 'word-slots');
}

function getTilesContainerId(prefix, isArchive) {
    if (isArchive) return 'archive-tiles-container';
    return prefix ? `${prefix}tiles-container` : 'tiles-container';
}

function getMinTileIndexByLetter(tilesContainer, wordSlotsContainer) {
    const minIndexByLetter = new Map();
    const tileElements = [];
    
    // Check ALL tiles (including locked) to determine jumble order for tie-breaking
    // This ensures we use the earliest position of each letter from the initial jumble
    if (tilesContainer) {
        tileElements.push(...tilesContainer.querySelectorAll('.tile'));
    }
    if (wordSlotsContainer) {
        tileElements.push(...wordSlotsContainer.querySelectorAll('.tile'));
    }
    
    tileElements.forEach(tile => {
        const letter = tile.getAttribute('data-letter');
        const indexRaw = tile.getAttribute('data-tile-index');
        const index = indexRaw == null ? NaN : Number(indexRaw);
        if (!letter || Number.isNaN(index)) return;
        
        const prev = minIndexByLetter.get(letter);
        if (prev == null || index < prev) {
            minIndexByLetter.set(letter, index);
        }
    });
    
    return minIndexByLetter;
}

function selectBestHint(hintsToPlace, minTileIndexByLetter) {
    // Deterministic ordering:
    // 1) higher Scrabble score
    // 2) earlier in initial jumble (lowest data-tile-index for that letter)
    // 3) earliest slot (word 1 left-to-right, then word 2)
    const sorted = [...hintsToPlace].sort((a, b) => {
        const scoreA = SCRABBLE_SCORES[a.letter?.toUpperCase?.()] || 0;
        const scoreB = SCRABBLE_SCORES[b.letter?.toUpperCase?.()] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        const idxA = minTileIndexByLetter.get(a.letter) ?? Number.POSITIVE_INFINITY;
        const idxB = minTileIndexByLetter.get(b.letter) ?? Number.POSITIVE_INFINITY;
        if (idxA !== idxB) return idxA - idxB;
        
        if (a.wordIndex !== b.wordIndex) return a.wordIndex - b.wordIndex;
        return a.slotIndex - b.slotIndex;
    });
    
    return sorted[0];
}

// Update hint button text based on remaining hints
export function updateHintButtonText(buttonId = 'hint-btn', hintsRemaining) {
    const hintBtn = document.getElementById(buttonId);
    if (!hintBtn) return;
    
    if (hintsRemaining <= 0) {
        hintBtn.disabled = true;
        hintBtn.textContent = 'Get Hint (0 left)';
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
    const tilesContainerId = getTilesContainerId(prefix, isArchive);
    const returnTileCallback = isArchive && context.returnArchiveTileToContainer ? context.returnArchiveTileToContainer : returnTileToContainer;
    const updateScoreCallback = updateScoreDisplay;
    const updateSubmitCallback = updateSubmitButton;
    
    // Check if hints are available
    if (hintsRemaining <= 0) {
        const feedbackId = isArchive ? 'archive-feedback' : (prefix ? `${prefix}feedback` : 'feedback');
        showFeedback('All hints have been used', 'error', feedbackId);
        return;
    }
    
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return;

    const solution = puzzle.solution;
    // Scope slot queries to the prefix word-slots container
    const wordSlotsContainerId = getWordSlotsContainerId(prefix, isArchive);
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
        const isSlotLocked = slot.getAttribute('data-locked') === 'true';
        const isTileLocked = currentTile ? currentTile.getAttribute('data-locked') === 'true' : false;
        
        // Include slot if:
        // - Slot is not locked AND
        // - (Slot is empty OR has wrong letter OR has correct letter but tile is not locked)
        // This ensures highest-value tiles get locked even if already correctly placed
        if (!isSlotLocked && (!currentTile || currentLetter !== correctLetter || !isTileLocked)) {
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
        const isSlotLocked = slot.getAttribute('data-locked') === 'true';
        const isTileLocked = currentTile ? currentTile.getAttribute('data-locked') === 'true' : false;
        
        // Include slot if:
        // - Slot is not locked AND
        // - (Slot is empty OR has wrong letter OR has correct letter but tile is not locked)
        // This ensures highest-value tiles get locked even if already correctly placed
        if (!isSlotLocked && (!currentTile || currentLetter !== correctLetter || !isTileLocked)) {
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
    
    // Deterministically select the best hint:
    // highest letter value first; tie-break uses initial jumble order.
    const tilesContainer = document.getElementById(tilesContainerId);
    const minTileIndexByLetter = getMinTileIndexByLetter(tilesContainer, wordSlotsContainer);
    const hint = selectBestHint(hintsToPlace, minTileIndexByLetter);
    
    const slots = hint.wordIndex === 0 ? word1Slots : word2Slots;
    const targetSlot = slots[hint.slotIndex];
    
    // Check if target slot already has the correct tile (just needs to be locked)
    const existingTile = targetSlot.querySelector('.tile');
    const existingTileLetter = existingTile ? existingTile.getAttribute('data-letter') : null;
    const existingTileIsCorrect = existingTile && existingTileLetter === hint.letter;
    const existingTileIsLocked = existingTile ? existingTile.getAttribute('data-locked') === 'true' : false;
    
    if (existingTileIsCorrect && !existingTileIsLocked) {
        // Tile is already correct, just lock it in place
        existingTile.setAttribute('data-locked', 'true');
        existingTile.setAttribute('draggable', 'false');
        existingTile.classList.add('locked');
        targetSlot.setAttribute('data-locked', 'true');
    } else {
        // Need to find and place the correct tile
        // Remove existing tile if present (wrong letter)
        if (existingTile && !existingTileIsLocked) {
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
            const allSlots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll('.slot:not([data-locked="true"])') : [];
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
    const prefix = context.prefix || '';
    const stateManager = context.stateManager || createStateManager(prefix);
    const isArchive = prefix === 'archive-';
    const tilesContainerId = getTilesContainerId(prefix, isArchive);
    const returnTileCallback = isArchive ? context.returnArchiveTileToContainer : returnTileToContainer;
    const updateScoreCallback = isArchive ? context.updateArchiveScoreDisplay : updateScoreDisplay;
    const updateSubmitCallback = isArchive ? context.updateArchiveSubmitButton : updateSubmitButton;
    
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return;

    const solution = puzzle.solution;
    // Scope slot queries to the prefix word-slots container
    const wordSlotsContainerId = getWordSlotsContainerId(prefix, isArchive);
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
        const isSlotLocked = slot.getAttribute('data-locked') === 'true';
        const isTileLocked = currentTile ? currentTile.getAttribute('data-locked') === 'true' : false;
        
        // If slot is not locked and (slot is empty, has wrong letter, or has correct letter but tile is not locked)
        if (!isSlotLocked && (!currentTile || currentLetter !== correctLetter || !isTileLocked)) {
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
        const isSlotLocked = slot.getAttribute('data-locked') === 'true';
        const isTileLocked = currentTile ? currentTile.getAttribute('data-locked') === 'true' : false;
        
        // If slot is not locked and (slot is empty, has wrong letter, or has correct letter but tile is not locked)
        if (!isSlotLocked && (!currentTile || currentLetter !== correctLetter || !isTileLocked)) {
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
        
        // Check if target slot already has the correct tile (just needs to be locked)
        const existingTile = targetSlot.querySelector('.tile');
        const existingTileLetter = existingTile ? existingTile.getAttribute('data-letter') : null;
        const existingTileIsCorrect = existingTile && existingTileLetter === hint.letter;
        const existingTileIndex = existingTile ? existingTile.getAttribute('data-tile-index') : null;
        
        // Find the correct tile in the container or slots
        const tilesContainer = document.getElementById(tilesContainerId);
        let sourceTile = null;
        let shouldReturnExistingTile = false;
        
        // If target slot has correct tile, use it as source (will be removed and recreated as locked)
        if (existingTileIsCorrect && existingTile.getAttribute('data-locked') !== 'true') {
            sourceTile = existingTile;
            shouldReturnExistingTile = false; // Don't return it to container since we're locking it in place
        } else {
            // Remove existing tile if present (wrong letter or needs to be replaced)
            if (existingTile && existingTile.getAttribute('data-locked') !== 'true') {
                const letter = existingTile.getAttribute('data-letter');
                const index = existingTile.getAttribute('data-tile-index');
                existingTile.remove();
                targetSlot.classList.remove('filled');
                shouldReturnExistingTile = true;
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
                const allSlots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll('.slot:not([data-locked="true"])') : [];
                for (let slot of allSlots) {
                    const tile = slot.querySelector('.tile:not([data-locked="true"])');
                    if (tile && tile.getAttribute('data-letter') === hint.letter) {
                        sourceTile = tile;
                        break;
                    }
                }
            }
        }
        
        if (sourceTile) {
            // Remove source tile
            const letter = sourceTile.getAttribute('data-letter');
            const originalIndex = sourceTile.getAttribute('data-tile-index');
            const sourceSlot = sourceTile.closest('.slot');
            const isFromContainer = sourceTile.closest(`#${tilesContainerId}`);
            const isFromTargetSlot = sourceSlot === targetSlot;
            
            sourceTile.remove();
            // Remove filled class from source slot (will be re-added to target slot when locked tile is added)
            if (sourceSlot) {
                sourceSlot.classList.remove('filled');
            }
            
            // If tile was from container, update placeholder
            if (isFromContainer) {
                updatePlaceholderTile(tilesContainerId);
            }
            
            // Only return tile to container if it was wrong letter (not if it was correct but just needed locking)
            if (shouldReturnExistingTile && !isFromTargetSlot && returnTileCallback) {
                // This case is already handled above when removing wrong tile
            }
            
            // Create locked tile in target slot
            const lockedTile = createTile(letter, originalIndex, true);
            targetSlot.appendChild(lockedTile);
            // Locked slots don't need the 'filled' class since data-locked="true" indicates they're filled
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

