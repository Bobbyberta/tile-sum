// Modal management

import { formatDateString, getDateForPuzzleNumber, isAdventMode, PUZZLE_DATA } from '../puzzle-data-encoded.js';
import { getTestModeParamWithAmpersand } from './utils.js';
import { handleModalKeyDown } from './keyboard.js';
import { savePuzzleCompletion, markHelpAsSeen } from './completion.js';

// Track modal count for scroll lock management
let modalCount = 0;
let savedScrollPosition = 0;
let touchMoveHandler = null;

// Store triggering element for focus restoration
let triggeringElement = null;

// Mobile-compatible scroll lock utility
function lockBodyScroll() {
    modalCount++;
    
    // Only lock if this is the first modal
    if (modalCount === 1) {
        // Save current scroll position
        savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Apply position fixed to prevent scrolling
        document.body.style.position = 'fixed';
        document.body.style.top = `-${savedScrollPosition}px`;
        document.body.style.width = '100%';
        
        // Add overflow hidden class
        document.body.classList.add('overflow-hidden');
        
        // Prevent touchmove events on body/background (mobile)
        touchMoveHandler = (e) => {
            // Allow scrolling within modal content areas (like help-modal-content)
            const target = e.target;
            const isScrollableContent = target.closest('[id$="-modal-content"]');
            
            // Only allow scrolling if touching scrollable modal content, otherwise prevent
            if (!isScrollableContent) {
                e.preventDefault();
            }
        };
        
        document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    }
}

// Mobile-compatible scroll unlock utility
function unlockBodyScroll() {
    modalCount--;
    
    // Only unlock if all modals are closed
    if (modalCount === 0) {
        // Remove position fixed
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Remove overflow hidden class
        document.body.classList.remove('overflow-hidden');
        
        // Remove touchmove handler
        if (touchMoveHandler) {
            document.removeEventListener('touchmove', touchMoveHandler);
            touchMoveHandler = null;
        }
        
        // Restore scroll position
        window.scrollTo(0, savedScrollPosition);
        savedScrollPosition = 0;
    }
}

// Generate Wordle-style emoji grid showing hint usage and count locked slots
function generateHintEmojiGrid(day, prefix = '') {
    const puzzle = PUZZLE_DATA[day];
    if (!puzzle || !puzzle.solution) {
        return { emojiGrid: '', hintsCount: 0 };
    }
    
    const solution = puzzle.solution;
    const word1 = solution[0];
    const word2 = solution[1];
    
    // Determine word slots container ID
    const isArchive = prefix === 'archive-';
    const wordSlotsContainerId = isArchive ? 'archive-word-slots' : (prefix ? `${prefix}word-slots` : 'word-slots');
    const wordSlotsContainer = document.getElementById(wordSlotsContainerId);
    
    if (!wordSlotsContainer) {
        return { emojiGrid: '', hintsCount: 0 };
    }
    
    // Get slots for each word
    const word1Slots = wordSlotsContainer.querySelectorAll(`[data-word-slots="0"] .slot`);
    const word2Slots = wordSlotsContainer.querySelectorAll(`[data-word-slots="1"] .slot`);
    
    let hintsCount = 0;
    
    // Generate emoji row for word 1
    let word1Row = '';
    for (let i = 0; i < word1.length; i++) {
        const slot = word1Slots[i];
        const isLocked = slot && slot.getAttribute('data-locked') === 'true';
        if (isLocked) {
            hintsCount++;
            word1Row += '🟧';
        } else {
            word1Row += '🟩';
        }
    }
    
    // Generate emoji row for word 2
    let word2Row = '';
    for (let i = 0; i < word2.length; i++) {
        const slot = word2Slots[i];
        const isLocked = slot && slot.getAttribute('data-locked') === 'true';
        if (isLocked) {
            hintsCount++;
            word2Row += '🟧';
        } else {
            word2Row += '🟩';
        }
    }
    
    return { 
        emojiGrid: `${word1Row}\n${word2Row}`,
        hintsCount 
    };
}

