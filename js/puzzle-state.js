// Shared state management for puzzle game

// Drag and drop state
let draggedTile = null;

// Keyboard accessibility - track selected tile
let selectedTile = null;

// Hint counter - track remaining hints
let hintsRemaining = 3;

// Archive hint counter - track remaining hints for archive puzzles
let archiveHintsRemaining = 3;

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

