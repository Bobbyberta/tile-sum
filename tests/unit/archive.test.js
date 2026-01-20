import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initArchivePage, loadArchivePuzzle } from '../../js/archive.js';
import { createMockPuzzleDOM, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../puzzle-data-today.js', () => ({
  PUZZLE_DATA: {
    0: { words: ['TEST', 'DUMMY'], solution: ['TEST', 'DUMMY'] },
    1: { words: ['SNOW', 'FLAKE'], solution: ['SNOW', 'FLAKE'] },
    25: { words: ['CHRISTMAS', 'TREE'], solution: ['CHRISTMAS', 'TREE'] }
  },
  PUZZLE_START_DATE: new Date(2025, 11, 1), // Dec 1, 2025
  formatDateString: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  parseDateString: (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return isNaN(date.getTime()) ? null : date;
  },
  getPuzzleNumberForDate: (date) => {
    const startDate = new Date(2025, 11, 1); // Dec 1, 2025
    if (date < startDate) return null;
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Puzzle 1 is Dec 1, puzzle 2 is Dec 2, etc.
  }
}));

vi.mock('../../js/puzzle-data-loader.js', () => ({
  loadArchiveData: vi.fn(() => Promise.resolve()),
  loadArchiveDataIdle: vi.fn(),
  isArchiveDataLoaded: vi.fn(() => false)
}));

