import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDraggedTile,
  setDraggedTile,
  clearDraggedTile,
  getSelectedTile,
  setSelectedTile,
  clearSelectedTile,
  getHintsRemaining,
  setHintsRemaining,
  decrementHintsRemaining,
  getArchiveHintsRemaining,
  setArchiveHintsRemaining,
  decrementArchiveHintsRemaining,
  getSolutionShown,
  setSolutionShown,
  getArchiveSolutionShown,
  setArchiveSolutionShown
} from '../../js/puzzle-state.js';

describe('puzzle-state.js', () => {
  describe('Dragged Tile', () => {
    beforeEach(() => {
      clearDraggedTile();
    });

    it('should return null initially', () => {
      expect(getDraggedTile()).toBeNull();
    });

    it('should set and get dragged tile', () => {
      const mockTile = { id: 'tile-1' };
      setDraggedTile(mockTile);
      expect(getDraggedTile()).toBe(mockTile);
    });

    it('should clear dragged tile', () => {
      const mockTile = { id: 'tile-1' };
      setDraggedTile(mockTile);
      clearDraggedTile();
      expect(getDraggedTile()).toBeNull();
    });
  });

  describe('Selected Tile', () => {
    beforeEach(() => {
      clearSelectedTile();
    });

    it('should return null initially', () => {
      expect(getSelectedTile()).toBeNull();
    });

    it('should set and get selected tile', () => {
      const mockTile = { id: 'tile-1' };
      setSelectedTile(mockTile);
      expect(getSelectedTile()).toBe(mockTile);
    });

    it('should clear selected tile', () => {
      const mockTile = { id: 'tile-1' };
      setSelectedTile(mockTile);
      clearSelectedTile();
      expect(getSelectedTile()).toBeNull();
    });
  });

  describe('Hints Remaining', () => {
    beforeEach(() => {
      setHintsRemaining(3);
    });

    it('should return initial hints count', () => {
      expect(getHintsRemaining()).toBe(3);
    });

    it('should set hints remaining', () => {
      setHintsRemaining(5);
      expect(getHintsRemaining()).toBe(5);
    });

    it('should decrement hints remaining', () => {
      setHintsRemaining(3);
      decrementHintsRemaining();
      expect(getHintsRemaining()).toBe(2);
    });

    it('should not go below 0 when decrementing', () => {
      setHintsRemaining(0);
      decrementHintsRemaining();
      expect(getHintsRemaining()).toBe(0);
    });

    it('should handle multiple decrements', () => {
      setHintsRemaining(3);
      decrementHintsRemaining();
      decrementHintsRemaining();
      decrementHintsRemaining();
      expect(getHintsRemaining()).toBe(0);
    });
  });

  describe('Archive Hints Remaining', () => {
    beforeEach(() => {
      setArchiveHintsRemaining(3);
    });

    it('should return initial archive hints count', () => {
      expect(getArchiveHintsRemaining()).toBe(3);
    });

    it('should set archive hints remaining', () => {
      setArchiveHintsRemaining(5);
      expect(getArchiveHintsRemaining()).toBe(5);
    });

    it('should decrement archive hints remaining', () => {
      setArchiveHintsRemaining(3);
      decrementArchiveHintsRemaining();
      expect(getArchiveHintsRemaining()).toBe(2);
    });

    it('should not go below 0 when decrementing', () => {
      setArchiveHintsRemaining(0);
      decrementArchiveHintsRemaining();
      expect(getArchiveHintsRemaining()).toBe(0);
    });
  });

  describe('Solution Shown', () => {
    beforeEach(() => {
      setSolutionShown(false);
    });

    it('should return false initially', () => {
      expect(getSolutionShown()).toBe(false);
    });

    it('should set solution shown', () => {
      setSolutionShown(true);
      expect(getSolutionShown()).toBe(true);
    });

    it('should toggle solution shown', () => {
      setSolutionShown(false);
      setSolutionShown(true);
      expect(getSolutionShown()).toBe(true);
      setSolutionShown(false);
      expect(getSolutionShown()).toBe(false);
    });
  });

  describe('Archive Solution Shown', () => {
    beforeEach(() => {
      setArchiveSolutionShown(false);
    });

    it('should return false initially', () => {
      expect(getArchiveSolutionShown()).toBe(false);
    });

    it('should set archive solution shown', () => {
      setArchiveSolutionShown(true);
      expect(getArchiveSolutionShown()).toBe(true);
    });

    it('should toggle archive solution shown', () => {
      setArchiveSolutionShown(false);
      setArchiveSolutionShown(true);
      expect(getArchiveSolutionShown()).toBe(true);
      setArchiveSolutionShown(false);
      expect(getArchiveSolutionShown()).toBe(false);
    });
  });
});
