// Score & validation functions

import { calculateWordScore, validateSolution } from '../puzzle-data.js';

// Update score display
export function updateScoreDisplay(prefix = '') {
    const word1Slots = document.querySelectorAll(`[data-word-slots="0"] .slot`);
    const word2Slots = document.querySelectorAll(`[data-word-slots="1"] .slot`);

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

    // Get max scores from word containers
    const word1Container = document.querySelector(`[data-word-index="0"]`);
    const word2Container = document.querySelector(`[data-word-index="1"]`);
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

// Update submit button state (no longer disables button, kept for potential future use)
export function updateSubmitButton() {
    // Button is always enabled now
    // This function is kept for consistency but doesn't disable the button
}

// Check solution
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

