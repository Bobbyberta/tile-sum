// Archive page functionality

import { 
    PUZZLE_DATA, 
    PUZZLE_START_DATE,
    formatDateString, 
    parseDateString,
    getPuzzleNumberForDate
} from '../puzzle-data-today.js';
import { loadArchiveData } from './puzzle-data-loader.js';
import { isArchiveTestMode, getTestModeParam } from './utils.js';
import { getDaySuffix } from './utils.js';
import { createPuzzleDOMStructure } from './puzzle-core.js';
import { initPuzzleWithPrefix } from '../script.js';
import { createStateManager } from './puzzle-state.js';
import { showArchiveLoading, hideArchiveLoading } from './loading.js';

/**
 * Initializes the archive page functionality.
 * Sets up date picker, navigation buttons, and puzzle loading for archive puzzles.
 * Handles date selection and puzzle initialization for archive mode.
 * 
 * @returns {void}
 * 
 * @example
 * // Called when archive.html loads
 * initArchivePage();
 */
export function initArchivePage() {
    // Ensure archive data is loaded for archive page
    // Load immediately if not already loaded (don't wait for idle)
    loadArchiveData().catch((error) => {
        console.warn('[Archive] Failed to load archive data:', error);
    });
    
    const datePicker = document.getElementById('date-picker');
    const datePrevBtn = document.getElementById('date-prev-btn');
    const dateNextBtn = document.getElementById('date-next-btn');
    const archiveContent = document.getElementById('archive-puzzle-content');
    
    if (!datePicker || !archiveContent) return;
    
    // Update navigation links to preserve test mode
    const testParam = getTestModeParam();
    
    const backLink = document.querySelector('header a[href="index.html"]');
    if (backLink) {
        backLink.href = `index.html${testParam}`;
    }
    
    const todayLink = document.querySelector('header a:last-of-type');
    if (todayLink && todayLink.href.includes('index.html')) {
        todayLink.href = `index.html${testParam}`;
    }
    
    // Set initial date to today
    const today = new Date();
    const todayStr = formatDateString(today);
    datePicker.value = todayStr;
    datePicker.min = formatDateString(PUZZLE_START_DATE);
    
    // In archive test mode, allow future dates (no max), otherwise limit to today
    if (!isArchiveTestMode()) {
        datePicker.max = todayStr;
    }
    
    // Load puzzle for initial date (after archive data is loaded)
    loadArchiveData().then(() => {
        loadArchivePuzzle(todayStr);
    }).catch((error) => {
        console.warn('[Archive] Failed to load archive data:', error);
        // Still try to load puzzle - it might be today's puzzle which is already loaded
        loadArchivePuzzle(todayStr);
    });
    
    // Handle date change
    datePicker.addEventListener('change', async (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            await loadArchivePuzzle(selectedDate);
        }
    });
    
    // Handle previous day button
    if (datePrevBtn) {
        datePrevBtn.addEventListener('click', async () => {
            const currentDate = parseDateString(datePicker.value);
            if (currentDate) {
                currentDate.setHours(0, 0, 0, 0);
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 1);
                newDate.setHours(0, 0, 0, 0);
                const minDate = parseDateString(datePicker.min);
                if (minDate) {
                    minDate.setHours(0, 0, 0, 0);
                    if (newDate.getTime() >= minDate.getTime()) {
                        const newDateStr = formatDateString(newDate);
                        datePicker.value = newDateStr;
                        await loadArchivePuzzle(newDateStr);
                    }
                }
            }
        });
    }
    
    // Handle next day button
    if (dateNextBtn) {
        dateNextBtn.addEventListener('click', async () => {
            const currentDate = parseDateString(datePicker.value);
            if (currentDate) {
                currentDate.setHours(0, 0, 0, 0);
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 1);
                newDate.setHours(0, 0, 0, 0);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                // Allow future dates in archive test mode
                if (isArchiveTestMode() || newDate.getTime() <= todayDate.getTime()) {
                    const newDateStr = formatDateString(newDate);
                    datePicker.value = newDateStr;
                    await loadArchivePuzzle(newDateStr);
                }
            }
        });
    }
}

// Load puzzle for archive page
export async function loadArchivePuzzle(dateString) {
    const archiveContent = document.getElementById('archive-puzzle-content');
    if (!archiveContent) return;
    
    // Show loading state
    showArchiveLoading();
    
    // Ensure archive data is loaded before loading puzzle
    await loadArchiveData().catch((error) => {
        console.warn('[Archive] Failed to load archive data:', error);
    });
    
    const date = parseDateString(dateString);
    if (!date) {
        hideArchiveLoading();
        archiveContent.innerHTML = `
            <div class="text-center p-8 bg-white rounded-lg shadow-md">
                <p class="text-lg text-red-600">Invalid date selected.</p>
            </div>
        `;
        return;
    }
    
    // Check if date is before start date
    const startDate = new Date(PUZZLE_START_DATE);
    startDate.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    if (date < startDate) {
        hideArchiveLoading();
        archiveContent.innerHTML = `
            <div class="text-center p-8 bg-white rounded-lg shadow-md">
                <p class="text-lg text-text-primary">No puzzles available before ${formatDateString(startDate)}.</p>
            </div>
        `;
        return;
    }
    
    // Get puzzle number for date
    const puzzleNumber = getPuzzleNumberForDate(date);
    
    // Check if puzzle exists
    if (!PUZZLE_DATA[puzzleNumber]) {
        hideArchiveLoading();
        archiveContent.innerHTML = `
            <div class="text-center p-8 bg-white rounded-lg shadow-md">
                <p class="text-lg text-text-primary">No puzzle available for ${formatDateString(date)}.</p>
                <p class="text-sm text-text-primary mt-2">Puzzle #${puzzleNumber} has not been created yet.</p>
            </div>
        `;
        return;
    }
    
    // Format date for display (not displayed in archive mode, but kept for future use)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const daySuffix = getDaySuffix(date.getDate());
    const dateDisplay = `${dayName} ${date.getDate()}${daySuffix} ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    
    // Create puzzle DOM structure
    createPuzzleDOMStructure(archiveContent, 'archive-', dateDisplay);
    
    // Hide the date title in archive mode (date picker remains visible)
    const puzzleTitle = document.getElementById('archive-puzzle-title');
    if (puzzleTitle) {
        // Hide the title element by hiding its parent header
        const titleHeader = puzzleTitle.closest('header');
        if (titleHeader) {
            titleHeader.classList.add('hidden');
        }
    }
    
    // Initialize the puzzle interface using shared initialization function
    initArchivePuzzle(puzzleNumber, dateString);
}

// Initialize puzzle interface for archive page
function initArchivePuzzle(puzzleNumber, dateString) {
    // Check if puzzle exists
    if (!PUZZLE_DATA[puzzleNumber]) {
        return;
    }

    // Create state manager for archive
    const stateManager = createStateManager('archive-');
    
    // Use shared initialization function
    initPuzzleWithPrefix(puzzleNumber, 'archive-', stateManager);
}

