import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel
} from '../../js/touch-drag.js';
import { createMockPuzzleDOM, createMockTile, cleanupDOM } from '../helpers/dom-setup.js';

// Mock dependencies
vi.mock('../../js/puzzle-state.js', () => ({
  setDraggedTile: vi.fn(),
  clearDraggedTile: vi.fn()
}));

vi.mock('../../js/utils.js', () => ({
  debugLog: vi.fn()
}));

vi.mock('../../js/interaction-state.js', () => ({
  getTouchDragState: vi.fn(() => ({
    tile: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    threshold: 10,
    dragGhost: null,
    placeTileCallback: null,
    removeTileCallback: null,
    documentTouchMoveHandler: null,
    documentTouchEndHandler: null
  })),
  setTouchDragState: vi.fn(),
  resetTouchDragState: vi.fn(),
  setTouchInteractionActive: vi.fn(),
  setLastTouchTime: vi.fn(),
  getInteractionState: vi.fn(() => ({
    CLICK_DELAY_AFTER_TOUCH: 300
  }))
}));

vi.mock('../../js/tile-interactions.js', () => ({
  handleTileInteraction: vi.fn()
}));

// Helper to create touch event
function createTouchEvent(type, touches = [], changedTouches = []) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  event.touches = touches;
  event.changedTouches = changedTouches;
  event.preventDefault = vi.fn();
  return event;
}

// Helper to create touch object
function createTouch(clientX, clientY, target = null) {
  return {
    clientX,
    clientY,
    target: target || document.body
  };
}

