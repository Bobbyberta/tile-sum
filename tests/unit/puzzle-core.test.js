import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTile, createSlot, updatePlaceholderTile } from '../../js/puzzle-core.js';
import { createMockPuzzleDOM, cleanupDOM } from '../helpers/dom-setup.js';

// Mock puzzle-data-encoded.js
vi.mock('../../puzzle-data-encoded.js', () => ({
  SCRABBLE_SCORES: {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10
  }
}));

// Mock keyboard.js
vi.mock('../../js/keyboard.js', () => ({
  handleTileKeyDown: vi.fn()
}));

describe('puzzle-core.js', () => {
  beforeEach(() => {
    cleanupDOM();
  });

  describe('createTile', () => {
    it('should create a tile element with correct attributes', () => {
      const tile = createTile('A', 0);
      
      expect(tile.tagName).toBe('DIV');
      expect(tile.getAttribute('data-letter')).toBe('A');
      expect(tile.getAttribute('data-tile-index')).toBe('0');
      expect(tile.getAttribute('draggable')).toBe('true');
      expect(tile.getAttribute('role')).toBe('button');
      expect(tile.getAttribute('tabindex')).toBe('0');
      expect(tile.classList.contains('tile')).toBe(true);
    });

    it('should create locked tile with correct attributes', () => {
      const tile = createTile('B', 1, true);
      
      expect(tile.getAttribute('draggable')).toBe('false');
      expect(tile.getAttribute('data-locked')).toBe('true');
      expect(tile.getAttribute('aria-label')).toContain('locked');
    });

    it('should include letter and score display', () => {
      const tile = createTile('C', 0);
      const letterDisplay = tile.querySelector('.text-2xl');
      const scoreDisplay = tile.querySelector('.text-xs');
      
      expect(letterDisplay).toBeTruthy();
      expect(letterDisplay.textContent).toBe('C');
      expect(scoreDisplay).toBeTruthy();
      expect(scoreDisplay.textContent).toBe('3');
    });

    it('should attach event handlers when provided', () => {
      const onDragStart = vi.fn();
      const onClick = vi.fn();
      const handlers = { onDragStart, onClick };
      
      const tile = createTile('D', 0, false, handlers);
      
      const dragEvent = new Event('dragstart');
      tile.dispatchEvent(dragEvent);
      expect(onDragStart).toHaveBeenCalled();
      
      const clickEvent = new Event('click');
      tile.dispatchEvent(clickEvent);
      expect(onClick).toHaveBeenCalled();
    });

    it('should not attach handlers for locked tiles', () => {
      const onDragStart = vi.fn();
      const handlers = { onDragStart };
      
      const tile = createTile('E', 0, true, handlers);
      
      const dragEvent = new Event('dragstart');
      tile.dispatchEvent(dragEvent);
      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('should attach keyboard handler when none provided', () => {
      const tile = createTile('F', 0);
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      // Should not throw - handler should be attached
      expect(() => tile.dispatchEvent(keyEvent)).not.toThrow();
    });
  });

  describe('createSlot', () => {
    it('should create a slot element with correct attributes', () => {
      const slot = createSlot(0, 0);
      
      expect(slot.tagName).toBe('DIV');
      expect(slot.getAttribute('data-word-index')).toBe('0');
      expect(slot.getAttribute('data-slot-index')).toBe('0');
      expect(slot.getAttribute('droppable')).toBe('true');
      expect(slot.getAttribute('role')).toBe('button');
      expect(slot.getAttribute('tabindex')).toBe('0');
      expect(slot.classList.contains('slot')).toBe(true);
    });

    it('should create locked slot with correct attributes', () => {
      const slot = createSlot(1, 2, true);
      
      expect(slot.getAttribute('data-locked')).toBe('true');
      expect(slot.getAttribute('tabindex')).toBeNull();
      expect(slot.getAttribute('aria-label')).toContain('locked');
    });

    it('should attach event handlers when provided', () => {
      const onDragOver = vi.fn();
      const onDrop = vi.fn();
      const onClick = vi.fn();
      const handlers = { onDragOver, onDrop, onClick };
      
      const slot = createSlot(0, 0, false, handlers);
      
      const dragOverEvent = new Event('dragover');
      slot.dispatchEvent(dragOverEvent);
      expect(onDragOver).toHaveBeenCalled();
      
      const dropEvent = new Event('drop');
      slot.dispatchEvent(dropEvent);
      expect(onDrop).toHaveBeenCalled();
      
      const clickEvent = new Event('click');
      slot.dispatchEvent(clickEvent);
      expect(onClick).toHaveBeenCalled();
    });

    it('should not attach handlers for locked slots', () => {
      const onDragOver = vi.fn();
      const handlers = { onDragOver };
      
      const slot = createSlot(0, 0, true, handlers);
      
      const dragOverEvent = new Event('dragover');
      slot.dispatchEvent(dragOverEvent);
      expect(onDragOver).not.toHaveBeenCalled();
    });
  });

  describe('updatePlaceholderTile', () => {
    it('should create placeholder when container is empty', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      tilesContainer.innerHTML = '';
      
      updatePlaceholderTile('tiles-container');
      
      const placeholder = tilesContainer.querySelector('[data-placeholder]');
      expect(placeholder).toBeTruthy();
      expect(placeholder.getAttribute('aria-hidden')).toBe('true');
    });

    it('should remove placeholder when tiles exist', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      
      // Start with empty container - create placeholder
      tilesContainer.innerHTML = '';
      updatePlaceholderTile('tiles-container');
      expect(tilesContainer.querySelector('[data-placeholder]')).toBeTruthy();
      
      // Then add a tile and update again - placeholder should be removed
      const tile = document.createElement('div');
      tile.className = 'tile';
      tilesContainer.appendChild(tile);
      updatePlaceholderTile('tiles-container');
      expect(tilesContainer.querySelector('[data-placeholder]')).toBeFalsy();
    });

    it('should handle missing container gracefully', () => {
      expect(() => updatePlaceholderTile('non-existent-container')).not.toThrow();
    });

    it('should work with custom container ID', () => {
      const container = document.createElement('div');
      container.id = 'custom-tiles-container';
      document.body.appendChild(container);
      
      updatePlaceholderTile('custom-tiles-container');
      
      const placeholder = container.querySelector('[data-placeholder]');
      expect(placeholder).toBeTruthy();
      
      document.body.removeChild(container);
    });
  });
});
