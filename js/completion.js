// Completion tracking utilities

import { formatDateString, parseDateString, getDateForPuzzleNumber } from '../puzzle-data-today.js';
import { updateStreak } from './streak.js';

// Save puzzle completion status
export function savePuzzleCompletion(puzzleNumber, date) {
    if (!date) {
        date = getDateForPuzzleNumber(puzzleNumber);
    }
    
    if (!date) return;
    
    const dateString = formatDateString(date);
    const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
    
    try {
        localStorage.setItem(key, 'true');
        
        // Update streak when puzzle is completed
        updateStreak(date, true);
    } catch (error) {
        console.error('Error saving puzzle completion:', error);
    }
}

// Check if puzzle is completed today
export function isPuzzleCompletedToday(puzzleNumber) {
    const today = new Date();
    const dateString = formatDateString(today);
    const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
    
    try {
        return localStorage.getItem(key) === 'true';
    } catch (error) {
        console.error('Error checking puzzle completion:', error);
        return false;
    }
}

// Check if puzzle is completed for a specific date
export function isPuzzleCompletedForDate(puzzleNumber, date) {
    if (!date) return false;
    
    const dateString = formatDateString(date);
    const key = `puzzle-completed-${puzzleNumber}-${dateString}`;
    
    try {
        return localStorage.getItem(key) === 'true';
    } catch (error) {
        console.error('Error checking puzzle completion:', error);
        return false;
    }
}

// Check if user has seen the help modal before
export function hasSeenHelp() {
    try {
        return localStorage.getItem('has-seen-help') === 'true';
    } catch (error) {
        console.error('Error checking if help has been seen:', error);
        return false;
    }
}

// Mark help modal as seen
export function markHelpAsSeen() {
    try {
        localStorage.setItem('has-seen-help', 'true');
    } catch (error) {
        console.error('Error marking help as seen:', error);
    }
}

// Save puzzle completion time
export function savePuzzleCompletionTime(puzzleNumber, date, completionTimeMs) {
    if (!date) {
        date = getDateForPuzzleNumber(puzzleNumber);
    }
    
    if (!date || !completionTimeMs) return;
    
    const dateString = formatDateString(date);
    const key = `puzzle-time-${puzzleNumber}-${dateString}`;
    
    try {
        localStorage.setItem(key, completionTimeMs.toString());
    } catch (error) {
        console.error('Error saving puzzle completion time:', error);
    }
}

// Get puzzle completion time for a specific puzzle/date
export function getPuzzleCompletionTime(puzzleNumber, date) {
    if (!date) return null;
    
    const dateString = formatDateString(date);
    const key = `puzzle-time-${puzzleNumber}-${dateString}`;
    
    try {
        const timeStr = localStorage.getItem(key);
        if (timeStr) {
            const timeMs = parseInt(timeStr, 10);
            return isNaN(timeMs) ? null : timeMs;
        }
        return null;
    } catch (error) {
        console.error('Error getting puzzle completion time:', error);
        return null;
    }
}

// Get previous completion time (yesterday first, then most recent)
export function getPreviousCompletionTime(puzzleNumber, currentDate) {
    if (!currentDate) return null;
    
    try {
        const currentDateString = formatDateString(currentDate);
        const currentDateObj = parseDateString(currentDateString);
        if (!currentDateObj) return null;
        
        // Normalize current date to start of day for accurate comparison
        currentDateObj.setHours(0, 0, 0, 0);
        
        // First, check yesterday's puzzle completion time
        const yesterday = new Date(currentDateObj);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        
        const yesterdayString = formatDateString(yesterday);
        const yesterdayKey = `puzzle-time-${puzzleNumber}-${yesterdayString}`;
        const yesterdayTimeStr = localStorage.getItem(yesterdayKey);
        
        if (yesterdayTimeStr) {
            const timeMs = parseInt(yesterdayTimeStr, 10);
            if (!isNaN(timeMs)) {
                return {
                    timeMs,
                    date: yesterday,
                    puzzleNumber,
                    isYesterday: true
                };
            }
        }
        
        // If yesterday not available, find most recent completion time from any puzzle
        let mostRecentTime = null;
        let mostRecentDate = null;
        let mostRecentPuzzleNumber = null;
        
        // Iterate through all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('puzzle-time-')) {
                // Extract puzzle number and date from key format: puzzle-time-{puzzleNumber}-{dateString}
                const parts = key.split('-');
                if (parts.length >= 4) {
                    const puzzleNum = parseInt(parts[2], 10);
                    const dateString = parts.slice(3).join('-');
                    
                    // Validate date format (YYYY-MM-DD)
                    if (!isNaN(puzzleNum) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                        const storedDate = parseDateString(dateString);
                        if (storedDate) {
                            // Normalize stored date to start of day for accurate comparison
                            storedDate.setHours(0, 0, 0, 0);
                            
                            if (storedDate < currentDateObj) {
                                // This is a past completion
                                const timeStr = localStorage.getItem(key);
                                if (timeStr) {
                                    const timeMs = parseInt(timeStr, 10);
                                    if (!isNaN(timeMs)) {
                                        // Check if this is more recent than what we've found so far
                                        if (!mostRecentDate || storedDate > mostRecentDate) {
                                            mostRecentTime = timeMs;
                                            mostRecentDate = storedDate;
                                            mostRecentPuzzleNumber = puzzleNum;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (mostRecentTime !== null) {
            return {
                timeMs: mostRecentTime,
                date: mostRecentDate,
                puzzleNumber: mostRecentPuzzleNumber,
                isYesterday: false
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting previous completion time:', error);
        return null;
    }
}

// Format completion time in milliseconds to human-readable string
export function formatCompletionTime(timeMs) {
    if (!timeMs || timeMs < 0) return '0 seconds';
    
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) {
        return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    } else if (seconds === 0) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    }
}

