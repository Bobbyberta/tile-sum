// Interaction state management to prevent duplicate actions and race conditions

// Interaction state management
let interactionState = {
    isProcessing: false,
    lastTouchTime: 0,
    touchInteractionActive: false,
    CLICK_DELAY_AFTER_TOUCH: 300, // ms
    lastClickTime: 0,
    lastClickedTile: null,
    DOUBLE_CLICK_THRESHOLD: 300 // ms
};

// Touch drag state
let touchDragState = {
    isDragging: false,
    tile: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    threshold: 10, // pixels to move before drag starts
    dragGhost: null,
    placeTileCallback: null,
    removeTileCallback: null,
    documentTouchMoveHandler: null,
    documentTouchEndHandler: null
};

// Export getters and setters for interaction state
export function getInteractionState() {
    return interactionState;
}

export function setIsProcessing(value) {
    interactionState.isProcessing = value;
}

export function getIsProcessing() {
    return interactionState.isProcessing;
}

export function setLastTouchTime(value) {
    interactionState.lastTouchTime = value;
}

export function getLastTouchTime() {
    return interactionState.lastTouchTime;
}

export function setTouchInteractionActive(value) {
    interactionState.touchInteractionActive = value;
}

export function getTouchInteractionActive() {
    return interactionState.touchInteractionActive;
}

export function setLastClickTime(value) {
    interactionState.lastClickTime = value;
}

export function getLastClickTime() {
    return interactionState.lastClickTime;
}

export function setLastClickedTile(value) {
    interactionState.lastClickedTile = value;
}

export function getLastClickedTile() {
    return interactionState.lastClickedTile;
}

// Export getters and setters for touch drag state
export function getTouchDragState() {
    return touchDragState;
}

export function setTouchDragState(updates) {
    Object.assign(touchDragState, updates);
}

export function resetTouchDragState() {
    touchDragState.isDragging = false;
    touchDragState.tile = null;
    touchDragState.startX = 0;
    touchDragState.startY = 0;
    touchDragState.currentX = 0;
    touchDragState.currentY = 0;
    touchDragState.dragGhost = null;
    touchDragState.placeTileCallback = null;
    touchDragState.removeTileCallback = null;
    touchDragState.documentTouchMoveHandler = null;
    touchDragState.documentTouchEndHandler = null;
}
