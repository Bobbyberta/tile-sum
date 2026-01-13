// Drag & drop system for puzzle tiles
// This file re-exports all functions from the refactored modules for backward compatibility

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
