import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDaySuffix,
  isTestMode,
  isArchiveTestMode,
  isAdventTestMode,
  getTestModeParam,
  getTestModeParamWithAmpersand,
  debugLog
} from '../../js/utils.js';

describe('utils.js', () => {
  describe('getDaySuffix', () => {
    it('should return "st" for days ending in 1 (except 11)', () => {
      expect(getDaySuffix(1)).toBe('st');
      expect(getDaySuffix(21)).toBe('st');
      expect(getDaySuffix(31)).toBe('st');
    });

    it('should return "nd" for days ending in 2 (except 12)', () => {
      expect(getDaySuffix(2)).toBe('nd');
      expect(getDaySuffix(22)).toBe('nd');
    });

    it('should return "rd" for days ending in 3 (except 13)', () => {
      expect(getDaySuffix(3)).toBe('rd');
      expect(getDaySuffix(23)).toBe('rd');
    });

    it('should return "th" for days ending in 0, 4-9', () => {
      expect(getDaySuffix(4)).toBe('th');
      expect(getDaySuffix(5)).toBe('th');
      expect(getDaySuffix(6)).toBe('th');
      expect(getDaySuffix(7)).toBe('th');
      expect(getDaySuffix(8)).toBe('th');
      expect(getDaySuffix(9)).toBe('th');
      expect(getDaySuffix(10)).toBe('th');
      expect(getDaySuffix(20)).toBe('th');
    });

    it('should return "th" for 11, 12, 13', () => {
      expect(getDaySuffix(11)).toBe('th');
      expect(getDaySuffix(12)).toBe('th');
      expect(getDaySuffix(13)).toBe('th');
    });
  });

  describe('isTestMode', () => {
    beforeEach(() => {
      // Reset URL
      delete window.location;
      window.location = { search: '' };
    });

    it('should return true for archive test mode', () => {
      window.location.search = '?test=archive';
      expect(isTestMode()).toBe(true);
    });

    it('should return true for advent test mode', () => {
      window.location.search = '?test=advent';
      expect(isTestMode()).toBe(true);
    });

    it('should return false for other test values', () => {
      window.location.search = '?test=other';
      expect(isTestMode()).toBe(false);
    });

    it('should return false when no test parameter', () => {
      window.location.search = '';
      expect(isTestMode()).toBe(false);
    });
  });

  describe('isArchiveTestMode', () => {
    beforeEach(() => {
      delete window.location;
      window.location = { search: '' };
    });

    it('should return true for archive test mode', () => {
      window.location.search = '?test=archive';
      expect(isArchiveTestMode()).toBe(true);
    });

    it('should return false for advent test mode', () => {
      window.location.search = '?test=advent';
      expect(isArchiveTestMode()).toBe(false);
    });

    it('should return false when no test parameter', () => {
      window.location.search = '';
      expect(isArchiveTestMode()).toBe(false);
    });
  });

  describe('isAdventTestMode', () => {
    beforeEach(() => {
      delete window.location;
      window.location = { search: '' };
    });

    it('should return true for advent test mode', () => {
      window.location.search = '?test=advent';
      expect(isAdventTestMode()).toBe(true);
    });

    it('should return false for archive test mode', () => {
      window.location.search = '?test=archive';
      expect(isAdventTestMode()).toBe(false);
    });

    it('should return false when no test parameter', () => {
      window.location.search = '';
      expect(isAdventTestMode()).toBe(false);
    });
  });

  describe('getTestModeParam', () => {
    beforeEach(() => {
      delete window.location;
      window.location = { search: '' };
    });

    it('should return query string for archive test mode', () => {
      window.location.search = '?test=archive';
      expect(getTestModeParam()).toBe('?test=archive');
    });

    it('should return query string for advent test mode', () => {
      window.location.search = '?test=advent';
      expect(getTestModeParam()).toBe('?test=advent');
    });

    it('should return empty string when no test parameter', () => {
      window.location.search = '';
      expect(getTestModeParam()).toBe('');
    });

    it('should return empty string for invalid test parameter', () => {
      window.location.search = '?test=other';
      expect(getTestModeParam()).toBe('');
    });
  });

  describe('getTestModeParamWithAmpersand', () => {
    beforeEach(() => {
      delete window.location;
      window.location = { search: '' };
    });

    it('should return ampersand query string for archive test mode', () => {
      window.location.search = '?test=archive';
      expect(getTestModeParamWithAmpersand()).toBe('&test=archive');
    });

    it('should return ampersand query string for advent test mode', () => {
      window.location.search = '?test=advent';
      expect(getTestModeParamWithAmpersand()).toBe('&test=advent');
    });

    it('should return empty string when no test parameter', () => {
      window.location.search = '';
      expect(getTestModeParamWithAmpersand()).toBe('');
    });
  });

  describe('debugLog', () => {
    let originalConsoleLog;
    let consoleLogSpy;

    beforeEach(() => {
      originalConsoleLog = console.log;
      consoleLogSpy = vi.fn();
      console.log = consoleLogSpy;
    });

    afterEach(() => {
      console.log = originalConsoleLog;
    });

    it('should log in debug mode (localhost)', () => {
      delete window.location;
      window.location = { hostname: 'localhost', search: '' };
      debugLog('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });

    it('should log in debug mode (127.0.0.1)', () => {
      delete window.location;
      window.location = { hostname: '127.0.0.1', search: '' };
      debugLog('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });

    it('should log when test mode is enabled', () => {
      delete window.location;
      window.location = { hostname: 'example.com', search: '?test=archive' };
      debugLog('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('test message');
    });

    it('should not log in production mode', () => {
      delete window.location;
      window.location = { hostname: 'example.com', search: '' };
      debugLog('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
