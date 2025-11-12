// Update Christmas countdown overlay
function updateCountdown() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownDays = document.getElementById('countdown-days');
    const mainContent = document.getElementById('main-content');
    
    if (!countdownOverlay || !countdownDays) return;
    
    // Check for test mode - hide countdown in test mode
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test') === 'true';
    
    if (testMode) {
        countdownOverlay.classList.add('hidden');
        if (mainContent) {
            mainContent.style.paddingTop = '';
        }
        return;
    }
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const decemberFirst = new Date(currentYear, 11, 1); // Month is 0-indexed, so 11 = December
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    decemberFirst.setHours(0, 0, 0, 0);
    
    // Calculate days remaining
    const timeDiff = decemberFirst.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Show countdown only if we're before December 1st
    if (daysRemaining > 0) {
        countdownOverlay.classList.remove('hidden');
        
        // Update countdown text
        if (daysRemaining === 1) {
            countdownDays.textContent = '1 day remaining!';
        } else {
            countdownDays.textContent = `${daysRemaining} days remaining!`;
        }
        
        // Add padding to main content to account for overlay
        if (mainContent) {
            mainContent.style.paddingTop = '80px';
        }
    } else {
        // Hide countdown if it's December 1st or later
        countdownOverlay.classList.add('hidden');
        if (mainContent) {
            mainContent.style.paddingTop = '';
        }
    }
}

// Calendar initialization
function initCalendar() {
    const calendar = document.getElementById('calendar');
    if (!calendar) return;

    // Check for test mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test') === 'true';

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // December 1-25
    const adventStart = new Date(currentYear, 11, 1); // Month is 0-indexed, so 11 = December
    const adventEnd = new Date(currentYear, 11, 25);

    for (let day = 1; day <= 25; day++) {
        const dayDate = new Date(currentYear, 11, day);
        const isUnlocked = testMode || (dayDate <= today && dayDate >= adventStart);
        const isToday = dayDate.toDateString() === today.toDateString();

        const dayElement = document.createElement('div');
        dayElement.className = `relative p-4 rounded-lg text-center transition-all ${
            isUnlocked 
                ? 'bg-white shadow-md hover:shadow-lg cursor-pointer border-2 border-indigo-300 hover:border-indigo-500' 
                : 'bg-gray-200 opacity-60 cursor-not-allowed border-2 border-gray-300'
        }`;
        
        if (isUnlocked) {
            dayElement.setAttribute('role', 'button');
            dayElement.setAttribute('tabindex', '0');
            dayElement.setAttribute('aria-label', `Puzzle for December ${day}`);
            dayElement.addEventListener('click', () => {
                // Preserve test mode in puzzle URL if active
                const testParam = testMode ? '&test=true' : '';
                window.location.href = `puzzle.html?day=${day}${testParam}`;
            });
            dayElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const testParam = testMode ? '&test=true' : '';
                    window.location.href = `puzzle.html?day=${day}${testParam}`;
                }
            });
        } else {
            dayElement.setAttribute('aria-label', `Puzzle for December ${day} (locked)`);
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = `text-2xl font-bold ${
            isUnlocked ? 'text-indigo-900' : 'text-gray-500'
        }`;
        dayNumber.textContent = day;

        const dayLabel = document.createElement('div');
        dayLabel.className = `text-sm mt-1 ${
            isUnlocked ? 'text-indigo-900' : 'text-gray-500'
        }`;
        dayLabel.textContent = 'Dec';

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayLabel);

        if (isToday) {
            const todayBadge = document.createElement('div');
            todayBadge.className = 'absolute top-1 right-1 w-3 h-3 bg-indigo-600 rounded-full';
            todayBadge.setAttribute('aria-label', 'Today');
            dayElement.appendChild(todayBadge);
        }

        calendar.appendChild(dayElement);
    }
}

