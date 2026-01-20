// Error handling and recovery utilities

/**
 * Shows a user-friendly error message
 * @param {string} message - Error message to display
 * @param {string} containerId - Container ID to show error in
 * @param {Function} retryCallback - Optional retry function
 */
export function showError(message, containerId, retryCallback = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Error container not found:', containerId);
        return;
    }
    
    const errorHTML = `
        <div class="error-message bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-4" role="alert">
            <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div class="flex-1">
                    <p class="text-red-800 font-semibold mb-1">Something went wrong</p>
                    <p class="text-red-700 text-sm">${message}</p>
                    ${retryCallback ? `
                        <button 
                            class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                            onclick="this.closest('.error-message').querySelector('[data-retry]').click()"
                        >
                            Try Again
                        </button>
                        <button 
                            data-retry
                            class="hidden"
                            onclick="(${retryCallback.toString()})()"
                        ></button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = errorHTML;
    container.classList.remove('hidden');
}

/**
 * Checks if the browser is online
 * @returns {boolean}
 */
export function isOnline() {
    return navigator.onLine !== false;
}

/**
 * Shows offline message
 * @param {string} containerId - Container ID to show message in
 */
export function showOfflineMessage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const offlineHTML = `
        <div class="offline-message bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 mb-4" role="alert">
            <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                </svg>
                <div class="flex-1">
                    <p class="text-yellow-800 font-semibold mb-1">You're offline</p>
                    <p class="text-yellow-700 text-sm">Some features may not be available. Please check your internet connection.</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = offlineHTML;
    container.classList.remove('hidden');
}

/**
 * Hides offline message
 * @param {string} containerId - Container ID
 */
export function hideOfflineMessage(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const offlineMessage = container.querySelector('.offline-message');
    if (offlineMessage) {
        offlineMessage.remove();
    }
}

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Function to retry (should return a Promise)
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise}
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Sets up offline/online event listeners
 * @param {Function} onOffline - Callback when going offline
 * @param {Function} onOnline - Callback when coming online
 */
export function setupNetworkListeners(onOffline, onOnline) {
    window.addEventListener('offline', () => {
        if (onOffline) onOffline();
    });
    
    window.addEventListener('online', () => {
        if (onOnline) onOnline();
    });
}
