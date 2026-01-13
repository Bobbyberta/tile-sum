// Archive page functionality

import { 
    PUZZLE_DATA, 
    PUZZLE_START_DATE,
    formatDateString, 
    parseDateString,
    getPuzzleNumberForDate,
    getDateForPuzzleNumber,
    getPuzzleLetters,
    calculateWordScore,
    validateSolution
} from '../puzzle-data-encoded.js';
import { isArchiveTestMode, getTestModeParam, getTestModeParamWithAmpersand } from './utils.js';
import { getDaySuffix } from './utils.js';
import { 
    setArchiveHintsRemaining,
    getArchiveHintsRemaining,
    decrementArchiveHintsRemaining,
    setArchiveSolutionShown,
    getArchiveSolutionShown
} from './puzzle-state.js';
import { createTile, createSlot, updatePlaceholderTile } from './puzzle-core.js';
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
} from './drag-drop.js';
// Note: attachTileHandlers is not exported, so we'll need to use returnTileToContainer with context
import { 
    handleTileKeyDown,
    handleSlotKeyDown,
    handleSlotFocus,
    handleSlotBlur
} from './keyboard.js';
import { initKeyboardInput } from './keyboard-input.js';
import { updateScoreDisplay, updateSubmitButton, checkSolution } from './scoring.js';
import { provideHint, updateHintButtonText, showSolution } from './hints.js';
import { showFeedback, triggerSnowflakeConfetti } from './feedback.js';
import { showSuccessModal, showErrorModal, closeErrorModal, closeSuccessModal, copyShareMessage } from './modals.js';
import { initAutoComplete, checkAutoComplete, areAllSlotsFilled } from './auto-complete.js';

// Module-level variable to store the returnArchiveTileToContainer callback
let currentReturnArchiveTileToContainer = null;

// Initialize archive page
export function initArchivePage() {
    const datePicker = document.getElementById('date-picker');
    const datePrevBtn = document.getElementById('date-prev-btn');
    const dateNextBtn = document.getElementById('date-next-btn');
    const archiveContent = document.getElementById('archive-puzzle-content');
    
    if (!datePicker || !archiveContent) return;
    
    // Update navigation links to preserve test mode
    const testParam = getTestModeParam();
    
    const backLink = document.querySelector('header a[href="index.html"]');
    if (backLink) {
        backLink.href = `index.html${testParam}`;
    }
    
    const todayLink = document.querySelector('header a:last-of-type');
    if (todayLink && todayLink.href.includes('index.html')) {
        todayLink.href = `index.html${testParam}`;
    }
    
    // Set initial date to today
    const today = new Date();
    const todayStr = formatDateString(today);
    datePicker.value = todayStr;
    datePicker.min = formatDateString(PUZZLE_START_DATE);
    
    // In archive test mode, allow future dates (no max), otherwise limit to today
    if (!isArchiveTestMode()) {
        datePicker.max = todayStr;
    }
    
    // Setup success modal close icon (set up once on page load)
    const closeSuccessModalX = document.getElementById('archive-close-success-modal');
    if (closeSuccessModalX) {
        closeSuccessModalX.addEventListener('click', () => closeArchiveSuccessModal());
    }

    // Close success modal when clicking outside (set up once on page load)
    const successModal = document.getElementById('archive-success-modal');
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeArchiveSuccessModal();
            }
        });
    }
    
    // Load puzzle for initial date
    loadArchivePuzzle(todayStr);
    
    // Handle date change
    datePicker.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        loadArchivePuzzle(selectedDate);
    });
    
    // Handle previous day button
    if (datePrevBtn) {
        datePrevBtn.addEventListener('click', () => {
            const currentDate = parseDateString(datePicker.value);
            if (currentDate) {
                currentDate.setDate(currentDate.getDate() - 1);
                const newDateStr = formatDateString(currentDate);
                const minDate = parseDateString(datePicker.min);
                if (minDate && currentDate >= minDate) {
                    datePicker.value = newDateStr;
                    loadArchivePuzzle(newDateStr);
                }
            }
        });
    }
    
    // Handle next day button
    if (dateNextBtn) {
        dateNextBtn.addEventListener('click', () => {
            const currentDate = parseDateString(datePicker.value);
            if (currentDate) {
                currentDate.setDate(currentDate.getDate() + 1);
                const newDateStr = formatDateString(currentDate);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                // Allow future dates in archive test mode
                if (isArchiveTestMode() || currentDate <= todayDate) {
                    datePicker.value = newDateStr;
                    loadArchivePuzzle(newDateStr);
                }
            }
        });
    }
}

