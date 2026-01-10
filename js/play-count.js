// Play count tracking utilities
// Tracks how many people have played each puzzle each day

import { formatDateString, getDateForPuzzleNumber } from '../puzzle-data-encoded.js';

// API endpoint for play count service
// Set this to your backend API endpoint (e.g., Cloudflare Worker, Vercel Function, etc.)
// You can configure this by setting window.PLAY_COUNT_API_URL before the script loads,
// or modify this constant directly.
// Example: 'https://your-worker.workers.dev/api/play-count'
const PLAY_COUNT_API_URL = (typeof window !== 'undefined' && window.PLAY_COUNT_API_URL) || '';

// Cache play counts in memory to avoid excessive API calls
const playCountCache = new Map();

// Track if we've already recorded a play for this puzzle/date in this session
const sessionPlayRecorded = new Set();

/**
 * Record that a puzzle has been played/completed
 * @param {number} puzzleNumber - The puzzle number
 * @param {Date} date - The date the puzzle was played (defaults to today)
 */
export async function recordPlay(puzzleNumber, date = null) {
    if (!date) {
        date = getDateForPuzzleNumber(puzzleNumber);
    }
    
    if (!date || !puzzleNumber) return;
    
    const dateString = formatDateString(date);
    const cacheKey = `${puzzleNumber}-${dateString}`;
    
    // Don't record the same play twice in the same session
    if (sessionPlayRecorded.has(cacheKey)) {
        return;
    }
    
    // If no API URL is configured, silently fail (allows offline/local development)
    if (!PLAY_COUNT_API_URL) {
        console.warn('Play count API URL not configured. Skipping play count recording.');
        return;
    }
    
    try {
        const response = await fetch(`${PLAY_COUNT_API_URL}/record`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                puzzleNumber,
                date: dateString,
            }),
        });
        
        if (response.ok) {
            sessionPlayRecorded.add(cacheKey);
            // Clear cache for this puzzle/date so it refreshes on next fetch
            playCountCache.delete(cacheKey);
        } else {
            console.warn('Failed to record play count:', response.statusText);
        }
    } catch (error) {
        // Silently fail - don't interrupt user experience if tracking fails
        console.warn('Error recording play count:', error);
    }
}

/**
 * Get the play count for a specific puzzle and date
 * @param {number} puzzleNumber - The puzzle number
 * @param {Date} date - The date to check (defaults to today)
 * @returns {Promise<number>} The number of plays, or 0 if unavailable
 */
export async function getPlayCount(puzzleNumber, date = null) {
    if (!date) {
        date = getDateForPuzzleNumber(puzzleNumber);
    }
    
    if (!date || !puzzleNumber) return 0;
    
    const dateString = formatDateString(date);
    const cacheKey = `${puzzleNumber}-${dateString}`;
    
    // Check cache first
    if (playCountCache.has(cacheKey)) {
        return playCountCache.get(cacheKey);
    }
    
    // If no API URL is configured, return 0
    if (!PLAY_COUNT_API_URL) {
        return 0;
    }
    
    try {
        const response = await fetch(`${PLAY_COUNT_API_URL}/count?puzzleNumber=${puzzleNumber}&date=${encodeURIComponent(dateString)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            const count = data.count || 0;
            // Cache the result for 30 seconds to avoid excessive API calls
            playCountCache.set(cacheKey, count);
            setTimeout(() => playCountCache.delete(cacheKey), 30000);
            return count;
        } else {
            console.warn('Failed to get play count:', response.statusText);
            return 0;
        }
    } catch (error) {
        // Return 0 if there's an error - don't interrupt user experience
        console.warn('Error getting play count:', error);
        return 0;
    }
}

/**
 * Format play count for display (e.g., "1,234 players" or "5 players")
 * @param {number} count - The play count
 * @returns {string} Formatted string
 */
export function formatPlayCount(count) {
    if (count === 0) {
        return '0 players';
    }
    
    const formatted = count.toLocaleString('en-US');
    return `${formatted} ${count === 1 ? 'player' : 'players'}`;
}

/**
 * Update play count display element
 * @param {HTMLElement} element - The element to update
 * @param {number} puzzleNumber - The puzzle number
 * @param {Date} date - The date to check (defaults to today)
 */
export async function updatePlayCountDisplay(element, puzzleNumber, date = null) {
    if (!element) return;
    
    // Show loading state
    element.textContent = 'Loading...';
    element.classList.add('opacity-50');
    
    const count = await getPlayCount(puzzleNumber, date);
    
    // Update display
    element.textContent = formatPlayCount(count);
    element.classList.remove('opacity-50');
}
