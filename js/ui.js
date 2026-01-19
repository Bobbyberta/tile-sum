// UI initialization functions

import { isAdventMode } from '../puzzle-data-encoded.js';
import { formatDateString, getPuzzleNumberForDate, calculateWordScore } from '../puzzle-data-encoded.js';
import { PUZZLE_DATA, SCRABBLE_SCORES } from '../puzzle-data-encoded.js';
import { isTestMode, isAdventTestMode, isArchiveTestMode, getTestModeParam, getTestModeParamWithAmpersand } from './utils.js';
import { getDaySuffix } from './utils.js';
import { initPuzzleWithPrefix } from '../script.js';
import { isPuzzleCompletedToday, isPuzzleCompletedForDate } from './completion.js';
import { createTile, createSlot } from './puzzle-core.js';

/**
 * Updates the countdown overlay for the advent calendar.
 * Hidden in standard format, only shown in advent test mode.
 * Calculates days remaining until December 1st and displays countdown.
 * 
 * @returns {void}
 * 
 * @example
 * // Called on page load
 * updateCountdown();
 */
export function updateCountdown() {
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownDays = document.getElementById('countdown-days');
    const mainContent = document.getElementById('main-content');
    
    if (!countdownOverlay || !countdownDays) return;
    
    // Hide countdown in archive test mode
    if (isArchiveTestMode()) {
        countdownOverlay.classList.add('hidden');
        if (mainContent) {
            mainContent.style.paddingTop = '';
            mainContent.classList.remove('banner-visible');
        }
        return;
    }
    
    // Only show countdown in advent test mode (for testing calendar view)
    // Standard format: always hide countdown
    if (!isAdventTestMode()) {
        countdownOverlay.classList.add('hidden');
        if (mainContent) {
            mainContent.style.paddingTop = '';
            mainContent.classList.remove('banner-visible');
        }
        return;
    }
    
    // Advent test mode: show countdown logic (for testing purposes)
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
        // CSS handles responsive padding via .banner-visible class
        if (mainContent) {
            mainContent.classList.add('banner-visible');
        }
    } else {
        // Hide countdown if it's December 1st or later
        countdownOverlay.classList.add('hidden');
        if (mainContent) {
            mainContent.style.paddingTop = '';
            mainContent.classList.remove('banner-visible');
        }
    }
}

/**
 * Initializes the daily puzzle on the homepage.
 * Shows the daily puzzle view and hides the calendar view.
 * Updates header subtitle with puzzle number.
 * 
 * @returns {void}
 * 
 * @example
 * // Called when homepage loads
 * initDailyPuzzle();
 */