// Load puzzle for archive page
export function loadArchivePuzzle(dateString) {
    const archiveContent = document.getElementById('archive-puzzle-content');
    if (!archiveContent) return;
    
    const date = parseDateString(dateString);
    if (!date) {
        archiveContent.innerHTML = `
            <div class="text-center p-8 bg-white rounded-lg shadow-md">
                <p class="text-lg text-red-600">Invalid date selected.</p>
            </div>
        `;
        return;
    }
    
    // Check if date is before start date
    const startDate = new Date(PUZZLE_START_DATE);
    startDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < startDate) {
        archiveContent.innerHTML = `
            <div class="text-center p-8 bg-white rounded-lg shadow-md">
                <p class="text-lg text-indigo-900">No puzzles available before ${formatDateString(startDate)}.</p>
            </div>
        `;
        return;
    }
    
    // Get puzzle number for date
    const puzzleNumber = getPuzzleNumberForDate(date);
    
    // Check if puzzle exists
    if (!PUZZLE_DATA[puzzleNumber]) {
        archiveContent.innerHTML = `
            <div class="text-center p-8 bg-white rounded-lg shadow-md">
                <p class="text-lg text-indigo-900">No puzzle available for ${formatDateString(date)}.</p>
                <p class="text-sm text-indigo-700 mt-2">Puzzle #${puzzleNumber} has not been created yet.</p>
            </div>
        `;
        return;
    }
    
    // Format date for display
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const daySuffix = getDaySuffix(date.getDate());
    const dateDisplay = `${dayName} ${date.getDate()}${daySuffix} ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    // Clear previous puzzle content
    archiveContent.innerHTML = '';
    
    // Create header matching puzzle.html structure
    const header = document.createElement('header');
    header.className = 'mb-8';
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'flex items-center justify-between mb-2';
    
    const puzzleTitle = document.createElement('h1');
    puzzleTitle.className = 'text-3xl md:text-4xl font-bold text-indigo-900';
    puzzleTitle.id = 'archive-puzzle-title';
    puzzleTitle.textContent = dateDisplay;
    titleContainer.appendChild(puzzleTitle);
    
    header.appendChild(titleContainer);
    archiveContent.appendChild(header);
    
    // Create tiles container wrapper matching puzzle.html structure
    const tilesWrapper = document.createElement('div');
    tilesWrapper.className = 'mb-8';
    
    const tilesHeading = document.createElement('h2');
    tilesHeading.className = 'sr-only';
    tilesHeading.textContent = 'Available Tiles';
    tilesWrapper.appendChild(tilesHeading);
    
    const tilesContainer = document.createElement('div');
    tilesContainer.id = 'archive-tiles-container';
    tilesContainer.className = 'flex flex-wrap gap-2 p-4 bg-white rounded-lg shadow-md min-h-[100px]';
    tilesWrapper.appendChild(tilesContainer);
    
    archiveContent.appendChild(tilesWrapper);
    
    // Create word slots wrapper matching puzzle.html structure
    const slotsWrapper = document.createElement('div');
    slotsWrapper.className = 'mb-8';
    
    const slotsHeading = document.createElement('h2');
    slotsHeading.className = 'sr-only';
    slotsHeading.textContent = 'Word Slots';
    slotsWrapper.appendChild(slotsHeading);
    
    const wordSlotsContainer = document.createElement('div');
    wordSlotsContainer.id = 'archive-word-slots';
    wordSlotsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    slotsWrapper.appendChild(wordSlotsContainer);
    
    archiveContent.appendChild(slotsWrapper);
    
    // Create buttons container matching puzzle.html structure
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'mb-8 flex flex-col sm:flex-row gap-4';
    
    const hintBtn = document.createElement('button');
    hintBtn.id = 'archive-hint-btn';
    hintBtn.className = 'w-full md:w-auto px-8 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
    hintBtn.textContent = 'Get Hint';
    buttonsContainer.appendChild(hintBtn);
    
    const submitBtn = document.createElement('button');
    submitBtn.id = 'archive-submit-btn';
    submitBtn.className = 'w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors';
    submitBtn.textContent = 'Submit Solution';
    buttonsContainer.appendChild(submitBtn);
    
    archiveContent.appendChild(buttonsContainer);
    
    // Initialize the puzzle interface
    // Elements are already in the DOM since we created them synchronously above
    initArchivePuzzle(puzzleNumber, dateString);
}

// Initialize puzzle interface for archive page
function initArchivePuzzle(puzzleNumber, dateString) {
    // Check if puzzle exists
    if (!PUZZLE_DATA[puzzleNumber]) {
        return;
    }

    const puzzle = PUZZLE_DATA[puzzleNumber];
    const letters = getPuzzleLetters(puzzleNumber);
    
    // Calculate maximum scores for each word
    const maxScores = puzzle.solution.map(word => calculateWordScore(word));
    
    // Create tiles
    const tilesContainer = document.getElementById('archive-tiles-container');
    if (!tilesContainer) {
        console.error('archive-tiles-container not found');
        return;
    }
    
    tilesContainer.innerHTML = '';
    
    // Make tiles container a drop zone
    // Create handlers object first
    const archiveHandlers = {
        onDragStart: handleDragStart,
        onDragEnd: handleDragEnd,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchCancel
    };
    
    // archiveRemoveTileCallback will be defined after returnArchiveTileToContainer
    let archiveRemoveTileCallback;
    
    // Define placeTileCallback with handlers (removeTileCallback will be set later)
    const archivePlaceTileCallbackWithHandlers = (tile, slot) => {
        placeTileInSlot(tile, slot, {
            isArchive: true,
            updateArchiveScoreDisplay: updateArchiveScoreDisplay,
            updateArchiveSubmitButton: updateArchiveSubmitButton,
            removeTileCallback: archiveRemoveTileCallback,
            handlers: archiveHandlers
        });
    };
    
    // Define returnArchiveTileToContainer here so it has access to archiveHandlers
    function returnArchiveTileToContainer(letter, originalIndex, isKeyboardNavigation = false) {
        const tilesContainer = document.getElementById('archive-tiles-container');
        if (!tilesContainer) return;
        
        // Use the archiveHandlers that are already defined with touch support
        const newTile = createTile(letter, originalIndex, false, archiveHandlers);
        tilesContainer.appendChild(newTile);

        // Update placeholder visibility
        updateArchivePlaceholderTile();

        // Update score display
        updateArchiveScoreDisplay();
        
        // Check if solution is automatically complete
        // Only check if all slots are filled (optimization)
        // Use requestAnimationFrame to ensure DOM is fully updated
        requestAnimationFrame(() => {
            if (areAllSlotsFilled()) {
                checkAutoComplete(puzzleNumber, 'archive-');
            }
        });
        
        // Focus the new tile only for keyboard navigation
        // Don't focus for drag/touch interactions
        if (isKeyboardNavigation) {
            setTimeout(() => {
                newTile.focus();
            }, 50);
        }
    }
    
    // Store the callback in module-level variable for use by provideArchiveHint
    currentReturnArchiveTileToContainer = returnArchiveTileToContainer;
    
    // Update archiveRemoveTileCallback to use the local returnArchiveTileToContainer
    // Note: This callback is used for both keyboard and non-keyboard interactions
    // The isKeyboardNavigation flag will be passed via context when called from keyboard handlers
    archiveRemoveTileCallback = (slot) => {
        removeTileFromSlot(slot, {
            isArchive: true,
            returnArchiveTileToContainer: returnArchiveTileToContainer,
            handlers: archiveHandlers
        });
    };
    
    // Initialize keyboard input system with archive context
    const archiveKeyboardContext = {
        placeTileCallback: archivePlaceTileCallbackWithHandlers,
        removeTileCallback: archiveRemoveTileCallback,
        prefix: 'archive-'
    };
    initKeyboardInput(archiveKeyboardContext);
    
    // Now update archiveHandlers with the final callbacks
    archiveHandlers.onClick = (e) => handleTileClick(e, archivePlaceTileCallbackWithHandlers, archiveRemoveTileCallback);
    archiveHandlers.onTouchStart = (e) => handleTouchStart(e, archivePlaceTileCallbackWithHandlers, archiveRemoveTileCallback);
    archiveHandlers.onKeyDown = (e) => handleTileKeyDown(e, archiveKeyboardContext);
    
    tilesContainer.addEventListener('dragover', (e) => handleTilesContainerDragOver(e));
    tilesContainer.addEventListener('drop', (e) => handleTilesContainerDrop(e, {
        returnArchiveTileToContainer: returnArchiveTileToContainer,
        handlers: archiveHandlers
    }));
    tilesContainer.addEventListener('dragleave', handleTilesContainerDragLeave);
    
    letters.forEach((letter, index) => {
        const tile = createTile(letter, index, false, archiveHandlers);
        tilesContainer.appendChild(tile);
    });
    
    // Update placeholder visibility
    updateArchivePlaceholderTile();
    
    // Create word slots
    const wordSlots = document.getElementById('archive-word-slots');
    if (!wordSlots) {
        console.error('archive-word-slots container not found');
        return;
    }
    
    wordSlots.innerHTML = '';
    
    const slotHandlers = {
        onDragOver: handleDragOver,
        onDrop: (e) => handleDrop(e, (tile, slot) => {
            placeTileInSlot(tile, slot, {
                isArchive: true,
                updateArchiveScoreDisplay: updateArchiveScoreDisplay,
                updateArchiveSubmitButton: updateArchiveSubmitButton,
                removeTileCallback: archiveRemoveTileCallback,
                handlers: archiveHandlers
            });
        }),
        onDragLeave: handleDragLeave,
        onClick: (e) => handleSlotClick(e, 
            (tile, slot) => placeTileInSlot(tile, slot, {
                isArchive: true,
                updateArchiveScoreDisplay: updateArchiveScoreDisplay,
                updateArchiveSubmitButton: updateArchiveSubmitButton,
                removeTileCallback: archiveRemoveTileCallback,
                handlers: archiveHandlers
            }),
            (slot) => {
                removeTileFromSlot(slot, {
                    isArchive: true,
                    returnArchiveTileToContainer: returnArchiveTileToContainer,
                    handlers: archiveHandlers
                });
            }
        ),
        onKeyDown: (e) => handleSlotKeyDown(e, 
            (tile, slot) => {
                placeTileInSlot(tile, slot, {
                    isArchive: true,
                    updateArchiveScoreDisplay: updateArchiveScoreDisplay,
                    updateArchiveSubmitButton: updateArchiveSubmitButton,
                    removeTileCallback: archiveRemoveTileCallback,
                    handlers: archiveHandlers,
                    isKeyboardNavigation: true
                });
            },
            (slot) => {
                removeTileFromSlot(slot, {
                    isArchive: true,
                    returnArchiveTileToContainer: returnArchiveTileToContainer,
                    handlers: archiveHandlers,
                    isKeyboardNavigation: true
                });
            }
        ),
        onFocus: handleSlotFocus,
        onBlur: handleSlotBlur
    };
    
    puzzle.words.forEach((word, wordIndex) => {
        const wordContainer = document.createElement('div');
        wordContainer.className = 'bg-white rounded-lg shadow-md p-4';
        wordContainer.setAttribute('data-word-index', wordIndex);
        wordContainer.setAttribute('data-max-score', maxScores[wordIndex]);
        
        // Hidden label for screen readers
        const wordLabel = document.createElement('h3');
        wordLabel.className = 'sr-only';
        wordLabel.textContent = `Word ${wordIndex + 1} (${word.length} letters)`;
        wordContainer.appendChild(wordLabel);

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'flex flex-wrap gap-2 mb-3';
        slotsContainer.setAttribute('data-word-slots', wordIndex);
        
        for (let i = 0; i < word.length; i++) {
            const slot = createSlot(wordIndex, i, false, slotHandlers);
            slotsContainer.appendChild(slot);
        }
        
        wordContainer.appendChild(slotsContainer);
        
        // Score display below the slots
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'text-lg font-semibold text-indigo-800 text-right';
        scoreDisplay.setAttribute('id', `archive-word${wordIndex + 1}-score-display`);
        scoreDisplay.textContent = `0 / ${maxScores[wordIndex]} points`;
        wordContainer.appendChild(scoreDisplay);
        
        // Append word container to word slots container
        wordSlots.appendChild(wordContainer);
    });
    
    // Verify containers were created
    if (wordSlots.children.length === 0) {
        console.error('No word containers were created');
    }

    // Setup submit button
    const submitBtn = document.getElementById('archive-submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            checkArchiveSolution(puzzleNumber);
        });
    }

    // Initialize hint counter and reset solution shown state
    setArchiveHintsRemaining(3);
    setArchiveSolutionShown(false);
    
    // Setup hint button
    const hintBtn = document.getElementById('archive-hint-btn');
    if (hintBtn) {
        hintBtn.disabled = false;
        updateHintButtonText('archive-hint-btn', getArchiveHintsRemaining());
        hintBtn.addEventListener('click', () => {
            const hintsRemaining = getArchiveHintsRemaining();
            if (hintsRemaining <= 0) {
                showArchiveSolution(puzzleNumber);
            } else {
                provideArchiveHint(puzzleNumber);
            }
        });
    }

    // Setup error modal close buttons
    const closeErrorModalBtn = document.getElementById('archive-close-error-modal-btn');
    const closeErrorModalX = document.getElementById('archive-close-error-modal');
    if (closeErrorModalBtn) {
        closeErrorModalBtn.addEventListener('click', () => closeArchiveErrorModal());
    }
    if (closeErrorModalX) {
        closeErrorModalX.addEventListener('click', () => closeArchiveErrorModal());
    }

    // Close error modal when clicking outside
    const errorModal = document.getElementById('archive-error-modal');
    if (errorModal) {
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                closeArchiveErrorModal();
            }
        });
    }

    // Update score display
    updateArchiveScoreDisplay();
}

// Update placeholder tile visibility for archive
function updateArchivePlaceholderTile() {
    updatePlaceholderTile('archive-tiles-container');
}

// Update score display for archive
function updateArchiveScoreDisplay() {
    updateScoreDisplay('archive-');
}

// Update submit button state for archive
function updateArchiveSubmitButton() {
    updateSubmitButton();
}

// Provide hint for archive puzzle
function provideArchiveHint(puzzleNumber) {
    provideHint(puzzleNumber, {
        isArchive: true,
        returnArchiveTileToContainer: currentReturnArchiveTileToContainer,
        updateArchiveScoreDisplay: updateArchiveScoreDisplay,
        updateArchiveSubmitButton: updateArchiveSubmitButton,
        handlers: {
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
            onClick: (e) => handleTileClick(e, (tile, slot) => {
                placeTileInSlot(tile, slot, {
                    isArchive: true,
                    updateArchiveScoreDisplay: updateArchiveScoreDisplay,
                    updateArchiveSubmitButton: updateArchiveSubmitButton,
                    removeTileCallback: (slot) => removeTileFromSlot(slot, {
                        isArchive: true,
                        returnArchiveTileToContainer: currentReturnArchiveTileToContainer
                    })
                });
            })
        }
    });
}

// Show solution for archive puzzle
function showArchiveSolution(puzzleNumber) {
    showSolution(puzzleNumber, {
        isArchive: true,
        returnArchiveTileToContainer: currentReturnArchiveTileToContainer,
        updateArchiveScoreDisplay: updateArchiveScoreDisplay,
        updateArchiveSubmitButton: updateArchiveSubmitButton,
        handlers: {
            onDragStart: handleDragStart,
            onDragEnd: handleDragEnd,
            onClick: (e) => handleTileClick(e, (tile, slot) => {
                placeTileInSlot(tile, slot, {
                    isArchive: true,
                    updateArchiveScoreDisplay: updateArchiveScoreDisplay,
                    updateArchiveSubmitButton: updateArchiveSubmitButton,
                    removeTileCallback: (slot) => removeTileFromSlot(slot, {
                        isArchive: true,
                        returnArchiveTileToContainer: currentReturnArchiveTileToContainer
                    })
                });
            })
        }
    });
    
    // Check if solution is automatically complete
    // Only check if all slots are filled (optimization)
    if (areAllSlotsFilled()) {
        checkAutoComplete(puzzleNumber, 'archive-');
    }
}


// Check solution for archive puzzle
function checkArchiveSolution(puzzleNumber) {
    checkSolution(
        puzzleNumber,
        () => showArchiveErrorModal(),
        (day, word1Score, word2Score, word1MaxScore, word2MaxScore) => {
            showArchiveSuccessModal(puzzleNumber, word1Score, word2Score, word1MaxScore, word2MaxScore);
        },
        () => triggerSnowflakeConfetti()
    );
}

// Show success modal for archive
function showArchiveSuccessModal(puzzleNumber, word1Score, word2Score, word1MaxScore, word2MaxScore) {
    const hintsUsed = 3 - getArchiveHintsRemaining();
    const solutionShown = getArchiveSolutionShown();
    showSuccessModal(puzzleNumber, word1Score, word2Score, word1MaxScore, word2MaxScore, 'archive-', hintsUsed, solutionShown);
}

// Show error modal for archive
function showArchiveErrorModal() {
    showErrorModal('archive-');
}

// Close error modal for archive
function closeArchiveErrorModal() {
    closeErrorModal('archive-');
}

// Close success modal for archive
function closeArchiveSuccessModal() {
    closeSuccessModal('archive-');
}

