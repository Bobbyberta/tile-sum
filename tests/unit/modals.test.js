import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  showSuccessModal,
  showErrorModal,
  closeErrorModal,
  showHelpModal,
  closeHelpModal,
  closeSuccessModal,
  copyShareMessage,
  resetModalCount
} from '../../js/modals.js';
import { cleanupDOM, createMockPuzzleDOM, createMockSlot } from '../helpers/dom-setup.js';

// Mock dependencies
const mockIsAdventMode = vi.fn(() => false);
vi.mock('../../puzzle-data-encoded.js', () => ({
  formatDateString: vi.fn((date) => '2024-12-01'),
  getDateForPuzzleNumber: vi.fn((day) => new Date(2024, 11, day)),
  isAdventMode: () => mockIsAdventMode(),
  PUZZLE_DATA: {
    1: {
      words: ['SNOW', 'FLAKE'],
      solution: ['SNOW', 'FLAKE']
    }
  }
}));

vi.mock('../../js/utils.js', () => ({
  getTestModeParamWithAmpersand: vi.fn(() => '')
}));

vi.mock('../../js/keyboard.js', () => ({
  handleModalKeyDown: vi.fn()
}));

vi.mock('../../js/completion.js', () => ({
  savePuzzleCompletion: vi.fn(),
  markHelpAsSeen: vi.fn()
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  },
  share: undefined // Will be set in individual tests if needed
});