export function initDailyPuzzle() {
    const dailyPuzzleContainer = document.getElementById('daily-puzzle-container');
    const calendarContainer = document.getElementById('calendar-container');
    const headerSubtitle = document.getElementById('header-subtitle');
    
    if (!dailyPuzzleContainer) return;
    
    // Hide calendar, show daily puzzle
    if (calendarContainer) {
        calendarContainer.classList.add('hidden');
    }
    dailyPuzzleContainer.classList.remove('hidden');
    
    // Update header subtitle with puzzle number
    if (headerSubtitle) {
        // Get puzzle number for subtitle
        let puzzleNumberForSubtitle;
        if (isArchiveTestMode()) {
            puzzleNumberForSubtitle = 0;
        } else {
            const today = new Date();
            puzzleNumberForSubtitle = getPuzzleNumberForDate(today);
        }
        headerSubtitle.textContent = `Daily Word Puzzle #${puzzleNumberForSubtitle}`;
        headerSubtitle.classList.remove('hidden');
    }
    
    // Update archive link to preserve test mode (only show in archive test mode or normal daily mode)
    const archiveLink = document.getElementById('daily-archive-link');
    if (archiveLink) {
        // Hide archive link in advent test mode
        if (isAdventTestMode()) {
            archiveLink.style.display = 'none';
        } else {
            archiveLink.style.display = 'inline-block';
            const testParam = getTestModeParam();
            archiveLink.href = `archive.html${testParam}`;
        }
    }
    
    // In archive test mode, show dummy puzzle #0 for layout testing
    let puzzleNumber;
    let displayDate;
    
    if (isArchiveTestMode()) {
        puzzleNumber = 0;
        displayDate = new Date(2025, 11, 1); // December 1, 2025 as placeholder date
    } else {
        // Get today's puzzle number
        const today = new Date();
        puzzleNumber = getPuzzleNumberForDate(today);
        displayDate = today;
    }
    
    // Check if puzzle exists
    if (!PUZZLE_DATA[puzzleNumber]) {
        const dailyPuzzleTitle = document.getElementById('daily-puzzle-title');
        if (dailyPuzzleTitle) {
            dailyPuzzleTitle.textContent = 'No puzzle available for today.';
        }
        return;
    }
    
    // Check if puzzle is completed today
    const isCompleted = isArchiveTestMode() 
        ? isPuzzleCompletedForDate(puzzleNumber, displayDate)
        : isPuzzleCompletedToday(puzzleNumber);
    
    if (isCompleted) {
        // Show completed puzzle display
        displayCompletedPuzzle(puzzleNumber, displayDate);
    } else {
        // Remove completion message if present (when showing non-completed puzzle)
        const existingMessage = document.getElementById('daily-completion-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        // Show interactive puzzle
        initPuzzleWithPrefix(puzzleNumber, 'daily-');
    }
}

// Calculate when the next puzzle unlocks (midnight tomorrow)
function getNextPuzzleUnlockTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

// Format countdown time as a human-readable string
function formatCountdown(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (hours > 0) {
        parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    }
    
    // Join with commas and "and" for the last part
    if (parts.length === 1) {
        return parts[0];
    } else if (parts.length === 2) {
        return parts.join(' and ');
    } else {
        return parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
    }
}

// Start countdown timer for next puzzle unlock
function startNextPuzzleCountdown(countdownElement) {
    const updateCountdown = () => {
        // Check if element still exists in DOM
        if (!document.contains(countdownElement)) {
            return null; // Signal to stop the interval
        }
        
        const now = new Date();
        const nextUnlock = getNextPuzzleUnlockTime();
        const timeRemaining = nextUnlock.getTime() - now.getTime();
        
        if (timeRemaining <= 0) {
            countdownElement.textContent = 'Puzzle complete! A new puzzle is available now!';
            return null; // Signal to stop the interval
        }
        
        const countdownText = formatCountdown(timeRemaining);
        countdownElement.textContent = `Puzzle complete! Next puzzle available in ${countdownText}`;
        return true; // Continue the interval
    };
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    const intervalId = setInterval(() => {
        const shouldContinue = updateCountdown();
        if (shouldContinue === null) {
            clearInterval(intervalId);
        }
    }, 1000);
    
    // Return interval ID for cleanup
    return intervalId;
}

// Show countdown for daily puzzle completion (exported for use by modals)
export function showDailyPuzzleCountdown() {
    // Hide or remove existing completion message if present
    const existingMessage = document.getElementById('daily-completion-message');
    if (existingMessage) {
        // Clear any existing countdown interval
        if (existingMessage.dataset.countdownIntervalId) {
            clearInterval(parseInt(existingMessage.dataset.countdownIntervalId));
        }
        existingMessage.remove();
    }
    
    // Create and display completion message with countdown
    const header = document.querySelector('#daily-puzzle-container header');
    const tilesContainer = document.getElementById('daily-tiles-container');
    if (header && tilesContainer) {
        const completionMessage = document.createElement('div');
        completionMessage.id = 'daily-completion-message';
        completionMessage.className = 'text-lg text-text-primary text-center mb-8 font-rem';
        // Insert after header, before tiles container
        header.insertAdjacentElement('afterend', completionMessage);
        
        // Start countdown timer and store interval ID
        const intervalId = startNextPuzzleCountdown(completionMessage);
        completionMessage.dataset.countdownIntervalId = intervalId.toString();
    }
}

// Display completed puzzle (read-only)
function displayCompletedPuzzle(puzzleNumber, displayDate) {
    const puzzle = PUZZLE_DATA[puzzleNumber];
    if (!puzzle) return;
    
    // Title is hidden, no need to update it
    
    // Show countdown message
    showDailyPuzzleCountdown();
    
    // Hide interactive elements
    const tilesContainer = document.getElementById('daily-tiles-container');
    const wordSlots = document.getElementById('daily-word-slots');
    const hintBtn = document.getElementById('daily-hint-btn');
    const submitBtn = document.getElementById('daily-submit-btn');
    
    if (tilesContainer) tilesContainer.style.display = 'none';
    if (hintBtn) hintBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';
    
    // Display completed words using same structure as interactive puzzle
    if (wordSlots) {
        wordSlots.innerHTML = '';
        
        const maxScores = puzzle.solution.map(word => calculateWordScore(word));
        
        // Track tile index across all words for uniqueness
        let tileIndexCounter = 0;
        
        puzzle.solution.forEach((word, wordIndex) => {
            const wordContainer = document.createElement('div');
            wordContainer.className = 'bg-slot-container rounded-[24px] shadow-container p-2 flex flex-col items-start gap-3';
            wordContainer.setAttribute('data-word-index', wordIndex);
            wordContainer.setAttribute('data-max-score', maxScores[wordIndex]);
            
            // Hidden label for screen readers (same as interactive version)
            const wordLabel = document.createElement('h3');
            wordLabel.className = 'sr-only';
            wordLabel.textContent = `Word ${wordIndex + 1} (${word.length} letters)`;
            wordContainer.appendChild(wordLabel);

            // Create slots container (same structure as interactive version)
            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'flex flex-wrap gap-[6px]';
            slotsContainer.setAttribute('data-word-slots', wordIndex);
            
            // Create slots and populate with solution tiles
            const solutionLetters = word.split('');
            solutionLetters.forEach((letter, slotIndex) => {
                // Create locked slot (no handlers needed)
                const slot = createSlot(wordIndex, slotIndex, true, {});
                
                // Create locked tile (no handlers needed) with unique index
                const tile = createTile(letter, tileIndexCounter++, true, {});
                
                // Place tile in slot
                slot.appendChild(tile);
                slot.classList.add('filled');
                
                slotsContainer.appendChild(slot);
            });
            
            wordContainer.appendChild(slotsContainer);
            
            // Category and score display section
            const categoryScoreContainer = document.createElement('div');
            categoryScoreContainer.className = 'flex flex-row items-center self-end';
            
            // Category label (if category exists in puzzle data)
            const category = puzzle.categories?.[wordIndex];
            
            if (category) {
                const categoryLabel = document.createElement('div');
                categoryLabel.className = 'border-[4px] border-slot-border rounded-l-[20px] px-3 py-2.5 font-rem';
                categoryLabel.style.fontSize = '20px';
                categoryLabel.style.lineHeight = '25px';
                categoryLabel.style.fontWeight = '500';
                categoryLabel.style.color = '#4E2E07';
                categoryLabel.textContent = category;
                categoryScoreContainer.appendChild(categoryLabel);
            }
            
            // Score display
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = category ? 'bg-category-bg rounded-r-[20px] px-3 py-2.5 text-white font-rem' : 'bg-category-bg rounded-[16px] px-3 py-2.5 text-white font-rem';
            scoreDisplay.style.fontSize = '20px';
            scoreDisplay.style.lineHeight = '25px';
            scoreDisplay.style.fontWeight = '500';
            scoreDisplay.setAttribute('id', `daily-word${wordIndex + 1}-score-display`);
            scoreDisplay.textContent = `${maxScores[wordIndex]} / ${maxScores[wordIndex]} points`;
            categoryScoreContainer.appendChild(scoreDisplay);
            
            wordContainer.appendChild(categoryScoreContainer);
            
            wordSlots.appendChild(wordContainer);
        });
    }
}

// Calendar initialization (kept for potential future use - only called in advent test mode)
export function initCalendar() {
    const calendar = document.getElementById('calendar');
    const headerSubtitle = document.getElementById('header-subtitle');
    if (!calendar) return;

    // Hide subtitle in calendar view (or update if you want a different message)
    if (headerSubtitle) {
        headerSubtitle.classList.add('hidden');
    }

    const adventTestMode = isAdventTestMode();
    const today = new Date();
    const currentYear = today.getFullYear();

    // December 1-25 (for advent test mode)
    const adventStart = new Date(currentYear, 11, 1); // Month is 0-indexed, so 11 = December
    const adventEnd = new Date(currentYear, 11, 25);

    for (let day = 1; day <= 25; day++) {
        const dayDate = new Date(currentYear, 11, day);
        // Unlock all days in advent test mode, otherwise use normal date-based logic
        const isUnlocked = adventTestMode || (dayDate <= today && dayDate >= adventStart);
        const isToday = dayDate.toDateString() === today.toDateString();
        
        // Check completion status for unlocked puzzles
        let isCompleted = false;
        if (isUnlocked) {
            const puzzleNumber = getPuzzleNumberForDate(dayDate);
            if (puzzleNumber !== null) {
                isCompleted = isPuzzleCompletedForDate(puzzleNumber, dayDate);
            }
        }

        const dayElement = document.createElement('div');
        dayElement.className = `relative p-4 rounded-lg text-center transition-all font-rem ${
            isUnlocked 
                ? 'bg-white shadow-md hover:shadow-lg cursor-pointer border-2 border-slot-border hover:border-text-primary' 
                : 'bg-gray-200 opacity-60 cursor-not-allowed border-2 border-gray-300'
        }`;
        
        // Build descriptive aria-label
        let ariaLabel = `Puzzle for December ${day}`;
        if (isToday) {
            ariaLabel += ', today';
        }
        if (isCompleted) {
            ariaLabel += ', completed';
        }
        if (!isUnlocked) {
            ariaLabel += ', locked';
        }
        
        if (isUnlocked) {
            dayElement.setAttribute('role', 'button');
            dayElement.setAttribute('tabindex', '0');
            dayElement.setAttribute('aria-label', ariaLabel);
            dayElement.addEventListener('click', () => {
                // Preserve test mode in puzzle URL if active
                const testParam = getTestModeParamWithAmpersand();
                window.location.href = `puzzle.html?day=${day}${testParam}`;
            });
            dayElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const testParam = getTestModeParamWithAmpersand();
                    window.location.href = `puzzle.html?day=${day}${testParam}`;
                }
            });
        } else {
            dayElement.setAttribute('aria-label', ariaLabel);
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = `text-2xl font-bold font-rem ${
            isUnlocked ? 'text-text-primary' : 'text-gray-500'
        }`;
        dayNumber.textContent = day;

        const dayLabel = document.createElement('div');
        dayLabel.className = `text-sm mt-1 font-rem ${
            isUnlocked ? 'text-text-primary' : 'text-gray-500'
        }`;
        dayLabel.textContent = 'Dec';

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayLabel);

        if (isToday) {
            const todayBadge = document.createElement('div');
            todayBadge.className = 'absolute top-1 right-1 w-3 h-3 bg-hint rounded-full';
            todayBadge.setAttribute('aria-label', 'Today');
            dayElement.appendChild(todayBadge);
        }

        calendar.appendChild(dayElement);
    }
}

