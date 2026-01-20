import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  showFeedback,
  triggerSnowflakeConfetti
} from '../../js/feedback.js';
import { cleanupDOM } from '../helpers/dom-setup.js';

describe('feedback.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('showFeedback', () => {
    it('should display feedback message', () => {
      const feedbackElement = document.createElement('div');
      feedbackElement.id = 'feedback';
      feedbackElement.scrollIntoView = vi.fn();
      document.body.appendChild(feedbackElement);
      
      showFeedback('Test message', 'success');
      
      expect(feedbackElement.textContent).toBe('Test message');
    });

    it('should add success class for success type', () => {
      const feedbackElement = document.createElement('div');
      feedbackElement.id = 'feedback';
      feedbackElement.scrollIntoView = vi.fn();
      document.body.appendChild(feedbackElement);
      
      showFeedback('Success!', 'success');
      
      expect(feedbackElement.classList.contains('success')).toBe(true);
      expect(feedbackElement.classList.contains('error')).toBe(false);
    });

    it('should add error class for error type', () => {
      const feedbackElement = document.createElement('div');
      feedbackElement.id = 'feedback';
      feedbackElement.scrollIntoView = vi.fn();
      document.body.appendChild(feedbackElement);
      
      showFeedback('Error!', 'error');
      
      expect(feedbackElement.classList.contains('error')).toBe(true);
      expect(feedbackElement.classList.contains('success')).toBe(false);
    });

    it('should use custom element ID', () => {
      const feedbackElement = document.createElement('div');
      feedbackElement.id = 'custom-feedback';
      feedbackElement.scrollIntoView = vi.fn();
      document.body.appendChild(feedbackElement);
      
      showFeedback('Custom message', 'success', 'custom-feedback');
      
      expect(feedbackElement.textContent).toBe('Custom message');
    });

    it('should handle missing feedback element gracefully', () => {
      expect(() => showFeedback('Test', 'success')).not.toThrow();
    });

    it('should remove classes before adding new ones', () => {
      const feedbackElement = document.createElement('div');
      feedbackElement.id = 'feedback';
      feedbackElement.classList.add('error');
      feedbackElement.scrollIntoView = vi.fn();
      document.body.appendChild(feedbackElement);
      
      showFeedback('Success!', 'success');
      
      expect(feedbackElement.classList.contains('error')).toBe(false);
      expect(feedbackElement.classList.contains('success')).toBe(true);
    });
  });

  describe('triggerSnowflakeConfetti', () => {
    let mockScript;
    let mockScriptOnLoad;
    let mockScriptOnError;

    beforeEach(() => {
      // Mock confetti library
      global.confetti = vi.fn();
      global.setInterval = vi.fn((fn, delay) => {
        // Simulate interval by calling fn immediately
        fn();
        return 123; // Return interval ID
      });
      global.clearInterval = vi.fn();
      global.Date.now = vi.fn(() => 1000);
      
      // Mock document.createElement for script loading
      mockScript = {
        src: '',
        async: false,
        onload: null,
        onerror: null,
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') mockScriptOnLoad = handler;
          if (event === 'error') mockScriptOnError = handler;
        })
      };
      
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'script') {
          return mockScript;
        }
        return originalCreateElement(tagName);
      });
      
      // Mock document.head.appendChild
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => {
        // Simulate script loading success
        if (mockScript.onload) {
          setTimeout(() => mockScript.onload(), 0);
        }
        return mockScript;
      });
      
      // Mock document.querySelector to return null (no existing script)
      vi.spyOn(document, 'querySelector').mockReturnValue(null);
    });

    it('should call confetti library after loading', async () => {
      const promise = triggerSnowflakeConfetti();
      
      // Wait for the promise to resolve
      await promise;
      
      expect(global.confetti).toHaveBeenCalled();
    });

    it('should return early if confetti not available', async () => {
      delete global.confetti;
      
      // Should not throw even if confetti can't be loaded
      await expect(triggerSnowflakeConfetti()).resolves.not.toThrow();
    });

    it('should create confetti with snowflake colors', async () => {
      const promise = triggerSnowflakeConfetti();
      
      // Wait for the promise to resolve
      await promise;
      
      const call = global.confetti.mock.calls[0][0];
      expect(call.colors).toEqual(['#ffffff', '#e0f2fe', '#dbeafe', '#bfdbfe']);
      expect(call.shapes).toEqual(['circle']);
    });

    it('should stop after duration', async () => {
      let intervalId = null;
      let intervalFn = null;
      
      global.setInterval = vi.fn((fn, delay) => {
        intervalFn = fn;
        intervalId = 123;
        return intervalId;
      });
      
      let currentTime = 1000;
      global.Date.now = vi.fn(() => currentTime);
      
      const promise = triggerSnowflakeConfetti();
      
      // Wait for script to load
      await promise;
      
      // Simulate interval calls - first call at 2000ms
      currentTime = 2000;
      if (intervalFn) intervalFn();
      
      // Second call at 3000ms
      currentTime = 3000;
      if (intervalFn) intervalFn();
      
      // Third call at 4001ms (after 3000ms duration) - should trigger clearInterval
      currentTime = 4001;
      if (intervalFn) intervalFn();
      
      // Should have called clearInterval when timeLeft <= 0
      expect(global.clearInterval).toHaveBeenCalledWith(intervalId);
    });
  });
});