// Update social sharing meta tags for puzzle pages
function updateSocialMetaTags(day) {
    if (!PUZZLE_DATA[day]) return;
    
    const puzzle = PUZZLE_DATA[day];
    const baseUrl = 'https://sum-tile.uk';
    const puzzleUrl = `${baseUrl}/puzzle.html?day=${day}`;
    const title = `Puzzle Day ${day} - Advent Calendar Puzzle | Word Puzzle Game`;
    const description = `Play today's advent calendar puzzle! Arrange letter tiles to form the words: ${puzzle.words.join(' and ')}. Daily word puzzle game challenge with Scrabble scoring.`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', description);
    }
    
    // Update canonical URL
    const canonicalUrl = document.getElementById('canonical-url');
    if (canonicalUrl) {
        canonicalUrl.setAttribute('href', puzzleUrl);
    }
    
    // Update Open Graph tags
    const ogTitle = document.getElementById('og-title');
    const ogDescription = document.getElementById('og-description');
    const ogUrl = document.getElementById('og-url');
    
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDescription) ogDescription.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', puzzleUrl);
    
    // Update Twitter Card tags
    const twitterTitle = document.getElementById('twitter-title');
    const twitterDescription = document.getElementById('twitter-description');
    
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDescription) twitterDescription.setAttribute('content', description);
    
    // Update page title
    const pageTitle = document.querySelector('title');
    if (pageTitle) {
        pageTitle.textContent = title;
    }
    
    // Update structured data (WebPage)
    const structuredDataWebpage = document.getElementById('structured-data-webpage');
    if (structuredDataWebpage) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": `Puzzle Day ${day} - Advent Calendar Puzzle`,
            "description": `Daily word puzzle challenge - Arrange letter tiles to form the words: ${puzzle.words.join(' and ')}.`,
            "url": puzzleUrl,
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": `${baseUrl}/`
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": `Puzzle Day ${day}`,
                        "item": puzzleUrl
                    }
                ]
            }
        };
        structuredDataWebpage.textContent = JSON.stringify(structuredData);
    }
}

// Puzzle initialization
function initPuzzle(day) {
    // Update puzzle title with formatted date
    const puzzleTitle = document.getElementById('puzzle-title');
    if (puzzleTitle) {
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, 11, day); // December is month 11 (0-indexed)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        const daySuffix = getDaySuffix(day);
        puzzleTitle.textContent = `${dayName} ${day}${daySuffix} December`;
    }
    
    // Update day number display (for title tag)
    const dayNumber = document.getElementById('day-number');
    if (dayNumber) dayNumber.textContent = day;

    // Check if puzzle exists
    if (!PUZZLE_DATA[day]) {
        showFeedback('Puzzle not found', 'error');
        return;
    }

    // Update social sharing meta tags
    updateSocialMetaTags(day);

    const puzzle = PUZZLE_DATA[day];
    const letters = getPuzzleLetters(day);
    
    // Calculate maximum scores for each word
    const maxScores = puzzle.solution.map(word => calculateWordScore(word));
    
    // Create tiles
    const tilesContainer = document.getElementById('tiles-container');
    tilesContainer.innerHTML = '';
    
    // Make tiles container a drop zone
    tilesContainer.addEventListener('dragover', handleTilesContainerDragOver);
    tilesContainer.addEventListener('drop', handleTilesContainerDrop);
    tilesContainer.addEventListener('dragleave', handleTilesContainerDragLeave);
    
    letters.forEach((letter, index) => {
        const tile = createTile(letter, index);
        tilesContainer.appendChild(tile);
    });
    
    // Update placeholder visibility
    updatePlaceholderTile();

    // Create word slots
    const wordSlots = document.getElementById('word-slots');
    wordSlots.innerHTML = '';
    
    puzzle.words.forEach((word, wordIndex) => {
        const wordContainer = document.createElement('div');
        wordContainer.className = 'bg-white rounded-lg shadow-md p-4';
        wordContainer.setAttribute('data-word-index', wordIndex);
        wordContainer.setAttribute('data-max-score', maxScores[wordIndex]);
        
        // Hidden label for screen readers
        const wordLabel = document.createElement('h3');
        wordLabel.className = 'sr-only';
        wordLabel.textContent = `Word ${wordIndex + 1} (${word.length} letters)`;
        wordContainer.appendChild(wordLabel);

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'flex flex-wrap gap-2 mb-3';
        slotsContainer.setAttribute('data-word-slots', wordIndex);
        
        for (let i = 0; i < word.length; i++) {
            const slot = createSlot(wordIndex, i);
            slotsContainer.appendChild(slot);
        }
        
        wordContainer.appendChild(slotsContainer);
        
        // Score display below the slots
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'text-lg font-semibold text-indigo-800 text-right';
        scoreDisplay.setAttribute('id', `word${wordIndex + 1}-score-display`);
        scoreDisplay.textContent = `0 / ${maxScores[wordIndex]} points`;
        wordContainer.appendChild(scoreDisplay);
        
        wordSlots.appendChild(wordContainer);
    });

    // Setup submit button
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.addEventListener('click', () => {
        checkSolution(day);
    });

    // Initialize hint counter
    hintsRemaining = 3;
    
    // Setup hint button
    const hintBtn = document.getElementById('hint-btn');
    hintBtn.disabled = false;
    updateHintButtonText();
    hintBtn.addEventListener('click', () => {
        provideHint(day);
    });

    // Setup help modal
    const helpBtn = document.getElementById('help-btn');
    const closeHelpModalBtn = document.getElementById('close-help-modal-btn');
    const closeHelpModalX = document.getElementById('close-help-modal');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelpModal);
    }
    if (closeHelpModalBtn) {
        closeHelpModalBtn.addEventListener('click', closeHelpModal);
    }
    if (closeHelpModalX) {
        closeHelpModalX.addEventListener('click', closeHelpModal);
    }

    // Close help modal when clicking outside
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                closeHelpModal();
            }
        });
    }

    // Setup error modal close button
    const closeErrorModalBtn = document.getElementById('close-error-modal-btn');
    const closeErrorModalX = document.getElementById('close-error-modal');
    if (closeErrorModalBtn) {
        closeErrorModalBtn.addEventListener('click', closeErrorModal);
    }
    if (closeErrorModalX) {
        closeErrorModalX.addEventListener('click', closeErrorModal);
    }

    // Close error modal when clicking outside
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                closeErrorModal();
            }
        });
    }

    // Update score display
    updateScoreDisplay();
}

