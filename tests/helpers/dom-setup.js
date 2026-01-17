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
  word1Container.className = 'bg-slot-container rounded-[24px] shadow-container p-2 flex flex-col items-start gap-3';
  word1Container.setAttribute('data-word-index', '0');
  word1Container.setAttribute('data-max-score', '10');

  const word2Container = document.createElement('div');
  word2Container.className = 'bg-slot-container rounded-[24px] shadow-container p-2 flex flex-col items-start gap-3';
  word2Container.setAttribute('data-word-index', '1');
  word2Container.setAttribute('data-max-score', '12');

  // Create slots containers
  const slots1Container = document.createElement('div');
  slots1Container.className = 'flex flex-wrap gap-[6px]';
  slots1Container.setAttribute('data-word-slots', '0');

  const slots2Container = document.createElement('div');
  slots2Container.className = 'flex flex-wrap gap-[6px]';
  slots2Container.setAttribute('data-word-slots', '1');

  // Create slots for word 1 (4 letters: SNOW)
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot w-[60px] h-[60px] rounded-[8px]';
    slot.setAttribute('data-word-index', '0');
    slot.setAttribute('data-slot-index', String(i));
    slot.setAttribute('droppable', 'true');
    slot.setAttribute('tabindex', '0');
    slots1Container.appendChild(slot);
  }

  // Create slots for word 2 (5 letters: FLAKE)
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot w-[60px] h-[60px] rounded-[8px]';
    slot.setAttribute('data-word-index', '1');
    slot.setAttribute('data-slot-index', String(i));
    slot.setAttribute('droppable', 'true');
    slot.setAttribute('tabindex', '0');
    slots2Container.appendChild(slot);
  }

  // Create score displays
  const score1Display = document.createElement('div');
  score1Display.id = `${prefix}word1-score-display`;
  score1Display.className = 'bg-category-bg rounded-[16px] px-3 py-2.5 text-white font-rem';
  score1Display.style.fontSize = '20px';
  score1Display.style.lineHeight = '25px';
  score1Display.style.fontWeight = '500';
  score1Display.textContent = '0 / 10 points';

  const score2Display = document.createElement('div');
  score2Display.id = `${prefix}word2-score-display`;
  score2Display.className = 'bg-category-bg rounded-[16px] px-3 py-2.5 text-white font-rem';
  score2Display.style.fontSize = '20px';
  score2Display.style.lineHeight = '25px';
  score2Display.style.fontWeight = '500';
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
  submitBtn.className = 'bg-submit text-text-primary font-black rounded-[24px] shadow-button px-6 py-3 font-rem';
  submitBtn.style.fontSize = '24px';
  submitBtn.style.lineHeight = '30px';
  submitBtn.textContent = 'Submit';
  document.body.appendChild(submitBtn);

  const hintBtn = document.createElement('button');
  hintBtn.id = `${prefix}hint-btn`;
  hintBtn.className = 'bg-hint text-white font-bold rounded-[24px] shadow-button px-6 py-3 font-rem';
  hintBtn.style.fontSize = '24px';
  hintBtn.style.lineHeight = '30px';
  hintBtn.textContent = 'Hint (3)';
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
  tile.className = `tile bg-tile-bg border border-tile-border text-text-primary rounded-[12px] p-3 w-[60px] h-[60px] flex items-center justify-center shadow-md font-inter relative`;
  tile.setAttribute('draggable', isLocked ? 'false' : 'true');
  tile.setAttribute('data-letter', letter);
  if (index !== null && index !== undefined) {
    tile.setAttribute('data-tile-index', String(index));
  }
  if (isLocked) {
    tile.setAttribute('data-locked', 'true');
  }
  tile.setAttribute('role', 'button');
  tile.setAttribute('tabindex', '0');

  // Create a wrapper for the letter that will be centered
  const letterWrapper = document.createElement('div');
  letterWrapper.className = 'relative inline-block';
  
  const letterDisplay = document.createElement('div');
  letterDisplay.className = 'font-bold font-inter';
  letterDisplay.style.fontSize = '40px';
  letterDisplay.style.lineHeight = '48px';
  letterDisplay.textContent = letter;

  const scoreDisplay = document.createElement('div');
  scoreDisplay.className = 'opacity-90 font-inter absolute';
  scoreDisplay.style.fontSize = '20px';
  scoreDisplay.style.lineHeight = '24px';
  scoreDisplay.style.bottom = '0px';
  scoreDisplay.style.left = 'calc(100% + 2px)';
  scoreDisplay.textContent = '1';

  letterWrapper.appendChild(letterDisplay);
  letterWrapper.appendChild(scoreDisplay);
  tile.appendChild(letterWrapper);

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
  slot.className = `slot w-[60px] h-[60px] rounded-[8px] flex items-center justify-center`;
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
