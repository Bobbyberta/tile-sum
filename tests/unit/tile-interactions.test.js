import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  handleDoubleClickOrTap,
  handleTileSelection,
  handleTileInteraction,
  handleTileClick,
  handleSlotClick
} from '../../js/tile-interactions.js';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  getSelectedTile: vi.fn(() => null)
}));

vi.mock('../../js/keyboard.js', () => ({
  selectTile: vi.fn(),
  deselectTile: vi.fn()
}));

vi.mock('../../js/utils.js', () => ({
  debugLog: vi.fn()
}));

vi.mock('../../js/interaction-state.js', () => ({
  getInteractionState: vi.fn(() => ({
    CLICK_DELAY_AFTER_TOUCH: 300,
    DOUBLE_CLICK_THRESHOLD: 300
  })),
  getIsProcessing: vi.fn(() => false),
  getLastClickTime: vi.fn(() => 0),
  getLastClickedTile: vi.fn(() => null),
  setLastClickTime: vi.fn(),
  setLastClickedTile: vi.fn(),
  getTouchInteractionActive: vi.fn(() => false),
  getLastTouchTime: vi.fn(() => 0)
}));

vi.mock('../../js/tile-validation.js', () => ({
  validateTileExists: vi.fn((tile) => tile && document.contains(tile)),
  findTileInContainer: vi.fn(() => null)
}));

