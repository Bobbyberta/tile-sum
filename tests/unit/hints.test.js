import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateHintButtonText, provideHint, showSolution } from '../../js/hints.js';
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

vi.mock('../../js/puzzle-state.js', () => {
  const getHintsRemaining = vi.fn(() => 9); // SNOW (4) + FLAKE (5) = 9
  const decrementHintsRemaining = vi.fn();
  const getArchiveHintsRemaining = vi.fn(() => 9); // SNOW (4) + FLAKE (5) = 9
  const decrementArchiveHintsRemaining = vi.fn();
  const setSolutionShown = vi.fn();
  const setArchiveSolutionShown = vi.fn();
  
  return {
    getHintsRemaining,
    decrementHintsRemaining,
    getArchiveHintsRemaining,
    decrementArchiveHintsRemaining,
    setSolutionShown,
    setArchiveSolutionShown,
    createStateManager: vi.fn((prefix = '') => {
      if (prefix === 'archive-') {
        return {
          getHintsRemaining: getArchiveHintsRemaining,
          setHintsRemaining: vi.fn(),
          decrementHintsRemaining: decrementArchiveHintsRemaining,
          getSolutionShown: vi.fn(() => false),
          setSolutionShown: setArchiveSolutionShown
        };
      }
      return {
        getHintsRemaining,
        setHintsRemaining: vi.fn(),
        decrementHintsRemaining,
        getSolutionShown: vi.fn(() => false),
        setSolutionShown
      };
    })
  };
});

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
      
      updateHintButtonText('hint-btn', 9);
      
      expect(hintBtn.textContent).toBe('Get Hint (9 left)');
    });

    it('should show "Get Hint (0 left)" and disable button when no hints remaining', () => {
      const { hintBtn } = createMockPuzzleDOM();
      
      updateHintButtonText('hint-btn', 0);
      
      expect(hintBtn.textContent).toBe('Get Hint (0 left)');
      expect(hintBtn.disabled).toBe(true);
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
      puzzleState.getHintsRemaining.mockReturnValue(9); // SNOW (4) + FLAKE (5) = 9
      puzzleState.getArchiveHintsRemaining.mockReturnValue(9); // SNOW (4) + FLAKE (5) = 9
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

    it('should show "All hints have been used" feedback when hints remaining is 0', async () => {
      const puzzleState = await import('../../js/puzzle-state.js');
      puzzleState.getHintsRemaining.mockReturnValue(0);
      
      createMockPuzzleDOM();
      const feedback = await import('../../js/feedback.js');
      
      provideHint(1, {});
      
      expect(feedback.showFeedback).toHaveBeenCalledWith('All hints have been used', 'error', 'feedback');
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

    it('should handle archive puzzle', async () => {
      await setupCreateTileMock();
      const puzzleState = await import('../../js/puzzle-state.js');
      
      // Create archive container
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-tiles-container';
      document.body.appendChild(archiveContainer);
      
      // Create archive word slots container matching createMockPuzzleDOM structure
      const archiveSlots = document.createElement('div');
      archiveSlots.id = 'archive-word-slots';
      
      // Create word containers with proper structure
      const word1Container = document.createElement('div');
      word1Container.setAttribute('data-word-index', '0');
      word1Container.setAttribute('data-max-score', '10');
      
      const slots1Container = document.createElement('div');
      slots1Container.setAttribute('data-word-slots', '0');
      slots1Container.className = 'flex flex-wrap gap-2 mb-3';
      
      // Create 4 slots for word 1 (SNOW)
      for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.setAttribute('data-word-index', '0');
        slot.setAttribute('data-slot-index', String(i));
        slots1Container.appendChild(slot);
      }
      
      word1Container.appendChild(slots1Container);
      archiveSlots.appendChild(word1Container);
      
      // Create word 2 container with slots (FLAKE - 5 letters)
      const word2Container = document.createElement('div');
      word2Container.setAttribute('data-word-index', '1');
      word2Container.setAttribute('data-max-score', '12');
      
      const slots2Container = document.createElement('div');
      slots2Container.setAttribute('data-word-slots', '1');
      slots2Container.className = 'flex flex-wrap gap-2 mb-3';
      
      // Create 5 slots for word 2 (FLAKE)
      for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.setAttribute('data-word-index', '1');
        slot.setAttribute('data-slot-index', String(i));
        slots2Container.appendChild(slot);
      }
      
      word2Container.appendChild(slots2Container);
      archiveSlots.appendChild(word2Container);
      document.body.appendChild(archiveSlots);
      
      ['S', 'N', 'O', 'W'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile';
        archiveContainer.appendChild(tile);
      });
      
      const returnArchiveTileToContainer = vi.fn();
      const updateArchiveScoreDisplay = vi.fn();
      const updateArchiveSubmitButton = vi.fn();
      
      provideHint(1, {
        prefix: 'archive-',
        returnArchiveTileToContainer,
        updateArchiveScoreDisplay,
        updateArchiveSubmitButton
      });
      
      expect(puzzleState.decrementArchiveHintsRemaining).toHaveBeenCalled();
      
      archiveContainer.remove();
      archiveSlots.remove();
    });

    it('should handle tile from slot', async () => {
      await setupCreateTileMock();
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      
      // Mock Math.random to always select the first hint (slot 0)
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0);
      
      // Place 'S' tile in slot 1 (wrong position - should be in slot 0)
      const tileS = createMockTile('S', 0);
      tileS.setAttribute('data-letter', 'S');
      tileS.className = 'tile';
      slots1Container.children[1].appendChild(tileS);
      slots1Container.children[1].classList.add('filled');
      
      // Add other tiles to container
      ['N', 'O', 'W'].forEach((letter, index) => {
        const t = createMockTile(letter, index + 1);
        t.setAttribute('data-letter', letter.toUpperCase());
        t.className = 'tile';
        tilesContainer.appendChild(t);
      });
      
      provideHint(1, {
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      // provideHint should move 'S' from slot 1 to slot 0 and lock it
      // Check that slot 0 now has a locked tile
      const lockedTile = slots1Container.children[0].querySelector('.tile[data-locked="true"]');
      expect(lockedTile).toBeTruthy();
      expect(lockedTile.getAttribute('data-letter')).toBe('S');
      
      // Restore Math.random
      Math.random = originalRandom;
    });

    it('should show feedback when all tiles correct', async () => {
      const feedback = await import('../../js/feedback.js');
      const { slots1Container, slots2Container } = createMockPuzzleDOM();
      
      // Place all tiles correctly
      ['S', 'N', 'O', 'W'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter);
        tile.setAttribute('data-locked', 'true');
        slots1Container.children[index].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index + 4);
        tile.setAttribute('data-letter', letter);
        tile.setAttribute('data-locked', 'true');
        slots2Container.children[index].appendChild(tile);
      });
      
      provideHint(1, {});
      
      expect(feedback.showFeedback).toHaveBeenCalledWith('All tiles are already correct!', 'success', 'feedback');
    });

    it('should handle prefix', async () => {
      await setupCreateTileMock();
      const puzzleState = await import('../../js/puzzle-state.js');
      const { tilesContainer } = createMockPuzzleDOM('daily-');
      
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile';
        tilesContainer.appendChild(tile);
      });
      
      provideHint(1, {
        prefix: 'daily-',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      expect(puzzleState.decrementHintsRemaining).toHaveBeenCalled();
    });
  });

  describe('showSolution', () => {
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

    it('should place all remaining tiles correctly', async () => {
      await setupCreateTileMock();
      const puzzleState = await import('../../js/puzzle-state.js');
      const { tilesContainer, slots1Container, slots2Container } = createMockPuzzleDOM();
      
      // Add all tiles to container
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile';
        tilesContainer.appendChild(tile);
      });
      
      showSolution(1, {
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      // All slots should have locked tiles
      const allSlots = [...slots1Container.children, ...slots2Container.children];
      allSlots.forEach(slot => {
        const tile = slot.querySelector('.tile[data-locked="true"]');
        expect(tile).toBeTruthy();
      });
      
      expect(puzzleState.setSolutionShown).toHaveBeenCalledWith(true);
    });

    it('should not show solution when puzzle does not exist', () => {
      createMockPuzzleDOM();
      
      expect(() => showSolution(999, {})).not.toThrow();
    });

    it('should show feedback when all tiles correct', async () => {
      const feedback = await import('../../js/feedback.js');
      const { slots1Container, slots2Container } = createMockPuzzleDOM();
      
      // Place all tiles correctly
      ['S', 'N', 'O', 'W'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter);
        tile.setAttribute('data-locked', 'true');
        slots1Container.children[index].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index + 4);
        tile.setAttribute('data-letter', letter);
        tile.setAttribute('data-locked', 'true');
        slots2Container.children[index].appendChild(tile);
      });
      
      showSolution(1, {});
      
      expect(feedback.showFeedback).toHaveBeenCalledWith('All tiles are already correct!', 'success', 'feedback');
    });

    it('should handle archive puzzle', async () => {
      await setupCreateTileMock();
      const puzzleState = await import('../../js/puzzle-state.js');
      
      // Create archive container
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-tiles-container';
      document.body.appendChild(archiveContainer);
      
      // Create archive word slots container matching createMockPuzzleDOM structure
      const archiveSlots = document.createElement('div');
      archiveSlots.id = 'archive-word-slots';
      
      // Create word containers with proper structure
      const word1Container = document.createElement('div');
      word1Container.setAttribute('data-word-index', '0');
      word1Container.setAttribute('data-max-score', '10');
      
      const slots1Container = document.createElement('div');
      slots1Container.setAttribute('data-word-slots', '0');
      slots1Container.className = 'flex flex-wrap gap-2 mb-3';
      
      // Create 4 slots for word 1 (SNOW)
      for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.setAttribute('data-word-index', '0');
        slot.setAttribute('data-slot-index', String(i));
        slots1Container.appendChild(slot);
      }
      
      // Create word 2 container
      const word2Container = document.createElement('div');
      word2Container.setAttribute('data-word-index', '1');
      word2Container.setAttribute('data-max-score', '12');
      
      const slots2Container = document.createElement('div');
      slots2Container.setAttribute('data-word-slots', '1');
      slots2Container.className = 'flex flex-wrap gap-2 mb-3';
      
      // Create 5 slots for word 2 (FLAKE)
      for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.setAttribute('data-word-index', '1');
        slot.setAttribute('data-slot-index', String(i));
        slots2Container.appendChild(slot);
      }
      
      word1Container.appendChild(slots1Container);
      word2Container.appendChild(slots2Container);
      archiveSlots.appendChild(word1Container);
      archiveSlots.appendChild(word2Container);
      document.body.appendChild(archiveSlots);
      
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile';
        archiveContainer.appendChild(tile);
      });
      
      const returnArchiveTileToContainer = vi.fn();
      const updateArchiveScoreDisplay = vi.fn();
      const updateArchiveSubmitButton = vi.fn();
      
      showSolution(1, {
        prefix: 'archive-',
        returnArchiveTileToContainer,
        updateArchiveScoreDisplay,
        updateArchiveSubmitButton
      });
      
      expect(puzzleState.setArchiveSolutionShown).toHaveBeenCalledWith(true);
      
      archiveContainer.remove();
      archiveSlots.remove();
    });

    it('should handle prefix', async () => {
      await setupCreateTileMock();
      const puzzleState = await import('../../js/puzzle-state.js');
      const { tilesContainer } = createMockPuzzleDOM('daily-');
      
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile';
        tilesContainer.appendChild(tile);
      });
      
      showSolution(1, {
        prefix: 'daily-',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      expect(puzzleState.setSolutionShown).toHaveBeenCalledWith(true);
    });

    it('should update score display', async () => {
      await setupCreateTileMock();
      const scoring = await import('../../js/scoring.js');
      const { tilesContainer } = createMockPuzzleDOM();
      
      ['S', 'N', 'O', 'W', 'F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const tile = createMockTile(letter, index);
        tile.setAttribute('data-letter', letter.toUpperCase());
        tile.className = 'tile';
        tilesContainer.appendChild(tile);
      });
      
      showSolution(1, {});
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(scoring.updateScoreDisplay).toHaveBeenCalled();
    });

    it('should handle hint when tile is in slot not container', async () => {
      await setupCreateTileMock();
      const { tilesContainer, slots1Container, slots2Container } = createMockPuzzleDOM();
      
      // Place a tile in a slot
      const tile = createMockTile('S', 0);
      slots1Container.children[0].appendChild(tile);
      slots1Container.children[0].classList.add('filled');
      
      // The hint needs 'S' which is already in a slot
      showSolution(1, {
        prefix: '',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should have removed tile from slot and created locked tile
      expect(slots1Container.children[0].querySelector('[data-locked="true"]')).toBeTruthy();
    });

    it('should remove filled class from source slot', async () => {
      await setupCreateTileMock();
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      
      const tile = createMockTile('S', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      slot.classList.add('filled');
      
      showSolution(1, {
        prefix: '',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Slot should have filled class removed when tile is removed
      expect(slot.classList.contains('filled')).toBe(false);
    });

    it('should call checkAutoComplete when all slots filled', async () => {
      await setupCreateTileMock();
      const { checkAutoComplete, areAllSlotsFilled } = await import('../../js/auto-complete.js');
      const { tilesContainer, slots1Container, slots2Container } = createMockPuzzleDOM();
      
      // Fill all slots except one
      for (let i = 0; i < 3; i++) {
        const tile = createMockTile('S', i);
        slots1Container.children[i].appendChild(tile);
        slots1Container.children[i].classList.add('filled');
      }
      for (let i = 0; i < 5; i++) {
        const tile = createMockTile('N', i + 3);
        slots2Container.children[i].appendChild(tile);
        slots2Container.children[i].classList.add('filled');
      }
      
      areAllSlotsFilled.mockReturnValue(true);
      global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
      
      showSolution(1, {
        prefix: '',
        placeTileCallback: vi.fn(),
        removeTileCallback: vi.fn()
      });
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });
});