// Show success modal
export function showSuccessModal(day, word1Score, word2Score, word1MaxScore, word2MaxScore, prefix = '', hintsUsed = 0, solutionShown = false) {
    const modal = document.getElementById(`${prefix}success-modal`);
    if (!modal) return;

    // Generate share message
    const baseUrl = 'https://sum-tile.uk';
    const testParam = getTestModeParamWithAmpersand();
    
    // Use date parameter if available, otherwise use day parameter
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    const puzzleDate = getDateForPuzzleNumber(day);
    let puzzleUrl;
    if (dateParam && puzzleDate) {
        puzzleUrl = `${baseUrl}/puzzle.html?date=${dateParam}${testParam}`;
    } else if (puzzleDate) {
        puzzleUrl = `${baseUrl}/puzzle.html?date=${formatDateString(puzzleDate)}${testParam}`;
    } else {
        puzzleUrl = `${baseUrl}/puzzle.html?day=${day}${testParam}`;
    }
    
    // Generate emoji grid for hint usage and count actual hints from locked slots
    const { emojiGrid, hintsCount: actualHintsUsed } = generateHintEmojiGrid(day, prefix);
    
    // Use the actual count from locked slots instead of the passed parameter
    // This ensures the count matches what's shown in the emoji grid
    const displayHintsUsed = actualHintsUsed > 0 ? actualHintsUsed : hintsUsed;
    
    // Format the share message with emoji grid
    let shareText;
    const isAdvent = isAdventMode();
    
    // Build the share message with emoji grid
    let messageParts = [];
    
    if (emojiGrid) {
        messageParts.push(emojiGrid);
        messageParts.push(''); // Empty line
    }
    
    // Add hints used message (only if hints were used)
    if (displayHintsUsed > 0 || solutionShown) {
        messageParts.push(`I used ${displayHintsUsed} hint${displayHintsUsed !== 1 ? 's' : ''} on todays puzzle`);
    }
    
    // Add challenge message (always shown)
    messageParts.push('can you beat my score?');
    messageParts.push(''); // Empty line
    
    // Add puzzle URL
    if (isAdvent) {
        // Advent test mode: Calculate days until Christmas (for testing calendar view)
        const today = new Date();
        const currentYear = today.getFullYear();
        let christmas = new Date(currentYear, 11, 25); // Month is 0-indexed, so 11 = December
        
        // Set time to start of day for accurate comparison
        today.setHours(0, 0, 0, 0);
        christmas.setHours(0, 0, 0, 0);
        
        // If Christmas has passed this year, calculate for next year
        if (today > christmas) {
            christmas = new Date(currentYear + 1, 11, 25);
            christmas.setHours(0, 0, 0, 0);
        }
        
        // Calculate days remaining
        const timeDiff = christmas.getTime() - today.getTime();
        const daysTillChristmas = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        messageParts.push(`${daysTillChristmas} Days till Christmas!`);
        messageParts.push(puzzleUrl);
    } else {
        messageParts.push(puzzleUrl);
    }
    
    shareText = messageParts.join('\n');
    
    // Display hints used message (for modal display, not share text)
    const hintsUsedMessage = document.getElementById(`${prefix}hints-used-message`);
    if (hintsUsedMessage) {
        if (solutionShown) {
            hintsUsedMessage.textContent = `You used ${displayHintsUsed} hint${displayHintsUsed !== 1 ? 's' : ''} and were shown the solution.`;
        } else if (displayHintsUsed > 0) {
            hintsUsedMessage.textContent = `You used ${displayHintsUsed} hint${displayHintsUsed !== 1 ? 's' : ''}.`;
        } else {
            hintsUsedMessage.textContent = '';
        }
    }
    
    // Display share message in modal
    const shareMessage = document.getElementById(`${prefix}share-message`);
    if (shareMessage) {
        shareMessage.textContent = shareText;
    }

    // Save completion status
    savePuzzleCompletion(day, puzzleDate);

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    // Lock body scroll (mobile-compatible)
    lockBodyScroll();
    
    // Store triggering element before opening modal
    triggeringElement = document.activeElement;
    
    // Add focus trap event listener with close callback
    const focusTrapHandler = (e) => handleModalKeyDown(e, `${prefix}success-modal`, () => closeSuccessModal(prefix));
    modal.addEventListener('keydown', focusTrapHandler);
    modal._focusTrapHandler = focusTrapHandler;
    modal._closeCallback = () => closeSuccessModal(prefix);
    
    // Focus the close button for accessibility (not the title which isn't focusable)
    const closeBtn = document.getElementById(`${prefix}close-success-modal`);
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100);
    }
    
    // Setup share button event listener
    const shareBtn = document.getElementById(`${prefix}share-btn`);
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
export function copyShareMessage(shareText, buttonElement, originalText, originalClassName) {
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
export function showErrorModal(prefix = '') {
    const modal = document.getElementById(`${prefix}error-modal`);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    // Lock body scroll (mobile-compatible)
    lockBodyScroll();
    
    // Store triggering element before opening modal
    triggeringElement = document.activeElement;
    
    // Add focus trap event listener with close callback
    const focusTrapHandler = (e) => handleModalKeyDown(e, `${prefix}error-modal`, () => closeErrorModal(prefix));
    modal.addEventListener('keydown', focusTrapHandler);
    modal._focusTrapHandler = focusTrapHandler;
    modal._closeCallback = () => closeErrorModal(prefix);
    
    // Focus the close button for accessibility (not the title which isn't focusable)
    const closeBtn = document.getElementById(`${prefix}close-error-modal`) || document.getElementById(`${prefix}close-error-modal-btn`);
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100);
    }
}