// Update placeholder tile visibility
function updatePlaceholderTile() {
    const tilesContainer = document.getElementById('tiles-container');
    if (!tilesContainer) return;
    
    const actualTiles = tilesContainer.querySelectorAll('.tile:not([data-placeholder])');
    const placeholder = tilesContainer.querySelector('[data-placeholder]');
    
    if (actualTiles.length === 0) {
        // Show placeholder if no tiles
        if (!placeholder) {
            const placeholderTile = document.createElement('div');
            placeholderTile.className = 'tile bg-transparent text-transparent rounded-lg p-3 w-14 h-14 flex flex-col items-center justify-center pointer-events-none';
            placeholderTile.setAttribute('data-placeholder', 'true');
            placeholderTile.setAttribute('aria-hidden', 'true');
            
            const letterDisplay = document.createElement('div');
            letterDisplay.className = 'text-2xl font-bold';
            letterDisplay.textContent = 'A';
            
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'text-xs mt-1 opacity-90';
            scoreDisplay.textContent = '1';
            
            placeholderTile.appendChild(letterDisplay);
            placeholderTile.appendChild(scoreDisplay);
            tilesContainer.appendChild(placeholderTile);
        }
    } else {
        // Hide placeholder if tiles exist
        if (placeholder) {
            placeholder.remove();
        }
    }
}

// Create a tile element
function createTile(letter, index, isLocked = false) {
    const tile = document.createElement('div');
    tile.className = `tile bg-indigo-600 text-white rounded-lg p-3 w-14 h-14 flex flex-col items-center justify-center shadow-md transition-shadow ${isLocked ? 'locked' : 'hover:shadow-lg'}`;
    tile.setAttribute('draggable', isLocked ? 'false' : 'true');
    tile.setAttribute('data-letter', letter);
    tile.setAttribute('data-tile-index', index);
    if (isLocked) {
        tile.setAttribute('data-locked', 'true');
    }
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', `Tile with letter ${letter}, score ${SCRABBLE_SCORES[letter.toUpperCase()] || 0}${isLocked ? ' (locked)' : ''}`);

    const letterDisplay = document.createElement('div');
    letterDisplay.className = 'text-2xl font-bold';
    letterDisplay.textContent = letter;

    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'text-xs mt-1 opacity-90';
    scoreDisplay.textContent = SCRABBLE_SCORES[letter.toUpperCase()] || 0;

    tile.appendChild(letterDisplay);
    tile.appendChild(scoreDisplay);

    // Drag and drop handlers only if not locked
    if (!isLocked) {
        tile.addEventListener('dragstart', handleDragStart);
        tile.addEventListener('dragend', handleDragEnd);
        tile.addEventListener('click', handleTileClick);
        tile.addEventListener('keydown', handleTileKeyDown);
    }

    return tile;
}

// Create a slot element
function createSlot(wordIndex, slotIndex, isLocked = false) {
    const slot = document.createElement('div');
    slot.className = `slot w-14 h-14 rounded-lg flex items-center justify-center ${isLocked ? 'locked' : ''}`;
    slot.setAttribute('data-word-index', wordIndex);
    slot.setAttribute('data-slot-index', slotIndex);
    slot.setAttribute('droppable', 'true');
    if (isLocked) {
        slot.setAttribute('data-locked', 'true');
    }
    slot.setAttribute('aria-label', `Slot ${slotIndex + 1} for word ${wordIndex + 1}${isLocked ? ' (locked)' : ''}`);
    slot.setAttribute('role', 'button');
    
    // Make slots keyboard accessible
    if (!isLocked) {
        slot.setAttribute('tabindex', '0');
    }

    // Drag and drop handlers only if not locked
    if (!isLocked) {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('click', handleSlotClick);
        slot.addEventListener('keydown', handleSlotKeyDown);
        slot.addEventListener('focus', handleSlotFocus);
        slot.addEventListener('blur', handleSlotBlur);
    }

    return slot;
}

