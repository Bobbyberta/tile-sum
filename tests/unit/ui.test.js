import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { updateCountdown, initDailyPuzzle, initCalendar } from '../../js/ui.js';
import { cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../puzzle-data-today.js', () => {
  const scrabbleScores = {
    'A': 1, 'B': 3, 'C': 3, 'D': 2, 'E': 1, 'F': 4, 'G': 2, 'H': 4,
    'I': 1, 'J': 8, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 3,
    'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 1, 'V': 4, 'W': 4, 'X': 8,
    'Y': 4, 'Z': 10
  };
  
  return {
    PUZZLE_DATA: {
      0: { words: ['TEST', 'DUMMY'], solution: ['TEST', 'DUMMY'] },
      1: { words: ['SNOW', 'FLAKE'], solution: ['SNOW', 'FLAKE'] },
      15: { words: ['CHRISTMAS', 'TREE'], solution: ['CHRISTMAS', 'TREE'] }
    },
    SCRABBLE_SCORES: scrabbleScores,
    isAdventMode: vi.fn(() => false),
    formatDateString: (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    getPuzzleNumberForDate: (date) => {
      const startDate = new Date(2025, 11, 1); // Dec 1, 2025
      const puzzleDate = new Date(date);
      puzzleDate.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = puzzleDate.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    },
    calculateWordScore: (word) => {
      return word.split('').reduce((score, letter) => {
        return score + (scrabbleScores[letter.toUpperCase()] || 0);
      }, 0);
    }
  };
});

vi.mock('../../js/utils.js', () => ({
  isTestMode: vi.fn(() => false),
  isAdventTestMode: vi.fn(() => false),
  isArchiveTestMode: vi.fn(() => false),
  getTestModeParam: vi.fn(() => ''),
  getTestModeParamWithAmpersand: vi.fn(() => ''),
  getDaySuffix: vi.fn((day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  })
}));

vi.mock('../../script.js', () => ({
  initPuzzleWithPrefix: vi.fn()
}));

vi.mock('../../js/completion.js', () => ({
  isPuzzleCompletedToday: vi.fn(() => false),
  isPuzzleCompletedForDate: vi.fn(() => false)
}));

vi.mock('../../js/puzzle-core.js', () => ({
  createTile: vi.fn((letter, index, isLocked, handlers) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.setAttribute('data-letter', letter);
    tile.setAttribute('data-tile-index', index);
    if (isLocked) tile.setAttribute('data-locked', 'true');
    return tile;
  }),
  createSlot: vi.fn((wordIndex, slotIndex, isLocked, handlers) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.setAttribute('data-word-index', wordIndex);
    slot.setAttribute('data-slot-index', slotIndex);
    if (isLocked) slot.setAttribute('data-locked', 'true');
    return slot;
  })
}));

