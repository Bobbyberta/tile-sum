// DOM setup utilities for tests

/**
 * Creates a mock puzzle HTML structure
 * @param {string} prefix - Prefix for element IDs (e.g., '', 'daily-', 'archive-')
 * @returns {Object} Object containing references to created elements
 */
export function createMockPuzzleDOM(prefix = '') {
  // Clear existing content
  document.body.innerHTML = '';

  // Create tiles container
  const tilesContainer = document.createElement('div');
  tilesContainer.id = `${prefix}tiles-container`;
  tilesContainer.className = 'flex flex-wrap gap-2';
  document.body.appendChild(tilesContainer);

  // Create word slots container
  const wordSlots = document.createElement('div');
  wordSlots.id = prefix ? `${prefix}word-slots` : 'word-slots';
  wordSlots.className = 'space-y-4';
  document.body.appendChild(wordSlots);

  // Create word containers
  const word1Container = document.createElement('div');
  word1Container.className = 'bg-white rounded-lg shadow-md p-4';
  word1Container.setAttribute('data-word-index', '0');
  word1Container.setAttribute('data-max-score', '10');

  const word2Container = document.createElement('div');
  word2Container.className = 'bg-white rounded-lg shadow-md p-4';
  word2Container.setAttribute('data-word-index', '1');
  word2Container.setAttribute('data-max-score', '12');

  // Create slots containers
  const slots1Container = document.createElement('div');
  slots1Container.className = 'flex flex-wrap gap-2 mb-3';
  slots1Container.setAttribute('data-word-slots', '0');

  const slots2Container = document.createElement('div');
  slots2Container.className = 'flex flex-wrap gap-2 mb-3';
  slots2Container.setAttribute('data-word-slots', '1');

  // Create slots for word 1 (4 letters: SNOW)
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot w-12 h-14 rounded-lg';
    slot.setAttribute('data-word-index', '0');
    slot.setAttribute('data-slot-index', String(i));
    slot.setAttribute('droppable', 'true');
    slot.setAttribute('tabindex', '0');
    slots1Container.appendChild(slot);
  }

  // Create slots for word 2 (5 letters: FLAKE)
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot w-12 h-14 rounded-lg';
    slot.setAttribute('data-word-index', '1');
    slot.setAttribute('data-slot-index', String(i));
    slot.setAttribute('droppable', 'true');
    slot.setAttribute('tabindex', '0');
    slots2Container.appendChild(slot);
  }

  // Create score displays
  const score1Display = document.createElement('div');
  score1Display.id = `${prefix}word1-score-display`;
  score1Display.className = 'text-lg font-semibold text-indigo-800 text-right';
  score1Display.textContent = '0 / 10 points';

  const score2Display = document.createElement('div');
  score2Display.id = `${prefix}word2-score-display`;
  score2Display.className = 'text-lg font-semibold text-indigo-800 text-right';
  score2Display.textContent = '0 / 12 points';

  word1Container.appendChild(slots1Container);
  word1Container.appendChild(score1Display);
  word2Container.appendChild(slots2Container);
  word2Container.appendChild(score2Display);

  wordSlots.appendChild(word1Container);
  wordSlots.appendChild(word2Container);

  // Create buttons
  const submitBtn = document.createElement('button');
  submitBtn.id = `${prefix}submit-btn`;
  submitBtn.className = 'bg-indigo-600 text-white px-6 py-3 rounded-lg';
  submitBtn.textContent = 'Submit';
  document.body.appendChild(submitBtn);

  const hintBtn = document.createElement('button');
  hintBtn.id = `${prefix}hint-btn`;
  hintBtn.className = 'bg-indigo-600 text-white px-6 py-3 rounded-lg';
  hintBtn.textContent = 'Get Hint (3 left)';
  document.body.appendChild(hintBtn);

  return {
    tilesContainer,
    wordSlots,
    word1Container,
    word2Container,
    slots1Container,
    slots2Container,
    score1Display,
    score2Display,
    submitBtn,
    hintBtn
  };
}

/**
 * Creates a mock tile element
 * @param {string} letter - Letter for the tile
 * @param {number} index - Tile index
 * @param {boolean} isLocked - Whether tile is locked
 * @returns {HTMLElement} Tile element
 */
export function createMockTile(letter, index = 0, isLocked = false) {
  const tile = document.createElement('div');
  tile.className = `tile bg-indigo-600 text-white rounded-lg p-3 w-12 h-14 flex flex-col items-center justify-center shadow-md`;
  tile.setAttribute('draggable', isLocked ? 'false' : 'true');
  tile.setAttribute('data-letter', letter);
  tile.setAttribute('data-tile-index', String(index));
  if (isLocked) {
    tile.setAttribute('data-locked', 'true');
  }
  tile.setAttribute('role', 'button');
  tile.setAttribute('tabindex', '0');

  const letterDisplay = document.createElement('div');
  letterDisplay.className = 'text-2xl font-bold';
  letterDisplay.textContent = letter;

  const scoreDisplay = document.createElement('div');
  scoreDisplay.className = 'text-xs mt-1 opacity-90';
  scoreDisplay.textContent = '1';

  tile.appendChild(letterDisplay);
  tile.appendChild(scoreDisplay);

  return tile;
}

/**
 * Creates a mock slot element
 * @param {number} wordIndex - Word index (0 or 1)
 * @param {number} slotIndex - Slot index within word
 * @param {boolean} isLocked - Whether slot is locked
 * @returns {HTMLElement} Slot element
 */
export function createMockSlot(wordIndex, slotIndex, isLocked = false) {
  const slot = document.createElement('div');
  slot.className = `slot w-12 h-14 rounded-lg flex items-center justify-center`;
  slot.setAttribute('data-word-index', String(wordIndex));
  slot.setAttribute('data-slot-index', String(slotIndex));
  slot.setAttribute('droppable', 'true');
  if (isLocked) {
    slot.setAttribute('data-locked', 'true');
  }
  slot.setAttribute('role', 'button');
  if (!isLocked) {
    slot.setAttribute('tabindex', '0');
  }
  return slot;
}

/**
 * Cleans up DOM after tests
 */
export function cleanupDOM() {
  document.body.innerHTML = '';
}