// Drag and drop handlers
let draggedTile = null;

// Keyboard accessibility - track selected tile
let selectedTile = null;

// Hint counter - track remaining hints
let hintsRemaining = 3;

function handleDragStart(e) {
    // Don't allow dragging locked tiles
    if (this.getAttribute('data-locked') === 'true') {
        e.preventDefault();
        return false;
    }
    draggedTile = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    // Don't allow dropping on locked slots
    if (this.getAttribute('data-locked') === 'true') {
        return false;
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    if (draggedTile) {
        placeTileInSlot(draggedTile, this);
    }
    
    return false;
}

// Click handlers for accessibility
function handleTileClick(e) {
    const tile = e.currentTarget;
    // Don't allow clicking locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    const activeSlot = document.querySelector('.slot.drag-over:not([data-locked="true"])') || 
                       document.querySelector('.slot:not(.filled):not([data-locked="true"])');
    if (activeSlot) {
        placeTileInSlot(tile, activeSlot);
    }
}

function handleSlotClick(e) {
    const slot = e.currentTarget;
    // Don't allow clicking locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    if (slot.classList.contains('filled')) {
        // Remove tile from slot
        const tile = slot.querySelector('.tile');
        if (tile && tile.getAttribute('data-locked') !== 'true') {
            removeTileFromSlot(slot);
        }
    }
}

// Keyboard handler for tiles
function handleTileKeyDown(e) {
    const tile = e.currentTarget;
    
    // Don't allow keyboard interaction with locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        
        // If this tile is already selected, deselect it
        if (selectedTile === tile) {
            deselectTile();
        } else {
            // Select this tile
            selectTile(tile);
        }
    } else if (e.key === 'Escape') {
        // Deselect if this tile is selected
        if (selectedTile === tile) {
            deselectTile();
        }
    }
}

// Keyboard handler for slots
function handleSlotKeyDown(e) {
    const slot = e.currentTarget;
    
    // Don't allow keyboard interaction with locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        
        if (slot.classList.contains('filled')) {
            // Remove tile from slot if it's filled and not locked
            const tile = slot.querySelector('.tile');
            if (tile && tile.getAttribute('data-locked') !== 'true') {
                removeTileFromSlot(slot);
                // Focus the tile that was removed (will be in container)
                setTimeout(() => {
                    const tilesContainer = document.getElementById('tiles-container');
                    const removedTile = tilesContainer.querySelector(`[data-letter="${tile.getAttribute('data-letter')}"]`);
                    if (removedTile) removedTile.focus();
                }, 100);
            }
        } else if (selectedTile) {
            // Place selected tile in this slot
            placeTileInSlot(selectedTile, slot);
            deselectTile();
            // Keep focus on the slot
            slot.focus();
        }
    } else if (e.key === 'Escape') {
        // Deselect tile if one is selected
        if (selectedTile) {
            deselectTile();
        }
    }
}

// Handle slot focus for visual feedback
function handleSlotFocus(e) {
    const slot = e.currentTarget;
    if (slot.getAttribute('data-locked') !== 'true') {
        slot.classList.add('focus:ring-2', 'focus:ring-indigo-500', 'focus:outline-none');
    }
}

// Handle slot blur
function handleSlotBlur(e) {
    const slot = e.currentTarget;
    // Focus styles are handled by Tailwind focus: classes
}

// Select a tile for keyboard placement
function selectTile(tile) {
    // Deselect previous tile if any
    if (selectedTile && selectedTile !== tile) {
        deselectTile();
    }
    
    selectedTile = tile;
    tile.classList.add('ring-4', 'ring-yellow-400', 'ring-offset-2');
    const currentLabel = tile.getAttribute('aria-label').replace(' (selected)', '');
    tile.setAttribute('aria-label', currentLabel + ' (selected)');
    
    // Announce selection to screen readers
    const letter = tile.getAttribute('data-letter');
    const score = SCRABBLE_SCORES[letter.toUpperCase()] || 0;
    announceToScreenReader(`Selected tile ${letter} with score ${score}. Tab to a slot and press Enter to place.`);
}

// Deselect the currently selected tile
function deselectTile() {
    if (selectedTile) {
        selectedTile.classList.remove('ring-4', 'ring-yellow-400', 'ring-offset-2');
        const ariaLabel = selectedTile.getAttribute('aria-label').replace(' (selected)', '');
        selectedTile.setAttribute('aria-label', ariaLabel);
        selectedTile = null;
    }
}

// Announce to screen readers
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
        }
    }, 1000);
}

