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

// Getters and setters for dragged tile
export function getDraggedTile() {
    return draggedTile;
}

export function setDraggedTile(tile) {
    draggedTile = tile;
}

export function clearDraggedTile() {
    draggedTile = null;
}

// Getters and setters for selected tile
export function getSelectedTile() {
    return selectedTile;
}

export function setSelectedTile(tile) {
    selectedTile = tile;
}

export function clearSelectedTile() {
    selectedTile = null;
}

// Getters and setters for hints remaining
export function getHintsRemaining() {
    return hintsRemaining;
}

export function setHintsRemaining(count) {
    hintsRemaining = count;
}

export function decrementHintsRemaining() {
    hintsRemaining = Math.max(0, hintsRemaining - 1);
}

// Getters and setters for archive hints remaining
export function getArchiveHintsRemaining() {
    return archiveHintsRemaining;
}

export function setArchiveHintsRemaining(count) {
    archiveHintsRemaining = count;
}

export function decrementArchiveHintsRemaining() {
    archiveHintsRemaining = Math.max(0, archiveHintsRemaining - 1);
}

// Getters and setters for solution shown state
export function getSolutionShown() {
    return solutionShown;
}

export function setSolutionShown(value) {
    solutionShown = value;
}

// Getters and setters for archive solution shown state
export function getArchiveSolutionShown() {
    return archiveSolutionShown;
}

export function setArchiveSolutionShown(value) {
    archiveSolutionShown = value;
}

// State manager factory - returns appropriate getters/setters based on prefix
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

