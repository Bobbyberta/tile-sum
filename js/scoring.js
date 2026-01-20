// Score & validation functions

import { calculateWordScore, validateSolution } from '../puzzle-data-today.js';

/**
 * Updates the score display for both words in the puzzle.
 * Calculates current scores based on tiles in slots and displays them
 * alongside the maximum possible scores.
 * 
 * @param {string} [prefix=''] - Prefix for element IDs ('daily-', 'archive-', or '')
 * @returns {void}
 * 
 * @example
 * updateScoreDisplay(); // Updates scores for regular puzzle
 * updateScoreDisplay('daily-'); // Updates scores for daily puzzle
 */
export function updateScoreDisplay(prefix = '') {
    // Determine the correct word-slots container ID based on prefix
    // Archive puzzles use 'archive-word-slots' (prefix would be 'archive-' but container doesn't use prefix)
    // Regular puzzles use 'word-slots' (no prefix)
    // Daily puzzles use 'daily-word-slots' (prefix = 'daily-')
    let wordSlotsContainerId;
    if (prefix === 'archive-') {
        wordSlotsContainerId = 'archive-word-slots';
    } else if (prefix) {
        wordSlotsContainerId = `${prefix}word-slots`;
    } else {
        // No prefix - check for archive container first, then default to regular
        wordSlotsContainerId = document.getElementById('archive-word-slots') ? 'archive-word-slots' : 'word-slots';
    }
    
    const wordSlotsContainer = document.getElementById(wordSlotsContainerId);
    
    // Scope slot queries to the correct container
    const word1Slots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll(`[data-word-slots="0"] .slot`) : [];
    const word2Slots = wordSlotsContainer ? wordSlotsContainer.querySelectorAll(`[data-word-slots="1"] .slot`) : [];

    const word1 = Array.from(word1Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('');

    const word2 = Array.from(word2Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('');

    const word1Score = calculateWordScore(word1);
    const word2Score = calculateWordScore(word2);

    // Get max scores from word containers - scope to the same container
    const word1Container = wordSlotsContainer ? wordSlotsContainer.querySelector(`[data-word-index="0"]`) : null;
    const word2Container = wordSlotsContainer ? wordSlotsContainer.querySelector(`[data-word-index="1"]`) : null;
    const word1MaxScore = word1Container ? parseInt(word1Container.getAttribute('data-max-score')) : 0;
    const word2MaxScore = word2Container ? parseInt(word2Container.getAttribute('data-max-score')) : 0;

    const word1ScoreDisplay = document.getElementById(`${prefix}word1-score-display`);
    const word2ScoreDisplay = document.getElementById(`${prefix}word2-score-display`);
    
    if (word1ScoreDisplay) {
        word1ScoreDisplay.textContent = `${word1Score} / ${word1MaxScore} points`;
    }
    if (word2ScoreDisplay) {
        word2ScoreDisplay.textContent = `${word2Score} / ${word2MaxScore} points`;
    }
}

/**
 * Updates submit button state.
 * Note: Currently the button is always enabled. This function is kept
 * for consistency and potential future use.
 * 
 * @returns {void}
 */
export function updateSubmitButton() {
    // Button is always enabled now
    // This function is kept for consistency but doesn't disable the button
}

/**
 * Checks if the current puzzle solution is correct.
 * Validates that all slots are filled and the words match the solution.
 * 
 * @param {number} day - The puzzle number/day to validate
 * @param {Function} [showErrorModalCallback] - Callback to show error modal if solution is incorrect or incomplete
 * @param {Function} [showSuccessModalCallback] - Callback to show success modal with scores if solution is correct
 * @param {Function} [triggerConfettiCallback] - Callback to trigger celebration animation
 * @returns {void}
 * 
 * @example
 * checkSolution(1, 
 *   () => showErrorModal('Incorrect solution'),
 *   (day, score1, score2, max1, max2) => showSuccessModal(day, score1, score2),
 *   () => triggerSnowflakeConfetti()
 * );
 */
export function checkSolution(day, showErrorModalCallback, showSuccessModalCallback, triggerConfettiCallback) {
    const word1Slots = document.querySelectorAll('[data-word-slots="0"] .slot');
    const word2Slots = document.querySelectorAll('[data-word-slots="1"] .slot');

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

    // Check if puzzle is complete (all slots filled)
    const word1Complete = Array.from(word1Slots).every(slot => slot.querySelector('.tile'));
    const word2Complete = Array.from(word2Slots).every(slot => slot.querySelector('.tile'));

    // If puzzle is not complete, show error modal
    if (!word1Complete || !word2Complete) {
        if (showErrorModalCallback) {
            showErrorModalCallback();
        }
        return;
    }

    // Validate solution
    const isValid = validateSolution(day, word1, word2);

    if (isValid) {
        // Calculate scores
        const word1Score = calculateWordScore(word1);
        const word2Score = calculateWordScore(word2);
        
        // Get max scores from word containers
        const word1Container = document.querySelector('[data-word-index="0"]');
        const word2Container = document.querySelector('[data-word-index="1"]');
        const word1MaxScore = word1Container ? parseInt(word1Container.getAttribute('data-max-score')) : 0;
        const word2MaxScore = word2Container ? parseInt(word2Container.getAttribute('data-max-score')) : 0;
        
        if (showSuccessModalCallback) {
            showSuccessModalCallback(day, word1Score, word2Score, word1MaxScore, word2MaxScore);
        }
        if (triggerConfettiCallback) {
            triggerConfettiCallback();
        }
    } else {
        if (showErrorModalCallback) {
            showErrorModalCallback();
        }
    }
}