// Place tile in slot
function placeTileInSlot(tile, slot) {
    // Don't allow placing tiles in locked slots
    if (slot.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Don't allow placing locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }
    
    // Clear selected tile if this is the selected one
    if (selectedTile === tile) {
        deselectTile();
    }
    
    const existingTile = slot.querySelector('.tile');
    
    // Check if slot already has a tile - if so, swap them (but not if existing is locked)
    if (existingTile) {
        if (existingTile.getAttribute('data-locked') === 'true') {
            return; // Can't swap with locked tile
        }
        swapTiles(tile, existingTile, slot);
        return;
    }

    // Check if tile is already in a slot (being moved from one slot to another or back to container)
    const isFromSlot = tile.closest('.slot');
    const isFromContainer = tile.closest('#tiles-container');
    
    // Remove tile from its current location
    tile.remove();
    
    // If tile was from container, update placeholder
    if (isFromContainer) {
        updatePlaceholderTile();
    }
    
    // If tile was in a slot, remove filled class
    if (isFromSlot) {
        isFromSlot.classList.remove('filled');
    }

    // Clone tile for the slot
    const clonedTile = tile.cloneNode(true);
    const isLocked = slot.getAttribute('data-locked') === 'true';
    clonedTile.setAttribute('draggable', isLocked ? 'false' : 'true');
    if (isLocked) {
        clonedTile.setAttribute('data-locked', 'true');
        clonedTile.classList.add('locked');
    }
    clonedTile.classList.remove('dragging');
    if (!isLocked) {
        clonedTile.addEventListener('dragstart', handleDragStart);
        clonedTile.addEventListener('dragend', handleDragEnd);
        clonedTile.addEventListener('click', () => {
            removeTileFromSlot(slot);
        });
        clonedTile.addEventListener('keydown', handleTileKeyDown);
    }

    slot.appendChild(clonedTile);
    slot.classList.add('filled');
    slot.classList.remove('drag-over');

    // Update score and submit button state
    updateScoreDisplay();
    updateSubmitButton();
}

// Swap two tiles between slots or container
function swapTiles(draggedTile, existingTile, targetSlot) {
    const draggedSlot = draggedTile.closest('.slot');
    const draggedLetter = draggedTile.getAttribute('data-letter');
    const draggedIndex = draggedTile.getAttribute('data-tile-index');
    const existingLetter = existingTile.getAttribute('data-letter');
    const existingIndex = existingTile.getAttribute('data-tile-index');
    
    // Clear selected tile if either tile is selected
    if (selectedTile === draggedTile || selectedTile === existingTile) {
        deselectTile();
    }
    
    const isDraggedFromContainer = draggedTile.closest('#tiles-container');
    
    // Remove both tiles
    draggedTile.remove();
    existingTile.remove();
    
    // If dragged tile was from container, update placeholder
    if (isDraggedFromContainer) {
        updatePlaceholderTile();
    }
    
    // If dragged tile was from a slot, place existing tile there
    if (draggedSlot) {
        const clonedExistingTile = existingTile.cloneNode(true);
        clonedExistingTile.setAttribute('draggable', 'true');
        clonedExistingTile.classList.remove('dragging');
        clonedExistingTile.addEventListener('dragstart', handleDragStart);
        clonedExistingTile.addEventListener('dragend', handleDragEnd);
        clonedExistingTile.addEventListener('click', () => {
            removeTileFromSlot(draggedSlot);
        });
        clonedExistingTile.addEventListener('keydown', handleTileKeyDown);
        draggedSlot.appendChild(clonedExistingTile);
        draggedSlot.classList.add('filled');
    } else {
        // If dragged tile was from container, return existing tile to container
        returnTileToContainer(existingLetter, existingIndex);
    }
    
    // Place dragged tile in target slot
    const clonedDraggedTile = draggedTile.cloneNode(true);
    clonedDraggedTile.setAttribute('draggable', 'true');
    clonedDraggedTile.classList.remove('dragging');
    clonedDraggedTile.addEventListener('dragstart', handleDragStart);
    clonedDraggedTile.addEventListener('dragend', handleDragEnd);
    clonedDraggedTile.addEventListener('click', () => {
        removeTileFromSlot(targetSlot);
    });
    clonedDraggedTile.addEventListener('keydown', handleTileKeyDown);
    targetSlot.appendChild(clonedDraggedTile);
    targetSlot.classList.add('filled');
    targetSlot.classList.remove('drag-over');
    
    // Update score and submit button state
    updateScoreDisplay();
    updateSubmitButton();
}

// Remove tile from slot
function removeTileFromSlot(slot) {
    const tile = slot.querySelector('.tile');
    if (!tile) return;
    
    // Don't allow removing locked tiles
    if (tile.getAttribute('data-locked') === 'true') {
        return;
    }

    const letter = tile.getAttribute('data-letter');
    const originalIndex = tile.getAttribute('data-tile-index');
    
    // Remove from slot
    tile.remove();
    slot.classList.remove('filled');

    // Add back to tiles container
    returnTileToContainer(letter, originalIndex);
}

// Return tile to the starting container
function returnTileToContainer(letter, originalIndex) {
    const tilesContainer = document.getElementById('tiles-container');
    const newTile = createTile(letter, originalIndex);
    tilesContainer.appendChild(newTile);

    // Update placeholder visibility
    updatePlaceholderTile();

    // Update score and submit button state
    updateScoreDisplay();
    updateSubmitButton();
    
    // Focus the new tile for keyboard navigation
    setTimeout(() => {
        newTile.focus();
    }, 50);
}

// Handle drag over tiles container
function handleTilesContainerDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// Handle drop on tiles container
function handleTilesContainerDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedTile) {
        // Check if tile is from a slot
        const slot = draggedTile.closest('.slot');
        if (slot) {
            const letter = draggedTile.getAttribute('data-letter');
            const originalIndex = draggedTile.getAttribute('data-tile-index');
            
            // Remove from slot
            draggedTile.remove();
            slot.classList.remove('filled');
            
            // Add back to container
            returnTileToContainer(letter, originalIndex);
        }
    }
    
    return false;
}

