// Streak tracking utilities

import { formatDateString, parseDateString } from '../puzzle-data-encoded.js';

const STREAK_STORAGE_KEY = 'puzzle-streak';
const LAST_VISIT_STORAGE_KEY = 'puzzle-last-visit';

// Get current streak count
export function getStreak() {
    try {
        const streak = localStorage.getItem(STREAK_STORAGE_KEY);
        return streak ? parseInt(streak, 10) : 0;
    } catch (error) {
        console.error('Error getting streak:', error);
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

// Update streak based on current visit
export function updateStreak(testDate = null) {
    const today = testDate || new Date();
    const todayString = formatDateString(today);
    const lastVisitString = getLastVisitDateString();
    
    // If no last visit, this is their first time - don't start streak yet
    if (!lastVisitString) {
        setStreak(0, todayString);
        return 0;
    }
    
    // Parse dates for comparison
    const lastVisit = parseDateString(lastVisitString);
    const todayDate = parseDateString(todayString);
    
    if (!lastVisit || !todayDate) {
        // If parsing fails, start fresh
        setStreak(0, todayString);
        return 0;
    }
    
    // Set time to start of day for accurate comparison
    lastVisit.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const timeDiff = todayDate.getTime() - lastVisit.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    let newStreak;
    
    if (daysDiff === 0) {
        // Same day - don't increment, just update last visit
        newStreak = getStreak();
    } else if (daysDiff === 1) {
        // Consecutive day - increment streak (first consecutive visit = streak 2)
        const currentStreak = getStreak();
        newStreak = currentStreak === 0 ? 2 : currentStreak + 1;
    } else {
        // Gap in visits - reset streak to 0
        newStreak = 0;
    }
    
    setStreak(newStreak, todayString);
    return newStreak;
}

// Set streak and last visit date
function setStreak(count, dateString) {
    try {
        localStorage.setItem(STREAK_STORAGE_KEY, count.toString());
        localStorage.setItem(LAST_VISIT_STORAGE_KEY, dateString);
    } catch (error) {
        console.error('Error setting streak:', error);
    }
}

// Reset streak (for testing)
export function resetStreak() {
    try {
        localStorage.removeItem(STREAK_STORAGE_KEY);
        localStorage.removeItem(LAST_VISIT_STORAGE_KEY);
    } catch (error) {
        console.error('Error resetting streak:', error);
    }
}

// Set streak to a specific value (for testing)
export function setStreakForTesting(count, dateString) {
    setStreak(count, dateString);
}

// Display streak counter in the UI
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
