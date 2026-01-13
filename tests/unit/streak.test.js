import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStreak,
  updateStreak,
  resetStreak,
  setStreakForTesting,
  displayStreak
} from '../../js/streak.js';

// Mock puzzle-data-encoded.js functions
vi.mock('../../puzzle-data-encoded.js', () => ({
  formatDateString: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  parseDateString: (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
}));

describe('streak.js', () => {
  beforeEach(() => {
    resetStreak();
  });

  describe('getStreak', () => {
    it('should return 0 initially', () => {
      expect(getStreak()).toBe(0);
    });

    it('should return stored streak value', () => {
      localStorage.setItem('puzzle-streak', '5');
      expect(getStreak()).toBe(5);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => getStreak()).not.toThrow();
      expect(getStreak()).toBe(0);
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('updateStreak', () => {
    it('should set streak to 0 on first visit', () => {
      const today = new Date(2025, 11, 1);
      const result = updateStreak(today);
      expect(result).toBe(0);
      expect(getStreak()).toBe(0);
    });

    it('should increment streak on consecutive day', () => {
      const yesterday = new Date(2025, 11, 1);
      const today = new Date(2025, 11, 2);
      
      // Set up yesterday's visit
      localStorage.setItem('puzzle-streak', '0');
      localStorage.setItem('puzzle-last-visit', '2025-12-01');
      
      const result = updateStreak(today);
      expect(result).toBe(2); // First consecutive visit = streak 2
      expect(getStreak()).toBe(2);
    });

    it('should increment existing streak on consecutive day', () => {
      const yesterday = new Date(2025, 11, 1);
      const today = new Date(2025, 11, 2);
      
      // Set up existing streak
      localStorage.setItem('puzzle-streak', '3');
      localStorage.setItem('puzzle-last-visit', '2025-12-01');
      
      const result = updateStreak(today);
      expect(result).toBe(4);
      expect(getStreak()).toBe(4);
    });

    it('should not increment streak on same day', () => {
      const today = new Date(2025, 11, 1);
      
      localStorage.setItem('puzzle-streak', '5');
      localStorage.setItem('puzzle-last-visit', '2025-12-01');
      
      const result = updateStreak(today);
      expect(result).toBe(5); // Same day, no increment
      expect(getStreak()).toBe(5);
    });

    it('should reset streak when gap is more than 1 day', () => {
      const lastVisit = new Date(2025, 11, 1);
      const today = new Date(2025, 11, 5); // 4 days later
      
      localStorage.setItem('puzzle-streak', '5');
      localStorage.setItem('puzzle-last-visit', '2025-12-01');
      
      const result = updateStreak(today);
      expect(result).toBe(0);
      expect(getStreak()).toBe(0);
    });

    it('should handle invalid date strings gracefully', () => {
      localStorage.setItem('puzzle-streak', '5');
      localStorage.setItem('puzzle-last-visit', 'invalid-date');
      
      const today = new Date(2025, 11, 2);
      const result = updateStreak(today);
      expect(result).toBe(0);
      expect(getStreak()).toBe(0);
    });
  });

  describe('resetStreak', () => {
    it('should reset streak and last visit', () => {
      localStorage.setItem('puzzle-streak', '5');
      localStorage.setItem('puzzle-last-visit', '2025-12-01');
      
      resetStreak();
      
      expect(localStorage.getItem('puzzle-streak')).toBeNull();
      expect(localStorage.getItem('puzzle-last-visit')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => resetStreak()).not.toThrow();
      
      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('setStreakForTesting', () => {
    it('should set streak and last visit date', () => {
      setStreakForTesting(5, '2025-12-01');
      
      expect(getStreak()).toBe(5);
      expect(localStorage.getItem('puzzle-last-visit')).toBe('2025-12-01');
    });
  });

  describe('displayStreak', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="streak-container" class="hidden">
          <span id="streak-display"></span>
        </div>
      `;
    });

    it('should hide streak when streak is 0', () => {
      resetStreak();
      displayStreak();
      
      const container = document.getElementById('streak-container');
      expect(container.classList.contains('hidden')).toBe(true);
    });

    it('should show streak when streak is greater than 0', () => {
      setStreakForTesting(3, '2025-12-01');
      displayStreak(new Date(2025, 11, 2));
      
      const container = document.getElementById('streak-container');
      const display = document.getElementById('streak-display');
      
      expect(container.classList.contains('hidden')).toBe(false);
      expect(display.textContent).toBe('🔥 4');
      expect(display.getAttribute('aria-label')).toBe('Current streak: 4 days');
    });

    it('should use singular form for streak of 1', () => {
      setStreakForTesting(1, '2025-12-01');
      displayStreak(new Date(2025, 11, 2));
      
      const display = document.getElementById('streak-display');
      expect(display.getAttribute('aria-label')).toBe('Current streak: 2 days');
    });

    it('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '';
      expect(() => displayStreak()).not.toThrow();
    });
  });
});