// Handle drag leave tiles container
function handleTilesContainerDragLeave(e) {
    // No visual feedback needed
}

// Update score display
function updateScoreDisplay() {
    const word1Slots = document.querySelectorAll('[data-word-slots="0"] .slot');
    const word2Slots = document.querySelectorAll('[data-word-slots="1"] .slot');

    const word1 = Array.from(word1Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('');

    const word2 = Array.from(word2Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('');

    const word1Score = calculateWordScore(word1);
    const word2Score = calculateWordScore(word2);

    // Get max scores from word containers
    const word1Container = document.querySelector('[data-word-index="0"]');
    const word2Container = document.querySelector('[data-word-index="1"]');
    const word1MaxScore = word1Container ? parseInt(word1Container.getAttribute('data-max-score')) : 0;
    const word2MaxScore = word2Container ? parseInt(word2Container.getAttribute('data-max-score')) : 0;

    const word1ScoreDisplay = document.getElementById('word1-score-display');
    const word2ScoreDisplay = document.getElementById('word2-score-display');
    
    if (word1ScoreDisplay) {
        word1ScoreDisplay.textContent = `${word1Score} / ${word1MaxScore} points`;
    }
    if (word2ScoreDisplay) {
        word2ScoreDisplay.textContent = `${word2Score} / ${word2MaxScore} points`;
    }
}

// Update submit button state (no longer disables button, kept for potential future use)
function updateSubmitButton() {
    // Button is always enabled now
    // This function is kept for consistency but doesn't disable the button
}

// Check solution
function checkSolution(day) {
    const word1Slots = document.querySelectorAll('[data-word-slots="0"] .slot');
    const word2Slots = document.querySelectorAll('[data-word-slots="1"] .slot');

    const word1 = Array.from(word1Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('')
        .toUpperCase();

    const word2 = Array.from(word2Slots)
        .map(slot => {
            const tile = slot.querySelector('.tile');
            return tile ? tile.getAttribute('data-letter') : '';
        })
        .join('')
        .toUpperCase();

    // Check if puzzle is complete (all slots filled)
    const word1Complete = Array.from(word1Slots).every(slot => slot.querySelector('.tile'));
    const word2Complete = Array.from(word2Slots).every(slot => slot.querySelector('.tile'));

    // If puzzle is not complete, show error modal
    if (!word1Complete || !word2Complete) {
        showErrorModal();
        return;
    }

    // Validate solution
    const isValid = validateSolution(day, word1, word2);

    if (isValid) {
        // Calculate scores
        const word1Score = calculateWordScore(word1);
        const word2Score = calculateWordScore(word2);
        
        // Get max scores from word containers
        const word1Container = document.querySelector('[data-word-index="0"]');
        const word2Container = document.querySelector('[data-word-index="1"]');
        const word1MaxScore = word1Container ? parseInt(word1Container.getAttribute('data-max-score')) : 0;
        const word2MaxScore = word2Container ? parseInt(word2Container.getAttribute('data-max-score')) : 0;
        
        showSuccessModal(day, word1Score, word2Score, word1MaxScore, word2MaxScore);
        triggerSnowflakeConfetti();
    } else {
        showErrorModal();
    }
}

// Trigger snowflake confetti animation
function triggerSnowflakeConfetti() {
    // Check if confetti library is available
    if (typeof confetti === 'undefined') {
        return;
    }

    const duration = 3000; // 3 seconds
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Create snowflake-like confetti
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
            colors: ['#ffffff', '#e0f2fe', '#dbeafe', '#bfdbfe'],
            shapes: ['circle'],
            gravity: randomInRange(0.4, 0.6),
            scalar: randomInRange(0.8, 1.2),
        });
    }, 250);
}

