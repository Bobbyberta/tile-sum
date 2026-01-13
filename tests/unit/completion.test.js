import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  savePuzzleCompletion,
  isPuzzleCompletedToday,
  isPuzzleCompletedForDate,
  hasSeenHelp,
  markHelpAsSeen
} from '../../js/completion.js';

// Mock puzzle-data-encoded.js functions
vi.mock('../../puzzle-data-encoded.js', () => ({
  formatDateString: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  getDateForPuzzleNumber: (puzzleNum) => {
    const startDate = new Date(2025, 11, 1); // Dec 1, 2025
    if (puzzleNum === 0) return startDate;
    const date = new Date(startDate);
    date.setDate(date.getDate() + (puzzleNum - 1));
    return date;
  }
}));

describe('completion.js', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('savePuzzleCompletion', () => {
    it('should save puzzle completion with date', () => {
      const puzzleNumber = 1;
      const date = new Date(2025, 11, 1); // Dec 1, 2025
      savePuzzleCompletion(puzzleNumber, date);
      
      const dateString = '2025-12-01';
      const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
      expect(localStorage.getItem(key)).toBe('true');
    });

    it('should save puzzle completion without date (uses puzzle date)', () => {
      const puzzleNumber = 1;
      savePuzzleCompletion(puzzleNumber);
      
      const dateString = '2025-12-01';
      const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
      expect(localStorage.getItem(key)).toBe('true');
    });

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const puzzleNumber = 1;
      const date = new Date(2025, 11, 1);
      
      expect(() => savePuzzleCompletion(puzzleNumber, date)).not.toThrow();
      
      localStorage.setItem = originalSetItem;
    });
  });

  describe('isPuzzleCompletedToday', () => {
    it('should return false for uncompleted puzzle', () => {
      expect(isPuzzleCompletedToday(1)).toBe(false);
    });

    it('should return true for completed puzzle today', () => {
      const puzzleNumber = 1;
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
      localStorage.setItem(key, 'true');
      
      expect(isPuzzleCompletedToday(puzzleNumber)).toBe(true);
    });

    it('should return false for puzzle completed on different day', () => {
      const puzzleNumber = 1;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
      localStorage.setItem(key, 'true');
      
      expect(isPuzzleCompletedToday(puzzleNumber)).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => isPuzzleCompletedToday(1)).not.toThrow();
      expect(isPuzzleCompletedToday(1)).toBe(false);
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('isPuzzleCompletedForDate', () => {
    it('should return false for uncompleted puzzle', () => {
      const date = new Date(2025, 11, 1);
      expect(isPuzzleCompletedForDate(1, date)).toBe(false);
    });

    it('should return true for completed puzzle on specific date', () => {
      const puzzleNumber = 1;
      const date = new Date(2025, 11, 1);
      const dateString = '2025-12-01';
      const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
      localStorage.setItem(key, 'true');
      
      expect(isPuzzleCompletedForDate(puzzleNumber, date)).toBe(true);
    });

    it('should return false when date is null', () => {
      expect(isPuzzleCompletedForDate(1, null)).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const date = new Date(2025, 11, 1);
      expect(() => isPuzzleCompletedForDate(1, date)).not.toThrow();
      expect(isPuzzleCompletedForDate(1, date)).toBe(false);
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('hasSeenHelp', () => {
    it('should return false initially', () => {
      expect(hasSeenHelp()).toBe(false);
    });

    it('should return true after marking help as seen', () => {
      markHelpAsSeen();
      expect(hasSeenHelp()).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => hasSeenHelp()).not.toThrow();
      expect(hasSeenHelp()).toBe(false);
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('markHelpAsSeen', () => {
    it('should mark help as seen', () => {
      markHelpAsSeen();
      expect(localStorage.getItem('has-seen-help')).toBe('true');
    });

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => markHelpAsSeen()).not.toThrow();
      
      localStorage.setItem = originalSetItem;
    });
  });
});
