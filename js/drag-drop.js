// Drag & drop system for puzzle tiles
// This file re-exports all functions from the refactored modules for backward compatibility

/**
 * @module drag-drop
 * @description
 * Central export point for drag-and-drop functionality.
 * Re-exports handlers from specialized modules:
 * - Mouse drag handlers from `mouse-drag.js`
 * - Touch drag handlers from `touch-drag.js`
 * - Tile interaction handlers from `tile-interactions.js`
 * - Tile operations from `tile-operations.js`
 * 
 * This module provides a unified API for drag-and-drop functionality
 * while keeping implementation separated by interaction type.
 * 
 * @see {@link module:mouse-drag} Mouse drag handlers
 * @see {@link module:touch-drag} Touch drag handlers
 * @see {@link module:tile-interactions} Click handlers
 * @see {@link module:tile-operations} Core tile operations
 */

// Re-export mouse drag handlers
export {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleTileDragOver,
    handleTileDragLeave,
    handleTileDrop,
    handleTilesContainerDragOver,
    handleTilesContainerDrop,
    handleTilesContainerDragLeave
} from './mouse-drag.js';

// Re-export touch drag handlers
export {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
} from './touch-drag.js';

// Re-export tile interaction handlers
export {
    handleTileClick,
    handleSlotClick
} from './tile-interactions.js';

// Re-export tile operations
export {
    placeTileInSlot,
    removeTileFromSlot,
    returnTileToContainer,
    attachTileHandlers
} from './tile-operations.js';