// Update hint button text based on remaining hints
function updateHintButtonText() {
    const hintBtn = document.getElementById('hint-btn');
    if (!hintBtn) return;
    
    if (hintsRemaining <= 0) {
        hintBtn.disabled = true;
        hintBtn.textContent = 'No Hints Left';
    } else {
        hintBtn.textContent = `Get Hint (${hintsRemaining} left)`;
    }
}

// Provide hint - places 1 tile in correct position and locks it
function provideHint(day) {
    // Check if hints are available
    if (hintsRemaining <= 0) {
        return;
    }
    
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle) return;

    const solution = puzzle.solution;
    const word1Slots = document.querySelectorAll('[data-word-slots="0"] .slot');
    const word2Slots = document.querySelectorAll('[data-word-slots="1"] .slot');
    
    // Find tiles that need to be placed correctly
    const hintsToPlace = [];
    
    // Check word 1
    solution[0].split('').forEach((correctLetter, index) => {
        const slot = word1Slots[index];
        const currentTile = slot.querySelector('.tile');
        const currentLetter = currentTile ? currentTile.getAttribute('data-letter') : null;
        
        // If slot is empty or has wrong letter, and not already locked
        if ((!currentTile || currentLetter !== correctLetter) && slot.getAttribute('data-locked') !== 'true') {
            hintsToPlace.push({
                wordIndex: 0,
                slotIndex: index,
                letter: correctLetter
            });
        }
    });
    
    // Check word 2
    solution[1].split('').forEach((correctLetter, index) => {
        const slot = word2Slots[index];
        const currentTile = slot.querySelector('.tile');
        const currentLetter = currentTile ? currentTile.getAttribute('data-letter') : null;
        
        // If slot is empty or has wrong letter, and not already locked
        if ((!currentTile || currentLetter !== correctLetter) && slot.getAttribute('data-locked') !== 'true') {
            hintsToPlace.push({
                wordIndex: 1,
                slotIndex: index,
                letter: correctLetter
            });
        }
    });
    
    if (hintsToPlace.length === 0) {
        showFeedback('All tiles are already correct!', 'success');
        return;
    }
    
    // Randomly select 1 hint from available slots
    const randomIndex = Math.floor(Math.random() * hintsToPlace.length);
    const hint = hintsToPlace[randomIndex];
    
    const slots = hint.wordIndex === 0 ? word1Slots : word2Slots;
    const targetSlot = slots[hint.slotIndex];
    
    // Remove existing tile if present
    const existingTile = targetSlot.querySelector('.tile');
    if (existingTile && existingTile.getAttribute('data-locked') !== 'true') {
        const letter = existingTile.getAttribute('data-letter');
        const index = existingTile.getAttribute('data-tile-index');
        existingTile.remove();
        targetSlot.classList.remove('filled');
        returnTileToContainer(letter, index);
    }
    
    // Find the correct tile in the container or slots
    const tilesContainer = document.getElementById('tiles-container');
    let sourceTile = null;
    
    // First check container
    const containerTiles = tilesContainer.querySelectorAll('.tile:not([data-locked="true"])');
    for (let tile of containerTiles) {
        if (tile.getAttribute('data-letter') === hint.letter) {
            sourceTile = tile;
            break;
        }
    }
    
    // If not in container, check other slots
    if (!sourceTile) {
        const allSlots = document.querySelectorAll('.slot:not([data-locked="true"])');
        for (let slot of allSlots) {
            const tile = slot.querySelector('.tile:not([data-locked="true"])');
            if (tile && tile.getAttribute('data-letter') === hint.letter) {
                sourceTile = tile;
                break;
            }
        }
    }
    
    if (sourceTile) {
        // Remove source tile
        const letter = sourceTile.getAttribute('data-letter');
        const originalIndex = sourceTile.getAttribute('data-tile-index');
        const sourceSlot = sourceTile.closest('.slot');
        const isFromContainer = sourceTile.closest('#tiles-container');
        
        sourceTile.remove();
        if (sourceSlot) {
            sourceSlot.classList.remove('filled');
        }
        
        // If tile was from container, update placeholder
        if (isFromContainer) {
            updatePlaceholderTile();
        }
        
        // Create locked tile in target slot
        const lockedTile = createTile(letter, originalIndex, true);
        targetSlot.appendChild(lockedTile);
        targetSlot.classList.add('filled');
        targetSlot.setAttribute('data-locked', 'true');
    }
    
    // Decrement hint counter and update button
    hintsRemaining--;
    updateHintButtonText();
    
    // Update score display
    updateScoreDisplay();
    updateSubmitButton();
}

