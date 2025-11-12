// User feedback and animations

// Show feedback message
export function showFeedback(message, type, feedbackElementId = 'feedback') {
    const feedback = document.getElementById(feedbackElementId);
    if (!feedback) return;

    feedback.className = `p-4 rounded-lg mb-8 ${
        type === 'success' 
            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
            : 'bg-red-100 text-red-800 border-2 border-red-300'
    }`;
    feedback.textContent = message;
    feedback.classList.remove('hidden');
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'polite');

    // Scroll to feedback
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Trigger snowflake confetti animation
export function triggerSnowflakeConfetti() {
    // Check if confetti library is available
    if (typeof confetti === 'undefined') {
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
}

