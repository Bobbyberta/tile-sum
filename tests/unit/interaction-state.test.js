import { describe, it, expect, beforeEach } from 'vitest';
import {
  getInteractionState,
  setIsProcessing,
  getIsProcessing,
  setLastTouchTime,
  getLastTouchTime,
  setTouchInteractionActive,
  getTouchInteractionActive,
  setLastClickTime,
  getLastClickTime,
  setLastClickedTile,
  getLastClickedTile,
  getTouchDragState,
  setTouchDragState,
  resetTouchDragState
} from '../../js/interaction-state.js';

describe('interaction-state.js', () => {
  beforeEach(() => {
    // Reset state before each test
    setIsProcessing(false);
    setLastTouchTime(0);
    setTouchInteractionActive(false);
    setLastClickTime(0);
    setLastClickedTile(null);
    resetTouchDragState();
  });

  describe('getInteractionState', () => {
    it('should return interaction state object', () => {
      const state = getInteractionState();
      expect(state).toHaveProperty('isProcessing');
      expect(state).toHaveProperty('lastTouchTime');
      expect(state).toHaveProperty('touchInteractionActive');
      expect(state).toHaveProperty('CLICK_DELAY_AFTER_TOUCH');
      expect(state).toHaveProperty('lastClickTime');
      expect(state).toHaveProperty('lastClickedTile');
      expect(state).toHaveProperty('DOUBLE_CLICK_THRESHOLD');
    });
  });

  describe('isProcessing', () => {
    it('should set and get isProcessing', () => {
      expect(getIsProcessing()).toBe(false);
      setIsProcessing(true);
      expect(getIsProcessing()).toBe(true);
      setIsProcessing(false);
      expect(getIsProcessing()).toBe(false);
    });
  });

  describe('lastTouchTime', () => {
    it('should set and get lastTouchTime', () => {
      expect(getLastTouchTime()).toBe(0);
      const time = Date.now();
      setLastTouchTime(time);
      expect(getLastTouchTime()).toBe(time);
      setLastTouchTime(0);
      expect(getLastTouchTime()).toBe(0);
    });
  });

  describe('touchInteractionActive', () => {
    it('should set and get touchInteractionActive', () => {
      expect(getTouchInteractionActive()).toBe(false);
      setTouchInteractionActive(true);
      expect(getTouchInteractionActive()).toBe(true);
      setTouchInteractionActive(false);
      expect(getTouchInteractionActive()).toBe(false);
    });
  });

  describe('lastClickTime', () => {
    it('should set and get lastClickTime', () => {
      expect(getLastClickTime()).toBe(0);
      const time = Date.now();
      setLastClickTime(time);
      expect(getLastClickTime()).toBe(time);
      setLastClickTime(0);
      expect(getLastClickTime()).toBe(0);
    });
  });

  describe('lastClickedTile', () => {
    it('should set and get lastClickedTile', () => {
      expect(getLastClickedTile()).toBe(null);
      const tile = document.createElement('div');
      tile.className = 'tile';
      setLastClickedTile(tile);
      expect(getLastClickedTile()).toBe(tile);
      setLastClickedTile(null);
      expect(getLastClickedTile()).toBe(null);
    });
  });

  describe('touchDragState', () => {
    it('should get touch drag state', () => {
      const state = getTouchDragState();
      expect(state).toHaveProperty('isDragging');
      expect(state).toHaveProperty('tile');
      expect(state).toHaveProperty('startX');
      expect(state).toHaveProperty('startY');
      expect(state).toHaveProperty('currentX');
      expect(state).toHaveProperty('currentY');
      expect(state).toHaveProperty('threshold');
      expect(state).toHaveProperty('dragGhost');
      expect(state).toHaveProperty('placeTileCallback');
      expect(state).toHaveProperty('removeTileCallback');
      expect(state).toHaveProperty('documentTouchMoveHandler');
      expect(state).toHaveProperty('documentTouchEndHandler');
    });

    it('should set touch drag state with updates', () => {
      const tile = document.createElement('div');
      setTouchDragState({
        isDragging: true,
        tile: tile,
        startX: 10,
        startY: 20
      });

      const state = getTouchDragState();
      expect(state.isDragging).toBe(true);
      expect(state.tile).toBe(tile);
      expect(state.startX).toBe(10);
      expect(state.startY).toBe(20);
    });

    it('should partially update touch drag state', () => {
      setTouchDragState({ startX: 100 });
      const state = getTouchDragState();
      expect(state.startX).toBe(100);
      // Other properties should remain unchanged
      expect(state.isDragging).toBe(false);
    });

    it('should reset touch drag state', () => {
      const tile = document.createElement('div');
      const callback = () => {};
      
      setTouchDragState({
        isDragging: true,
        tile: tile,
        startX: 10,
        startY: 20,
        currentX: 15,
        currentY: 25,
        dragGhost: document.createElement('div'),
        placeTileCallback: callback,
        removeTileCallback: callback,
        documentTouchMoveHandler: callback,
        documentTouchEndHandler: callback
      });

      resetTouchDragState();

      const state = getTouchDragState();
      expect(state.isDragging).toBe(false);
      expect(state.tile).toBe(null);
      expect(state.startX).toBe(0);
      expect(state.startY).toBe(0);
      expect(state.currentX).toBe(0);
      expect(state.currentY).toBe(0);
      expect(state.dragGhost).toBe(null);
      expect(state.placeTileCallback).toBe(null);
      expect(state.removeTileCallback).toBe(null);
      expect(state.documentTouchMoveHandler).toBe(null);
      expect(state.documentTouchEndHandler).toBe(null);
    });
  });
});
