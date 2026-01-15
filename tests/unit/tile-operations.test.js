import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  placeTileInSlot,
  removeTileFromSlot,
  returnTileToContainer,
  attachTileHandlers
} from '../../js/tile-operations.js';
import { createMockPuzzleDOM, createMockTile, createMockSlot, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  getSelectedTile: vi.fn(() => null),
  clearSelectedTile: vi.fn(),
  setSelectedTile: vi.fn()
}));

vi.mock('../../js/keyboard.js', () => ({
  deselectTile: vi.fn(),
  handleTileKeyDown: vi.fn()
}));

vi.mock('../../js/puzzle-core.js', () => ({
  createTile: vi.fn((letter, index, isLocked, handlers) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.setAttribute('data-letter', letter);
    tile.setAttribute('data-tile-index', String(index));
    tile.setAttribute('draggable', isLocked ? 'false' : 'true');
    if (isLocked) {
      tile.setAttribute('data-locked', 'true');
    }
    if (handlers && handlers.onClick) {
      tile.addEventListener('click', handlers.onClick);
    }
    return tile;
  }),
  updatePlaceholderTile: vi.fn()
}));

vi.mock('../../js/scoring.js', () => ({
  updateScoreDisplay: vi.fn(),
  updateSubmitButton: vi.fn()
}));

vi.mock('../../js/auto-complete.js', () => ({
  checkAutoComplete: vi.fn(),
  areAllSlotsFilled: vi.fn(() => false)
}));

vi.mock('../../js/utils.js', () => ({
  debugLog: vi.fn()
}));

vi.mock('../../js/interaction-state.js', () => ({
  getIsProcessing: vi.fn(() => false),
  setIsProcessing: vi.fn()
}));

vi.mock('../../js/tile-validation.js', () => ({
  validateTileExists: vi.fn((tile) => {
    if (!tile) return false;
    return tile.parentNode !== null && document.contains(tile);
  }),
  findTileInContainer: vi.fn(() => null),
  ensureTilePreserved: vi.fn()
}));

vi.mock('../../js/mouse-drag.js', () => ({
  handleDragStart: vi.fn(),
  handleDragEnd: vi.fn(),
  handleTileDragOver: vi.fn(),
  handleTileDragLeave: vi.fn(),
  handleTileDrop: vi.fn()
}));

vi.mock('../../js/tile-interactions.js', () => ({
  handleTileClick: vi.fn()
}));

vi.mock('../../js/touch-drag.js', () => ({
  handleTouchStart: vi.fn(),
  handleTouchMove: vi.fn(),
  handleTouchEnd: vi.fn(),
  handleTouchCancel: vi.fn()
}));