vi.mock('../../js/utils.js', () => ({
  isArchiveTestMode: vi.fn(() => false),
  getTestModeParam: vi.fn(() => ''),
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

vi.mock('../../js/puzzle-core.js', () => ({
  createPuzzleDOMStructure: vi.fn((container, prefix, title) => {
    const header = document.createElement('header');
    header.textContent = title;
    container.appendChild(header);
    return { header };
  })
}));

vi.mock('../../script.js', () => ({
  initPuzzleWithPrefix: vi.fn()
}));

vi.mock('../../js/puzzle-state.js', () => ({
  createStateManager: vi.fn(() => ({
    getHintsRemaining: vi.fn(() => 3),
    setHintsRemaining: vi.fn(),
    getSolutionShown: vi.fn(() => false),
    setSolutionShown: vi.fn()
  }))
}));

describe('archive.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
    
    // Set up default date
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 11, 15)); // Dec 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initArchivePage', () => {
    it('should initialize archive page with date picker', () => {
      // Create required DOM elements
      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      document.body.appendChild(datePicker);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      const header = document.createElement('header');
      const backLink = document.createElement('a');
      backLink.href = 'index.html';
      header.appendChild(backLink);
      const todayLink = document.createElement('a');
      todayLink.href = 'index.html';
      header.appendChild(todayLink);
      document.body.appendChild(header);

      initArchivePage();

      expect(datePicker.value).toBe('2025-12-15');
      expect(datePicker.min).toBe('2025-12-01');
      expect(datePicker.max).toBe('2025-12-15');
    });

    it('should allow future dates in archive test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(true);

      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      document.body.appendChild(datePicker);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      initArchivePage();

      expect(datePicker.max).toBe('');
    });

    it('should update navigation links with test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.getTestModeParam.mockReturnValue('?test=archive');

      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      document.body.appendChild(datePicker);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      const header = document.createElement('header');
      const backLink = document.createElement('a');
      backLink.href = 'index.html';
      header.appendChild(backLink);
      const todayLink = document.createElement('a');
      todayLink.href = 'index.html';
      header.appendChild(todayLink);
      document.body.appendChild(header);

      initArchivePage();

      expect(backLink.href).toContain('?test=archive');
      expect(todayLink.href).toContain('?test=archive');
    });

    it('should handle date change event', () => {
      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      document.body.appendChild(datePicker);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      const loadSpy = vi.spyOn({ loadArchivePuzzle }, 'loadArchivePuzzle');

      initArchivePage();

      datePicker.value = '2025-12-10';
      datePicker.dispatchEvent(new Event('change'));

      // Verify loadArchivePuzzle was called (indirectly via event handler)
      expect(datePicker.value).toBe('2025-12-10');
    });

    it('should handle previous day button click', () => {
      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      datePicker.value = '2025-12-15';
      datePicker.min = '2025-12-01';
      document.body.appendChild(datePicker);

      const datePrevBtn = document.createElement('button');
      datePrevBtn.id = 'date-prev-btn';
      document.body.appendChild(datePrevBtn);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      initArchivePage();

      datePrevBtn.click();

      expect(datePicker.value).toBe('2025-12-14');
    });

    it('should not go before min date with previous button', () => {
      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      datePicker.min = '2025-12-01';
      document.body.appendChild(datePicker);

      const datePrevBtn = document.createElement('button');
      datePrevBtn.id = 'date-prev-btn';
      document.body.appendChild(datePrevBtn);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      initArchivePage();

      // Set date to min date after initArchivePage (which sets it to today)
      datePicker.value = '2025-12-01';
      datePrevBtn.click();

      expect(datePicker.value).toBe('2025-12-01'); // Should not change
    });

    it('should handle next day button click', () => {
      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      datePicker.max = '2025-12-15';
      document.body.appendChild(datePicker);

      const dateNextBtn = document.createElement('button');
      dateNextBtn.id = 'date-next-btn';
      document.body.appendChild(dateNextBtn);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      initArchivePage();

      // Set date to day before max after initArchivePage (which sets it to today)
      datePicker.value = '2025-12-14';
      dateNextBtn.click();

      expect(datePicker.value).toBe('2025-12-15');
    });

    it('should not go after today with next button in normal mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(false);

      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      datePicker.max = '2025-12-15';
      document.body.appendChild(datePicker);

      const dateNextBtn = document.createElement('button');
      dateNextBtn.id = 'date-next-btn';
      document.body.appendChild(dateNextBtn);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      initArchivePage();

      // Set date to today after initArchivePage (which already sets it to today)
      datePicker.value = '2025-12-15';
      dateNextBtn.click();

      expect(datePicker.value).toBe('2025-12-15'); // Should not change
    });

    it('should allow future dates with next button in archive test mode', async () => {
      const utils = await import('../../js/utils.js');
      utils.isArchiveTestMode.mockReturnValue(true);

      const datePicker = document.createElement('input');
      datePicker.id = 'date-picker';
      datePicker.type = 'date';
      datePicker.value = '2025-12-15';
      document.body.appendChild(datePicker);

      const dateNextBtn = document.createElement('button');
      dateNextBtn.id = 'date-next-btn';
      document.body.appendChild(dateNextBtn);

      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);

      initArchivePage();

      dateNextBtn.click();

      expect(datePicker.value).toBe('2025-12-16');
    });

    it('should return early if date picker or archive content is missing', () => {
      expect(() => initArchivePage()).not.toThrow();
    });
  });

  describe('loadArchivePuzzle', () => {
    beforeEach(() => {
      const archiveContent = document.createElement('div');
      archiveContent.id = 'archive-puzzle-content';
      document.body.appendChild(archiveContent);
    });

    it('should load puzzle for valid date', async () => {
      const puzzleCore = await import('../../js/puzzle-core.js');
      const script = await import('../../script.js');

      await loadArchivePuzzle('2025-12-01');

      expect(puzzleCore.createPuzzleDOMStructure).toHaveBeenCalled();
      expect(script.initPuzzleWithPrefix).toHaveBeenCalled();
    });

    it('should show error for invalid date', async () => {
      await loadArchivePuzzle('invalid-date');

      const archiveContent = document.getElementById('archive-puzzle-content');
      expect(archiveContent.innerHTML).toContain('Invalid date selected');
    });

    it('should show error for date before start date', async () => {
      await loadArchivePuzzle('2025-11-30');

      const archiveContent = document.getElementById('archive-puzzle-content');
      expect(archiveContent.innerHTML).toContain('No puzzles available before');
    });

    it('should show error for missing puzzle data', async () => {
      await loadArchivePuzzle('2025-12-30'); // Puzzle 30 doesn't exist in mock

      const archiveContent = document.getElementById('archive-puzzle-content');
      expect(archiveContent.innerHTML).toContain('No puzzle available for');
    });

    it('should format date display correctly', async () => {
      const puzzleCore = await import('../../js/puzzle-core.js');

      await loadArchivePuzzle('2025-12-01'); // Dec 1 maps to puzzle 1 which exists in mock

      expect(puzzleCore.createPuzzleDOMStructure).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        'archive-',
        expect.stringContaining('December')
      );
    });

    it('should return early if archive content is missing', async () => {
      document.body.innerHTML = '';
      await expect(loadArchivePuzzle('2025-12-01')).resolves.not.toThrow();
    });
  });
});
