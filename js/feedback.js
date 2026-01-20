// User feedback and animations

/**
 * Shows a feedback message to the user.
 * Displays success or error messages with appropriate styling and accessibility attributes.
 * 
 * @param {string} message - The feedback message to display
 * @param {string} type - The type of feedback: 'success' or 'error'
 * @param {string} [feedbackElementId='feedback'] - ID of the feedback element
 * @returns {void}
 * 
 * @example
 * showFeedback('Puzzle completed!', 'success');
 * showFeedback('Incorrect solution', 'error', 'archive-feedback');
 */
export function showFeedback(message, type, feedbackElementId = 'feedback') {
    const feedback = document.getElementById(feedbackElementId);
    if (!feedback) return;

    // Remove previous type classes
    feedback.classList.remove('success', 'error');
    
    // Set Tailwind classes and type class
    feedback.className = `p-4 rounded-lg mb-8 ${
        type === 'success' 
            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
            : 'bg-red-100 text-red-800 border-2 border-red-300'
    }`;
    
    // Add type class for testing/scripting purposes
    feedback.classList.add(type);
    
    feedback.textContent = message;
    feedback.classList.remove('hidden');
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'polite');

    // Scroll to feedback
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Track confetti library loading state
let confettiLoading = false;
let confettiLoaded = false;

/**
 * Dynamically loads the canvas-confetti library from CDN.
 * Returns a Promise that resolves when the library is loaded.
 * 
 * @returns {Promise<void>}
 */
function loadConfettiLibrary() {
    // Return existing promise if already loading
    if (confettiLoading) {
        return new Promise((resolve) => {
            const checkLoaded = setInterval(() => {
                if (confettiLoaded && typeof confetti !== 'undefined') {
                    clearInterval(checkLoaded);
                    resolve();
                }
            }, 50);
        });
    }
    
    // Return immediately if already loaded
    if (confettiLoaded && typeof confetti !== 'undefined') {
        return Promise.resolve();
    }
    
    // Start loading
    confettiLoading = true;
    
    return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="canvas-confetti"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                confettiLoaded = true;
                confettiLoading = false;
                resolve();
            });
            existingScript.addEventListener('error', reject);
            return;
        }
        
        // Create and load script
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
        script.async = true;
        
        script.onload = () => {
            confettiLoaded = true;
            confettiLoading = false;
            resolve();
        };
        
        script.onerror = () => {
            confettiLoading = false;
            reject(new Error('Failed to load confetti library'));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Triggers a snowflake confetti animation using the canvas-confetti library.
 * Creates a winter-themed celebration effect when puzzles are solved.
 * Dynamically loads the confetti library if not already loaded.
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * // Called after puzzle is solved
 * triggerSnowflakeConfetti();
 */
export function triggerSnowflakeConfetti() {
    // Load confetti library if needed, then trigger animation
    return loadConfettiLibrary()
        .then(() => {
            // Check if confetti library is available
            if (typeof confetti === 'undefined') {
                console.warn('Confetti library loaded but confetti function not available');
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
        })
        .catch((error) => {
            // Silently fail if confetti can't be loaded
            console.warn('Could not load confetti library:', error);
        });
}