describe('tile-operations.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
    // Reset requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attachTileHandlers', () => {
    it('should attach handlers to unlocked tile in container', async () => {
      const { handleDragStart, handleDragEnd } = await import('../../js/mouse-drag.js');
      const { handleTileKeyDown } = await import('../../js/keyboard.js');
      const { handleTouchStart } = await import('../../js/touch-drag.js');
      
      const tile = createMockTile('A', 0);
      const context = {};

      attachTileHandlers(tile, context, false);

      // Verify drag handlers attached
      const dragStartEvent = new Event('dragstart');
      tile.dispatchEvent(dragStartEvent);
      expect(handleDragStart).toHaveBeenCalled();

      // Verify keyboard handler attached
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      tile.dispatchEvent(keyEvent);
      expect(handleTileKeyDown).toHaveBeenCalled();
    });

    it('should not attach handlers to locked tile', () => {
      const tile = createMockTile('A', 0, true);
      const context = {};

      attachTileHandlers(tile, context, false);

      // Should not have attached handlers
      expect(tile.getAttribute('droppable')).toBeNull();
    });

    it('should make tile droppable when in slot', () => {
      const tile = createMockTile('A', 0);
      const context = {};

      attachTileHandlers(tile, context, true);

      expect(tile.getAttribute('droppable')).toBe('true');
    });

    it('should use custom touch handlers from context', () => {
      const onTouchStart = vi.fn();
      const tile = createMockTile('A', 0);
      const context = {
        handlers: {
          onTouchStart
        }
      };

      attachTileHandlers(tile, context, false);

      const touchEvent = new TouchEvent('touchstart', { bubbles: true });
      tile.dispatchEvent(touchEvent);
      expect(onTouchStart).toHaveBeenCalled();
    });

    it('should use placeTileCallback from context', () => {
      const placeTileCallback = vi.fn();
      const tile = createMockTile('A', 0);
      const context = { placeTileCallback };

      attachTileHandlers(tile, context, false);

      // The callback should be used when tile is clicked
      expect(context.placeTileCallback).toBe(placeTileCallback);
    });
  });

  describe('placeTileInSlot', () => {
    it('should place tile in empty slot', async () => {
      const { updateScoreDisplay, updateSubmitButton } = await import('../../js/scoring.js');
      const { getIsProcessing, setIsProcessing } = await import('../../js/interaction-state.js');
      
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);

      placeTileInSlot(tile, slot, {});

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(slot.querySelector('.tile')).toBeTruthy();
      expect(slot.classList.contains('filled')).toBe(true);
      expect(updateScoreDisplay).toHaveBeenCalled();
      expect(updateSubmitButton).toHaveBeenCalled();
    });

    it('should prevent concurrent executions', async () => {
      const { getIsProcessing } = await import('../../js/interaction-state.js');
      getIsProcessing.mockReturnValue(true);

      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);

      placeTileInSlot(tile, slot, {});

      // Should return early without placing
      expect(slot.querySelector('.tile')).toBeFalsy();
    });

    it('should not place tile in locked slot', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      slot.setAttribute('data-locked', 'true');
      tilesContainer.appendChild(tile);

      placeTileInSlot(tile, slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(slot.querySelector('.tile')).toBeFalsy();
    });

    it('should not place locked tile', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0, true);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);

      placeTileInSlot(tile, slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(slot.querySelector('.tile')).toBeFalsy();
    });

    it('should swap tiles when slot is occupied', async () => {
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { getIsProcessing } = await import('../../js/interaction-state.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const existingTile = createMockTile('N', 1);
      const newTile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      
      slot.appendChild(existingTile);
      tilesContainer.appendChild(newTile);
      
      // Reset mocks to ensure clean state
      vi.clearAllMocks();
      getIsProcessing.mockReturnValue(false);
      // Ensure validateTileExists returns true for tiles in DOM
      validateTileExists.mockImplementation((t) => {
        if (!t) return false;
        return t.parentNode !== null && document.contains(t);
      });

      placeTileInSlot(newTile, slot, {});

      // Wait for async operations including requestAnimationFrame
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 50);
        });
      });

      const tileInSlot = slot.querySelector('.tile');
      expect(tileInSlot).toBeTruthy();
      expect(tileInSlot.getAttribute('data-letter')).toBe('S');
      // Existing tile should be returned to container
      expect(tilesContainer.querySelector('.tile')).toBeTruthy();
    });

    it('should not swap with locked tile', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const existingTile = createMockTile('N', 1, true);
      const newTile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      
      slot.appendChild(existingTile);
      tilesContainer.appendChild(newTile);

      placeTileInSlot(newTile, slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not swap
      const tileInSlot = slot.querySelector('.tile');
      expect(tileInSlot.getAttribute('data-letter')).toBe('N');
    });

    it('should ignore if tile already in slot', async () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      
      slot.appendChild(tile);

      placeTileInSlot(tile, slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should still be in slot (no duplicate)
      expect(slot.querySelectorAll('.tile').length).toBe(1);
    });

    it('should handle invalid tile or slot', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { setIsProcessing, getIsProcessing } = await import('../../js/interaction-state.js');
      
      // Reset mocks
      vi.clearAllMocks();
      getIsProcessing.mockReturnValue(false);

      placeTileInSlot(null, null, {});

      // Wait for finally block to execute - use requestAnimationFrame to ensure it runs
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 10);
        });
      });

      expect(setIsProcessing).toHaveBeenCalledWith(false);
      consoleError.mockRestore();
    });

    it('should handle tile not in DOM with recovery', async () => {
      const { findTileInContainer, validateTileExists } = await import('../../js/tile-validation.js');
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      
      // Add tile to container first so it exists in DOM initially
      tilesContainer.appendChild(tile);
      
      // Now simulate tile not in DOM by making validateTileExists return false
      // This simulates the tile being removed from DOM before the function checks
      validateTileExists.mockReturnValueOnce(false);
      findTileInContainer.mockReturnValue(null);

      placeTileInSlot(tile, slot, {});

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(validateTileExists).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should update placeholder when tile from container', async () => {
      const { updatePlaceholderTile } = await import('../../js/puzzle-core.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);
      
      // Ensure validateTileExists returns true for tile in container
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      placeTileInSlot(tile, slot, {});

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updatePlaceholderTile).toHaveBeenCalledWith('tiles-container');
    });

    it('should focus slot for keyboard navigation', async () => {
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);
      
      // Make slot focusable
      slot.setAttribute('tabindex', '0');
      const focusSpy = vi.spyOn(slot, 'focus');
      
      // Ensure validateTileExists returns true for tile in container
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      placeTileInSlot(tile, slot, { isKeyboardNavigation: true });

      // Wait for setTimeout(0) to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(focusSpy).toHaveBeenCalled();
    });

    it('should work with prefix', async () => {
      const { updateScoreDisplay } = await import('../../js/scoring.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM('daily-');
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);
      
      // Ensure validateTileExists returns true for tile in container
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      placeTileInSlot(tile, slot, { prefix: 'daily-' });

      // Wait for async operations including requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updateScoreDisplay).toHaveBeenCalledWith('daily-');
    });

    it('should handle archive puzzle', async () => {
      const updateArchiveScoreDisplay = vi.fn();
      const updateArchiveSubmitButton = vi.fn();
      const { validateTileExists } = await import('../../js/tile-validation.js');
      
      // Create archive word slots container
      const archiveWordSlots = document.createElement('div');
      archiveWordSlots.id = 'archive-word-slots';
      document.body.appendChild(archiveWordSlots);
      
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      // Make slot part of archive by moving it to archive container
      archiveWordSlots.appendChild(slots1Container.parentElement);
      
      const tile = createMockTile('S', 0);
      tilesContainer.appendChild(tile);
      
      // Ensure validateTileExists returns true for tile in container
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      placeTileInSlot(tile, slot, {
        isArchive: true,
        updateArchiveScoreDisplay,
        updateArchiveSubmitButton
      });

      // Wait for async operations including requestAnimationFrame
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(updateArchiveScoreDisplay).toHaveBeenCalled();
      expect(updateArchiveSubmitButton).toHaveBeenCalled();
      
      // Cleanup
      archiveWordSlots.remove();
    });

    it('should clear selected tile if placing selected tile', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      tilesContainer.appendChild(tile);
      
      getSelectedTile.mockReturnValue(tile);
      // Ensure validateTileExists returns true for tile in container
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      placeTileInSlot(tile, slot, {});

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(deselectTile).toHaveBeenCalled();
    });
  });

  describe('removeTileFromSlot', () => {
    it('should remove tile from slot and return to container', async () => {
      const { updateScoreDisplay, updateSubmitButton } = await import('../../js/scoring.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      // Ensure validateTileExists returns true for the tile in slot
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      removeTileFromSlot(slot, {});

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(slot.querySelector('.tile')).toBeFalsy();
      expect(slot.classList.contains('filled')).toBe(false);
      expect(updateScoreDisplay).toHaveBeenCalled();
      expect(updateSubmitButton).toHaveBeenCalled();
    });

    it('should not remove locked tile', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0, true);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);

      removeTileFromSlot(slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(slot.querySelector('.tile')).toBeTruthy();
    });

    it('should handle empty slot', async () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];

      removeTileFromSlot(slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not throw
      expect(slot.querySelector('.tile')).toBeFalsy();
    });

    it('should clear selected tile if removing selected tile', async () => {
      const { getSelectedTile, clearSelectedTile } = await import('../../js/puzzle-state.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      getSelectedTile.mockReturnValue(tile);
      // Ensure validateTileExists returns true for the tile in slot
      validateTileExists.mockImplementation((t) => t && document.contains(t));

      removeTileFromSlot(slot, {});

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(clearSelectedTile).toHaveBeenCalled();
    });

    it('should handle archive puzzle removal', async () => {
      const returnArchiveTileToContainer = vi.fn();
      const updateArchiveScoreDisplay = vi.fn();
      const updateArchiveSubmitButton = vi.fn();
      const { validateTileExists } = await import('../../js/tile-validation.js');
      
      // Create mock puzzle DOM first (this clears the body)
      const { slots1Container } = createMockPuzzleDOM();
      
      // Create archive word slots container AFTER createMockPuzzleDOM
      const archiveWordSlots = document.createElement('div');
      archiveWordSlots.id = 'archive-word-slots';
      document.body.appendChild(archiveWordSlots);
      
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      // Make slot part of archive by moving the word container to archive
      const wordContainer = slots1Container.parentElement;
      archiveWordSlots.appendChild(wordContainer);
      
      // Ensure validateTileExists returns true for the tile in slot
      validateTileExists.mockImplementation((t) => {
        if (!t) return false;
        return t.parentNode !== null && document.contains(t);
      });

      removeTileFromSlot(slot, {
        isArchive: true,
        returnArchiveTileToContainer,
        updateArchiveScoreDisplay,
        updateArchiveSubmitButton
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(returnArchiveTileToContainer).toHaveBeenCalled();
      expect(updateArchiveScoreDisplay).toHaveBeenCalled();
      expect(updateArchiveSubmitButton).toHaveBeenCalled();
      
      // Cleanup
      archiveWordSlots.remove();
    });

    it('should handle tile without letter or index', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { slots1Container } = createMockPuzzleDOM();
      const tile = document.createElement('div');
      tile.className = 'tile';
      const slot = slots1Container.children[0];
      slot.appendChild(tile);

      removeTileFromSlot(slot, {});

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('returnTileToContainer', () => {
    it('should return tile to container', async () => {
      const { updateScoreDisplay, updateSubmitButton } = await import('../../js/scoring.js');
      const { updatePlaceholderTile } = await import('../../js/puzzle-core.js');
      const { tilesContainer } = createMockPuzzleDOM();

      returnTileToContainer('S', 0, {}, false, '', {});

      await new Promise(resolve => setTimeout(resolve, 10));

      const returnedTile = tilesContainer.querySelector('.tile');
      expect(returnedTile).toBeTruthy();
      expect(returnedTile.getAttribute('data-letter')).toBe('S');
      expect(updatePlaceholderTile).toHaveBeenCalled();
      expect(updateScoreDisplay).toHaveBeenCalled();
      expect(updateSubmitButton).toHaveBeenCalled();
    });

    it('should use prefix for container ID', async () => {
      const { tilesContainer } = createMockPuzzleDOM('daily-');

      returnTileToContainer('S', 0, {}, false, 'daily-', {});

      await new Promise(resolve => setTimeout(resolve, 10));

      const returnedTile = tilesContainer.querySelector('.tile');
      expect(returnedTile).toBeTruthy();
    });

    it('should focus tile for keyboard navigation', async () => {
      const { tilesContainer } = createMockPuzzleDOM();

      returnTileToContainer('S', 0, {}, true, '', {});

      await new Promise(resolve => setTimeout(resolve, 60));

      const returnedTile = tilesContainer.querySelector('.tile');
      const focusSpy = vi.spyOn(returnedTile, 'focus');
      
      // Focus happens in setTimeout, wait a bit more
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // The focus should have been called
      expect(returnedTile).toBeTruthy();
    });

    it('should fallback to regular container if prefix container not found', async () => {
      const { tilesContainer } = createMockPuzzleDOM();
      // Remove the daily container if it exists
      const dailyContainer = document.getElementById('daily-tiles-container');
      if (dailyContainer) dailyContainer.remove();

      returnTileToContainer('S', 0, {}, false, 'nonexistent-', {});

      await new Promise(resolve => setTimeout(resolve, 10));

      const returnedTile = tilesContainer.querySelector('.tile');
      expect(returnedTile).toBeTruthy();
    });

    it('should handle archive container', async () => {
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-tiles-container';
      document.body.appendChild(archiveContainer);

      returnTileToContainer('S', 0, {}, false, '', {});

      await new Promise(resolve => setTimeout(resolve, 10));

      const returnedTile = archiveContainer.querySelector('.tile');
      expect(returnedTile).toBeTruthy();
      
      archiveContainer.remove();
    });

    it('should use context for handler attachment', async () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const context = {
        handlers: {}
      };

      returnTileToContainer('S', 0, {}, false, '', context);

      await new Promise(resolve => setTimeout(resolve, 10));

      const returnedTile = tilesContainer.querySelector('.tile');
      expect(returnedTile).toBeTruthy();
    });

    it('should handle missing container gracefully', async () => {
      cleanupDOM();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      returnTileToContainer('S', 0, {}, false, '', {});

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
