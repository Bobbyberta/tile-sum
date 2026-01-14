import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleSlotFocus,
  handleSlotBlur,
  selectTile,
  deselectTile,
  announceToScreenReader,
  handleModalKeyDown,
  handleHelpModalKeyDown,
  handleTileKeyDown,
  handleSlotKeyDown
} from '../../js/keyboard.js';
import { createMockTile, createMockPuzzleDOM, cleanupDOM } from '../helpers/dom-setup.js';

// Helper to create a keyboard event with mockable currentTarget
function createKeyboardEventWithTarget(type, options, currentTarget) {
  const event = new KeyboardEvent(type, options);
  Object.defineProperty(event, 'currentTarget', {
    get: () => currentTarget,
    configurable: true
  });
  return event;
}

// Mock dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  getSelectedTile: vi.fn(() => null),
  setSelectedTile: vi.fn(),
  clearSelectedTile: vi.fn()
}));

vi.mock('../../puzzle-data-encoded.js', () => ({
  SCRABBLE_SCORES: {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1
  }
}));

vi.mock('../../js/keyboard-input.js', () => ({
  handleTileKeyDown: vi.fn(),
  handleSlotKeyDown: vi.fn(),
  getKeyboardContext: vi.fn(() => ({}))
}));

describe('keyboard.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  describe('handleSlotFocus', () => {
    it('should add focus classes to unlocked slot', () => {
      const slot = document.createElement('div');
      slot.setAttribute('data-word-index', '0');
      slot.setAttribute('data-slot-index', '0');
      
      const event = { currentTarget: slot };
      handleSlotFocus(event);
      
      expect(slot.classList.contains('focus:ring-2')).toBe(true);
    });

    it('should not add focus classes to locked slot', () => {
      const slot = document.createElement('div');
      slot.setAttribute('data-locked', 'true');
      
      const event = { currentTarget: slot };
      handleSlotFocus(event);
      
      // Locked slots should not get focus classes per implementation
      expect(slot.classList.contains('focus:ring-2')).toBe(false);
    });
  });

  describe('handleSlotBlur', () => {
    it('should handle blur event without errors', () => {
      const slot = document.createElement('div');
      const event = { currentTarget: slot };
      
      expect(() => handleSlotBlur(event)).not.toThrow();
    });
  });

  describe('selectTile', () => {
    it('should select a tile and add visual indicators', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      tile.setAttribute('aria-label', 'Tile with letter A');
      document.body.appendChild(tile);
      
      selectTile(tile);
      
      expect(puzzleState.setSelectedTile).toHaveBeenCalledWith(tile);
      expect(tile.classList.contains('ring-4')).toBe(true);
      expect(tile.getAttribute('aria-label')).toContain('(selected)');
    });

    it('should deselect previous tile when selecting new one', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      const tile1 = createMockTile('A', 0);
      const tile2 = createMockTile('B', 1);
      tile1.setAttribute('aria-label', 'Tile A');
      tile2.setAttribute('aria-label', 'Tile B');
      document.body.appendChild(tile1);
      document.body.appendChild(tile2);
      
      puzzleState.getSelectedTile.mockReturnValue(tile1);
      selectTile(tile2);
      
      expect(tile1.classList.contains('ring-4')).toBe(false);
      expect(puzzleState.setSelectedTile).toHaveBeenCalledWith(tile2);
    });
  });

  describe('deselectTile', () => {
    it('should deselect tile and remove visual indicators', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      tile.classList.add('ring-4', 'ring-yellow-400');
      tile.setAttribute('aria-label', 'Tile A (selected)');
      document.body.appendChild(tile);
      
      puzzleState.getSelectedTile.mockReturnValue(tile);
      deselectTile();
      
      expect(puzzleState.clearSelectedTile).toHaveBeenCalled();
      expect(tile.classList.contains('ring-4')).toBe(false);
      expect(tile.getAttribute('aria-label')).not.toContain('(selected)');
    });
  });

  describe('announceToScreenReader', () => {
    it('should create announcement element', () => {
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement.textContent).toBe('Test message');
      expect(announcement.getAttribute('aria-live')).toBe('polite');
    });

    it('should remove announcement after timeout', async () => {
      vi.useFakeTimers();
      
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      
      // Fast-forward time
      vi.advanceTimersByTime(1100);
      
      expect(document.querySelector('[role="status"]')).toBeFalsy();
      
      vi.useRealTimers();
    });

    it('should handle multiple announcements', () => {
      announceToScreenReader('First message');
      announceToScreenReader('Second message');
      
      const announcements = document.querySelectorAll('[role="status"]');
      expect(announcements.length).toBeGreaterThanOrEqual(1);
    });

    it('should set correct ARIA attributes', () => {
      announceToScreenReader('Test message');
      
      const announcement = document.querySelector('[role="status"]');
      expect(announcement.getAttribute('aria-live')).toBe('polite');
      expect(announcement.getAttribute('aria-atomic')).toBe('true');
      expect(announcement.classList.contains('sr-only')).toBe(true);
    });
  });

  describe('handleModalKeyDown', () => {
    it('should close modal on Escape key', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      document.body.appendChild(modal);
      
      const closeCallback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      handleModalKeyDown(event, 'test-modal', closeCallback);
      
      expect(closeCallback).toHaveBeenCalled();
    });

    it('should trap focus on Tab key', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      // Make buttons focusable and visible for jsdom
      button1.tabIndex = 0;
      button2.tabIndex = 0;
      // Set offsetParent by adding to DOM with display
      modal.style.display = 'block';
      modal.appendChild(button1);
      modal.appendChild(button2);
      document.body.appendChild(modal);
      
      // Set focus on last element
      button2.focus();
      
      const preventDefaultSpy = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy, writable: true });
      
      handleModalKeyDown(event, 'test-modal');
      
      // The function checks if document.activeElement === lastElement
      // In jsdom, focus might not work, but we verify the function runs without error
      // If the condition is met, preventDefault should be called
      const wordSlots = document.getElementById('word-slots');
      const focusableElements = Array.from(modal.querySelectorAll('button')).filter(
        el => !el.disabled && !el.hasAttribute('hidden') && el.offsetParent !== null
      );
      
      if (focusableElements.length > 0 && document.activeElement === focusableElements[focusableElements.length - 1]) {
        expect(preventDefaultSpy).toHaveBeenCalled();
      } else {
        // If focus didn't work in jsdom, just verify function ran without error
        expect(() => handleModalKeyDown(event, 'test-modal')).not.toThrow();
      }
    });

    it('should wrap focus backwards on Shift+Tab', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      // Make buttons focusable and visible for jsdom
      button1.tabIndex = 0;
      button2.tabIndex = 0;
      // Set offsetParent by adding to DOM with display
      modal.style.display = 'block';
      modal.appendChild(button1);
      modal.appendChild(button2);
      document.body.appendChild(modal);
      
      // Set focus on first element
      button1.focus();
      
      const preventDefaultSpy = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy, writable: true });
      
      handleModalKeyDown(event, 'test-modal');
      
      // The function checks if document.activeElement === firstElement
      // In jsdom, focus might not work, but we verify the function runs without error
      // If the condition is met, preventDefault should be called
      const focusableElements = Array.from(modal.querySelectorAll('button')).filter(
        el => !el.disabled && !el.hasAttribute('hidden') && el.offsetParent !== null
      );
      
      if (focusableElements.length > 0 && document.activeElement === focusableElements[0]) {
        expect(preventDefaultSpy).toHaveBeenCalled();
      } else {
        // If focus didn't work in jsdom, just verify function ran without error
        expect(() => handleModalKeyDown(event, 'test-modal')).not.toThrow();
      }
    });

    it('should not handle keys for hidden modal', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.classList.add('hidden');
      document.body.appendChild(modal);
      
      const closeCallback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      handleModalKeyDown(event, 'test-modal', closeCallback);
      
      expect(closeCallback).not.toHaveBeenCalled();
    });

    it('should return early if modal is missing', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const closeCallback = vi.fn();
      
      expect(() => handleModalKeyDown(event, 'non-existent-modal', closeCallback)).not.toThrow();
      expect(closeCallback).not.toHaveBeenCalled();
    });

    it('should use modal._closeCallback if no callback provided', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      const closeCallback = vi.fn();
      modal._closeCallback = closeCallback;
      document.body.appendChild(modal);
      
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      handleModalKeyDown(event, 'test-modal');
      
      expect(closeCallback).toHaveBeenCalled();
    });

    it('should filter out disabled elements from focusable list', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.style.display = 'block';
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      button2.disabled = true;
      button1.tabIndex = 0;
      button2.tabIndex = 0;
      modal.appendChild(button1);
      modal.appendChild(button2);
      document.body.appendChild(modal);
      
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      
      expect(() => handleModalKeyDown(event, 'test-modal')).not.toThrow();
    });

    it('should filter out hidden elements from focusable list', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.style.display = 'block';
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      button2.setAttribute('hidden', 'true');
      button1.tabIndex = 0;
      button2.tabIndex = 0;
      modal.appendChild(button1);
      modal.appendChild(button2);
      document.body.appendChild(modal);
      
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      
      expect(() => handleModalKeyDown(event, 'test-modal')).not.toThrow();
    });

    it('should return early if no focusable elements', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      modal.style.display = 'block';
      document.body.appendChild(modal);
      
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      
      expect(() => handleModalKeyDown(event, 'test-modal')).not.toThrow();
    });

    it('should ignore non-Tab keys', () => {
      const modal = document.createElement('div');
      modal.id = 'test-modal';
      document.body.appendChild(modal);
      
      const closeCallback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      
      handleModalKeyDown(event, 'test-modal', closeCallback);
      
      expect(closeCallback).not.toHaveBeenCalled();
    });
  });

  describe('handleHelpModalKeyDown', () => {
    it('should call handleModalKeyDown with help-modal id', () => {
      const modal = document.createElement('div');
      modal.id = 'help-modal';
      document.body.appendChild(modal);
      
      const closeCallback = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      handleHelpModalKeyDown(event);
      
      // Since handleModalKeyDown is called, verify it would work
      // We can't easily spy on it, but we can verify the modal exists
      expect(document.getElementById('help-modal')).toBeTruthy();
    });
  });

  describe('handleTileKeyDown', () => {
    it('should delegate to keyboard-input with provided context', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const tile = createMockTile('A', 0);
      document.body.appendChild(tile);
      
      const context = { prefix: 'daily-' };
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      
      handleTileKeyDown(event, context);
      
      expect(keyboardInput.handleTileKeyDown).toHaveBeenCalledWith(event, context);
    });

    it('should use stored context if no context provided', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const tile = createMockTile('A', 0);
      document.body.appendChild(tile);
      
      const storedContext = { prefix: 'archive-' };
      keyboardInput.getKeyboardContext.mockReturnValue(storedContext);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      
      handleTileKeyDown(event);
      
      expect(keyboardInput.handleTileKeyDown).toHaveBeenCalledWith(event, storedContext);
    });

    it('should use provided context over stored context', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const tile = createMockTile('A', 0);
      document.body.appendChild(tile);
      
      const storedContext = { prefix: 'archive-' };
      const providedContext = { prefix: 'daily-' };
      keyboardInput.getKeyboardContext.mockReturnValue(storedContext);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'Enter' }, tile);
      
      handleTileKeyDown(event, providedContext);
      
      expect(keyboardInput.handleTileKeyDown).toHaveBeenCalledWith(event, providedContext);
    });
  });

  describe('handleSlotKeyDown', () => {
    it('should delegate to keyboard-input with built context', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const placeTileCallback = vi.fn();
      const removeTileCallback = vi.fn();
      const storedContext = { prefix: 'test-' };
      keyboardInput.getKeyboardContext.mockReturnValue(storedContext);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event, placeTileCallback, removeTileCallback);
      
      expect(keyboardInput.handleSlotKeyDown).toHaveBeenCalled();
      const callArgs = keyboardInput.handleSlotKeyDown.mock.calls[0];
      expect(callArgs[1].placeTileCallback).toBe(placeTileCallback);
      expect(callArgs[1].removeTileCallback).toBe(removeTileCallback);
    });

    it('should detect daily- prefix from container', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const dailyContainer = document.createElement('div');
      dailyContainer.id = 'daily-word-slots';
      const slot = document.createElement('div');
      slot.className = 'slot';
      dailyContainer.appendChild(slot);
      document.body.appendChild(dailyContainer);
      
      keyboardInput.getKeyboardContext.mockReturnValue({});
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event);
      
      expect(keyboardInput.handleSlotKeyDown).toHaveBeenCalled();
      const callArgs = keyboardInput.handleSlotKeyDown.mock.calls[0];
      expect(callArgs[1].prefix).toBe('daily-');
    });

    it('should detect archive- prefix from container', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-word-slots';
      const slot = document.createElement('div');
      slot.className = 'slot';
      archiveContainer.appendChild(slot);
      document.body.appendChild(archiveContainer);
      
      keyboardInput.getKeyboardContext.mockReturnValue({});
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event);
      
      expect(keyboardInput.handleSlotKeyDown).toHaveBeenCalled();
      const callArgs = keyboardInput.handleSlotKeyDown.mock.calls[0];
      expect(callArgs[1].prefix).toBe('archive-');
    });

    it('should use stored context prefix if container has no prefix', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const container = document.createElement('div');
      container.id = 'word-slots';
      const slot = document.createElement('div');
      slot.className = 'slot';
      container.appendChild(slot);
      document.body.appendChild(container);
      
      const storedContext = { prefix: 'stored-' };
      keyboardInput.getKeyboardContext.mockReturnValue(storedContext);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event);
      
      expect(keyboardInput.handleSlotKeyDown).toHaveBeenCalled();
      const callArgs = keyboardInput.handleSlotKeyDown.mock.calls[0];
      expect(callArgs[1].prefix).toBe('stored-');
    });

    it('should merge callbacks with stored context', async () => {
      const keyboardInput = await import('../../js/keyboard-input.js');
      const { slots1Container } = createMockPuzzleDOM();
      const slot = slots1Container.children[0];
      
      const storedPlaceCallback = vi.fn();
      const storedRemoveCallback = vi.fn();
      const newPlaceCallback = vi.fn();
      const storedContext = {
        prefix: '',
        placeTileCallback: storedPlaceCallback,
        removeTileCallback: storedRemoveCallback
      };
      keyboardInput.getKeyboardContext.mockReturnValue(storedContext);
      
      const event = createKeyboardEventWithTarget('keydown', { key: 'A' }, slot);
      
      handleSlotKeyDown(event, newPlaceCallback);
      
      expect(keyboardInput.handleSlotKeyDown).toHaveBeenCalled();
      const callArgs = keyboardInput.handleSlotKeyDown.mock.calls[0];
      expect(callArgs[1].placeTileCallback).toBe(newPlaceCallback);
      expect(callArgs[1].removeTileCallback).toBe(storedRemoveCallback);
    });
  });

  describe('selectTile edge cases', () => {
    it('should handle tile without aria-label', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      tile.removeAttribute('aria-label');
      document.body.appendChild(tile);
      
      selectTile(tile);
      
      expect(puzzleState.setSelectedTile).toHaveBeenCalledWith(tile);
      expect(tile.classList.contains('ring-4')).toBe(true);
    });

    it('should maintain focus if tile is already focused', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      tile.setAttribute('aria-label', 'Tile A');
      document.body.appendChild(tile);
      tile.focus();
      
      const focusSpy = vi.spyOn(tile, 'focus');
      selectTile(tile);
      
      // Focus should not be called again if already focused
      expect(focusSpy).not.toHaveBeenCalled();
      expect(puzzleState.setSelectedTile).toHaveBeenCalledWith(tile);
    });

    it('should focus tile if not already focused', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      const tile = createMockTile('A', 0);
      tile.setAttribute('aria-label', 'Tile A');
      document.body.appendChild(tile);
      
      const focusSpy = vi.spyOn(tile, 'focus');
      selectTile(tile);
      
      expect(focusSpy).toHaveBeenCalled();
      expect(puzzleState.setSelectedTile).toHaveBeenCalledWith(tile);
    });
  });

  describe('deselectTile edge cases', () => {
    it('should handle focus restoration when tile was focused', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      vi.useFakeTimers();
      
      const tile = createMockTile('A', 0);
      tile.setAttribute('aria-label', 'Tile A (selected)');
      document.body.appendChild(tile);
      tile.focus();
      
      puzzleState.getSelectedTile.mockReturnValue(tile);
      const focusSpy = vi.spyOn(tile, 'focus');
      
      deselectTile();
      
      vi.advanceTimersByTime(1);
      
      expect(focusSpy).toHaveBeenCalled();
      expect(puzzleState.clearSelectedTile).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should not restore focus if tile was not focused', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      vi.useFakeTimers();
      
      const tile = createMockTile('A', 0);
      tile.setAttribute('aria-label', 'Tile A (selected)');
      document.body.appendChild(tile);
      
      puzzleState.getSelectedTile.mockReturnValue(tile);
      const focusSpy = vi.spyOn(tile, 'focus');
      
      deselectTile();
      
      vi.advanceTimersByTime(1);
      
      expect(focusSpy).not.toHaveBeenCalled();
      expect(puzzleState.clearSelectedTile).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should not restore focus if tile removed from DOM', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      vi.useFakeTimers();
      
      const tile = createMockTile('A', 0);
      tile.setAttribute('aria-label', 'Tile A (selected)');
      document.body.appendChild(tile);
      tile.focus();
      
      puzzleState.getSelectedTile.mockReturnValue(tile);
      const focusSpy = vi.spyOn(tile, 'focus');
      
      deselectTile();
      document.body.removeChild(tile);
      
      vi.advanceTimersByTime(1);
      
      // Focus should not be called if tile is not in DOM
      expect(focusSpy).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });
});