// Show success modal
function showSuccessModal(day, word1Score, word2Score, word1MaxScore, word2MaxScore) {
    const modal = document.getElementById('success-modal');
    if (!modal) return;

    // Generate share message
    const baseUrl = 'https://sum-tile.uk';
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get('test') === 'true';
    const testParam = testMode ? '&test=true' : '';
    const puzzleUrl = `${baseUrl}/puzzle.html?day=${day}${testParam}`;
    
    // Calculate days until Christmas (December 25th)
    const today = new Date();
    const currentYear = today.getFullYear();
    let christmas = new Date(currentYear, 11, 25); // Month is 0-indexed, so 11 = December
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    christmas.setHours(0, 0, 0, 0);
    
    // If Christmas has passed this year, use next year's Christmas
    if (today > christmas) {
        christmas = new Date(currentYear + 1, 11, 25);
        christmas.setHours(0, 0, 0, 0);
    }
    
    // Calculate days remaining until Christmas
    const timeDiff = christmas.getTime() - today.getTime();
    const daysUntilChristmas = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Format the share message
    const daysText = daysUntilChristmas === 1 ? '1 day' : `${daysUntilChristmas} days`;
    const shareText = `I completed puzzle #${day} on Sum Tile! Only ${daysText} left to christmas\n${puzzleUrl}`;
    
    // Display share message in modal
    const shareMessage = document.getElementById('share-message');
    if (shareMessage) {
        shareMessage.textContent = shareText;
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus the modal for accessibility
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.focus();
    }
    
    // Setup share button event listener
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        // Remove any existing event listeners by cloning the button
        const newShareBtn = shareBtn.cloneNode(true);
        shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
        
        // Store original state - store the full className to preserve all classes
        const originalText = newShareBtn.textContent;
        const originalClassName = newShareBtn.className;
        
        // Add event listener to the new button
        newShareBtn.addEventListener('click', () => {
            copyShareMessage(shareText, newShareBtn, originalText, originalClassName);
        });
    }
}

// Copy share message to clipboard
function copyShareMessage(shareText, buttonElement, originalText, originalClassName) {
    const shareBtn = buttonElement || document.getElementById('share-btn');
    if (!shareBtn) return;
    
    // Show immediate feedback and ensure it renders
    shareBtn.textContent = 'Copying...';
    shareBtn.disabled = true;
    
    // Use requestAnimationFrame to ensure the "Copying..." text is rendered before clipboard operation
    requestAnimationFrame(() => {
        // Small delay to ensure the text is visible
        setTimeout(() => {
            // Copy to clipboard
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    // Update button text and color - only change the background color classes
                    shareBtn.textContent = 'Copied!';
                    shareBtn.disabled = false;
                    shareBtn.classList.remove('bg-amber-500', 'hover:bg-amber-600', 'focus:ring-amber-500');
                    shareBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'focus:ring-green-500');
                    
                    // Restore after 2 seconds - restore all original classes to ensure nothing is missing
                    setTimeout(() => {
                        shareBtn.textContent = originalText;
                        shareBtn.className = originalClassName; // Restore full className to ensure all classes are preserved
                    }, 2000);
                })
                .catch((error) => {
                    console.error('Error copying to clipboard:', error);
                    shareBtn.textContent = 'Error';
                    shareBtn.disabled = false;
                    setTimeout(() => {
                        shareBtn.textContent = originalText;
                        shareBtn.className = originalClassName; // Restore full className
                    }, 2000);
                });
        }, 50); // Small delay to ensure "Copying..." is visible
    });
}

// Show error modal
function showErrorModal() {
    const modal = document.getElementById('error-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus the modal for accessibility
    const modalTitle = document.getElementById('error-modal-title');
    if (modalTitle) {
        modalTitle.focus();
    }
}

// Close error modal
function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

// Get day suffix (1st, 2nd, 3rd, etc.)
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Show help modal
function showHelpModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus the close button for accessibility
    const closeBtn = document.getElementById('close-help-modal-btn');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100);
    }
}

// Close help modal
function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

// Show feedback message
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;

    feedback.className = `p-4 rounded-lg mb-8 ${
        type === 'success' 
            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
            : 'bg-red-100 text-red-800 border-2 border-red-300'
    }`;
    feedback.textContent = message;
    feedback.classList.remove('hidden');
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'polite');

    // Scroll to feedback
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

