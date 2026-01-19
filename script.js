// Main entry point - imports and wires together all modules

// Import puzzle data (must be first)
import { 
    PUZZLE_DATA,
    getPuzzleLetters,
    calculateWordScore,
    getDateForPuzzleNumber,
    parseDateString,
    getPuzzleNumberForDate,
    isAdventMode
} from './puzzle-data-encoded.js';

// Import all modules
import { updateCountdown, initCalendar, initDailyPuzzle } from './js/ui.js';
import { createTile, createSlot, updatePlaceholderTile } from './js/puzzle-core.js';
import { 
    handleDragStart, 
    handleDragEnd, 
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleTileClick,
    handleSlotClick,
    handleTilesContainerDragOver,
    handleTilesContainerDrop,
    handleTilesContainerDragLeave,
    placeTileInSlot,
    removeTileFromSlot,
    returnTileToContainer,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
} from './js/drag-drop.js';
import { 
    handleTileKeyDown,
    handleSlotKeyDown,
    handleButtonKeyDown,
    handleSlotFocus,
    handleSlotBlur
} from './js/keyboard.js';
import { initKeyboardInput } from './js/keyboard-input.js';
import { updateScoreDisplay, updateSubmitButton, checkSolution } from './js/scoring.js';
import { provideHint, updateHintButtonText } from './js/hints.js';
import { showFeedback, triggerSnowflakeConfetti } from './js/feedback.js';
import { showSuccessModal, showErrorModal, closeErrorModal, closeSuccessModal, showHelpModal, closeHelpModal } from './js/modals.js';
import { updateSocialMetaTags } from './js/seo.js';
import { getDaySuffix, debugLog } from './js/utils.js';
import { setHintsRemaining, getHintsRemaining, getSolutionShown, setSolutionShown, createStateManager } from './js/puzzle-state.js';
import { initArchivePage } from './js/archive.js';
import { isPuzzleCompletedToday, isPuzzleCompletedForDate } from './js/completion.js';
import { initAutoComplete } from './js/auto-complete.js';
import { displayStreak } from './js/streak.js';

