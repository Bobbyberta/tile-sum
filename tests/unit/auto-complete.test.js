import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initAutoComplete,
  resetAutoComplete,
  areAllSlotsFilled,
  checkAutoComplete
} from '../../js/auto-complete.js';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../puzzle-data-today.js', () => ({
  validateSolution: vi.fn((day, word1, word2) => {
    if (day === 1) {
      return word1 === 'SNOW' && word2 === 'FLAKE';
    }
    return false;
  }),
  calculateWordScore: vi.fn((word) => {
    const scores = { 'S': 1, 'N': 1, 'O': 1, 'W': 4, 'F': 4, 'L': 1, 'A': 1, 'K': 5, 'E': 1 };
    return word.split('').reduce((sum, letter) => sum + (scores[letter] || 0), 0);
  })
}));

vi.mock('../../js/modals.js', () => ({
  showSuccessModal: vi.fn()
}));

vi.mock('../../js/feedback.js', () => ({
  triggerSnowflakeConfetti: vi.fn()
}));

vi.mock('../../js/puzzle-state.js', () => ({
  getHintsRemaining: vi.fn(() => 2),
  getArchiveHintsRemaining: vi.fn(() => 1),
  getSolutionShown: vi.fn(() => false),
  getArchiveSolutionShown: vi.fn(() => false)
}));

vi.mock('../../js/utils.js', () => ({
  debugLog: vi.fn()
}));

