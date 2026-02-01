// Shared state management for puzzle game

// Drag and drop state
let draggedTile = null;

// Keyboard accessibility - track selected tile
let selectedTile = null;

// Hint counter - track remaining hints
let hintsRemaining = 3;

// Archive hint counter - track remaining hints for archive puzzles
let archiveHintsRemaining = 3;

// Solution shown state - track whether solution was shown (for regular puzzles)
let solutionShown = false;

// Archive solution shown state - track whether solution was shown (for archive puzzles)
let archiveSolutionShown = false;

// Puzzle start time tracking - track when puzzle started (per prefix)
let puzzleStartTime = null;
let dailyPuzzleStartTime = null;
let archivePuzzleStartTime = null;

/**
 * Gets the currently dragged tile element.
 * @returns {HTMLElement|null} The dragged tile element, or null if none
 */
export function getDraggedTile() {
    return draggedTile;
}

/**
 * Sets the currently dragged tile element.
 * @param {HTMLElement|null} tile - The tile element being dragged
 * @returns {void}
 */
export function setDraggedTile(tile) {
    draggedTile = tile;
}

/**
 * Clears the currently dragged tile (sets to null).
 * @returns {void}
 */
export function clearDraggedTile() {
    draggedTile = null;
}

/**
 * Gets the currently selected tile (for keyboard navigation).
 * @returns {HTMLElement|null} The selected tile element, or null if none
 */
export function getSelectedTile() {
    return selectedTile;
}

/**
 * Sets the currently selected tile (for keyboard navigation).
 * @param {HTMLElement|null} tile - The tile element to select
 * @returns {void}
 */
export function setSelectedTile(tile) {
    selectedTile = tile;
}

/**
 * Clears the currently selected tile (sets to null).
 * @returns {void}
 */
export function clearSelectedTile() {
    selectedTile = null;
}

/**
 * Gets the number of hints remaining for regular puzzles.
 * @returns {number} Number of hints remaining (0-3)
 */
export function getHintsRemaining() {
    return hintsRemaining;
}

/**
 * Sets the number of hints remaining for regular puzzles.
 * @param {number} count - Number of hints remaining (typically 0-3)
 * @returns {void}
 */
export function setHintsRemaining(count) {
    hintsRemaining = count;
}

/**
 * Decrements the number of hints remaining for regular puzzles.
 * Prevents going below 0.
 * @returns {void}
 */
export function decrementHintsRemaining() {
    hintsRemaining = Math.max(0, hintsRemaining - 1);
}

/**
 * Gets the number of hints remaining for archive puzzles.
 * @returns {number} Number of hints remaining (0-3)
 */
export function getArchiveHintsRemaining() {
    return archiveHintsRemaining;
}

/**
 * Sets the number of hints remaining for archive puzzles.
 * @param {number} count - Number of hints remaining (typically 0-3)
 * @returns {void}
 */
export function setArchiveHintsRemaining(count) {
    archiveHintsRemaining = count;
}

/**
 * Decrements the number of hints remaining for archive puzzles.
 * Prevents going below 0.
 * @returns {void}
 */
export function decrementArchiveHintsRemaining() {
    archiveHintsRemaining = Math.max(0, archiveHintsRemaining - 1);
}

/**
 * Gets whether the solution has been shown for regular puzzles.
 * @returns {boolean} True if solution was shown, false otherwise
 */
export function getSolutionShown() {
    return solutionShown;
}

/**
 * Sets whether the solution has been shown for regular puzzles.
 * @param {boolean} value - True if solution was shown, false otherwise
 * @returns {void}
 */
export function setSolutionShown(value) {
    solutionShown = value;
}

/**
 * Gets whether the solution has been shown for archive puzzles.
 * @returns {boolean} True if solution was shown, false otherwise
 */
export function getArchiveSolutionShown() {
    return archiveSolutionShown;
}

/**
 * Sets whether the solution has been shown for archive puzzles.
 * @param {boolean} value - True if solution was shown, false otherwise
 * @returns {void}
 */
export function setArchiveSolutionShown(value) {
    archiveSolutionShown = value;
}

