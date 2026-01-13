import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop
} from '../../js/mouse-drag.js';
import { createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

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
  });
});
