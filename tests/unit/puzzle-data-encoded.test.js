import { describe, it, expect } from 'vitest';
import { getPuzzleLetters, PUZZLE_DATA } from '../../puzzle-data-encoded.js';

describe('puzzle-data-encoded.js', () => {
  describe('getPuzzleLetters', () => {
    it('should be deterministic for the same puzzle', () => {
      const day = PUZZLE_DATA[1] ? 1 : (PUZZLE_DATA[0] ? 0 : null);
      expect(day).not.toBeNull();

      const letters1 = getPuzzleLetters(day);
      const letters2 = getPuzzleLetters(day);

      expect(letters1).toEqual(letters2);
    });
  });
});

