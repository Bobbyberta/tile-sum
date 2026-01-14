import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateScoreDisplay, checkSolution } from '../../js/scoring.js';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

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

describe('scoring.js', () => {
  beforeEach(() => {
    cleanupDOM();
  });

  describe('updateScoreDisplay', () => {
    it('should update score displays for empty slots', () => {
      const { score1Display, score2Display } = createMockPuzzleDOM();
      
      updateScoreDisplay();
      
      expect(score1Display.textContent).toBe('0 / 10 points');
      expect(score2Display.textContent).toBe('0 / 12 points');
    });

    it('should calculate and display correct scores', () => {
      const { slots1Container, slots2Container, score1Display, score2Display } = createMockPuzzleDOM();
      
      // Place tiles for SNOW (S=1, N=1, O=1, W=4 = 7)
      const letters1 = ['S', 'N', 'O', 'W'];
      letters1.forEach((letter, index) => {
        const slot = slots1Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      // Place tiles for FLAKE (F=4, L=1, A=1, K=5, E=1 = 12)
      const letters2 = ['F', 'L', 'A', 'K', 'E'];
      letters2.forEach((letter, index) => {
        const slot = slots2Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      updateScoreDisplay();
      
      expect(score1Display.textContent).toBe('7 / 10 points');
      expect(score2Display.textContent).toBe('12 / 12 points');
    });

    it('should handle partial word completion', () => {
      const { slots1Container, score1Display } = createMockPuzzleDOM();
      
      // Place only first two letters
      const slot1 = slots1Container.children[0];
      const slot2 = slots1Container.children[1];
      slot1.appendChild(createMockTile('S', 0));
      slot2.appendChild(createMockTile('N', 1));
      
      updateScoreDisplay();
      
      expect(score1Display.textContent).toBe('2 / 10 points');
    });

    it('should work with prefix', () => {
      const { score1Display, score2Display } = createMockPuzzleDOM('daily-');
      
      updateScoreDisplay('daily-');
      
      expect(score1Display.textContent).toBe('0 / 10 points');
      expect(score2Display.textContent).toBe('0 / 12 points');
    });

    it('should use archive-word-slots for archive prefix', () => {
      // Create archive word slots container
      const archiveWordSlots = document.createElement('div');
      archiveWordSlots.id = 'archive-word-slots';
      document.body.appendChild(archiveWordSlots);
      
      // Create word containers
      const word1Container = document.createElement('div');
      word1Container.setAttribute('data-word-index', '0');
      word1Container.setAttribute('data-max-score', '10');
      const slots1Container = document.createElement('div');
      slots1Container.setAttribute('data-word-slots', '0');
      for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.setAttribute('data-word-index', '0');
        slot.setAttribute('data-slot-index', String(i));
        slots1Container.appendChild(slot);
      }
      word1Container.appendChild(slots1Container);
      const score1Display = document.createElement('div');
      score1Display.id = 'archive-word1-score-display';
      word1Container.appendChild(score1Display);
      
      const word2Container = document.createElement('div');
      word2Container.setAttribute('data-word-index', '1');
      word2Container.setAttribute('data-max-score', '12');
      const slots2Container = document.createElement('div');
      slots2Container.setAttribute('data-word-slots', '1');
      for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.setAttribute('data-word-index', '1');
        slot.setAttribute('data-slot-index', String(i));
        slots2Container.appendChild(slot);
      }
      word2Container.appendChild(slots2Container);
      const score2Display = document.createElement('div');
      score2Display.id = 'archive-word2-score-display';
      word2Container.appendChild(score2Display);
      
      archiveWordSlots.appendChild(word1Container);
      archiveWordSlots.appendChild(word2Container);
      
      updateScoreDisplay('archive-');
      
      expect(score1Display.textContent).toBe('0 / 10 points');
      expect(score2Display.textContent).toBe('0 / 12 points');
    });

    it('should handle missing score displays gracefully', () => {
      createMockPuzzleDOM();
      document.getElementById('word1-score-display')?.remove();
      
      expect(() => updateScoreDisplay()).not.toThrow();
    });
  });

  describe('checkSolution', () => {
    it('should call error callback when puzzle is incomplete', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const showErrorModal = vi.fn();
      const showSuccessModal = vi.fn();
      
      // Place only one tile
      slots1Container.children[0].appendChild(createMockTile('S', 0));
      
      checkSolution(1, showErrorModal, showSuccessModal);
      
      expect(showErrorModal).toHaveBeenCalled();
      expect(showSuccessModal).not.toHaveBeenCalled();
    });

    it('should call success callback for correct solution', () => {
      const { slots1Container, slots2Container } = createMockPuzzleDOM();
      const showErrorModal = vi.fn();
      const showSuccessModal = vi.fn();
      const triggerConfetti = vi.fn();
      
      // Place SNOW
      ['S', 'N', 'O', 'W'].forEach((letter, index) => {
        const slot = slots1Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      // Place FLAKE
      ['F', 'L', 'A', 'K', 'E'].forEach((letter, index) => {
        const slot = slots2Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      checkSolution(1, showErrorModal, showSuccessModal, triggerConfetti);
      
      expect(showErrorModal).not.toHaveBeenCalled();
      expect(showSuccessModal).toHaveBeenCalledWith(1, 7, 12, 10, 12);
      expect(triggerConfetti).toHaveBeenCalled();
    });

    it('should call error callback for incorrect solution', () => {
      const { slots1Container, slots2Container } = createMockPuzzleDOM();
      const showErrorModal = vi.fn();
      const showSuccessModal = vi.fn();
      
      // Place wrong words
      ['W', 'R', 'O', 'N', 'G'].forEach((letter, index) => {
        if (index < 4) {
          const slot = slots1Container.children[index];
          const tile = createMockTile(letter, index);
          slot.appendChild(tile);
        }
      });
      
      ['W', 'O', 'R', 'D', 'S'].forEach((letter, index) => {
        const slot = slots2Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      checkSolution(1, showErrorModal, showSuccessModal);
      
      expect(showErrorModal).toHaveBeenCalled();
      expect(showSuccessModal).not.toHaveBeenCalled();
    });

    it('should handle solution in reverse order', () => {
      const { slots1Container, slots2Container } = createMockPuzzleDOM();
      const showSuccessModal = vi.fn();
      
      // Place FLAKE in word1 slots
      ['F', 'L', 'A', 'K'].forEach((letter, index) => {
        const slot = slots1Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      // Place SNOW in word2 slots (first 4)
      ['S', 'N', 'O', 'W'].forEach((letter, index) => {
        const slot = slots2Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      // Fill remaining slot
      slots2Container.children[4].appendChild(createMockTile('X', 4));
      
      checkSolution(1, vi.fn(), showSuccessModal);
      
      // Should still fail because it's not the correct solution
      expect(showSuccessModal).not.toHaveBeenCalled();
    });

    it('should convert letters to uppercase', () => {
      const { slots1Container, slots2Container } = createMockPuzzleDOM();
      const showSuccessModal = vi.fn();
      
      // Place lowercase letters
      ['s', 'n', 'o', 'w'].forEach((letter, index) => {
        const slot = slots1Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      ['f', 'l', 'a', 'k', 'e'].forEach((letter, index) => {
        const slot = slots2Container.children[index];
        const tile = createMockTile(letter, index);
        slot.appendChild(tile);
      });
      
      checkSolution(1, vi.fn(), showSuccessModal);
      
      expect(showSuccessModal).toHaveBeenCalled();
    });
  });
});
