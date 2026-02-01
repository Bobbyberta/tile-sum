// Streak tracking utilities

import { formatDateString, parseDateString } from '../puzzle-data-today.js';

const STREAK_STORAGE_KEY = 'puzzle-streak';
const LAST_VISIT_STORAGE_KEY = 'puzzle-last-visit';
const LAST_COMPLETION_STORAGE_KEY = 'puzzle-last-completion';

/**
 * Gets the current streak count from localStorage.
 * 
 * @returns {number} Current streak count (0 if no streak)
 * 
 * @example
 * const streak = getStreak();
 * console.log(`Current streak: ${streak} days`);
 */
export function getStreak() {
    try {
        const streak = localStorage.getItem(STREAK_STORAGE_KEY);
        return streak ? parseInt(streak, 10) : 0;
    } catch (error) {
        console.error('Error getting streak:', error);
        return 0;
    }
}

/**
 * Gets the total number of unique days the user has played (completed puzzles).
 * Counts unique dates from completion entries in localStorage.
 * 
 * @returns {number} Total number of unique days played
 * 
 * @example
 * const totalDays = getTotalDaysPlayed();
 * console.log(`Total days played: ${totalDays}`);
 */
export function getTotalDaysPlayed() {
    try {
        const uniqueDates = new Set();
        
        // Iterate through all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('puzzle-completed-')) {
                // Extract date from key format: puzzle-completed-{puzzleNumber}-{dateString}
                const parts = key.split('-');
                if (parts.length >= 4) {
                    // Date is the last part (YYYY-MM-DD format)
                    const dateString = parts.slice(3).join('-');
                    // Validate date format (YYYY-MM-DD)
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                        uniqueDates.add(dateString);
                    }
                }
            }
        }
        
        return uniqueDates.size;
    } catch (error) {
        console.error('Error getting total days played:', error);
        return 0;
    }
}

// Get last visit date string
function getLastVisitDateString() {
    try {
        return localStorage.getItem(LAST_VISIT_STORAGE_KEY);
    } catch (error) {
        console.error('Error getting last visit date:', error);
        return null;
    }
}

// Get last completion date string
function getLastCompletionDateString() {
    try {
        return localStorage.getItem(LAST_COMPLETION_STORAGE_KEY);
    } catch (error) {
        console.error('Error getting last completion date:', error);
        return null;
    }
}

/**
 * Updates the streak based on puzzle completion.
 * Increments streak if completing puzzles on consecutive days, resets if there's a gap.
 * 
 * @param {Date} [testDate=null] - Optional test date (for testing purposes)
 * @param {boolean} [isCompletion=false] - Whether this is a puzzle completion (true) or just a visit (false)
 * @returns {number} Updated streak count
 * 
 * @example
 * // Update streak on puzzle completion
 * const newStreak = updateStreak(null, true);
 * 
 * // Update streak on page visit (for display purposes)
 * const currentStreak = updateStreak();
 */
export function updateStreak(testDate = null, isCompletion = false) {
    const today = testDate || new Date();
    const todayString = formatDateString(today);
    
    // For completions, use last completion date; for visits, use last visit date
    const lastDateString = isCompletion ? getLastCompletionDateString() : getLastVisitDateString();
    
    // If no last date, this is their first time - don't start streak yet
    if (!lastDateString) {
        if (isCompletion) {
            setStreak(1, todayString, true);
            return 1;
        } else {
            setStreak(0, todayString, false);
            return 0;
        }
    }
    
    // Parse dates for comparison
    const lastDate = parseDateString(lastDateString);
    const todayDate = parseDateString(todayString);
    
    if (!lastDate || !todayDate) {
        // If parsing fails, start fresh
        if (isCompletion) {
            setStreak(1, todayString, true);
            return 1;
        } else {
            setStreak(0, todayString, false);
            return 0;
        }
    }
    
    // Set time to start of day for accurate comparison
    lastDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const timeDiff = todayDate.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    let newStreak;
    
    if (daysDiff === 0) {
        // Same day - don't increment, just update last date
        newStreak = getStreak();
    } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        const currentStreak = getStreak();
        // For completions, start at 1 on first completion, then increment
        // For visits, keep existing logic (first consecutive = 2)
        if (isCompletion) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = currentStreak === 0 ? 2 : currentStreak + 1;
        }
    } else {
        // Gap in days - reset streak
        // For completions, start at 1 (today's completion)
        // For visits, reset to 0
        newStreak = isCompletion ? 1 : 0;
    }
    
    if (isCompletion) {
        setStreak(newStreak, todayString, true);
    } else {
        setStreak(newStreak, todayString, false);
    }
    
    return newStreak;
}

