import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';
import { placeTileInSlot, removeTileFromSlot, returnTileToContainer } from '../../js/tile-operations.js';
import { updateScoreDisplay } from '../../js/scoring.js';
import { handleDragStart, handleDrop } from '../../js/mouse-drag.js';

// Mock puzzle-data-encoded.js
vi.mock('../../puzzle-data-encoded.js', () => ({
  SCRABBLE_SCORES: {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10
  },
  calculateWordScore: (word) => {
    const scores = {
      'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
      'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
      'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
      'Y': 4, 'Z': 10
    };
    return word.toUpperCase().split('').reduce((sum, letter) => sum + (scores[letter] || 0), 0);
  }
}));

// Mock other dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  getDraggedTile: vi.fn(() => null),
  setDraggedTile: vi.fn(),
  clearDraggedTile: vi.fn(),
  getSelectedTile: vi.fn(() => null),
  setSelectedTile: vi.fn(),
  clearSelectedTile: vi.fn()
}));

vi.mock('../../js/auto-complete.js', () => ({
  checkAutoComplete: vi.fn(),
  areAllSlotsFilled: vi.fn(() => false)
}));

vi.mock('../../js/utils.js', () => ({
  debugLog: vi.fn()
}));

describe('Drag & Drop Integration', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  it('should complete drag-drop cycle: start drag, drop tile, update score', async () => {
    const { tilesContainer, slots1Container, score1Display } = createMockPuzzleDOM();
    
    // Create tile in container
    const tile = createMockTile('S', 0);
    tilesContainer.appendChild(tile);
    
    // Start drag
    const dragStartEvent = {
      preventDefault: vi.fn(),
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn()
      }
    };
    handleDragStart.call(tile, dragStartEvent);
    
    // Drop on slot
    const slot = slots1Container.children[0];
    const placeTileCallback = (tile, slot) => placeTileInSlot(tile, slot, {
      handlers: {},
      prefix: '',
      isArchive: false,
      removeTileCallback: vi.fn()
    });
    
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      currentTarget: slot
    };
    
    // Mock getDraggedTile to return our tile
    const puzzleState = await import('../../js/puzzle-state.js');
    puzzleState.getDraggedTile.mockReturnValue(tile);
    
    handleDrop(dropEvent, placeTileCallback);
    
    // Verify tile was placed
    expect(slot.querySelector('.tile')).toBeTruthy();
    expect(slot.querySelector('.tile').getAttribute('data-letter')).toBe('S');
    
    // Update score and verify
    updateScoreDisplay();
    expect(score1Display.textContent).toContain('1');
  });

  it('should handle tile removal and return to container', () => {
    const { tilesContainer, slots1Container } = createMockPuzzleDOM();
    
    // Place tile in slot
    const tile = createMockTile('N', 0);
    const slot = slots1Container.children[0];
    slot.appendChild(tile);
    slot.classList.add('filled');
    
    // Remove tile
    const removeTileCallback = (slot) => removeTileFromSlot(slot, {
      handlers: {},
      prefix: '',
      isArchive: false
    });
    
    removeTileCallback(slot);
    
    // Verify tile was removed from slot
    expect(slot.querySelector('.tile')).toBeFalsy();
    expect(slot.classList.contains('filled')).toBe(false);
  });

  it('should handle tile swapping between slots', () => {
    const { slots1Container } = createMockPuzzleDOM();
    
    // Place tiles in two slots
    const tile1 = createMockTile('S', 0);
    const tile2 = createMockTile('N', 1);
    const slot1 = slots1Container.children[0];
    const slot2 = slots1Container.children[1];
    
    slot1.appendChild(tile1);
    slot2.appendChild(tile2);
    
    // Swap: place tile1 in slot2 (should swap with tile2)
    const placeTileCallback = (tile, slot) => placeTileInSlot(tile, slot, {
      handlers: {},
      prefix: '',
      isArchive: false,
      removeTileCallback: vi.fn()
    });
    
    placeTileCallback(tile1, slot2);
    
    // Verify swap occurred - tile1 should be in slot2, tile2 should be in slot1
    expect(slot2.querySelector('.tile')).toBeTruthy();
    expect(slot2.querySelector('.tile').getAttribute('data-letter')).toBe('S');
    // When swapping, the existing tile (tile2) should be moved to slot1
    expect(slot1.querySelector('.tile')).toBeTruthy();
    expect(slot1.querySelector('.tile').getAttribute('data-letter')).toBe('N');
  });
});