// Shared puzzle initialization function that works with different prefixes
function initPuzzleWithPrefix(day, prefix = '', stateManager = null) {
    // Create state manager if not provided
    if (!stateManager) {
        stateManager = createStateManager(prefix);
    }
    // Get date for this puzzle number
    const puzzleDate = getDateForPuzzleNumber(day);
    
    // Update puzzle title with formatted date (skip for daily puzzle as it's hidden)
    if (prefix !== 'daily-') {
        const puzzleTitle = document.getElementById(`${prefix}puzzle-title`);
        if (puzzleTitle && puzzleDate) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[puzzleDate.getDay()];
            const daySuffix = getDaySuffix(puzzleDate.getDate());
            const monthName = puzzleDate.toLocaleDateString('en-US', { month: 'long' });
            const year = puzzleDate.getFullYear();
            puzzleTitle.textContent = `${dayName} ${puzzleDate.getDate()}${daySuffix} ${monthName} ${year}`;
        } else if (puzzleTitle) {
            // Fallback for puzzles without dates (shouldn't happen, but just in case)
            puzzleTitle.textContent = `Puzzle #${day}`;
        }
    }
    
    // Check if puzzle exists
    if (!PUZZLE_DATA[day]) {
        if (prefix === 'daily-') {
            const dailyPuzzleContent = document.getElementById('daily-puzzle-content');
            if (dailyPuzzleContent) {
                dailyPuzzleContent.innerHTML = `
                    <div class="text-center p-8 bg-white rounded-lg shadow-md">
                        <p class="text-lg text-indigo-900">Puzzle not found</p>
                    </div>
                `;
            }
        } else {
            showFeedback('Puzzle not found', 'error');
        }
        return;
    }

    // Update social sharing meta tags (only for regular puzzle page)
    if (prefix === '') {
        updateSocialMetaTags(day);
    }

    const puzzle = PUZZLE_DATA[day];
    const letters = getPuzzleLetters(day);
    
    // Calculate maximum scores for each word
    const maxScores = puzzle.solution.map(word => calculateWordScore(word));
    
    // Create tiles
    const tilesContainer = document.getElementById(`${prefix}tiles-container`);
    if (!tilesContainer) {
        console.error(`${prefix}tiles-container not found`);
        return;
    }
    tilesContainer.innerHTML = '';
    
    // Make tiles container a drop zone
    // Create handlers object first
    const handlers = {
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchCancel
    };
    
    // Create context with prefix for drag-drop functions
    const dragDropContext = { handlers, prefix, isArchive: false };
    
    // Define removeTileCallback first (doesn't depend on placeTileCallback)
    const removeTileCallback = (slot) => removeTileFromSlot(slot, dragDropContext);
    
    // Define placeTileCallback with handlers available
    const placeTileCallback = (tile, slot) => placeTileInSlot(tile, slot, { ...dragDropContext, removeTileCallback });
    
    // Initialize keyboard input system with context
    const keyboardContext = {
        placeTileCallback,
        removeTileCallback,
        prefix
    };
    initKeyboardInput(keyboardContext);
    
    // Now update handlers with callbacks
    handlers.onClick = (e) => handleTileClick(e, placeTileCallback, removeTileCallback);
    handlers.onTouchStart = (e) => handleTouchStart(e, placeTileCallback, removeTileCallback);
    handlers.onKeyDown = (e) => handleTileKeyDown(e, keyboardContext);
    
    tilesContainer.addEventListener('dragover', handleTilesContainerDragOver);
    tilesContainer.addEventListener('drop', (e) => handleTilesContainerDrop(e, dragDropContext));
    tilesContainer.addEventListener('dragleave', handleTilesContainerDragLeave);
    
    letters.forEach((letter, index) => {
        const tile = createTile(letter, index, false, handlers);
        tilesContainer.appendChild(tile);
    });
    
    // Update placeholder visibility
    updatePlaceholderTile(`${prefix}tiles-container`);

    // Create word slots
    const wordSlots = document.getElementById(`${prefix}word-slots`);
    if (!wordSlots) {
        console.error(`${prefix}word-slots container not found`);
        return;
    }
    
    wordSlots.innerHTML = '';
    
    const slotHandlers = {
        onDragOver: handleDragOver,
        onDrop: (e) => handleDrop(e, (tile, slot) => placeTileInSlot(tile, slot, { ...dragDropContext, removeTileCallback })),
        onDragLeave: handleDragLeave,
        onClick: (e) => handleSlotClick(e, 
            (tile, slot) => placeTileInSlot(tile, slot, { ...dragDropContext, removeTileCallback }),
            (slot) => removeTileFromSlot(slot, dragDropContext)
        ),
        onKeyDown: (e) => handleSlotKeyDown(e, 
            (tile, slot) => placeTileInSlot(tile, slot, { ...dragDropContext, removeTileCallback, isKeyboardNavigation: true }),
            (slot) => removeTileFromSlot(slot, { ...dragDropContext, isKeyboardNavigation: true })
        ),
        onFocus: handleSlotFocus,
        onBlur: handleSlotBlur
    };
    
    // Update keyboard context for slots (they use the same context)
    // The handleSlotKeyDown function will detect prefix from slot's container
    
    puzzle.words.forEach((word, wordIndex) => {
        const wordContainer = document.createElement('div');
        wordContainer.className = 'bg-slot-container rounded-[24px] shadow-container p-2 flex flex-col items-start gap-3';
        wordContainer.setAttribute('data-word-index', wordIndex);
        wordContainer.setAttribute('data-max-score', maxScores[wordIndex]);
        
        // Hidden label for screen readers
        const wordLabel = document.createElement('h3');
        wordLabel.className = 'sr-only';
        wordLabel.textContent = `Word ${wordIndex + 1} (${word.length} letters)`;
        wordContainer.appendChild(wordLabel);

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'flex flex-wrap gap-[6px]';
        slotsContainer.setAttribute('data-word-slots', wordIndex);
        
        for (let i = 0; i < word.length; i++) {
            const slot = createSlot(wordIndex, i, false, slotHandlers);
            slotsContainer.appendChild(slot);
        }
        
        wordContainer.appendChild(slotsContainer);
        
        // Category and score display section
        const categoryScoreContainer = document.createElement('div');
        categoryScoreContainer.className = 'flex flex-row items-center self-end';
        
        // Category label (if category exists in puzzle data)
        const category = puzzle.categories?.[wordIndex];
        
        if (category) {
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'border-[4px] border-slot-border rounded-l-[20px] px-3 py-2.5 font-rem';
            categoryLabel.style.fontSize = '20px';
            categoryLabel.style.lineHeight = '25px';
            categoryLabel.style.fontWeight = '500';
            categoryLabel.style.color = '#4E2E07';
            categoryLabel.textContent = category;
            categoryScoreContainer.appendChild(categoryLabel);
        }
        
        // Score display
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = category ? 'bg-category-bg rounded-r-[20px] px-3 py-2.5 text-white font-rem' : 'bg-category-bg rounded-[16px] px-3 py-2.5 text-white font-rem';
        scoreDisplay.style.fontSize = '20px';
        scoreDisplay.style.lineHeight = '25px';
        scoreDisplay.style.fontWeight = '500';
        scoreDisplay.setAttribute('id', `${prefix}word${wordIndex + 1}-score-display`);
        scoreDisplay.textContent = `0 / ${maxScores[wordIndex]} points`;
        categoryScoreContainer.appendChild(scoreDisplay);
        
        wordContainer.appendChild(categoryScoreContainer);
        
        wordSlots.appendChild(wordContainer);
    });
    
    // Verify containers were created
    if (wordSlots.children.length === 0) {
        console.error('No word containers were created');
    }

    // Setup submit button
    const submitBtn = document.getElementById(`${prefix}submit-btn`);
    if (submitBtn) {
        // Remove existing listeners by cloning
        const newSubmitBtn = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        
        newSubmitBtn.addEventListener('click', () => {
            // Track Google Analytics event for daily puzzle submit button click
            if (prefix === 'daily-' && typeof window.gtag !== 'undefined') {
                window.gtag('event', 'submit_button_click', {
                    'event_category': 'game_interaction',
                    'event_label': 'daily_puzzle',
                    'puzzle_day': day
                });
            }
            
            checkSolution(
                day,
                () => showErrorModal(prefix),
                (day, word1Score, word2Score, word1MaxScore, word2MaxScore) => {
                    const totalLetters = puzzle.solution[0].length + puzzle.solution[1].length;
                    const hintsUsed = totalLetters - stateManager.getHintsRemaining();
                    const solutionShown = stateManager.getSolutionShown();
                    showSuccessModal(day, word1Score, word2Score, word1MaxScore, word2MaxScore, prefix, hintsUsed, solutionShown);
                },
                () => triggerSnowflakeConfetti()
            );
        });
        
        // Add keyboard handler for Tab navigation
        newSubmitBtn.addEventListener('keydown', (e) => handleButtonKeyDown(e, keyboardContext));
    }

    // Initialize hint counter and reset solution shown state
    const totalLetters = puzzle.solution[0].length + puzzle.solution[1].length;
    stateManager.setHintsRemaining(totalLetters);
    stateManager.setSolutionShown(false);
    
    // Setup hint button
    const hintBtn = document.getElementById(`${prefix}hint-btn`);
    if (hintBtn) {
        hintBtn.disabled = false;
        updateHintButtonText(`${prefix}hint-btn`, stateManager.getHintsRemaining());
        // Remove existing listeners by cloning
        const newHintBtn = hintBtn.cloneNode(true);
        hintBtn.parentNode.replaceChild(newHintBtn, hintBtn);
        
        // Handler function to check hints and provide hint
        const handleHintRequest = () => {
            // Check if hints are available - return early if not
            // Button is already disabled, so no feedback needed
            const hintsRemaining = stateManager.getHintsRemaining();
            if (hintsRemaining <= 0) {
                return;
            }
            
            // Track Google Analytics event for daily puzzle hint button click
            if (prefix === 'daily-' && typeof window.gtag !== 'undefined') {
                window.gtag('event', 'hint_button_click', {
                    'event_category': 'game_interaction',
                    'event_label': 'daily_puzzle',
                    'puzzle_day': day,
                    'hints_remaining': hintsRemaining
                });
            }
            
            // Pass full dragDropContext to ensure handlers are properly attached to returned tiles
            // Include keyboard context properties for keyboard input system
            const hintContext = {
                ...dragDropContext,
                placeTileCallback,
                removeTileCallback,
                prefix, // Ensure prefix is included for keyboard input system
                stateManager // Include state manager in context
            };
            provideHint(day, hintContext);
        };
        
        // Add click listener for normal clicks
        newHintBtn.addEventListener('click', handleHintRequest);
        
        // Add mousedown listener as backup - mousedown events can fire even on disabled buttons
        // This ensures feedback is shown when button is clicked while disabled (for testing)
        newHintBtn.addEventListener('mousedown', (e) => {
            // Only handle if button is disabled (normal clicks use the click event)
            if (newHintBtn.disabled) {
                e.preventDefault(); // Prevent any default behavior
                handleHintRequest();
            }
        });
        
        // Add keyboard handler for Tab navigation
        newHintBtn.addEventListener('keydown', (e) => handleButtonKeyDown(e, keyboardContext));
    }

    // Setup help modal (only for daily puzzle, regular puzzle handles it in HTML)
    if (prefix === 'daily-') {
        const helpBtn = document.getElementById('daily-help-btn');
        const closeHelpModalBtn = document.getElementById('close-help-modal-btn');
        const closeHelpModalX = document.getElementById('close-help-modal');
        if (helpBtn) {
            // Remove existing listeners by cloning
            const newHelpBtn = helpBtn.cloneNode(true);
            helpBtn.parentNode.replaceChild(newHelpBtn, helpBtn);
            newHelpBtn.classList.remove('hidden');
            newHelpBtn.addEventListener('click', showHelpModal);
        }
        if (closeHelpModalBtn) {
            closeHelpModalBtn.addEventListener('click', closeHelpModal);
        }
        if (closeHelpModalX) {
            closeHelpModalX.addEventListener('click', closeHelpModal);
        }

        // Close help modal when clicking outside
        const helpModal = document.getElementById('help-modal');
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    closeHelpModal();
                }
            });
        }
    }

    // Setup error modal close buttons
    const closeErrorModalBtn = document.getElementById(`${prefix}close-error-modal-btn`);
    const closeErrorModalX = document.getElementById(`${prefix}close-error-modal`);
    if (closeErrorModalBtn) {
        // Remove existing listeners by cloning
        const newCloseBtn = closeErrorModalBtn.cloneNode(true);
        closeErrorModalBtn.parentNode.replaceChild(newCloseBtn, closeErrorModalBtn);
        newCloseBtn.addEventListener('click', () => closeErrorModal(prefix));
    }
    if (closeErrorModalX) {
        // Remove existing listeners by cloning
        const newCloseX = closeErrorModalX.cloneNode(true);
        closeErrorModalX.parentNode.replaceChild(newCloseX, closeErrorModalX);
        newCloseX.addEventListener('click', () => closeErrorModal(prefix));
    }

    // Close error modal when clicking outside
    const errorModal = document.getElementById(`${prefix}error-modal`);
    if (errorModal) {
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                closeErrorModal(prefix);
            }
        });
    }

    // Setup success modal close icon (for all prefixes)
    const closeSuccessIcon = document.getElementById(`${prefix}close-success-modal`);
    if (closeSuccessIcon) {
        // Remove existing listeners by cloning
        const newCloseSuccessIcon = closeSuccessIcon.cloneNode(true);
        closeSuccessIcon.parentNode.replaceChild(newCloseSuccessIcon, closeSuccessIcon);
        newCloseSuccessIcon.addEventListener('click', () => closeSuccessModal(prefix));
    }
    
    // Close success modal when clicking outside
    const successModal = document.getElementById(`${prefix}success-modal`);
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeSuccessModal(prefix);
            }
        });
    }

    // Update score display
    updateScoreDisplay(prefix);
    
    // Initialize auto-complete detection
    debugLog('[AutoComplete] About to call initAutoComplete', { day, prefix, dayType: typeof day });
    if (day != null) {
        initAutoComplete(day, prefix);
        debugLog('[AutoComplete] Initialization called in initPuzzleWithPrefix', { day, prefix });
    } else {
        console.error('[AutoComplete] ERROR: day is null or undefined, cannot initialize auto-complete', { day, prefix });
    }
}

// Puzzle initialization (for puzzle.html)
function initPuzzle(day) {
    initPuzzleWithPrefix(day, '');
}

// Export functions that are used in HTML files
export { 
    updateCountdown, 
    initCalendar, 
    initDailyPuzzle, 
    initPuzzle, 
    initPuzzleWithPrefix,
    initArchivePage,
    isAdventMode,
    parseDateString,
    getPuzzleNumberForDate
};