// Set streak and last visit/completion date
function setStreak(count, dateString, isCompletion = false) {
    try {
        localStorage.setItem(STREAK_STORAGE_KEY, count.toString());
        if (isCompletion) {
            localStorage.setItem(LAST_COMPLETION_STORAGE_KEY, dateString);
        } else {
            localStorage.setItem(LAST_VISIT_STORAGE_KEY, dateString);
        }
    } catch (error) {
        console.error('Error setting streak:', error);
    }
}

/**
 * Resets the streak to 0 (for testing purposes).
 * Removes streak data from localStorage.
 * 
 * @returns {void}
 * 
 * @example
 * resetStreak();
 */
export function resetStreak() {
    try {
        localStorage.removeItem(STREAK_STORAGE_KEY);
        localStorage.removeItem(LAST_VISIT_STORAGE_KEY);
        localStorage.removeItem(LAST_COMPLETION_STORAGE_KEY);
    } catch (error) {
        console.error('Error resetting streak:', error);
    }
}

/**
 * Sets streak to a specific value (for testing purposes).
 * 
 * @param {number} count - Streak count to set
 * @param {string} dateString - Date string for last visit
 * @returns {void}
 * 
 * @example
 * setStreakForTesting(5, '2024-12-05');
 */
export function setStreakForTesting(count, dateString, isCompletion = false) {
    setStreak(count, dateString, isCompletion);
}

/**
 * Displays the streak counter in the UI.
 * Updates streak based on current visit and shows/hides streak display.
 * Only shows streak if it's greater than 0 (requires at least 2 consecutive visits).
 * 
 * @param {Date} [testDate=null] - Optional test date (for testing purposes)
 * @returns {void}
 * 
 * @example
 * // Called on page load
 * displayStreak();
 */
export function displayStreak(testDate = null) {
    const streakContainer = document.getElementById('streak-container');
    const streakDisplay = document.getElementById('streak-display');
    
    if (!streakContainer || !streakDisplay) return;
    
    // Update streak based on current visit
    const currentStreak = updateStreak(testDate);
    
    // Only show if streak is greater than 0 (requires at least 2 consecutive visits)
    if (currentStreak > 0) {
        streakDisplay.textContent = `🔥 ${currentStreak}`;
        streakDisplay.setAttribute('aria-label', `Current streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}`);
        streakContainer.classList.remove('hidden');
    } else {
        streakContainer.classList.add('hidden');
    }
}

/**
 * Displays streak and total days played stats on the home page.
 * Updates the stats display with current streak and total days played.
 * 
 * @param {Date} [testDate=null] - Optional test date (for testing purposes)
 * @returns {void}
 * 
 * @example
 * // Called on page load for index.html
 * displayStreakOnHomePage();
 */
export function displayStreakOnHomePage(testDate = null) {
    const totalDaysElement = document.getElementById('total-days-played');
    const streakElement = document.getElementById('home-streak-display');
    const statsContainer = document.getElementById('home-stats-container');
    
    if (!statsContainer) return;
    
    // Get total days played
    const totalDays = getTotalDaysPlayed();
    
    // Get current streak (don't update on visit, just display current value)
    const currentStreak = getStreak();
    
    // Update total days played
    if (totalDaysElement) {
        totalDaysElement.textContent = totalDays === 1 ? '1 day played' : `${totalDays} days played`;
        totalDaysElement.setAttribute('aria-label', `Total days played: ${totalDays}`);
    }
    
    // Update streak display
    if (streakElement) {
        if (currentStreak > 0) {
            streakElement.textContent = currentStreak === 1 ? '🔥 1 day streak' : `🔥 ${currentStreak} days streak`;
            streakElement.setAttribute('aria-label', `Current streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}`);
        } else {
            streakElement.textContent = 'No streak yet';
            streakElement.setAttribute('aria-label', 'No current streak');
        }
    }
    
    // Always show stats container (even if streak is 0)
    statsContainer.classList.remove('hidden');
}
