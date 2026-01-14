import { describe, it, expect, vi } from 'vitest';
import * as dragDrop from '../../js/drag-drop.js';
import * as mouseDrag from '../../js/mouse-drag.js';
import * as touchDrag from '../../js/touch-drag.js';
import * as tileInteractions from '../../js/tile-interactions.js';
import * as tileOperations from '../../js/tile-operations.js';

describe('drag-drop.js', () => {
  it('should re-export mouse drag handlers', () => {
    expect(dragDrop.handleDragStart).toBe(mouseDrag.handleDragStart);
    expect(dragDrop.handleDragEnd).toBe(mouseDrag.handleDragEnd);
    expect(dragDrop.handleDragOver).toBe(mouseDrag.handleDragOver);
    expect(dragDrop.handleDragLeave).toBe(mouseDrag.handleDragLeave);
    expect(dragDrop.handleDrop).toBe(mouseDrag.handleDrop);
    expect(dragDrop.handleTileDragOver).toBe(mouseDrag.handleTileDragOver);
    expect(dragDrop.handleTileDragLeave).toBe(mouseDrag.handleTileDragLeave);
    expect(dragDrop.handleTileDrop).toBe(mouseDrag.handleTileDrop);
    expect(dragDrop.handleTilesContainerDragOver).toBe(mouseDrag.handleTilesContainerDragOver);
    expect(dragDrop.handleTilesContainerDrop).toBe(mouseDrag.handleTilesContainerDrop);
    expect(dragDrop.handleTilesContainerDragLeave).toBe(mouseDrag.handleTilesContainerDragLeave);
  });

  it('should re-export touch drag handlers', () => {
    expect(dragDrop.handleTouchStart).toBe(touchDrag.handleTouchStart);
    expect(dragDrop.handleTouchMove).toBe(touchDrag.handleTouchMove);
    expect(dragDrop.handleTouchEnd).toBe(touchDrag.handleTouchEnd);
    expect(dragDrop.handleTouchCancel).toBe(touchDrag.handleTouchCancel);
  });

  it('should re-export tile interaction handlers', () => {
    expect(dragDrop.handleTileClick).toBe(tileInteractions.handleTileClick);
    expect(dragDrop.handleSlotClick).toBe(tileInteractions.handleSlotClick);
  });

  it('should re-export tile operations', () => {
    expect(dragDrop.placeTileInSlot).toBe(tileOperations.placeTileInSlot);
    expect(dragDrop.removeTileFromSlot).toBe(tileOperations.removeTileFromSlot);
    expect(dragDrop.returnTileToContainer).toBe(tileOperations.returnTileToContainer);
    expect(dragDrop.attachTileHandlers).toBe(tileOperations.attachTileHandlers);
  });
});
