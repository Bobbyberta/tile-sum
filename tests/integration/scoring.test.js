import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';
import { updateScoreDisplay, checkSolution } from '../../js/scoring.js';
import { placeTileInSlot } from '../../js/tile-operations.js';

// Mock puzzle-data-encoded.js
vi.mock('../../puzzle-data-encoded.js', () => ({
  calculateWordScore: (word) => {
    const scores = {
      'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
      'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
      'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
      'Y': 4, 'Z': 10
    };
    return word.toUpperCase().split('').reduce((sum, letter) => sum + (scores[letter] || 0), 0);
  },
  validateSolution: (day, word1, word2) => {
    const solutions = {
      1: { solution: ['SNOW', 'FLAKE'] }
    };
    const solution = solutions[day]?.solution || [];
    // Words must be in the correct order - word1 must match solution[0] and word2 must match solution[1]
    return word1 === solution[0] && word2 === solution[1];
  }
}));

// Mock dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  getDraggedTile: vi.fn(() => null),
  setDraggedTile: vi.fn(),
  clearDraggedTile: vi.fn()
}));

vi.mock('../../js/auto-complete.js', () => ({
  checkAutoComplete: vi.fn(),
  areAllSlotsFilled: vi.fn(() => false)
}));

describe('Scoring Integration', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  it('should update scores as tiles are placed', () => {
    const { tilesContainer, slots1Container, score1Display } = createMockPuzzleDOM();
    
    // Place tiles one by one and verify score updates
    const letters = ['S', 'N', 'O', 'W'];
    letters.forEach((letter, index) => {
      const tile = createMockTile(letter, index);
      const slot = slots1Container.children[index];
      slot.appendChild(tile);
      
      updateScoreDisplay();
      
      // Score should increase as more letters are added
      const currentScore = parseInt(score1Display.textContent.split(' ')[0]);
      expect(currentScore).toBeGreaterThanOrEqual(0);
    });
    
    // Final score should be 7 (S=1, N=1, O=1, W=4)
    expect(score1Display.textContent).toBe('7 / 10 points');
  });

  it('should update scores when tiles are removed', () => {
    const { slots1Container, score1Display } = createMockPuzzleDOM();
    
    // Place all tiles
    ['S', 'N', 'O', 'W'].forEach((letter, index) => {
      const tile = createMockTile(letter, index);
      slots1Container.children[index].appendChild(tile);
    });
    
    updateScoreDisplay();
    expect(score1Display.textContent).toBe('7 / 10 points');
    
    // Remove one tile
    slots1Container.children[0].innerHTML = '';
    updateScoreDisplay();
    
    // Score should decrease
    const newScore = parseInt(score1Display.textContent.split(' ')[0]);
    expect(newScore).toBeLessThan(7);
  });

  it('should validate complete solution correctly', () => {
    const { slots1Container, slots2Container } = createMockPuzzleDOM();
    const showSuccessModal = vi.fn();
    const showErrorModal = vi.fn();
    
    // Place correct solution: SNOW and FLAKE
    ['S', 'N', 'O', 'W'].forEach((letter, index) => {
      const tile = createMockTile(letter, index);
      slots1Container.children[index].appendChild(tile);
    });
    
    ['F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
      const tile = createMockTile(letter, index);
      slots2Container.children[index].appendChild(tile);
    });
    
    checkSolution(1, showErrorModal, showSuccessModal);
    
    expect(showSuccessModal).toHaveBeenCalled();
    expect(showErrorModal).not.toHaveBeenCalled();
  });

  it('should show error for incomplete solution', () => {
    const { slots1Container, slots2Container } = createMockPuzzleDOM();
    const showErrorModal = vi.fn();
    const showSuccessModal = vi.fn();
    
    // Place only partial solution
    ['S', 'N'].forEach((letter, index) => {
      const tile = createMockTile(letter, index);
      slots1Container.children[index].appendChild(tile);
    });
    
    checkSolution(1, showErrorModal, showSuccessModal);
    
    expect(showErrorModal).toHaveBeenCalled();
    expect(showSuccessModal).not.toHaveBeenCalled();
  });
});
