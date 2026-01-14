import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  initKeyboardInput,
  getKeyboardContext,
  handleSlotKeyDown,
  handleTileKeyDown
} from '../../js/keyboard-input.js';
import { createMockPuzzleDOM, createMockTile, createMockSlot, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../puzzle-data-encoded.js', () => ({
  SCRABBLE_SCORES: {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1
  }
}));

vi.mock('../../js/keyboard.js', () => ({
  selectTile: vi.fn(),
  deselectTile: vi.fn()
}));

vi.mock('../../js/puzzle-state.js', () => ({
  getSelectedTile: vi.fn(() => null)
}));

// Helper to create a keyboard event with mockable currentTarget
function createKeyboardEventWithTarget(type, options, currentTarget) {
  const event = new KeyboardEvent(type, options);
  Object.defineProperty(event, 'currentTarget', {
    get: () => currentTarget,
    configurable: true
  });
  return event;
}

describe('keyboard-input.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initKeyboardInput', () => {
    it('should store context', () => {
      const context = { prefix: 'daily-' };
      initKeyboardInput(context);
      expect(getKeyboardContext()).toBe(context);
    });
  });

  describe('getKeyboardContext', () => {
    it('should return stored context', () => {
      const context = { prefix: 'archive-' };
      initKeyboardInput(context);
      expect(getKeyboardContext()).toBe(context);
    });

    it('should return null if no context set', () => {
      initKeyboardInput(null);
      expect(getKeyboardContext()).toBeNull();
    });
  });

  describe('handleSlotKeyDown', () => {
    it('should not handle locked slots', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      slot.setAttribute('data-locked', 'true');
      
      const context = {
        prefix: '',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event, context);
      
      expect(context.placeTileCallback).not.toHaveBeenCalled();
    });

    it('should handle letter typing', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      const placeTileCallback = vi.fn();
      const context = {
        prefix: '',
        placeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(placeTileCallback).toHaveBeenCalled();
    });

    it('should handle Delete key', async () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const tile = createMockTile('A', 0);
      slot.appendChild(tile);
      
      const removeTileCallback = vi.fn();
      const context = {
        prefix: '',
        removeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Delete' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(removeTileCallback).toHaveBeenCalledWith(slot);
    });

    it('should handle Backspace key', async () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const tile = createMockTile('A', 0);
      slot.appendChild(tile);
      
      const removeTileCallback = vi.fn();
      const context = {
        prefix: '',
        removeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Backspace' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(removeTileCallback).toHaveBeenCalledWith(slot);
    });

    it('should handle Enter key with selected tile', async () => {
      const { getSelectedTile } = await import('../../js/puzzle-state.js');
      const { deselectTile } = await import('../../js/keyboard.js');
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const selectedTile = createMockTile('A', 0);
      
      getSelectedTile.mockReturnValue(selectedTile);
      
      const placeTileCallback = vi.fn();
      const context = {
        prefix: '',
        placeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(placeTileCallback).toHaveBeenCalledWith(selectedTile, slot);
      expect(deselectTile).toHaveBeenCalled();
    });

    it('should handle Enter key without selected tile', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const placeTileCallback = vi.fn();
      const context = {
        prefix: '',
        placeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(placeTileCallback).not.toHaveBeenCalled();
    });

    it('should handle arrow key navigation', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      const focusSpy = vi.spyOn(slots1Container.children[1], 'focus');
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'ArrowRight' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle Tab navigation', () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      const focusSpy = vi.spyOn(tile, 'focus');
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Tab' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should use stored context if no context provided', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const context = {
        prefix: '',
        placeTileCallback: vi.fn()
      };
      
      initKeyboardInput(context);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      event.preventDefault = vi.fn();
      
      handleSlotKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should warn if no context available', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      initKeyboardInput(null);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event);
      
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('handleTileKeyDown', () => {
    it('should not handle locked tiles', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0, true);
      tilesContainer.appendChild(tile);
      
      const context = {
        prefix: '',
        placeTileCallback: vi.fn()
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      
      handleTileKeyDown(event, context);
      
      expect(context.placeTileCallback).not.toHaveBeenCalled();
    });

    it('should select tile on Enter when in container', async () => {
      const { selectTile } = await import('../../js/keyboard.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(selectTile).toHaveBeenCalledWith(tile);
    });

    it('should not select tile on Enter when in slot', async () => {
      const { selectTile } = await import('../../js/keyboard.js');
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(selectTile).not.toHaveBeenCalled();
    });

    it('should handle Delete when tile in slot', async () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      const removeTileCallback = vi.fn();
      const context = {
        prefix: '',
        removeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Delete' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(removeTileCallback).toHaveBeenCalledWith(slot);
    });

    it('should not handle Delete when tile in container', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const removeTileCallback = vi.fn();
      const context = {
        prefix: '',
        removeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Delete' }, tile);
      
      handleTileKeyDown(event, context);
      
      expect(removeTileCallback).not.toHaveBeenCalled();
    });

    it('should handle letter typing', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      const placeTileCallback = vi.fn();
      const context = {
        prefix: '',
        placeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(placeTileCallback).toHaveBeenCalled();
    });

    it('should handle arrow keys for tile in container', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile1 = createMockTile('A', 0);
      const tile2 = createMockTile('B', 1);
      tilesContainer.appendChild(tile1);
      tilesContainer.appendChild(tile2);
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'ArrowRight' }, tile1);
      event.preventDefault = vi.fn();
      
      const focusSpy = vi.spyOn(tile2, 'focus');
      
      handleTileKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle arrow keys for tile in slot', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'ArrowRight' }, tile);
      event.preventDefault = vi.fn();
      
      const focusSpy = vi.spyOn(slots1Container.children[1], 'focus');
      
      handleTileKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should handle Tab navigation', () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      const focusSpy = vi.spyOn(slot, 'focus');
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Tab' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should use stored context if no context provided', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const context = {
        prefix: ''
      };
      
      initKeyboardInput(context);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should warn if no context available', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      initKeyboardInput(null);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      
      handleTileKeyDown(event);
      
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });

    it('should handle Escape key', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Escape' }, tile);
      
      expect(() => handleTileKeyDown(event, context)).not.toThrow();
    });

    it('should handle Escape key in slot', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const context = {
        prefix: ''
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Escape' }, slot);
      
      expect(() => handleSlotKeyDown(event, context)).not.toThrow();
    });

    it('should handle type letter when tile is in container', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      const placeTileCallback = vi.fn();
      const context = {
        prefix: '',
        placeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(placeTileCallback).toHaveBeenCalled();
    });

    it('should handle arrow navigation when nextElement is not in document', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const context = {
        prefix: '',
        slotsByWord: [
          [slots1Container.children[0], slots1Container.children[1]],
          [slots1Container.children[2], slots1Container.children[3]]
        ]
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'ArrowRight' }, slot);
      event.preventDefault = vi.fn();
      
      // Remove the next slot from document to test document.contains check
      const nextSlot = slots1Container.children[1];
      if (nextSlot) {
        nextSlot.remove();
      }
      
      handleSlotKeyDown(event, context);
      
      // Should not throw even if element not in document
      expect(() => handleSlotKeyDown(event, context)).not.toThrow();
    });

    it('should handle Escape key in slot without doing anything', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const context = {
        prefix: '',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Escape' }, slot);
      
      handleSlotKeyDown(event, context);
      
      // Escape should not trigger any callbacks
      expect(context.placeTileCallback).not.toHaveBeenCalled();
      expect(context.removeTileCallback).not.toHaveBeenCalled();
    });

    it('should handle type letter when tile is in container', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const placeTileCallback = vi.fn();
      const context = {
        prefix: '',
        placeTileCallback
      };
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, tile);
      event.preventDefault = vi.fn();
      
      handleTileKeyDown(event, context);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(event.preventDefault).toHaveBeenCalled();
      // Should call placeTileCallback to place tile in next empty slot
      expect(placeTileCallback).toHaveBeenCalled();
    });
  });
});
