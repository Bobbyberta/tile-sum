// Auto-completion detection - automatically shows success modal when solution is correct

import { validateSolution, calculateWordScore } from '../puzzle-data-encoded.js';
import { showSuccessModal } from './modals.js';
import { triggerSnowflakeConfetti } from './feedback.js';
import { 
    getHintsRemaining, 
    getArchiveHintsRemaining, 
    getSolutionShown, 
    getArchiveSolutionShown 
} from './puzzle-state.js';

// Track if auto-complete has already triggered to prevent duplicate modals
let autoCompleteTriggered = false;

// Store current puzzle day and prefix
let currentDay = null;
let currentPrefix = '';

// Initialize auto-complete for a puzzle (call when initializing a new puzzle)
export function initAutoComplete(day, prefix = '') {
    autoCompleteTriggered = false;
    currentDay = day;
    currentPrefix = prefix;
    console.log('[AutoComplete] Initialized', { day, prefix });
}

// Reset auto-complete tracking (call when initializing a new puzzle)
export function resetAutoComplete() {
    autoCompleteTriggered = false;
    currentDay = null;
    currentPrefix = '';
}

// Helper function to check if all slots are filled (optimization to avoid unnecessary checks)
export function areAllSlotsFilled() {
    const word1Slots = document.querySelectorAll(`[data-word-slots="0"] .slot`);
    const word2Slots = document.querySelectorAll(`[data-word-slots="1"] .slot`);
    
    console.log('[AutoComplete] areAllSlotsFilled check', { word1Count: word1Slots.length, word2Count: word2Slots.length });
    
    // Ensure slots exist
    if (word1Slots.length === 0 || word2Slots.length === 0) {
        console.log('[AutoComplete] Slots not found, returning false');
        return false;
    }
    
    // Check if puzzle is complete (all slots filled)
    const word1Complete = Array.from(word1Slots).every(slot => slot.querySelector('.tile'));
    const word2Complete = Array.from(word2Slots).every(slot => slot.querySelector('.tile'));
    
    const word1Filled = Array.from(word1Slots).filter(slot => slot.querySelector('.tile')).length;
    const word2Filled = Array.from(word2Slots).filter(slot => slot.querySelector('.tile')).length;
    
    console.log('[AutoComplete] Completion status', { word1Complete, word2Complete, word1Filled, word2Filled, word1Total: word1Slots.length, word2Total: word2Slots.length });
    
    return word1Complete && word2Complete;
}

// Check if solution is correct and automatically show success modal
// Can be called without parameters if initAutoComplete was called first
// Note: This function assumes all slots are filled (use areAllSlotsFilled() before calling)
export function checkAutoComplete(day = null, prefix = null) {
    console.log('[AutoComplete] checkAutoComplete called', { day, prefix, currentDay, currentPrefix, autoCompleteTriggered });
    
    // Use stored values if parameters not provided
    const puzzleDay = day !== null ? day : currentDay;
    const puzzlePrefix = prefix !== null ? prefix : currentPrefix;
    
    // Can't check if no puzzle day is set
    if (puzzleDay === null) {
        console.log('[AutoComplete] No puzzle day set, skipping');
        return;
    }
    // Prevent duplicate triggers
    if (autoCompleteTriggered) {
        return;
    }

    const word1Slots = document.querySelectorAll(`[data-word-slots="0"] .slot`);
    const word2Slots = document.querySelectorAll(`[data-word-slots="1"] .slot`);

    // Ensure slots exist
    if (word1Slots.length === 0 || word2Slots.length === 0) {
        return;
    }

    // Check if puzzle is complete (all slots filled)
    // Note: This check is redundant if areAllSlotsFilled() was called first, but kept for safety
    const word1Complete = Array.from(word1Slots).every(slot => slot.querySelector('.tile'));
    const word2Complete = Array.from(word2Slots).every(slot => slot.querySelector('.tile'));

    // Only proceed if puzzle is complete
    if (!word1Complete || !word2Complete) {
        return;
    }

    // Extract words from slots
    const word1 = Array.from(word1Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('')
        .toUpperCase();

    const word2 = Array.from(word2Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('')
        .toUpperCase();

    // Validate solution
    const isValid = validateSolution(puzzleDay, word1, word2);

    if (isValid) {
        // Mark as triggered to prevent duplicate modals
        autoCompleteTriggered = true;

        // Calculate scores
        const word1Score = calculateWordScore(word1);
        const word2Score = calculateWordScore(word2);
        
        // Get max scores from word containers
        const word1Container = document.querySelector(`[data-word-index="0"]`);
        const word2Container = document.querySelector(`[data-word-index="1"]`);
        const word1MaxScore = word1Container ? parseInt(word1Container.getAttribute('data-max-score')) : 0;
        const word2MaxScore = word2Container ? parseInt(word2Container.getAttribute('data-max-score')) : 0;
        
        // Calculate hints used and check if solution was shown
        const isArchive = puzzlePrefix === 'archive-';
        const hintsUsed = isArchive ? (3 - getArchiveHintsRemaining()) : (3 - getHintsRemaining());
        const solutionShown = isArchive ? getArchiveSolutionShown() : getSolutionShown();
        
        // Show success modal
        showSuccessModal(puzzleDay, word1Score, word2Score, word1MaxScore, word2MaxScore, puzzlePrefix, hintsUsed, solutionShown);
        
        // Trigger confetti
        triggerSnowflakeConfetti();
    }
}