/**
 * Gets the puzzle start time for regular puzzles.
 * @returns {number|null} The start time in milliseconds (Date.now()), or null if not set
 */
export function getPuzzleStartTime() {
    return puzzleStartTime;
}

/**
 * Sets the puzzle start time for regular puzzles.
 * @param {number|null} time - The start time in milliseconds (Date.now()), or null to clear
 * @returns {void}
 */
export function setPuzzleStartTime(time) {
    puzzleStartTime = time;
}

/**
 * Gets the puzzle start time for daily puzzles.
 * @returns {number|null} The start time in milliseconds (Date.now()), or null if not set
 */
export function getDailyPuzzleStartTime() {
    return dailyPuzzleStartTime;
}

/**
 * Sets the puzzle start time for daily puzzles.
 * @param {number|null} time - The start time in milliseconds (Date.now()), or null to clear
 * @returns {void}
 */
export function setDailyPuzzleStartTime(time) {
    dailyPuzzleStartTime = time;
}

/**
 * Gets the puzzle start time for archive puzzles.
 * @returns {number|null} The start time in milliseconds (Date.now()), or null if not set
 */
export function getArchivePuzzleStartTime() {
    return archivePuzzleStartTime;
}

/**
 * Sets the puzzle start time for archive puzzles.
 * @param {number|null} time - The start time in milliseconds (Date.now()), or null to clear
 * @returns {void}
 */
export function setArchivePuzzleStartTime(time) {
    archivePuzzleStartTime = time;
}

/**
 * Gets the puzzle start time based on prefix.
 * @param {string} [prefix=''] - Prefix to determine which start time to get
 * @returns {number|null} The start time in milliseconds, or null if not set
 */
export function getPuzzleStartTimeByPrefix(prefix = '') {
    if (prefix === 'archive-') {
        return getArchivePuzzleStartTime();
    } else if (prefix === 'daily-') {
        return getDailyPuzzleStartTime();
    } else {
        return getPuzzleStartTime();
    }
}

/**
 * Sets the puzzle start time based on prefix.
 * @param {string} [prefix=''] - Prefix to determine which start time to set
 * @param {number|null} time - The start time in milliseconds (Date.now()), or null to clear
 * @returns {void}
 */
export function setPuzzleStartTimeByPrefix(prefix = '', time) {
    if (prefix === 'archive-') {
        setArchivePuzzleStartTime(time);
    } else if (prefix === 'daily-') {
        setDailyPuzzleStartTime(time);
    } else {
        setPuzzleStartTime(time);
    }
}

/**
 * Creates a state manager object with appropriate getters/setters based on prefix.
 * This allows different puzzle instances (regular, daily, archive) to have separate state.
 * 
 * @param {string} [prefix=''] - Prefix to determine which state to use ('archive-' for archive puzzles)
 * @returns {Object} State manager object with methods:
 *   - getHintsRemaining(): Get hints remaining
 *   - setHintsRemaining(count): Set hints remaining
 *   - decrementHintsRemaining(): Decrement hints remaining
 *   - getSolutionShown(): Get solution shown state
 *   - setSolutionShown(value): Set solution shown state
 * 
 * @example
 * const stateManager = createStateManager('archive-');
 * stateManager.setHintsRemaining(3);
 * const hints = stateManager.getHintsRemaining(); // 3
 */
export function createStateManager(prefix = '') {
    if (prefix === 'archive-') {
        return {
            getHintsRemaining: getArchiveHintsRemaining,
            setHintsRemaining: setArchiveHintsRemaining,
            decrementHintsRemaining: decrementArchiveHintsRemaining,
            getSolutionShown: getArchiveSolutionShown,
            setSolutionShown: setArchiveSolutionShown
        };
    }
    
    // Return regular state functions for non-archive puzzles
    return {
        getHintsRemaining: getHintsRemaining,
        setHintsRemaining: setHintsRemaining,
        decrementHintsRemaining: decrementHintsRemaining,
        getSolutionShown: getSolutionShown,
        setSolutionShown: setSolutionShown
    };
}

