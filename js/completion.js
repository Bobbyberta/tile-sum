// Completion tracking utilities

import { formatDateString, getDateForPuzzleNumber } from '../puzzle-data-today.js';
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

