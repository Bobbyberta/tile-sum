import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
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
} from '../../js/mouse-drag.js';
import { createMockTile, createMockPuzzleDOM, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  getDraggedTile: vi.fn(() => null),
  setDraggedTile: vi.fn(),
  clearDraggedTile: vi.fn()
}));

vi.mock('../../js/tile-operations.js', () => ({
  returnTileToContainer: vi.fn()
}));

vi.mock('../../js/utils.js', () => ({
  debugLog: vi.fn()
}));

vi.mock('../../js/tile-validation.js', () => ({
  validateTileExists: vi.fn(() => true)
}));

describe('mouse-drag.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  describe('handleDragStart', () => {
    it('should set dragged tile and add dragging class', async () => {
      const { setDraggedTile } = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      document.body.appendChild(tile);
      
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        }
      };
      
      handleDragStart.call(tile, event);
      
      expect(setDraggedTile).toHaveBeenCalledWith(tile);
      expect(tile.classList.contains('dragging')).toBe(true);
      expect(event.dataTransfer.effectAllowed).toBe('move');
    });

    it('should prevent drag for locked tiles', () => {
      const tile = createMockTile('A', 0);
      tile.setAttribute('data-locked', 'true');
      
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn()
        }
      };
      
      const result = handleDragStart.call(tile, event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('handleDragEnd', () => {
    it('should remove dragging class and clean up drag-over classes', () => {
      const tile = createMockTile('A', 0);
      tile.classList.add('dragging');
      
      const slot1 = document.createElement('div');
      slot1.className = 'slot drag-over';
      const slot2 = document.createElement('div');
      slot2.className = 'slot drag-over';
      document.body.appendChild(tile);
      document.body.appendChild(slot1);
      document.body.appendChild(slot2);
      
      handleDragEnd.call(tile, {});
      
      expect(tile.classList.contains('dragging')).toBe(false);
      expect(slot1.classList.contains('drag-over')).toBe(false);
      expect(slot2.classList.contains('drag-over')).toBe(false);
    });
  });

  describe('handleDragOver', () => {
    it('should add drag-over class and prevent default', () => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      
      const event = {
        preventDefault: vi.fn(),
        currentTarget: slot
      };
      
      handleDragOver(event);
      
      expect(slot.classList.contains('drag-over')).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not allow drop on locked slots', () => {
      const slot = document.createElement('div');
      slot.setAttribute('data-locked', 'true');
      
      const event = {
        preventDefault: vi.fn(),
        currentTarget: slot
      };
      
      const result = handleDragOver(event);
      
      expect(result).toBe(false);
    });
  });

  describe('handleDragLeave', () => {
    it('should remove drag-over class', () => {
      const slot = document.createElement('div');
      slot.className = 'slot drag-over';
      
      const event = {
        currentTarget: slot
      };
      
      handleDragLeave(event);
      
      expect(slot.classList.contains('drag-over')).toBe(false);
    });
  });

  describe('handleDrop', () => {
    it('should stop propagation', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const slot = document.createElement('div');
      const event = {
        defaultPrevented: false,
        stopPropagation: vi.fn(),
        currentTarget: slot
      };
      
      // Mock to return null so callback isn't called, but stopPropagation still should be
      getDraggedTile.mockReturnValue(null);
      
      handleDrop(event, vi.fn());
      
      // handleDrop calls stopPropagation but not preventDefault
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should call placeTileCallback with dragged tile', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      const slot = document.createElement('div');
      const placeTileCallback = vi.fn();
      
      getDraggedTile.mockReturnValue(tile);
      
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: slot
      };
      
      handleDrop(event, placeTileCallback);
      
      expect(placeTileCallback).toHaveBeenCalledWith(tile, slot);
    });

    it('should not call callback if no dragged tile', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const slot = document.createElement('div');
      const placeTileCallback = vi.fn();
      
      // Explicitly set mock to return null
      getDraggedTile.mockReturnValue(null);
      
      const event = {
        defaultPrevented: false,
        stopPropagation: vi.fn(),
        currentTarget: slot
      };
      
      handleDrop(event, placeTileCallback);
      
      expect(placeTileCallback).not.toHaveBeenCalled();
    });

    it('should ignore if drop already handled', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const slot = document.createElement('div');
      const placeTileCallback = vi.fn();
      
      const event = {
        defaultPrevented: true,
        stopPropagation: vi.fn(),
        currentTarget: slot
      };
      
      handleDrop(event, placeTileCallback);
      
      expect(placeTileCallback).not.toHaveBeenCalled();
    });

    it('should clear dragged tile before placing', async () => {
      const { getDraggedTile, clearDraggedTile } = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      const slot = document.createElement('div');
      const placeTileCallback = vi.fn();
      
      getDraggedTile.mockReturnValue(tile);
      
      const event = {
        defaultPrevented: false,
        stopPropagation: vi.fn(),
        currentTarget: slot
      };
      
      handleDrop(event, placeTileCallback);
      
      expect(clearDraggedTile).toHaveBeenCalled();
      expect(placeTileCallback).toHaveBeenCalledWith(tile, slot);
    });
  });

  describe('handleTileDragOver', () => {
    it('should add drag-over class to tile and slot', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const draggedTile = createMockTile('A', 0);
      const targetTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(targetTile);
      
      getDraggedTile.mockReturnValue(draggedTile);
      
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: targetTile
      };
      
      handleTileDragOver(event);
      
      expect(targetTile.classList.contains('drag-over')).toBe(true);
      expect(slot.classList.contains('drag-over')).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not allow drop on locked tile', () => {
      const tile = createMockTile('A', 0, true);
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.appendChild(tile);
      
      const event = {
        preventDefault: vi.fn(),
        currentTarget: tile
      };
      
      const result = handleTileDragOver(event);
      
      expect(result).toBe(false);
    });

    it('should not allow drop if tile not in slot', () => {
      const tile = createMockTile('A', 0);
      tile.closest = vi.fn(() => null);
      
      const event = {
        preventDefault: vi.fn(),
        currentTarget: tile
      };
      
      const result = handleTileDragOver(event);
      
      expect(result).toBe(false);
    });

    it('should not allow drop on locked slot', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.setAttribute('data-locked', 'true');
      slot.appendChild(tile);
      
      const event = {
        preventDefault: vi.fn(),
        currentTarget: tile
      };
      
      const result = handleTileDragOver(event);
      
      expect(result).toBe(false);
    });

    it('should not allow drop on itself', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      getDraggedTile.mockReturnValue(tile);
      
      const event = {
        preventDefault: vi.fn(),
        currentTarget: tile
      };
      
      const result = handleTileDragOver(event);
      
      expect(result).toBe(false);
    });
  });

  describe('handleTileDragLeave', () => {
    it('should remove drag-over class from tile and slot', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      tile.classList.add('drag-over');
      slot.classList.add('drag-over');
      
      const event = {
        currentTarget: tile
      };
      
      handleTileDragLeave(event);
      
      expect(tile.classList.contains('drag-over')).toBe(false);
      expect(slot.classList.contains('drag-over')).toBe(false);
    });

    it('should handle tile without slot', () => {
      const tile = createMockTile('A', 0);
      tile.closest = vi.fn(() => null);
      tile.classList.add('drag-over');
      
      const event = {
        currentTarget: tile
      };
      
      handleTileDragLeave(event);
      
      expect(tile.classList.contains('drag-over')).toBe(false);
    });
  });

  describe('handleTileDrop', () => {
    it('should call placeTileCallback for tile in slot', async () => {
      const { getDraggedTile, clearDraggedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const draggedTile = createMockTile('A', 0);
      const targetTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(targetTile);
      const placeTileCallback = vi.fn();
      
      getDraggedTile.mockReturnValue(draggedTile);
      
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
        currentTarget: targetTile
      };
      
      handleTileDrop(event, placeTileCallback);
      
      expect(clearDraggedTile).toHaveBeenCalled();
      expect(placeTileCallback).toHaveBeenCalledWith(draggedTile, slot);
      expect(targetTile.classList.contains('drag-over')).toBe(false);
      expect(slot.classList.contains('drag-over')).toBe(false);
    });

    it('should not drop tile on itself', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      const placeTileCallback = vi.fn();
      
      getDraggedTile.mockReturnValue(tile);
      
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: tile
      };
      
      const result = handleTileDrop(event, placeTileCallback);
      
      expect(placeTileCallback).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle missing dragged tile', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const targetTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(targetTile);
      const placeTileCallback = vi.fn();
      
      getDraggedTile.mockReturnValue(null);
      
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: targetTile
      };
      
      const result = handleTileDrop(event, placeTileCallback);
      
      expect(placeTileCallback).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle tile not in slot', () => {
      const tile = createMockTile('A', 0);
      tile.closest = vi.fn(() => null);
      const placeTileCallback = vi.fn();
      
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: tile
      };
      
      const result = handleTileDrop(event, placeTileCallback);
      
      expect(placeTileCallback).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('handleTilesContainerDragOver', () => {
    it('should prevent default and set drop effect', () => {
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: ''
        }
      };
      
      handleTilesContainerDragOver(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('handleTilesContainerDrop', () => {
    it('should return tile from slot to container', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      const returnTileToContainer = vi.fn();
      
      getDraggedTile.mockReturnValue(tile);
      validateTileExists.mockReturnValue(true);
      
      const event = {
        stopPropagation: vi.fn(),
        currentTarget: tilesContainer
      };
      
      handleTilesContainerDrop(event, {
        returnTileToContainer
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(returnTileToContainer).toHaveBeenCalled();
      expect(slot.classList.contains('filled')).toBe(false);
    });

    it('should handle archive puzzle', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-tiles-container';
      document.body.appendChild(archiveContainer);
      
      const archiveSlots = document.createElement('div');
      archiveSlots.id = 'archive-word-slots';
      const slot = document.createElement('div');
      slot.className = 'slot';
      archiveSlots.appendChild(slot);
      document.body.appendChild(archiveSlots);
      
      const tile = createMockTile('A', 0);
      slot.appendChild(tile);
      const returnArchiveTileToContainer = vi.fn();
      
      getDraggedTile.mockReturnValue(tile);
      validateTileExists.mockReturnValue(true);
      
      const event = {
        stopPropagation: vi.fn(),
        currentTarget: archiveContainer
      };
      
      handleTilesContainerDrop(event, {
        isArchive: true,
        returnArchiveTileToContainer
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(returnArchiveTileToContainer).toHaveBeenCalled();
      
      archiveContainer.remove();
      archiveSlots.remove();
    });

    it('should handle missing dragged tile', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      
      getDraggedTile.mockReturnValue(null);
      
      const event = {
        stopPropagation: vi.fn(),
        currentTarget: tilesContainer
      };
      
      const result = handleTilesContainerDrop(event, {});
      
      expect(result).toBe(false);
    });

    it('should handle tile not in DOM', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      
      getDraggedTile.mockReturnValue(tile);
      validateTileExists.mockReturnValue(false);
      
      const event = {
        stopPropagation: vi.fn(),
        currentTarget: tilesContainer
      };
      
      const result = handleTilesContainerDrop(event, {});
      
      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should handle tile without letter or index', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = document.createElement('div');
      tile.className = 'tile';
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      getDraggedTile.mockReturnValue(tile);
      validateTileExists.mockReturnValue(true);
      
      const event = {
        stopPropagation: vi.fn(),
        currentTarget: tilesContainer
      };
      
      const result = handleTilesContainerDrop(event, {});
      
      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should handle tile not from slot', async () => {
      const { getDraggedTile } = await import('../../js/puzzle-state.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tile.closest = vi.fn(() => null);
      
      getDraggedTile.mockReturnValue(tile);
      validateTileExists.mockReturnValue(true);
      
      const event = {
        stopPropagation: vi.fn(),
        currentTarget: tilesContainer
      };
      
      const result = handleTilesContainerDrop(event, {});
      
      expect(result).toBe(false);
    });
  });

  describe('handleTilesContainerDragLeave', () => {
    it('should not throw', () => {
      const event = {};
      
      expect(() => handleTilesContainerDragLeave(event)).not.toThrow();
    });
  });
});