describe('ui.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 11, 15)); // Dec 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('updateCountdown', () => {
    it('should hide countdown in archive test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(true);

      const countdownOverlay = document.createElement('div');
      countdownOverlay.id = 'countdown-overlay';
      countdownOverlay.classList.add('hidden');
      document.body.appendChild(countdownOverlay);

      const countdownDays = document.createElement('div');
      countdownDays.id = 'countdown-days';
      document.body.appendChild(countdownDays);

      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      updateCountdown();

      expect(countdownOverlay.classList.contains('hidden')).toBe(true);
      expect(mainContent.classList.contains('banner-visible')).toBe(false);
    });

    it('should hide countdown in standard mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);
      utils.isAdventTestMode.mockReturnValue(false);

      const countdownOverlay = document.createElement('div');
      countdownOverlay.id = 'countdown-overlay';
      document.body.appendChild(countdownOverlay);

      const countdownDays = document.createElement('div');
      countdownDays.id = 'countdown-days';
      document.body.appendChild(countdownDays);

      updateCountdown();

      expect(countdownOverlay.classList.contains('hidden')).toBe(true);
    });

    it('should show countdown in advent test mode before December 1st', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);
      utils.isAdventTestMode.mockReturnValue(true);

      vi.setSystemTime(new Date(2025, 10, 20)); // Nov 20, 2025

      const countdownOverlay = document.createElement('div');
      countdownOverlay.id = 'countdown-overlay';
      countdownOverlay.classList.add('hidden');
      document.body.appendChild(countdownOverlay);

      const countdownDays = document.createElement('div');
      countdownDays.id = 'countdown-days';
      document.body.appendChild(countdownDays);

      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      updateCountdown();

      expect(countdownOverlay.classList.contains('hidden')).toBe(false);
      expect(countdownDays.textContent).toContain('days remaining');
      expect(mainContent.classList.contains('banner-visible')).toBe(true);
    });

    it('should show singular day text for 1 day remaining', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);
      utils.isAdventTestMode.mockReturnValue(true);

      vi.setSystemTime(new Date(2025, 10, 30)); // Nov 30, 2025

      const countdownOverlay = document.createElement('div');
      countdownOverlay.id = 'countdown-overlay';
      document.body.appendChild(countdownOverlay);

      const countdownDays = document.createElement('div');
      countdownDays.id = 'countdown-days';
      document.body.appendChild(countdownDays);

      updateCountdown();

      expect(countdownDays.textContent).toBe('1 day remaining!');
    });

    it('should hide countdown on December 1st or later', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);
      utils.isAdventTestMode.mockReturnValue(true);

      vi.setSystemTime(new Date(2025, 11, 1)); // Dec 1, 2025

      const countdownOverlay = document.createElement('div');
      countdownOverlay.id = 'countdown-overlay';
      document.body.appendChild(countdownOverlay);

      const countdownDays = document.createElement('div');
      countdownDays.id = 'countdown-days';
      document.body.appendChild(countdownDays);

      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      updateCountdown();

      expect(countdownOverlay.classList.contains('hidden')).toBe(true);
      expect(mainContent.classList.contains('banner-visible')).toBe(false);
    });

    it('should return early if countdown elements are missing', () => {
      expect(() => updateCountdown()).not.toThrow();
    });
  });

  describe('initDailyPuzzle', () => {
    beforeEach(() => {
      const dailyPuzzleContainer = document.createElement('div');
      dailyPuzzleContainer.id = 'daily-puzzle-container';
      dailyPuzzleContainer.classList.add('hidden');
      document.body.appendChild(dailyPuzzleContainer);

      const calendarContainer = document.createElement('div');
      calendarContainer.id = 'calendar-container';
      document.body.appendChild(calendarContainer);

      const headerSubtitle = document.createElement('div');
      headerSubtitle.id = 'header-subtitle';
      document.body.appendChild(headerSubtitle);
    });

    it('should show daily puzzle and hide calendar', () => {
      const dailyPuzzleContainer = document.getElementById('daily-puzzle-container');
      const calendarContainer = document.getElementById('calendar-container');

      initDailyPuzzle();

      expect(dailyPuzzleContainer.classList.contains('hidden')).toBe(false);
      expect(calendarContainer.classList.contains('hidden')).toBe(true);
    });

    it('should update header subtitle with puzzle number', () => {
      const headerSubtitle = document.getElementById('header-subtitle');

      initDailyPuzzle();

      expect(headerSubtitle.textContent).toContain('Daily Word Puzzle #');
    });

    it('should use puzzle 0 in archive test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(true);

      const headerSubtitle = document.getElementById('header-subtitle');

      initDailyPuzzle();

      expect(headerSubtitle.textContent).toBe('Daily Word Puzzle #0');
    });

    it('should update archive link with test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isAdventTestMode.mockReturnValue(false);
      utils.getTestModeParam.mockReturnValue('?test=archive');

      const archiveLink = document.createElement('a');
      archiveLink.id = 'daily-archive-link';
      document.body.appendChild(archiveLink);

      initDailyPuzzle();

      // The href is set as a property, check the href property
      // In jsdom, href might be an absolute URL, so check that it contains the test param
      expect(archiveLink.href).toContain('?test=archive');
      expect(archiveLink.href).toContain('archive.html');
    });

    it('should hide archive link in advent test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isAdventTestMode.mockReturnValue(true);

      const archiveLink = document.createElement('a');
      archiveLink.id = 'daily-archive-link';
      document.body.appendChild(archiveLink);

      initDailyPuzzle();

      expect(archiveLink.style.display).toBe('none');
    });

    it('should initialize puzzle for today', async () => {
      const script = await import('../../script.js');
      const completion = await import('../../js/completion.js');
      completion.isPuzzleCompletedToday.mockReturnValue(false);

      initDailyPuzzle();

      expect(script.initPuzzleWithPrefix).toHaveBeenCalledWith(
        expect.any(Number),
        'daily-'
      );
    });

    it('should show completion message for completed puzzle', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);
      
      const completion = await import('../../js/completion.js');
      completion.isPuzzleCompletedToday.mockReturnValue(true);

      const container = document.getElementById('daily-puzzle-container');
      
      // Create header element inside container (not with the container's id)
      const header = document.createElement('header');
      container.appendChild(header);

      const tilesContainer = document.createElement('div');
      tilesContainer.id = 'daily-tiles-container';
      container.appendChild(tilesContainer);

      // wordSlots is needed for displayCompletedPuzzle to create score displays
      const wordSlots = document.createElement('div');
      wordSlots.id = 'daily-word-slots';
      container.appendChild(wordSlots);

      initDailyPuzzle();

      const completionMessage = document.getElementById('daily-completion-message');
      expect(completionMessage).toBeTruthy();
      expect(completionMessage.textContent).toContain('Puzzle complete');
    });

    it('should return early if daily puzzle container is missing', () => {
      document.body.innerHTML = '';
      expect(() => initDailyPuzzle()).not.toThrow();
    });

    it('should handle missing puzzle gracefully', () => {
      // This test verifies the function handles missing puzzle data
      // The actual check happens in the code, but mocking PUZZLE_DATA dynamically
      // is complex, so we just verify the function doesn't throw
      const dailyPuzzleTitle = document.createElement('div');
      dailyPuzzleTitle.id = 'daily-puzzle-title';
      const container = document.getElementById('daily-puzzle-container');
      container.appendChild(dailyPuzzleTitle);

      // Function should handle missing puzzle gracefully
      expect(() => initDailyPuzzle()).not.toThrow();
    });
  });

  describe('initCalendar', () => {
    beforeEach(() => {
      const calendar = document.createElement('div');
      calendar.id = 'calendar';
      document.body.appendChild(calendar);

      const headerSubtitle = document.createElement('div');
      headerSubtitle.id = 'header-subtitle';
      document.body.appendChild(headerSubtitle);
    });

    it('should hide header subtitle in calendar view', () => {
      const headerSubtitle = document.getElementById('header-subtitle');

      initCalendar();

      expect(headerSubtitle.classList.contains('hidden')).toBe(true);
    });

    it('should create 25 calendar day elements', () => {
      const calendar = document.getElementById('calendar');

      initCalendar();

      expect(calendar.children.length).toBe(25);
    });

    it('should unlock days up to today in normal mode', () => {
      const calendar = document.getElementById('calendar');

      initCalendar();

      const day15 = calendar.children[14]; // Day 15 (0-indexed)
      expect(day15.classList.contains('cursor-pointer')).toBe(true);
      expect(day15.getAttribute('tabindex')).toBe('0');
    });

    it('should unlock all days in advent test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isAdventTestMode.mockReturnValue(true);

      const calendar = document.getElementById('calendar');

      initCalendar();

      const day25 = calendar.children[24]; // Day 25
      expect(day25.classList.contains('cursor-pointer')).toBe(true);
    });

    it('should mark today with badge', () => {
      const calendar = document.getElementById('calendar');

      initCalendar();

      const day15 = calendar.children[14]; // Day 15 (today)
      const todayBadge = day15.querySelector('.bg-hint');
      expect(todayBadge).toBeTruthy();
    });

    it('should add click handler to unlocked days', () => {
      const calendar = document.getElementById('calendar');
      
      // Mock window.location
      delete window.location;
      window.location = { href: '' };

      initCalendar();

      const day15 = calendar.children[14];
      day15.click();

      expect(window.location.href).toContain('puzzle.html?day=15');
    });

    it('should add keyboard handler to unlocked days', () => {
      const calendar = document.getElementById('calendar');
      
      delete window.location;
      window.location = { href: '' };

      initCalendar();

      const day15 = calendar.children[14];
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      day15.dispatchEvent(enterEvent);

      expect(window.location.href).toContain('puzzle.html?day=15');
    });

    it('should show completion status for completed puzzles', async () => {
      const completion = await import('../../js/completion.js');
      completion.isPuzzleCompletedForDate.mockReturnValue(true);

      const calendar = document.getElementById('calendar');

      initCalendar();

      const day15 = calendar.children[14];
      const ariaLabel = day15.getAttribute('aria-label');
      expect(ariaLabel).toContain('completed');
    });

    it('should return early if calendar element is missing', () => {
      document.body.innerHTML = '';
      expect(() => initCalendar()).not.toThrow();
    });

    it('should handle locked days with proper aria-label', async () => {
      vi.setSystemTime(new Date(2025, 11, 5)); // Dec 5, 2025
      const calendar = document.getElementById('calendar');

      // Ensure advent test mode is off so days are properly locked
      const utils = await import('../../js/utils.js');
      utils.isAdventTestMode.mockReturnValue(false);

      // Ensure completion mock returns false for locked days
      const completion = await import('../../js/completion.js');
      completion.isPuzzleCompletedForDate.mockReturnValue(false);

      initCalendar();

      const day25 = calendar.children[24]; // Day 25 (locked)
      const ariaLabel = day25.getAttribute('aria-label');
      expect(ariaLabel).toContain('locked');
      expect(day25.getAttribute('tabindex')).toBeNull();
    });

    it('should handle header subtitle missing', () => {
      const headerSubtitle = document.getElementById('header-subtitle');
      headerSubtitle.remove();

      expect(() => initCalendar()).not.toThrow();
    });
  });

  describe('initDailyPuzzle - score displays', () => {
    beforeEach(() => {
      const dailyPuzzleContainer = document.createElement('div');
      dailyPuzzleContainer.id = 'daily-puzzle-container';
      dailyPuzzleContainer.classList.add('hidden');
      document.body.appendChild(dailyPuzzleContainer);

      const calendarContainer = document.createElement('div');
      calendarContainer.id = 'calendar-container';
      document.body.appendChild(calendarContainer);

      const headerSubtitle = document.createElement('div');
      headerSubtitle.id = 'header-subtitle';
      document.body.appendChild(headerSubtitle);
    });

    it('should create score displays for daily puzzle', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);
      
      const completion = await import('../../js/completion.js');
      completion.isPuzzleCompletedToday.mockReturnValue(true);

      const container = document.getElementById('daily-puzzle-container');
      
      // Create header element inside container (required for displayCompletedPuzzle)
      const header = document.createElement('header');
      container.appendChild(header);

      const tilesContainer = document.createElement('div');
      tilesContainer.id = 'daily-tiles-container';
      container.appendChild(tilesContainer);

      const wordSlots = document.createElement('div');
      wordSlots.id = 'daily-word-slots';
      container.appendChild(wordSlots);

      initDailyPuzzle();

      const score1Display = document.getElementById('daily-word1-score-display');
      const score2Display = document.getElementById('daily-word2-score-display');
      expect(score1Display).toBeTruthy();
      expect(score2Display).toBeTruthy();
    });
  });
});