describe('touch-drag.js', () => {
  let touchDragState;
  let setTouchDragStateMock;
  let getTouchDragStateMock;

  beforeEach(async () => {
    cleanupDOM();
    vi.clearAllMocks();
    
    const interactionState = await import('../../js/interaction-state.js');
    getTouchDragStateMock = interactionState.getTouchDragState;
    setTouchDragStateMock = interactionState.setTouchDragState;
    
    // Reset state
    touchDragState = {
      tile: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      threshold: 10,
      dragGhost: null,
      placeTileCallback: null,
      removeTileCallback: null,
      documentTouchMoveHandler: null,
      documentTouchEndHandler: null
    };
    
    getTouchDragStateMock.mockReturnValue(touchDragState);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleTouchStart', () => {
    it('should initialize touch drag state', async () => {
      const { setTouchInteractionActive, setLastTouchTime } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const touch = createTouch(100, 200, tile);
      const event = createTouchEventWithTarget('touchstart', [touch], [], tile);
      
      // Mock getBoundingClientRect
      tile.getBoundingClientRect = vi.fn(() => ({
        left: 50,
        top: 150,
        width: 40,
        height: 40
      }));
      
      const placeTileCallback = vi.fn();
      const removeTileCallback = vi.fn();
      
      handleTouchStart(event, placeTileCallback, removeTileCallback);
      
      expect(setTouchInteractionActive).toHaveBeenCalledWith(true);
      expect(setLastTouchTime).toHaveBeenCalled();
      expect(setTouchDragStateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          tile: tile,
          startX: 100,
          startY: 200,
          currentX: 100,
          currentY: 200,
          isDragging: false,
          placeTileCallback: placeTileCallback,
          removeTileCallback: removeTileCallback
        })
      );
    });

    it('should not handle locked tiles', () => {
      const tile = createMockTile('A', 0, true);
      const touch = createTouch(100, 200, tile);
      const event = createTouchEventWithTarget('touchstart', [touch], [], tile);
      
      handleTouchStart(event, vi.fn(), vi.fn());
      
      expect(setTouchDragStateMock).not.toHaveBeenCalled();
    });

    it('should not handle multiple touches', () => {
      const tile = createMockTile('A', 0);
      const touch1 = createTouch(100, 200, tile);
      const touch2 = createTouch(150, 250, tile);
      const event = createTouchEvent('touchstart', [touch1, touch2]);
      event.currentTarget = tile;
      
      handleTouchStart(event, vi.fn(), vi.fn());
      
      expect(setTouchDragStateMock).not.toHaveBeenCalled();
    });
  });

  describe('handleTouchMove', () => {
    it('should not start drag if threshold not exceeded', async () => {
      const { setDraggedTile } = await import('../../js/puzzle-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      touchDragState.tile = tile;
      touchDragState.startX = 100;
      touchDragState.startY = 200;
      
      const touch = createTouch(105, 205, tile); // Only 5px movement
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      expect(setDraggedTile).not.toHaveBeenCalled();
      expect(touchDragState.isDragging).toBe(false);
    });

    it('should start drag when threshold exceeded', async () => {
      const { setDraggedTile } = await import('../../js/puzzle-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      touchDragState.tile = tile;
      touchDragState.startX = 100;
      touchDragState.startY = 200;
      touchDragState.isDragging = false;
      
      // Mock elementFromPoint
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => null);
      
      const touch = createTouch(115, 215, tile); // 15px movement
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(setDraggedTile).toHaveBeenCalledWith(tile);
      expect(tile.classList.contains('dragging')).toBe(true);
      expect(touchDragState.isDragging).toBe(true);
      expect(touchDragState.dragGhost).toBeTruthy();
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should update ghost position during drag', () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      touchDragState.dragGhost = document.createElement('div');
      // Mock offsetWidth and offsetHeight using Object.defineProperty
      Object.defineProperty(touchDragState.dragGhost, 'offsetWidth', {
        get: () => 40,
        configurable: true
      });
      Object.defineProperty(touchDragState.dragGhost, 'offsetHeight', {
        get: () => 40,
        configurable: true
      });
      document.body.appendChild(touchDragState.dragGhost);
      
      // Mock elementFromPoint
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => null);
      
      const touch = createTouch(150, 250, tile);
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(touchDragState.dragGhost.style.left).toBe('130px');
      expect(touchDragState.dragGhost.style.top).toBe('230px');
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should highlight slot when dragging over it', () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      
      // Mock elementFromPoint to return slot
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => slot);
      
      const touch = createTouch(100, 200, slot);
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      expect(slot.classList.contains('drag-over')).toBe(true);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should highlight tile in slot for swapping', () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const draggedTile = createMockTile('A', 0);
      const targetTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(targetTile);
      tilesContainer.appendChild(draggedTile);
      
      touchDragState.tile = draggedTile;
      touchDragState.isDragging = true;
      
      // Mock elementFromPoint to return targetTile
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => targetTile);
      
      const touch = createTouch(100, 200, targetTile);
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      expect(targetTile.classList.contains('drag-over')).toBe(true);
      expect(slot.classList.contains('drag-over')).toBe(true);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should not highlight locked slot', () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      slot.setAttribute('data-locked', 'true');
      
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => slot);
      
      const touch = createTouch(100, 200, slot);
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      expect(slot.classList.contains('drag-over')).toBe(false);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should not handle if no tile in state', () => {
      touchDragState.tile = null;
      
      const touch = createTouch(100, 200);
      const event = createTouchEvent('touchmove', [touch]);
      
      handleTouchMove(event);
      
      // Should not throw
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not handle multiple touches', () => {
      const tile = createMockTile('A', 0);
      touchDragState.tile = tile;
      
      const touch1 = createTouch(100, 200);
      const touch2 = createTouch(150, 250);
      const event = createTouchEvent('touchmove', [touch1, touch2]);
      
      handleTouchMove(event);
      
      // Should return early
      expect(touchDragState.isDragging).toBe(false);
    });
  });

  describe('handleTouchEnd', () => {
    it('should place tile on slot when dropped', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      const placeTileCallback = vi.fn();
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      touchDragState.placeTileCallback = placeTileCallback;
      
      // Mock elementFromPoint to return slot
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => slot);
      
      const touch = createTouch(100, 200, slot);
      const event = createTouchEvent('touchend', [], [touch]);
      
      handleTouchEnd(event);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(placeTileCallback).toHaveBeenCalledWith(tile, slot);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should swap tiles when dropped on tile in slot', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const draggedTile = createMockTile('A', 0);
      const targetTile = createMockTile('B', 1);
      const slot = slots1Container.children[0];
      slot.appendChild(targetTile);
      tilesContainer.appendChild(draggedTile);
      
      const placeTileCallback = vi.fn();
      touchDragState.tile = draggedTile;
      touchDragState.isDragging = true;
      touchDragState.placeTileCallback = placeTileCallback;
      
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => targetTile);
      
      const touch = createTouch(100, 200, targetTile);
      const event = createTouchEvent('touchend', [], [touch]);
      
      handleTouchEnd(event);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(placeTileCallback).toHaveBeenCalledWith(draggedTile, slot);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should return tile to container when dropped on container', async () => {
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      const slot = slots1Container.children[0];
      slot.appendChild(tile);
      
      const removeTileCallback = vi.fn();
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      touchDragState.removeTileCallback = removeTileCallback;
      
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => tilesContainer);
      
      const touch = createTouch(100, 200, tilesContainer);
      const event = createTouchEvent('touchend', [], [touch]);
      
      handleTouchEnd(event);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(removeTileCallback).toHaveBeenCalledWith(slot);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should handle tap (not drag) using tile interaction', async () => {
      const { handleTileInteraction } = await import('../../js/tile-interactions.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      const placeTileCallback = vi.fn();
      const removeTileCallback = vi.fn();
      touchDragState.tile = tile;
      touchDragState.isDragging = false; // Not dragging, so it's a tap
      touchDragState.placeTileCallback = placeTileCallback;
      touchDragState.removeTileCallback = removeTileCallback;
      
      const event = createTouchEvent('touchend', [], []);
      
      handleTouchEnd(event);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(handleTileInteraction).toHaveBeenCalledWith(
        tile,
        placeTileCallback,
        removeTileCallback,
        { prefix: '' }
      );
    });

    it('should clean up drag state', async () => {
      const { clearDraggedTile } = await import('../../js/puzzle-state.js');
      const { resetTouchDragState, setTouchInteractionActive } = await import('../../js/interaction-state.js');
      const { tilesContainer, slots1Container } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      const slot = slots1Container.children[0];
      
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      touchDragState.dragGhost = document.createElement('div');
      document.body.appendChild(touchDragState.dragGhost);
      tile.classList.add('dragging');
      
      const originalElementFromPoint = document.elementFromPoint;
      document.elementFromPoint = vi.fn(() => slot);
      
      const touch = createTouch(100, 200, slot);
      const event = createTouchEvent('touchend', [], [touch]);
      
      handleTouchEnd(event);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(clearDraggedTile).toHaveBeenCalled();
      expect(resetTouchDragState).toHaveBeenCalled();
      expect(tile.classList.contains('dragging')).toBe(false);
      expect(setTouchInteractionActive).toHaveBeenCalledWith(false);
      
      document.elementFromPoint = originalElementFromPoint;
    });

    it('should handle missing tile in state', () => {
      touchDragState.tile = null;
      
      const event = createTouchEvent('touchend', [], []);
      
      expect(() => handleTouchEnd(event)).not.toThrow();
    });
  });

  describe('handleTouchCancel', () => {
    it('should clean up drag state on cancel', async () => {
      const { clearDraggedTile } = await import('../../js/puzzle-state.js');
      const { resetTouchDragState, setTouchInteractionActive } = await import('../../js/interaction-state.js');
      const { tilesContainer } = createMockPuzzleDOM();
      const tile = createMockTile('A', 0);
      tilesContainer.appendChild(tile);
      
      touchDragState.tile = tile;
      touchDragState.isDragging = true;
      touchDragState.dragGhost = document.createElement('div');
      document.body.appendChild(touchDragState.dragGhost);
      tile.classList.add('dragging');
      
      const event = createTouchEvent('touchcancel', [], []);
      
      handleTouchCancel(event);
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(clearDraggedTile).toHaveBeenCalled();
      expect(resetTouchDragState).toHaveBeenCalled();
      expect(tile.classList.contains('dragging')).toBe(false);
      expect(setTouchInteractionActive).toHaveBeenCalledWith(false);
    });
  });
});
