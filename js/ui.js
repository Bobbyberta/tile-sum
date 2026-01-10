// UI initialization functions

import { isAdventMode } from '../puzzle-data.js';
import { formatDateString, getPuzzleNumberForDate, calculateWordScore } from '../puzzle-data.js';
import { PUZZLE_DATA, SCRABBLE_SCORES } from '../puzzle-data.js';
import { isTestMode, isAdventTestMode, isArchiveTestMode, getTestModeParam, getTestModeParamWithAmpersand } from './utils.js';
import { getDaySuffix } from './utils.js';
import { initPuzzleWithPrefix } from '../script.js';
import { isPuzzleCompletedToday, isPuzzleCompletedForDate } from './completion.js';
import { createTile, createSlot } from './puzzle-core.js';

// Update countdown overlay (hidden in standard format - only shown in advent test mode)
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

// Initialize daily puzzle on homepage
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

// Display completed puzzle (read-only)
function displayCompletedPuzzle(puzzleNumber, displayDate) {
    const puzzle = PUZZLE_DATA[puzzleNumber];
    if (!puzzle) return;
    
    // Title is hidden, no need to update it
    
    // Hide or remove existing completion message if present
    const existingMessage = document.getElementById('daily-completion-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create and display completion message
    const header = document.querySelector('#daily-puzzle-container header');
    const tilesContainer = document.getElementById('daily-tiles-container');
    if (header && tilesContainer) {
        const completionMessage = document.createElement('div');
        completionMessage.id = 'daily-completion-message';
        completionMessage.className = 'text-lg text-indigo-900 text-center mb-8';
        completionMessage.textContent = 'Puzzle complete! Come back tomorrow for another daily puzzle';
        // Insert after header, before tiles container
        header.insertAdjacentElement('afterend', completionMessage);
    }
    
    // Hide interactive elements
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
            wordContainer.className = 'bg-white rounded-lg shadow-md p-4';
            wordContainer.setAttribute('data-word-index', wordIndex);
            wordContainer.setAttribute('data-max-score', maxScores[wordIndex]);
            
            // Hidden label for screen readers (same as interactive version)
            const wordLabel = document.createElement('h3');
            wordLabel.className = 'sr-only';
            wordLabel.textContent = `Word ${wordIndex + 1} (${word.length} letters)`;
            wordContainer.appendChild(wordLabel);

            // Create slots container (same structure as interactive version)
            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'flex flex-wrap gap-2 mb-3';
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
            
            // Score display below the slots (right-aligned, same as interactive version)
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'text-lg font-semibold text-indigo-800 text-right';
            scoreDisplay.setAttribute('id', `daily-word${wordIndex + 1}-score-display`);
            scoreDisplay.textContent = `${maxScores[wordIndex]} / ${maxScores[wordIndex]} points`;
            wordContainer.appendChild(scoreDisplay);
            
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
        dayElement.className = `relative p-4 rounded-lg text-center transition-all ${
            isUnlocked 
                ? 'bg-white shadow-md hover:shadow-lg cursor-pointer border-2 border-indigo-300 hover:border-indigo-500' 
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

