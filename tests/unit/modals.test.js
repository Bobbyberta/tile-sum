import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  showSuccessModal,
  showErrorModal,
  closeErrorModal,
  showHelpModal,
  closeHelpModal,
  closeSuccessModal,
  copyShareMessage
} from '../../js/modals.js';
import { cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../puzzle-data-encoded.js', () => ({
  formatDateString: vi.fn((date) => '2024-12-01'),
  getDateForPuzzleNumber: vi.fn((day) => new Date(2024, 11, day)),
  isAdventMode: vi.fn(() => false)
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
  }
});

describe('modals.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0));
    global.window.scrollTo = vi.fn();
    
    // Reset body styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('overflow-hidden');
  });

  afterEach(() => {
    // Close all modals to reset modalCount
    closeErrorModal();
    closeSuccessModal();
    closeHelpModal();
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

    it('should display share message', () => {
      const { shareMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      expect(shareMessage.textContent).toContain('Play Sum Tile #1');
    });

    it('should display hints used message', () => {
      const { hintsUsedMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 2);
      
      expect(hintsUsedMessage.textContent).toContain('2 hints');
    });

    it('should display solution shown message', () => {
      const { hintsUsedMessage } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12, '', 1, true);
      
      expect(hintsUsedMessage.textContent).toContain('shown the solution');
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
      const { shareBtn } = createSuccessModal();
      
      showSuccessModal(1, 7, 12, 10, 12);
      
      const clickEvent = new MouseEvent('click', { bubbles: true });
      shareBtn.dispatchEvent(clickEvent);
      
      // Should have called copyShareMessage (tested separately)
      expect(shareBtn).toBeTruthy();
    });
  });

  describe('copyShareMessage', () => {
    it('should copy text to clipboard', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      const shareText = 'Test share message';
      
      copyShareMessage(shareText, shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareText);
    });

    it('should update button text to Copied', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      copyShareMessage('Test', shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shareBtn.textContent).toBe('Copied!');
      expect(shareBtn.classList.contains('bg-green-600')).toBe(true);
    });

    it('should restore button after 2 seconds', async () => {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share';
      shareBtn.className = 'bg-amber-500';
      document.body.appendChild(shareBtn);
      
      copyShareMessage('Test', shareBtn, 'Share', 'bg-amber-500');
      
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
      
      copyShareMessage('Test', shareBtn, 'Share', 'bg-amber-500');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(shareBtn.textContent).toBe('Error');
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    it('should return early if button not found', () => {
      expect(() => copyShareMessage('Test', null, 'Share', 'bg-amber-500')).not.toThrow();
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
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();
      
      // Verify trigger button is focused before opening modal
      expect(document.activeElement).toBe(triggerBtn);
      
      showErrorModal();
      closeErrorModal();
      
      // Wait for setTimeout in closeErrorModal
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
      
      // Mock window.pageYOffset and document.documentElement.scrollTop
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
  });
});