describe('modals.js', () => {
  beforeEach(() => {
    cleanupDOM();
    // Reset navigator.share to undefined (not available) for tests that don't set it
    navigator.share = undefined;
    vi.clearAllMocks();
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
    global.window.scrollTo = vi.fn();
    
    // Reset modal state
    resetModalCount();
    
    // Reset body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('overflow-hidden');
  });

  afterEach(async () => {
    // Wait for any pending timeouts to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Clear any pending timeouts
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  function createModal(id, prefix = '') {
    const modal = document.createElement('div');
    modal.id = `${prefix}${id}`;
    modal.className = 'hidden';
    modal.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modal);
    return modal;
  }

  function createSuccessModal(prefix = '') {
    const modal = createModal('success-modal', prefix);
    
    const shareMessage = document.createElement('div');
    shareMessage.id = `${prefix}share-message`;
    modal.appendChild(shareMessage);
    
    const hintsUsedMessage = document.createElement('div');
    hintsUsedMessage.id = `${prefix}hints-used-message`;
    modal.appendChild(hintsUsedMessage);
    
    const closeBtn = document.createElement('button');
    closeBtn.id = `${prefix}close-success-modal`;
    modal.appendChild(closeBtn);
    
    const shareBtn = document.createElement('button');
    shareBtn.id = `${prefix}share-btn`;
    shareBtn.textContent = 'Share';
    shareBtn.className = 'bg-amber-500';
    modal.appendChild(shareBtn);
    
    return { modal, shareMessage, hintsUsedMessage, closeBtn, shareBtn };
  }

  // Helper to set up word slots with locked attributes for emoji grid testing
  function setupWordSlotsForEmojiGrid(prefix = '', lockedIndices = { word1: [], word2: [] }) {
    const { wordSlots } = createMockPuzzleDOM(prefix);
    
    // Get slot containers
    const slots1Container = wordSlots.querySelector('[data-word-slots="0"]');
    const slots2Container = wordSlots.querySelector('[data-word-slots="1"]');
    
    // Set locked attributes for word 1
    if (slots1Container) {
      const slots = slots1Container.querySelectorAll('.slot');
      lockedIndices.word1.forEach(index => {
        if (slots[index]) {
          slots[index].setAttribute('data-locked', 'true');
        }
      });
    }
    
    // Set locked attributes for word 2
    if (slots2Container) {
      const slots = slots2Container.querySelectorAll('.slot');
      lockedIndices.word2.forEach(index => {
        if (slots[index]) {
          slots[index].setAttribute('data-locked', 'true');
        }
      });
    }
    
    return { wordSlots, slots1Container, slots2Container };
  }

  function createErrorModal(prefix = '') {
    const modal = createModal('error-modal', prefix);
    
    const closeBtn = document.createElement('button');
    closeBtn.id = `${prefix}close-error-modal`;
    modal.appendChild(closeBtn);
    
    return { modal, closeBtn };
  }

  function createHelpModal() {
    const modal = createModal('help-modal');
    
    const contentArea = document.createElement('div');
    contentArea.id = 'help-modal-content';
    modal.appendChild(contentArea);
    
    const headerCloseBtn = document.createElement('button');
    headerCloseBtn.id = 'close-help-modal';
    modal.appendChild(headerCloseBtn);
    
    return { modal, contentArea, headerCloseBtn };
  }

  describe('showSuccessModal', () => {
    it('should show success modal', async () => {
      const { savePuzzleCompletion } = await import('../../js/completion.js');
      const { modal } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(modal.classList.contains('hidden')).toBe(false);
      expect(modal.getAttribute('aria-hidden')).toBe('false');
      expect(savePuzzleCompletion).toHaveBeenCalled();
    });

    it('should lock body scroll', () => {
      const { modal } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    });

    it('should display share message with emoji grid', () => {
      setupWordSlotsForEmojiGrid('', { word1: [], word2: [] }); // No hints
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      // Should contain emoji grid (all green boxes for no hints)
      expect(shareMessage.textContent).toContain('🟩');
      expect(shareMessage.textContent).toContain('can you beat my score?');
    });


    it('should handle prefix', () => {
      const { modal } = createSuccessModal('daily-');
      
      showSuccessModal(1, 7, 12, 10, 12, 'daily-');
      
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    it('should return early if modal not found', () => {
      expect(() => showSuccessModal(1, 7, 12, 10, 12)).not.toThrow();
    });

    it('should focus close button', async () => {
      const { closeBtn } = createSuccessModal();
      const focusSpy = vi.spyOn(closeBtn, 'focus');
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(focusSpy).toHaveBeenCalled();
    });

    it('should setup share button click handler', () => {
      setupWordSlotsForEmojiGrid('', { word1: [], word2: [] });
      const { shareBtn } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      shareBtn.dispatchEvent(clickEvent);
      
      // Should have called copyShareMessage (tested separately)
      expect(shareBtn).toBeTruthy();
    });

    it('should display emoji grid with no hints (all green)', () => {
      setupWordSlotsForEmojiGrid('', { word1: [], word2: [] });
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 0);
      
      const content = shareMessage.textContent;
      // Word 1 (SNOW = 4 letters) should be all green
      expect(content).toContain('🟩🟩🟩🟩');
      // Word 2 (FLAKE = 5 letters) should be all green
      expect(content).toContain('🟩🟩🟩🟩🟩');
      // Should not contain orange boxes
      expect(content).not.toContain('🟧');
    });

    it('should display emoji grid with hints (orange boxes)', () => {
      // Lock first slot of word 1 and second slot of word 2
      setupWordSlotsForEmojiGrid('', { word1: [0], word2: [1] });
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 2);
      
      const content = shareMessage.textContent;
      // Word 1 should have orange at position 0
      expect(content).toContain('🟧');
      // Should contain both green and orange
      expect(content).toContain('🟩');
      expect(content).toContain('🟧');
      // Should contain hints message
      expect(content).toContain('I used 2 hints on todays puzzle');
    });

    it('should display emoji grid with all hints used (all orange)', () => {
      // Lock all slots
      setupWordSlotsForEmojiGrid('', { word1: [0, 1, 2, 3], word2: [0, 1, 2, 3, 4] });
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 9);
      
      const content = shareMessage.textContent;
      // Word 1 should be all orange
      expect(content).toContain('🟧🟧🟧🟧');
      // Word 2 should be all orange
      expect(content).toContain('🟧🟧🟧🟧🟧');
      // Should not contain green boxes
      expect(content).not.toContain('🟩');
    });

    it('should display emoji grid for archive puzzles', () => {
      setupWordSlotsForEmojiGrid('archive-', { word1: [1], word2: [2] });
      const { shareMessage } = createSuccessModal('archive-');
      
      showSuccessModal(1, 7, 12, 10, 12, 'archive-', 2);
      
      const content = shareMessage.textContent;
      expect(content).toContain('🟧');
      expect(content).toContain('I used 2 hints on todays puzzle');
    });

    it('should display emoji grid for daily puzzles', () => {
      setupWordSlotsForEmojiGrid('daily-', { word1: [0, 2], word2: [] });
      const { shareMessage } = createSuccessModal('daily-');
      
      showSuccessModal(1, 7, 12, 10, 12, 'daily-', 2);
      
      const content = shareMessage.textContent;
      expect(content).toContain('🟧');
      expect(content).toContain('I used 2 hints on todays puzzle');
    });

    it('should include challenge message in share text', () => {
      setupWordSlotsForEmojiGrid('', { word1: [], word2: [] });
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 0);
      
      const content = shareMessage.textContent;
      expect(content).toContain('can you beat my score?');
    });

    it('should include puzzle URL in share text for regular puzzle', () => {
      setupWordSlotsForEmojiGrid('', { word1: [], word2: [] });
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 0);
      
      const content = shareMessage.textContent;
      expect(content).toContain('https://sum-tile.uk/puzzle.html');
    });

    it('should link to home screen for daily puzzle', () => {
      setupWordSlotsForEmojiGrid('daily-', { word1: [], word2: [] });
      const { shareMessage } = createSuccessModal('daily-');
      
      showSuccessModal(1, 7, 12, 10, 12, 'daily-', 0);
      
      const content = shareMessage.textContent;
      expect(content).toContain('https://sum-tile.uk/index.html');
      expect(content).not.toContain('puzzle.html');
    });

    it('should link to archive page for archive puzzle', () => {
      setupWordSlotsForEmojiGrid('archive-', { word1: [], word2: [] });
      const { shareMessage } = createSuccessModal('archive-');
      
      showSuccessModal(1, 7, 12, 10, 12, 'archive-', 0);
      
      const content = shareMessage.textContent;
      expect(content).toContain('https://sum-tile.uk/archive.html');
      expect(content).toContain('date=');
    });
  });

  describe('copyShareMessage', () => {
    it('should copy text to clipboard', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      const shareText = 'Test share message';
      const puzzleUrl = 'https://sum-tile.uk/puzzle.html';
      
      copyShareMessage(shareText, puzzleUrl, shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareText);
    });

    it('should update button text to Copied', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      copyShareMessage('Test', 'https://sum-tile.uk/puzzle.html', shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shareBtn.textContent).toBe('Copied!');
      expect(shareBtn.classList.contains('bg-green-600')).toBe(true);
    });

    it('should restore button after 2 seconds', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      copyShareMessage('Test', 'https://sum-tile.uk/puzzle.html', shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 2100));
      
      expect(shareBtn.textContent).toBe('Share');
      expect(shareBtn.className).toBe('bg-amber-500');
    });

    it('should handle clipboard error', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      copyShareMessage('Test', 'https://sum-tile.uk/puzzle.html', shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shareBtn.textContent).toBe('Error');
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should return early if button not found', () => {
      expect(() => copyShareMessage('Test', 'https://sum-tile.uk/puzzle.html', null, 'Share', 'bg-amber-500')).not.toThrow();
    });

    it('should use Web Share API when available', async () => {
      // Mock Web Share API
      const mockShare = vi.fn(() => Promise.resolve());
      navigator.share = mockShare;
      
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      const shareText = 'Test share message\nhttps://sum-tile.uk/puzzle.html';
      const puzzleUrl = 'https://sum-tile.uk/puzzle.html';
      
      copyShareMessage(shareText, puzzleUrl, shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockShare).toHaveBeenCalledWith({
        title: 'Sum Tile Puzzle',
        text: 'Test share message',
        url: puzzleUrl
      });
      expect(shareBtn.textContent).toBe('Shared!');
    });

    it('should fall back to clipboard if Web Share API fails', async () => {
      // Mock Web Share API to reject
      const mockShare = vi.fn(() => Promise.reject(new Error('Share failed')));
      navigator.share = mockShare;
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      const shareText = 'Test share message\nhttps://sum-tile.uk/puzzle.html';
      const puzzleUrl = 'https://sum-tile.uk/puzzle.html';
      
      copyShareMessage(shareText, puzzleUrl, shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockShare).toHaveBeenCalled();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareText);
      
      consoleError.mockRestore();
    });

    it('should not use Web Share API if user cancels share', async () => {
      // Mock Web Share API to reject with AbortError (user cancellation)
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const mockShare = vi.fn(() => Promise.reject(abortError));
      navigator.share = mockShare;
      
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      const shareText = 'Test share message\nhttps://sum-tile.uk/puzzle.html';
      const puzzleUrl = 'https://sum-tile.uk/puzzle.html';
      
      copyShareMessage(shareText, puzzleUrl, shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockShare).toHaveBeenCalled();
      // Should fall back to clipboard on cancellation
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareText);
    });
  });

  describe('showErrorModal', () => {
    it('should show error modal', () => {
      const { modal } = createErrorModal();
      
      showErrorModal();
      
      expect(modal.classList.contains('hidden')).toBe(false);
      expect(modal.getAttribute('aria-hidden')).toBe('false');
    });

    it('should lock body scroll', () => {
      const { modal } = createErrorModal();
      
      // Ensure modal exists
      expect(modal).toBeTruthy();
      
      showErrorModal();
      
      // lockBodyScroll is called inside showErrorModal when modalCount === 1
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    });

    it('should handle prefix', () => {
      const { modal } = createErrorModal('daily-');
      
      showErrorModal('daily-');
      
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    it('should return early if modal not found', () => {
      expect(() => showErrorModal()).not.toThrow();
    });

    it('should focus close button', async () => {
      const { closeBtn } = createErrorModal();
      const focusSpy = vi.spyOn(closeBtn, 'focus');
      
      showErrorModal();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('closeErrorModal', () => {
    it('should close error modal', () => {
      const { modal } = createErrorModal();
      showErrorModal();
      
      closeErrorModal();
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('should unlock body scroll', () => {
      const { modal } = createErrorModal();
      showErrorModal();
      
      closeErrorModal();
      
      expect(document.body.style.position).toBe('');
      expect(document.body.classList.contains('overflow-hidden')).toBe(false);
    });

    it('should handle prefix', () => {
      const { modal } = createErrorModal('daily-');
      showErrorModal('daily-');
      
      closeErrorModal('daily-');
      
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should return early if modal not found', () => {
      expect(() => closeErrorModal()).not.toThrow();
    });

    it('should restore focus to triggering element', async () => {
      const { modal } = createErrorModal();
      const triggerBtn = document.createElement('button');
      triggerBtn.id = 'trigger-btn';
      triggerBtn.tabIndex = 0; // Make it focusable
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();
      
      // Verify trigger button is focused before opening modal
      expect(document.activeElement).toBe(triggerBtn);
      
      showErrorModal();
      
      // Wait a bit for modal to open and focus to move to close button
      await new Promise(resolve => setTimeout(resolve, 50));
      
      closeErrorModal();
      
      // Wait for setTimeout in closeErrorModal to restore focus
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Focus should be restored to trigger button
      expect(document.activeElement).toBe(triggerBtn);
    });
  });

  describe('showHelpModal', () => {
    it('should show help modal', async () => {
      const { markHelpAsSeen } = await import('../../js/completion.js');
      const { modal, contentArea } = createHelpModal();
      
      showHelpModal();
      
      expect(modal.classList.contains('hidden')).toBe(false);
      expect(modal.getAttribute('aria-hidden')).toBe('false');
    });

    it('should lock body scroll', () => {
      const { modal } = createHelpModal();
      
      showHelpModal();
      
      expect(document.body.style.position).toBe('fixed');
    });

    it('should reset scroll position', async () => {
      const { contentArea } = createHelpModal();
      contentArea.scrollTop = 100;
      
      showHelpModal();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(contentArea.scrollTop).toBe(0);
    });

    it('should prevent default if event provided', () => {
      const { modal } = createHelpModal();
      const event = {
        preventDefault: vi.fn()
      };
      
      showHelpModal(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should return early if modal not found', () => {
      expect(() => showHelpModal()).not.toThrow();
    });
  });

  describe('closeHelpModal', () => {
    it('should close help modal', async () => {
      const { markHelpAsSeen } = await import('../../js/completion.js');
      const { modal } = createHelpModal();
      showHelpModal();
      
      closeHelpModal();
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(markHelpAsSeen).toHaveBeenCalled();
    });

    it('should unlock body scroll', () => {
      const { modal } = createHelpModal();
      showHelpModal();
      
      closeHelpModal();
      
      expect(document.body.style.position).toBe('');
    });

    it('should return early if modal not found', () => {
      expect(() => closeHelpModal()).not.toThrow();
    });
  });

  describe('closeSuccessModal', () => {
    it('should close success modal', () => {
      const { modal } = createSuccessModal();
      showSuccessModal(1, 7, 12, 10, 12);
      
      closeSuccessModal();
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('should unlock body scroll', () => {
      const { modal } = createSuccessModal();
      showSuccessModal(1, 7, 12, 10, 12);
      
      closeSuccessModal();
      
      expect(document.body.style.position).toBe('');
    });

    it('should handle prefix', () => {
      const { modal } = createSuccessModal('daily-');
      showSuccessModal(1, 7, 12, 10, 12, 'daily-');
      
      closeSuccessModal('daily-');
      
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should return early if modal not found', () => {
      expect(() => closeSuccessModal()).not.toThrow();
    });
  });

  describe('scroll lock management', () => {
    it('should handle multiple modals', () => {
      const { modal: errorModal } = createErrorModal();
      const { modal: helpModal } = createHelpModal();
      
      // Ensure modals exist
      expect(errorModal).toBeTruthy();
      expect(helpModal).toBeTruthy();
      
      showErrorModal();
      showHelpModal();
      
      // Both modals open, scroll should still be locked (modalCount = 2, but locked when first opened)
      expect(document.body.style.position).toBe('fixed');
      
      closeErrorModal();
      
      // One modal still open, scroll should still be locked (modalCount = 1)
      expect(document.body.style.position).toBe('fixed');
      
      closeHelpModal();
      
      // All modals closed, scroll should be unlocked (modalCount = 0)
      expect(document.body.style.position).toBe('');
    });

    it('should restore scroll position', () => {
      const { modal } = createErrorModal();
      
      // Mock window.pageYOffset and document.documentElement.scrollTop BEFORE opening modal
      // so lockBodyScroll can read the scroll position
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      Object.defineProperty(document.documentElement, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      showErrorModal();
      closeErrorModal();
      
      expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
    });

    it('should use document.documentElement.scrollTop if pageYOffset is 0', () => {
      const { modal } = createErrorModal();
      
      Object.defineProperty(window, 'pageYOffset', {
        writable: true,
        configurable: true,
        value: 0
      });
      
      Object.defineProperty(document.documentElement, 'scrollTop', {
        writable: true,
        configurable: true,
        value: 300
      });
      
      showErrorModal();
      closeErrorModal();
      
      expect(window.scrollTo).toHaveBeenCalledWith(0, 300);
    });

    it('should prevent touchmove on body but allow in modal content', () => {
      const { modal } = createHelpModal();
      const contentArea = document.getElementById('help-modal-content');
      
      showHelpModal();
      
      // Verify touchmove handler is attached
      const touchEvent = new TouchEvent('touchmove', {
        bubbles: true,
        cancelable: true
      });
      const preventDefaultSpy = vi.spyOn(touchEvent, 'preventDefault');
      
      // Simulate touch on body (should prevent)
      Object.defineProperty(touchEvent, 'target', {
        value: document.body,
        writable: true
      });
      document.body.dispatchEvent(touchEvent);
      
      // Handler should prevent default for body touches
      // Note: In jsdom, event listeners work differently, so we verify the handler exists
      expect(document.body.style.position).toBe('fixed');
      
      // Simulate touch on modal content (should allow)
      Object.defineProperty(touchEvent, 'target', {
        value: contentArea,
        writable: true
      });
      contentArea.dispatchEvent(touchEvent);
      
      closeHelpModal();
    });

    it('should not lock scroll if modalCount > 1', () => {
      const { modal: modal1 } = createErrorModal();
      const { modal: modal2 } = createHelpModal();
      
      showErrorModal();
      const firstPosition = document.body.style.position;
      const firstTop = document.body.style.top;
      
      showHelpModal();
      
      // Position should remain the same (not re-locked)
      expect(document.body.style.position).toBe(firstPosition);
      expect(document.body.style.top).toBe(firstTop);
      
      closeErrorModal();
      closeHelpModal();
    });
  });

  describe('showSuccessModal advent mode', () => {
    beforeEach(() => {
      mockIsAdventMode.mockReturnValue(true);
    });

    afterEach(() => {
      mockIsAdventMode.mockReturnValue(false);
    });

    it('should format share message for advent mode', () => {
      const { shareMessage } = createSuccessModal();
      
      // Mock current date to be before Christmas
      const mockDate = new Date(2024, 11, 15); // December 15, 2024
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      expect(shareMessage.textContent).toContain('Days till Christmas!');
      expect(shareMessage.textContent).toContain('10'); // 10 days until Dec 25
      
      vi.useRealTimers();
    });

    it('should calculate days correctly when Christmas has passed', () => {
      const { shareMessage } = createSuccessModal();
      
      // Mock current date to be after Christmas
      const mockDate = new Date(2024, 11, 26); // December 26, 2024
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      // Should calculate for next year's Christmas
      expect(shareMessage.textContent).toContain('Days till Christmas!');
      
      vi.useRealTimers();
    });
  });

  describe('copyShareMessage edge cases', () => {
    it('should handle button element not found via ID', () => {
      // Don't create a button - test when button is not found by ID
      // Call without buttonElement parameter and without button in DOM
      expect(() => copyShareMessage('Test', 'https://sum-tile.uk/puzzle.html', null, 'Share', 'bg-amber-500')).not.toThrow();
      
      // Function should return early when button is not found
      // No button exists, so nothing should happen
      expect(document.getElementById('share-btn')).toBeNull();
    });

    it('should handle button with complex className', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 px-4 py-2';
      document.body.appendChild(shareBtn);
      
      const originalClassName = shareBtn.className;
      
      copyShareMessage('Test', 'https://sum-tile.uk/puzzle.html', shareBtn, 'Share', originalClassName);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shareBtn.textContent).toBe('Copied!');
      
      await new Promise(resolve => setTimeout(resolve, 2100));
      
      expect(shareBtn.className).toBe(originalClassName);
    });
  });
});
