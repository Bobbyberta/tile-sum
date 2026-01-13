// Validation and recovery helpers for tiles

// Validation helpers to ensure tiles are never deleted
export function validateTileExists(tile) {
    // Check if tile is still in the DOM
    if (!tile) return false;
    return tile.parentNode !== null && document.contains(tile);
}

// Find a tile in a container by letter and index
export function findTileInContainer(letter, index, context = {}) {
    const prefix = context?.prefix || '';
    const containers = [
        prefix ? `${prefix}tiles-container` : 'tiles-container',
        'archive-tiles-container',
        'daily-tiles-container'
    ];
    
    for (const containerId of containers) {
        const container = document.getElementById(containerId);
        if (!container) continue;
        
        const tiles = container.querySelectorAll('.tile');
        for (const tile of tiles) {
            const tileLetter = tile.getAttribute('data-letter');
            const tileIndex = tile.getAttribute('data-tile-index');
            if (tileLetter?.toUpperCase() === letter.toUpperCase() && tileIndex === String(index)) {
                return tile;
            }
        }
    }
    
    return null;
}

export function ensureTilePreserved(tile, context = {}, returnTileCallback = null) {
    // Recovery function: if tile is not in DOM, recreate it in container
    if (!validateTileExists(tile)) {
        const letter = tile.getAttribute('data-letter');
        const originalIndex = tile.getAttribute('data-tile-index');
        const isArchivePuzzle = context.isArchive;
        
        // Check if letter exists and index is not null/empty/undefined
        if (letter && originalIndex !== null && originalIndex !== '' && originalIndex !== 'null' && originalIndex !== undefined) {
            console.warn('Tile was lost, recovering to container:', letter, originalIndex);
            if (isArchivePuzzle && context.returnArchiveTileToContainer) {
                context.returnArchiveTileToContainer(letter, originalIndex);
            } else if (returnTileCallback) {
                returnTileCallback(letter, originalIndex, context.handlers || {}, false, context?.prefix || '', context);
            } else {
                console.error('ensureTilePreserved: No returnTileCallback provided');
                return false; // No callback provided, recovery failed
            }
            return true; // Recovery attempted
        }
    }
    return false; // No recovery needed or possible
}