describe('auto-complete.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
    resetAutoComplete();
  });

  describe('initAutoComplete', () => {
    it('should initialize auto-complete state', async () => {
      initAutoComplete(1, 'daily-');

      // State is internal, so we verify by checking behavior
      // After init, checkAutoComplete should work with stored values
      const { wordSlots, word1Container, word2Container } = createMockPuzzleDOM();
      word1Container.setAttribute('data-max-score', '7');
      word2Container.setAttribute('data-max-score', '12');
      
      // Fill slots with correct solution
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        tile.setAttribute('data-letter', letter);
        slots1[i].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        tile.setAttribute('data-letter', letter);
        slots2[i].appendChild(tile);
      });

      const modals = await import('../../js/modals.js');
      checkAutoComplete(); // Uses stored day and prefix

      expect(modals.showSuccessModal).toHaveBeenCalled();
    });

    it('should store day and prefix', async () => {
      initAutoComplete(5, 'archive-');
      
      // Verify by checking behavior with stored values
      createMockPuzzleDOM();
      
      checkAutoComplete(); // Should use stored day=5, prefix='archive-'
      
      // Since day 5 doesn't match our mock solution, modal shouldn't be called
      const modals = await import('../../js/modals.js');
      expect(modals.showSuccessModal).not.toHaveBeenCalled();
    });
  });

  describe('resetAutoComplete', () => {
    it('should reset auto-complete state', async () => {
      initAutoComplete(1, 'daily-');
      resetAutoComplete();

      createMockPuzzleDOM();
      
      checkAutoComplete(); // Should return early since currentDay is null
      
      const modals = await import('../../js/modals.js');
      expect(modals.showSuccessModal).not.toHaveBeenCalled();
    });
  });

  describe('areAllSlotsFilled', () => {
    it('should return false when slots are empty', () => {
      const { wordSlots } = createMockPuzzleDOM();
      
      expect(areAllSlotsFilled()).toBe(false);
    });

    it('should return false when word1 slots are partially filled', () => {
      const { wordSlots } = createMockPuzzleDOM();
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      
      // Fill only first slot
      const tile = createMockTile('S', 0);
      slots1[0].appendChild(tile);
      
      expect(areAllSlotsFilled()).toBe(false);
    });

    it('should return false when word2 slots are partially filled', () => {
      const { wordSlots } = createMockPuzzleDOM();
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      // Fill word1 completely
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        slots1[i].appendChild(tile);
      });
      
      // Fill only first slot of word2
      const tile = createMockTile('F', 4);
      slots2[0].appendChild(tile);
      
      expect(areAllSlotsFilled()).toBe(false);
    });

    it('should return true when all slots are filled', () => {
      const { wordSlots } = createMockPuzzleDOM();
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        slots1[i].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        slots2[i].appendChild(tile);
      });
      
      expect(areAllSlotsFilled()).toBe(true);
    });

    it('should return false when slots containers are missing', () => {
      cleanupDOM();
      
      expect(areAllSlotsFilled()).toBe(false);
    });

    it('should return false when word1 slots container is missing', () => {
      cleanupDOM();
      const wordSlots = document.createElement('div');
      wordSlots.id = 'word-slots';
      document.body.appendChild(wordSlots);
      
      // Only create word2 slots
      const slots2Container = document.createElement('div');
      slots2Container.setAttribute('data-word-slots', '1');
      wordSlots.appendChild(slots2Container);
      
      expect(areAllSlotsFilled()).toBe(false);
    });

    it('should return false when word2 slots container is missing', () => {
      cleanupDOM();
      const wordSlots = document.createElement('div');
      wordSlots.id = 'word-slots';
      document.body.appendChild(wordSlots);
      
      // Only create word1 slots
      const slots1Container = document.createElement('div');
      slots1Container.setAttribute('data-word-slots', '0');
      wordSlots.appendChild(slots1Container);
      
      expect(areAllSlotsFilled()).toBe(false);
    });
  });

  describe('checkAutoComplete', () => {
    beforeEach(() => {
      initAutoComplete(1, '');
    });

    it('should show success modal for correct solution', async () => {
      const { wordSlots, word1Container, word2Container } = createMockPuzzleDOM();
      word1Container.setAttribute('data-max-score', '7');
      word2Container.setAttribute('data-max-score', '12');
      
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        tile.setAttribute('data-letter', letter);
        slots1[i].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        tile.setAttribute('data-letter', letter);
        slots2[i].appendChild(tile);
      });

      const modals = await import('../../js/modals.js');
      const feedback = await import('../../js/feedback.js');
      
      checkAutoComplete();

      expect(modals.showSuccessModal).toHaveBeenCalledWith(
        1, // day
        7, // word1Score (S+N+O+W = 1+1+1+4 = 7)
        12, // word2Score (F+L+A+K+E = 4+1+1+5+1 = 12)
        7, // word1MaxScore
        12, // word2MaxScore
        '', // prefix
        1, // hintsUsed (3 - 2 = 1)
        false // solutionShown
      );
      expect(feedback.triggerSnowflakeConfetti).toHaveBeenCalled();
    });

    it('should not show modal for incorrect solution', async () => {
      const { wordSlots } = createMockPuzzleDOM();
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      // Fill with incorrect solution
      ['W', 'O', 'N', 'S'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        tile.setAttribute('data-letter', letter);
        slots1[i].appendChild(tile);
      });
      
      ['E', 'K', 'A', 'L', 'F'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        tile.setAttribute('data-letter', letter);
        slots2[i].appendChild(tile);
      });

      const modals = await import('../../js/modals.js');
      checkAutoComplete();

      expect(modals.showSuccessModal).not.toHaveBeenCalled();
    });

    it('should return early if puzzle day is not set', async () => {
      resetAutoComplete();
      createMockPuzzleDOM();
      
      checkAutoComplete();
      
      const modals = await import('../../js/modals.js');
      expect(modals.showSuccessModal).not.toHaveBeenCalled();
    });

    it('should prevent duplicate triggers', async () => {
      const { wordSlots, word1Container, word2Container } = createMockPuzzleDOM();
      word1Container.setAttribute('data-max-score', '7');
      word2Container.setAttribute('data-max-score', '12');
      
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        tile.setAttribute('data-letter', letter);
        slots1[i].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        tile.setAttribute('data-letter', letter);
        slots2[i].appendChild(tile);
      });

      const modals = await import('../../js/modals.js');
      
      checkAutoComplete();
      checkAutoComplete(); // Second call should be ignored

      expect(modals.showSuccessModal).toHaveBeenCalledTimes(1);
    });

    it('should use provided day and prefix parameters', async () => {
      resetAutoComplete();
      const { wordSlots, word1Container, word2Container } = createMockPuzzleDOM();
      word1Container.setAttribute('data-max-score', '7');
      word2Container.setAttribute('data-max-score', '12');
      
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        tile.setAttribute('data-letter', letter);
        slots1[i].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        tile.setAttribute('data-letter', letter);
        slots2[i].appendChild(tile);
      });

      const modals = await import('../../js/modals.js');
      const puzzleState = await import('../../js/puzzle-state.js');
      
      checkAutoComplete(1, 'archive-');

      expect(modals.showSuccessModal).toHaveBeenCalledWith(
        1, 7, 12, 7, 12, 'archive-',
        2, // hintsUsed (3 - 1 = 2 for archive)
        false
      );
    });

    it('should return early if slots are not filled', async () => {
      const { wordSlots } = createMockPuzzleDOM();
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      
      // Fill only word1 partially
      const tile = createMockTile('S', 0);
      tile.setAttribute('data-letter', 'S');
      slots1[0].appendChild(tile);

      const modals = await import('../../js/modals.js');
      checkAutoComplete();

      expect(modals.showSuccessModal).not.toHaveBeenCalled();
    });

    it('should return early if slots containers are missing', async () => {
      cleanupDOM();
      
      const modals = await import('../../js/modals.js');
      checkAutoComplete();

      expect(modals.showSuccessModal).not.toHaveBeenCalled();
    });

    it('should handle missing word containers gracefully', async () => {
      const { wordSlots } = createMockPuzzleDOM();
      // Remove data-max-score attributes
      const word1Container = document.querySelector('[data-word-index="0"]');
      const word2Container = document.querySelector('[data-word-index="1"]');
      if (word1Container) word1Container.removeAttribute('data-max-score');
      if (word2Container) word2Container.removeAttribute('data-max-score');
      
      const slots1 = wordSlots.querySelectorAll('[data-word-slots="0"] .slot');
      const slots2 = wordSlots.querySelectorAll('[data-word-slots="1"] .slot');
      
      ['S', 'N', 'O', 'W'].forEach((letter, i) => {
        const tile = createMockTile(letter, i);
        tile.setAttribute('data-letter', letter);
        slots1[i].appendChild(tile);
      });
      
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, i) => {
        const tile = createMockTile(letter, i + 4);
        tile.setAttribute('data-letter', letter);
        slots2[i].appendChild(tile);
      });

      const modals = await import('../../js/modals.js');
      checkAutoComplete();

      // When word containers are missing, max scores default to 0
      // But the function still calculates word scores correctly
      expect(modals.showSuccessModal).toHaveBeenCalled();
      const call = modals.showSuccessModal.mock.calls[0];
      expect(call[0]).toBe(1); // day
      expect(call[1]).toBe(7); // word1Score
      expect(call[2]).toBe(12); // word2Score
      expect(call[3]).toBe(0); // word1MaxScore (missing container)
      expect(call[4]).toBe(0); // word2MaxScore (missing container)
      expect(call[5]).toBe(''); // prefix
      expect(call[6]).toBe(1); // hintsUsed
      expect(call[7]).toBe(false); // solutionShown
    });
  });
});
