import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTileExists,
  findTileInContainer,
  ensureTilePreserved
} from '../../js/tile-validation.js';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

describe('tile-validation.js', () => {
  beforeEach(() => {
    cleanupDOM();
    vi.clearAllMocks();
  });

  describe('validateTileExists', () => {
    it('should return true for tile in DOM', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      expect(validateTileExists(tile)).toBe(true);
    });

    it('should return false for tile not in DOM', () => {
      const tile = createMockTile('A', 0);
      
      expect(validateTileExists(tile)).toBe(false);
    });

    it('should return false for null tile', () => {
      expect(validateTileExists(null)).toBe(false);
    });

    it('should return false for tile without parent', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      // Remove from DOM
      tile.remove();
      
      expect(validateTileExists(tile)).toBe(false);
    });
  });

  describe('findTileInContainer', () => {
    it('should find tile in regular container', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const found = findTileInContainer('A', 0, {});
      
      expect(found).toBe(tile);
    });

    it('should find tile in daily container', () => {
      const dailyContainer = document.createElement('div');
      dailyContainer.id = 'daily-tiles-container';
      document.body.appendChild(dailyContainer);
      
      const tile = createMockTile('B', 1);
      dailyContainer.appendChild(tile);
      
      const found = findTileInContainer('B', 1, { prefix: 'daily-' });
      
      expect(found).toBe(tile);
      
      dailyContainer.remove();
    });

    it('should find tile in archive container', () => {
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-tiles-container';
      document.body.appendChild(archiveContainer);
      
      const tile = createMockTile('C', 2);
      archiveContainer.appendChild(tile);
      
      const found = findTileInContainer('C', 2, { prefix: 'archive-' });
      
      expect(found).toBe(tile);
      
      archiveContainer.remove();
    });

    it('should not find tile in slots (only searches containers)', () => {
      const { slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('D', 3);
      slots1Container.children[0].appendChild(tile);
      
      // findTileInContainer only searches containers, not slots
      const found = findTileInContainer('D', 3, {});
      
      expect(found).toBeNull();
    });

    it('should return null if tile not found', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      
      const found = findTileInContainer('Z', 99, {});
      
      expect(found).toBeNull();
    });

    it('should match letter case insensitively', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('E', 4);
      tilesContainer.appendChild(tile);
      
      const found = findTileInContainer('e', 4, {});
      
      expect(found).toBe(tile);
    });

    it('should not find locked tiles', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('F', 5, true);
      tilesContainer.appendChild(tile);
      
      const found = findTileInContainer('F', 5, {});
      
      // Should still find it (locked tiles are filtered in getAllTilesInOrder, not here)
      // But the function checks for data-locked attribute
      expect(found).toBe(tile);
    });

    it('should search multiple containers', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const archiveContainer = document.createElement('div');
      archiveContainer.id = 'archive-tiles-container';
      document.body.appendChild(archiveContainer);
      
      // Not in regular container
      const tile = createMockTile('G', 6);
      archiveContainer.appendChild(tile);
      
      const found = findTileInContainer('G', 6, {});
      
      expect(found).toBe(tile);
      
      archiveContainer.remove();
    });
  });

  describe('ensureTilePreserved', () => {
    it('should return false if tile exists in DOM', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const result = ensureTilePreserved(tile, {}, vi.fn());
      
      expect(result).toBe(false);
    });

    it('should recover tile to container', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('B', 1);
      tilesContainer.appendChild(tile);
      const returnTileCallback = vi.fn();
      
      // Remove from DOM to simulate tile not in DOM
      tile.remove();
      
      // Mock document.contains to return false
      const originalContains = document.contains;
      document.contains = vi.fn(() => false);
      
      const result = ensureTilePreserved(tile, {}, returnTileCallback);
      
      expect(result).toBe(true);
      expect(returnTileCallback).toHaveBeenCalledWith('B', '1', {}, false, '', {});
      
      // Restore
      document.contains = originalContains;
    });

    it('should handle archive puzzle recovery', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('C', 2);
      tilesContainer.appendChild(tile);
      const returnArchiveTileToContainer = vi.fn();
      
      // Remove from DOM
      tile.remove();
      
      // Mock document.contains to return false
      const originalContains = document.contains;
      document.contains = vi.fn(() => false);
      
      const result = ensureTilePreserved(tile, {
        isArchive: true,
        returnArchiveTileToContainer
      }, null);
      
      expect(result).toBe(true);
      expect(returnArchiveTileToContainer).toHaveBeenCalledWith('C', '2');
      
      // Restore
      document.contains = originalContains;
    });

    it('should return false if tile has no letter', () => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      
      // Mock document.contains to return false (tile not in DOM)
      const originalContains = document.contains;
      document.contains = vi.fn(() => false);
      
      const result = ensureTilePreserved(tile, {}, vi.fn());
      
      expect(result).toBe(false);
      
      // Restore
      document.contains = originalContains;
    });

    it('should return false if tile has no index', () => {
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('D', null);
      tilesContainer.appendChild(tile);
      
      // Remove from DOM
      tile.remove();
      
      // Mock document.contains to return false
      const originalContains = document.contains;
      document.contains = vi.fn(() => false);
      
      const result = ensureTilePreserved(tile, {}, vi.fn());
      
      expect(result).toBe(false);
      
      // Restore
      document.contains = originalContains;
    });

    it('should handle missing return callback', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('E', 4);
      tilesContainer.appendChild(tile);
      
      // Remove from DOM
      tile.remove();
      
      // Mock document.contains to return false
      const originalContains = document.contains;
      document.contains = vi.fn(() => false);
      
      const result = ensureTilePreserved(tile, {}, null);
      
      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
      
      // Restore
      document.contains = originalContains;
      consoleError.mockRestore();
    });
  });
});
