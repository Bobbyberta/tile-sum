// Loading state management and UI indicators

/**
 * Shows a loading indicator for puzzle initialization
 * @param {string} containerId - ID of the container to show loading in
 * @param {string} prefix - Prefix for the container (e.g., 'daily-', 'archive-')
 */
export function showPuzzleLoading(containerId, prefix = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Announce loading to screen readers
    const statusId = prefix ? `${prefix}loading-status` : 'loading-status';
    const loadingStatus = document.getElementById(statusId);
    if (loadingStatus) {
        loadingStatus.textContent = 'Loading puzzle...';
    }
    
    // Check if this is a container that needs to preserve its structure (daily-puzzle-container)
    // For these, we show loading overlay instead of replacing content
    if (containerId === 'daily-puzzle-container' || containerId === 'archive-puzzle-content') {
        // Create loading overlay that doesn't replace the container structure
        const existingOverlay = container.querySelector('.puzzle-loading-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'puzzle-loading-overlay absolute inset-0 bg-bg-primary bg-opacity-90 flex items-center justify-center z-10';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary mx-auto mb-4"></div>
                <p class="text-text-primary font-semibold">Loading puzzle...</p>
            </div>
        `;
        
        // Make container relative positioned if not already
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        container.appendChild(overlay);
        container.classList.remove('hidden');
        return;
    }
    
    // For other containers, replace content with loading skeleton
    const loadingHTML = `
        <div class="puzzle-loading-skeleton animate-pulse">
            <div class="mb-8">
                <div class="h-12 bg-gray-300 rounded-lg w-64 mx-auto mb-4"></div>
                <div class="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
            <div class="mb-8 flex justify-center">
                <div class="flex flex-wrap gap-2 p-4 bg-gray-100 rounded-lg w-full max-w-2xl">
                    ${Array(12).fill(0).map(() => `
                        <div class="w-16 h-16 bg-gray-200 rounded-xl"></div>
                    `).join('')}
                </div>
            </div>
            <div class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                ${Array(2).fill(0).map(() => `
                    <div class="bg-gray-100 rounded-2xl p-4">
                        <div class="flex gap-2 mb-4">
                            ${Array(5).fill(0).map(() => `
                                <div class="w-16 h-16 bg-gray-200 rounded-xl"></div>
                            `).join('')}
                        </div>
                        <div class="h-10 bg-gray-200 rounded-lg w-32 ml-auto"></div>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-center gap-4">
                <div class="h-12 bg-gray-200 rounded-full w-32"></div>
                <div class="h-12 bg-gray-200 rounded-full w-32"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = loadingHTML;
    container.classList.remove('hidden');
}

/**
 * Hides loading indicator
 * @param {string} containerId - ID of the container
 */
export function hidePuzzleLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove overlay if present
    const overlay = container.querySelector('.puzzle-loading-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Remove skeleton if present
    const loadingElement = container.querySelector('.puzzle-loading-skeleton');
    if (loadingElement) {
        loadingElement.remove();
    }
    
    // Clear loading status for screen readers
    let prefix = '';
    if (containerId.includes('daily')) prefix = 'daily-';
    else if (containerId.includes('archive')) prefix = 'archive-';
    
    const statusId = prefix ? `${prefix}loading-status` : 'loading-status';
    const loadingStatus = document.getElementById(statusId);
    if (loadingStatus) {
        loadingStatus.textContent = '';
    }
}

/**
 * Shows a simple loading spinner
 * @param {string} containerId - ID of the container
 * @param {string} message - Optional loading message
 */
export function showLoadingSpinner(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const spinnerHTML = `
        <div class="loading-spinner flex flex-col items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary mb-4"></div>
            <p class="text-text-primary font-semibold">${message}</p>
        </div>
    `;
    
    container.innerHTML = spinnerHTML;
    container.classList.remove('hidden');
}

/**
 * Shows loading state for archive data
 */
export function showArchiveLoading() {
    const archiveContent = document.getElementById('archive-puzzle-content');
    if (archiveContent) {
        showLoadingSpinner('archive-puzzle-content', 'Loading archive puzzle...');
    }
}

/**
 * Hides archive loading state
 */
export function hideArchiveLoading() {
    const archiveContent = document.getElementById('archive-puzzle-content');
    if (archiveContent) {
        const spinner = archiveContent.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }
}
