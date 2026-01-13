import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateHintButtonText, provideHint } from '../../js/hints.js';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../puzzle-data-encoded.js', () => ({
  PUZZLE_DATA: {
    1: {
      words: ['SNOW', 'FLAKE'],
      solution: ['SNOW', 'FLAKE']
    }
  }
}));

vi.mock('../../js/puzzle-state.js', () => ({
  getHintsRemaining: vi.fn(() => 3),
  decrementHintsRemaining: vi.fn(),
  getArchiveHintsRemaining: vi.fn(() => 3),
  decrementArchiveHintsRemaining: vi.fn(),
  setSolutionShown: vi.fn(),
  setArchiveSolutionShown: vi.fn()
}));

vi.mock('../../js/puzzle-core.js', () => ({
  createTile: vi.fn((letter, index, isLocked) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.setAttribute('data-letter', letter);
    tile.setAttribute('data-tile-index', String(index));
    if (isLocked) {
      tile.setAttribute('data-locked', 'true');
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

vi.mock('../../js/feedback.js', () => ({
  showFeedback: vi.fn()
}));

vi.mock('../../js/drag-drop.js', () => ({
  returnTileToContainer: vi.fn()
}));

describe('hints.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  describe('updateHintButtonText', () => {
    it('should update button text with hints remaining', () => {
      const { hintBtn } = createMockPuzzleDOM();
      
      updateHintButtonText('hint-btn', 3);
      
      expect(hintBtn.textContent).toBe('Get Hint (3 left)');
    });

    it('should show "Show Solution?" when no hints remaining', () => {
      const { hintBtn } = createMockPuzzleDOM();
      
      updateHintButtonText('hint-btn', 0);
      
      expect(hintBtn.textContent).toBe('Show Solution?');
      expect(hintBtn.disabled).toBe(false);
    });

    it('should handle missing button gracefully', () => {
      expect(() => updateHintButtonText('non-existent-btn', 3)).not.toThrow();
    });

    it('should work with prefix', () => {
      const { hintBtn } = createMockPuzzleDOM('daily-');
      
      updateHintButtonText('daily-hint-btn', 2);
      
      expect(hintBtn.textContent).toBe('Get Hint (2 left)');
    });
  });

  describe('provideHint', () => {
    // Reset mock return values after vi.clearAllMocks() in parent beforeEach
    beforeEach(async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      // Reset mock return values to ensure they work after clearAllMocks
      puzzleState.getHintsRemaining.mockReturnValue(3);
      puzzleState.getArchiveHintsRemaining.mockReturnValue(3);
    });

    // Setup createTile mock implementation that will be used by all tests
    const setupCreateTileMock = async () => {
      const puzzleCore = await import('../../js/puzzle-core.js');
      puzzleCore.createTile.mockImplementation((letter, index, isLocked) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.setAttribute('data-letter', letter);
        tile.setAttribute('data-tile-index', String(index));
        if (isLocked) {
          tile.setAttribute('data-locked', 'true');
        }
        return tile;
      });
    };

    it('should not provide hint when hints remaining is 0', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      puzzleState.getHintsRemaining.mockReturnValue(0);
      
      createMockPuzzleDOM();
      const feedback = await import('../../js/feedback.js');
      
      provideHint(1, {});
      
      expect(feedback.showFeedback).not.toHaveBeenCalled();
    });

    it('should not provide hint when puzzle does not exist', () => {
      createMockPuzzleDOM();
      
      expect(() => provideHint(999, {})).not.toThrow();
    });

    it('should place a tile in correct position when hint is provided', async () => {
      await setupCreateTileMock();
      const { tilesContainer, wordSlots } = createMockPuzzleDOM();
      
      // Add tiles to container - ensure they have correct data-letter attributes and class
      // provideHint looks for tiles with .tile:not([data-locked="true"])
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        // Ensure tile has correct attributes for provideHint to find it
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile'; // Must have .tile class
        tilesContainer.appendChild(tile);
      });
      
      // Verify tiles are in container before calling provideHint
      const tilesBefore = tilesContainer.querySelectorAll('.tile:not([data-locked="true"])');
      expect(tilesBefore.length).toBeGreaterThan(0);
      
      provideHint(1, {
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      // Should have placed one tile in a slot (check all slots in word-slots)
      const allSlots = wordSlots ? wordSlots.querySelectorAll('.slot') : [];
      const filledSlots = Array.from(allSlots).filter(
        slot => slot.querySelector('.tile[data-locked="true"]')
      );
      expect(filledSlots.length).toBeGreaterThan(0);
    });

    it('should decrement hints remaining', async () => {
      await setupCreateTileMock();
      const puzzleState = await import('../../js/puzzle-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      
      // Add tiles to container with proper attributes
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile'; // Ensure class is set for querySelector
        tilesContainer.appendChild(tile);
      });
      
      // Verify tiles are findable
      const tilesBefore = tilesContainer.querySelectorAll('.tile:not([data-locked="true"])');
      expect(tilesBefore.length).toBeGreaterThan(0);
      
      provideHint(1, {
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      // provideHint only decrements if it successfully places a tile
      // Verify it was called (will only be called if tile was found and placed)
      expect(puzzleState.decrementHintsRemaining).toHaveBeenCalled();
    });

    it('should update score display after providing hint', async () => {
      await setupCreateTileMock();
      const scoring = await import('../../js/scoring.js');
      const { tilesContainer } = createMockPuzzleDOM();
      
      // Add tiles to container with proper attributes
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile'; // Ensure class is set for querySelector
        tilesContainer.appendChild(tile);
      });
      
      // Verify tiles are findable
      const tilesBefore = tilesContainer.querySelectorAll('.tile:not([data-locked="true"])');
      expect(tilesBefore.length).toBeGreaterThan(0);
      
      provideHint(1, {
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      // Wait for requestAnimationFrame callback to execute
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // provideHint only updates score if it successfully places a tile
      // Verify it was called (will only be called if tile was found and placed)
      expect(scoring.updateScoreDisplay).toHaveBeenCalled();
    });
  });
});