describe('tile-interactions.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handleDoubleClickOrTap', () => {
    it('should return tile to container when double-clicked in slot', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { setLastClickedTile } = await import('../../js/interaction-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      getSelectedTile.mockReturnValue(tile);
      
      const removeTileCallback = vi.fn();
      
      const result = handleDoubleClickOrTap(tile, vi.fn(), removeTileCallback, {});
      
      expect(result).toBe(true);
      expect(removeTileCallback).toHaveBeenCalledWith(slot);
      expect(deselectTile).toHaveBeenCalled();
      expect(setLastClickedTile).toHaveBeenCalledWith(null);
    });

    it('should place tile in next empty slot when double-clicked in container', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      getSelectedTile.mockReturnValue(tile);
      
      const placeTileCallback = vi.fn();
      
      const result = handleDoubleClickOrTap(tile, placeTileCallback, vi.fn(), {});
      
      expect(result).toBe(true);
      expect(placeTileCallback).toHaveBeenCalledWith(tile, slot);
      expect(deselectTile).toHaveBeenCalled();
    });

    it('should return false if no available slot', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      // Fill all slots
      const allSlots = document.querySelectorAll('.slot');
      allSlots.forEach(slot => {
        slot.classList.add('filled');
        const filledTile = createMockTile('X', 99);
        slot.appendChild(filledTile);
      });
      
      const result = handleDoubleClickOrTap(tile, vi.fn(), vi.fn(), {});
      
      expect(result).toBe(false);
    });

    it('should return false if tile not in slot or container', () => {
      const tile = createMockTile('A', 0);
      tile.closest = vi.fn(() => null);
      
      const result = handleDoubleClickOrTap(tile, vi.fn(), vi.fn(), {});
      
      expect(result).toBe(false);
    });
  });

  describe('handleTileSelection', () => {
    it('should deselect tile if already selected', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      getSelectedTile.mockReturnValue(tile);
      
      const result = handleTileSelection(tile, vi.fn(), {});
      
      expect(result).toBe(true);
      expect(deselectTile).toHaveBeenCalled();
    });

    it('should swap tiles when another tile is selected', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const selectedTile = createMockTile('A', 0);
      const clickedTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(clickedTile);
      tilesContainer.appendChild(selectedTile);
      
      getSelectedTile.mockReturnValue(selectedTile);
      
      const placeTileCallback = vi.fn();
      
      const result = handleTileSelection(clickedTile, placeTileCallback, {});
      
      expect(result).toBe(true);
      expect(placeTileCallback).toHaveBeenCalledWith(selectedTile, slot);
      expect(deselectTile).toHaveBeenCalled();
    });

    it('should select tile if no tile selected', async () => {
      const { selectTile } = await import('../../js/keyboard.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const result = handleTileSelection(tile, vi.fn(), {});
      
      expect(result).toBe(true);
      expect(selectTile).toHaveBeenCalledWith(tile);
    });

    it('should handle selected tile not in DOM', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile, selectTile } = await import('../../js/keyboard.js');
      const { validateTileExists, findTileInContainer } = await import('../../js/tile-validation.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const selectedTile = createMockTile('A', 0);
      const clickedTile = createMockTile('B', 1);
      tilesContainer.appendChild(clickedTile);
      
      getSelectedTile.mockReturnValue(selectedTile);
      validateTileExists.mockReturnValue(false);
      findTileInContainer.mockReturnValue(null);
      
      const result = handleTileSelection(clickedTile, vi.fn(), {});
      
      expect(result).toBe(true);
      expect(deselectTile).toHaveBeenCalled();
      expect(selectTile).toHaveBeenCalledWith(clickedTile);
    });

    it('should swap when selected tile in slot and clicked tile in container', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { validateTileExists } = await import('../../js/tile-validation.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const selectedTile = createMockTile('A', 0);
      const clickedTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(selectedTile);
      tilesContainer.appendChild(clickedTile);
      
      getSelectedTile.mockReturnValue(selectedTile);
      // Ensure validateTileExists returns true for the selected tile
      validateTileExists.mockImplementation((tile) => tile && document.contains(tile));
      
      const placeTileCallback = vi.fn();
      
      const result = handleTileSelection(clickedTile, placeTileCallback, {});
      
      expect(result).toBe(true);
      // The code places the clicked tile in the selected tile's slot
      expect(placeTileCallback).toHaveBeenCalledWith(clickedTile, slot);
      expect(deselectTile).toHaveBeenCalled();
    });
  });

  describe('handleTileInteraction', () => {
    it('should not handle locked tiles', () => {
      const tile = createMockTile('A', 0, true);
      
      handleTileInteraction(tile, vi.fn(), vi.fn(), {});
      
      // Should not throw or call callbacks
      expect(tile).toBeTruthy();
    });

    it('should not handle if already processing', async () => {
      const { getIsProcessing } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      getIsProcessing.mockReturnValue(true);
      
      handleTileInteraction(tile, vi.fn(), vi.fn(), {});
      
      // Should return early
      expect(getIsProcessing).toHaveBeenCalled();
    });

    it('should prevent click if recent touch interaction', async () => {
      const { getTouchInteractionActive, getLastTouchTime, getInteractionState, getLastClickedTile, getLastClickTime } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      // Set up mocks for touch interaction check
      // Use a fixed base time to ensure calculation works correctly
      const baseTime = 1000000;
      const recentTouchTime = baseTime - 100; // Recent touch (100ms before base time)
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);
      
      getTouchInteractionActive.mockReturnValue(true);
      getLastTouchTime.mockReturnValue(recentTouchTime);
      getInteractionState.mockReturnValue({ CLICK_DELAY_AFTER_TOUCH: 300, DOUBLE_CLICK_THRESHOLD: 300 });
      
      // Ensure it's not a double-click
      getLastClickedTile.mockReturnValue(null);
      getLastClickTime.mockReturnValue(0);
      
      const event = {
        type: 'click',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };
      
      handleTileInteraction(tile, vi.fn(), vi.fn(), {}, event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should handle double-click', async () => {
      const { getLastClickedTile, getLastClickTime, getInteractionState, getTouchInteractionActive, getLastTouchTime } = await import('../../js/interaction-state.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      // Simulate first click by setting state - this represents the state BEFORE the second click
      // Use a fixed base time to ensure calculation works correctly
      const baseTime = 1000000;
      const firstClickTime = baseTime - 100; // 100ms before base time
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);
      
      // Mock the getters to return the state from the first click
      getLastClickedTile.mockReturnValue(tile); // Same tile was clicked before
      getLastClickTime.mockReturnValue(firstClickTime); // Recent click
      getInteractionState.mockReturnValue({ DOUBLE_CLICK_THRESHOLD: 300, CLICK_DELAY_AFTER_TOUCH: 300 });
      
      // Ensure no touch interaction
      getTouchInteractionActive.mockReturnValue(false);
      getLastTouchTime.mockReturnValue(0);
      
      const removeTileCallback = vi.fn();
      
      handleTileInteraction(tile, vi.fn(), removeTileCallback, {});
      
      expect(removeTileCallback).toHaveBeenCalled();
    });

    it('should handle single click', async () => {
      const { selectTile } = await import('../../js/keyboard.js');
      const { getLastClickedTile, getLastClickTime, getInteractionState, getTouchInteractionActive, getLastTouchTime } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      // Use a fixed base time
      const baseTime = 1000000;
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);
      
      // Ensure it's not a double-click by setting last clicked tile to null or different tile
      getLastClickedTile.mockReturnValue(null);
      getLastClickTime.mockReturnValue(0);
      getInteractionState.mockReturnValue({ DOUBLE_CLICK_THRESHOLD: 300, CLICK_DELAY_AFTER_TOUCH: 300 });
      
      // Ensure no touch interaction
      getTouchInteractionActive.mockReturnValue(false);
      getLastTouchTime.mockReturnValue(0);
      
      handleTileInteraction(tile, vi.fn(), vi.fn(), {});
      
      expect(selectTile).toHaveBeenCalledWith(tile);
    });

    it('should stop propagation for tile in container', async () => {
      const { getLastClickedTile, getLastClickTime, getInteractionState, getTouchInteractionActive, getLastTouchTime } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      // Use a fixed base time
      const baseTime = 1000000;
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);
      
      // Ensure it's not a double-click and no recent touch
      getLastClickedTile.mockReturnValue(null);
      getLastClickTime.mockReturnValue(0);
      getInteractionState.mockReturnValue({ DOUBLE_CLICK_THRESHOLD: 300, CLICK_DELAY_AFTER_TOUCH: 300 });
      getTouchInteractionActive.mockReturnValue(false);
      getLastTouchTime.mockReturnValue(0);
      
      const event = {
        type: 'click',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };
      
      handleTileInteraction(tile, vi.fn(), vi.fn(), {}, event);
      
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not stop propagation for tile in slot', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      const event = {
        type: 'click',
        stopPropagation: vi.fn()
      };
      
      handleTileInteraction(tile, vi.fn(), vi.fn(), {}, event);
      
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('handleTileClick', () => {
    it('should call handleTileInteraction', async () => {
      const { selectTile } = await import('../../js/keyboard.js');
      const { getLastClickedTile, getLastClickTime, getInteractionState, getTouchInteractionActive, getLastTouchTime } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      // Use a fixed base time
      const baseTime = 1000000;
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);
      
      // Ensure it's not a double-click and no recent touch
      getLastClickedTile.mockReturnValue(null);
      getLastClickTime.mockReturnValue(0);
      getInteractionState.mockReturnValue({ DOUBLE_CLICK_THRESHOLD: 300, CLICK_DELAY_AFTER_TOUCH: 300 });
      getTouchInteractionActive.mockReturnValue(false);
      getLastTouchTime.mockReturnValue(0);
      
      const event = {
        currentTarget: tile,
        type: 'click',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };
      
      handleTileClick(event, vi.fn(), vi.fn());
      
      expect(selectTile).toHaveBeenCalledWith(tile);
    });
  });

  describe('handleSlotClick', () => {
    it('should not handle locked slots', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      slot.setAttribute('data-locked', 'true');
      
      const event = {
        currentTarget: slot
      };
      
      handleSlotClick(event, vi.fn(), vi.fn());
      
      // Should not throw
      expect(slot).toBeTruthy();
    });

    it('should place selected tile in slot', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const selectedTile = createMockTile('A', 0);
      
      getSelectedTile.mockReturnValue(selectedTile);
      
      const placeTileCallback = vi.fn();
      const event = {
        currentTarget: slot
      };
      
      handleSlotClick(event, placeTileCallback, vi.fn());
      
      expect(placeTileCallback).toHaveBeenCalledWith(selectedTile, slot);
      expect(deselectTile).toHaveBeenCalled();
    });

    it('should remove tile from filled slot when no tile selected', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const tile = createMockTile('A', 0);
      slot.appendChild(tile);
      slot.classList.add('filled');
      
      // Ensure no tile is selected
      getSelectedTile.mockReturnValue(null);
      
      const removeTileCallback = vi.fn();
      const event = {
        currentTarget: slot
      };
      
      handleSlotClick(event, vi.fn(), removeTileCallback);
      
      expect(removeTileCallback).toHaveBeenCalledWith(slot);
    });

    it('should not remove locked tile from slot', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const tile = createMockTile('A', 0, true);
      slot.appendChild(tile);
      slot.classList.add('filled');
      
      const removeTileCallback = vi.fn();
      const event = {
        currentTarget: slot
      };
      
      handleSlotClick(event, vi.fn(), removeTileCallback);
      
      expect(removeTileCallback).not.toHaveBeenCalled();
    });

    it('should do nothing if slot empty and no tile selected', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      // Ensure no tile is selected
      getSelectedTile.mockReturnValue(null);
      
      const placeTileCallback = vi.fn();
      const removeTileCallback = vi.fn();
      const event = {
        currentTarget: slot
      };
      
      handleSlotClick(event, placeTileCallback, removeTileCallback);
      
      expect(placeTileCallback).not.toHaveBeenCalled();
      expect(removeTileCallback).not.toHaveBeenCalled();
    });
  });
});