// Close error modal
export function closeErrorModal(prefix = '') {
    const modal = document.getElementById(`${prefix}error-modal`);
    if (!modal) return;

    // Blur any focused elements inside the modal before hiding it
    const focusedElement = modal.querySelector(':focus');
    if (focusedElement) {
        focusedElement.blur();
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    
    // Remove focus trap event listener
    if (modal._focusTrapHandler) {
        modal.removeEventListener('keydown', modal._focusTrapHandler);
        delete modal._focusTrapHandler;
    }
    delete modal._closeCallback;
    
    // Restore focus to triggering element
    if (triggeringElement && document.contains(triggeringElement)) {
        const elementToFocus = triggeringElement;
        triggeringElement = null;
        setTimeout(() => {
            if (elementToFocus && document.contains(elementToFocus)) {
                elementToFocus.focus();
            }
        }, 100);
    } else {
        triggeringElement = null;
    }
    
    // Unlock body scroll
    unlockBodyScroll();
}

// Show help modal
export function showHelpModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    
    // Lock body scroll (mobile-compatible)
    lockBodyScroll();
    
    // Reset scroll position to top - use requestAnimationFrame to ensure it happens after rendering
    const contentArea = document.getElementById('help-modal-content');
    if (contentArea) {
        requestAnimationFrame(() => {
            contentArea.scrollTop = 0;
        });
    }
    
    // Store triggering element before opening modal
    triggeringElement = document.activeElement;
    
    // Add focus trap event listener with close callback
    const focusTrapHandler = (e) => handleModalKeyDown(e, 'help-modal', () => closeHelpModal());
    modal.addEventListener('keydown', focusTrapHandler);
    modal._focusTrapHandler = focusTrapHandler;
    modal._closeCallback = () => closeHelpModal();
    
    // Focus the header close button for accessibility (not the bottom button to avoid scrolling)
    const headerCloseBtn = document.getElementById('close-help-modal');
    if (headerCloseBtn) {
        setTimeout(() => headerCloseBtn.focus(), 100);
    }
}

// Close help modal
export function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    if (!modal) return;

    // Blur any focused elements inside the modal before hiding it
    const focusedElement = modal.querySelector(':focus');
    if (focusedElement) {
        focusedElement.blur();
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    
    // Mark help as seen when modal is closed
    markHelpAsSeen();
    
    // Remove focus trap event listener
    if (modal._focusTrapHandler) {
        modal.removeEventListener('keydown', modal._focusTrapHandler);
        delete modal._focusTrapHandler;
    }
    delete modal._closeCallback;
    
    // Restore focus to triggering element
    if (triggeringElement && document.contains(triggeringElement)) {
        const elementToFocus = triggeringElement;
        triggeringElement = null;
        setTimeout(() => {
            if (elementToFocus && document.contains(elementToFocus)) {
                elementToFocus.focus();
            }
        }, 100);
    } else {
        triggeringElement = null;
    }
    
    // Unlock body scroll
    unlockBodyScroll();
}

// Close success modal
export function closeSuccessModal(prefix = '') {
    const modal = document.getElementById(`${prefix}success-modal`);
    if (!modal) return;

    // Blur any focused elements inside the modal before hiding it
    const focusedElement = modal.querySelector(':focus');
    if (focusedElement) {
        focusedElement.blur();
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    
    // Remove focus trap event listener
    if (modal._focusTrapHandler) {
        modal.removeEventListener('keydown', modal._focusTrapHandler);
        delete modal._focusTrapHandler;
    }
    delete modal._closeCallback;
    
    // Restore focus to triggering element
    if (triggeringElement && document.contains(triggeringElement)) {
        const elementToFocus = triggeringElement;
        triggeringElement = null;
        setTimeout(() => {
            if (elementToFocus && document.contains(elementToFocus)) {
                elementToFocus.focus();
            }
        }, 100);
    } else {
        triggeringElement = null;
    }
    
    // Unlock body scroll
    unlockBodyScroll();
}

// Reset modal state for testing purposes
export function resetModalCount() {
    modalCount = 0;
    savedScrollPosition = 0;
    triggeringElement = null;
    if (touchMoveHandler) {
        document.removeEventListener('touchmove', touchMoveHandler);
        touchMoveHandler = null;
    }
}

