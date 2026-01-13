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
    });

    it('should call confetti library', () => {
      triggerSnowflakeConfetti();
      
      expect(global.confetti).toHaveBeenCalled();
    });

    it('should return early if confetti not available', () => {
      delete global.confetti;
      
      expect(() => triggerSnowflakeConfetti()).not.toThrow();
    });

    it('should create confetti with snowflake colors', () => {
      triggerSnowflakeConfetti();
      
      const call = global.confetti.mock.calls[0][0];
      expect(call.colors).toEqual(['#ffffff', '#e0f2fe', '#dbeafe', '#bfdbfe']);
      expect(call.shapes).toEqual(['circle']);
    });

    it('should stop after duration', () => {
      let intervalId = null;
      let intervalFn = null;
      
      global.setInterval = vi.fn((fn, delay) => {
        intervalFn = fn;
        intervalId = 123;
        return intervalId;
      });
      
      let currentTime = 1000;
      global.Date.now = vi.fn(() => currentTime);
      
      triggerSnowflakeConfetti();
      
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
