// Puzzle data loader - dynamically loads archive puzzle data
// Merges archive chunks into the existing PUZZLE_DATA proxy

let archiveDataLoaded = false;
let archiveDataLoading = false;
let archiveLoadPromise = null;

/**
 * Loads archive puzzle data and merges it into PUZZLE_DATA
 * @returns {Promise<void>}
 */
export async function loadArchiveData() {
    // Return existing promise if already loading
    if (archiveDataLoading && archiveLoadPromise) {
        return archiveLoadPromise;
    }
    
    // Return immediately if already loaded
    if (archiveDataLoaded) {
        return Promise.resolve();
    }
    
    // Start loading
    archiveDataLoading = true;
    
    archiveLoadPromise = (async () => {
        try {
            // Dynamically import archive data
            const archiveModule = await import('../puzzle-data-archive.js');
            
            // Import the extend function from today's data
            // The extend function is exported from puzzle-data-today.js
            const todayModule = await import('../puzzle-data-today.js');
            
            // Check if today module has the extend function
            if (todayModule._extendPuzzleData) {
                // Merge archive chunks into today's data
                todayModule._extendPuzzleData(
                    archiveModule._archiveChunks,
                    archiveModule._archiveChunkData
                );
            } else {
                // Fallback: manually merge if extend function doesn't exist
                console.warn('[Puzzle Data Loader] _extendPuzzleData not found, archive data may not be fully loaded');
            }
            
            archiveDataLoaded = true;
            archiveDataLoading = false;
            
            console.log('[Puzzle Data Loader] Archive data loaded successfully');
        } catch (error) {
            archiveDataLoading = false;
            console.error('[Puzzle Data Loader] Failed to load archive data:', error);
            throw error;
        }
    })();
    
    return archiveLoadPromise;
}

/**
 * Loads archive data during idle time (non-blocking)
 * Uses requestIdleCallback with timeout fallback
 */
export function loadArchiveDataIdle() {
    // Don't load if already loaded or loading
    if (archiveDataLoaded || archiveDataLoading) {
        return;
    }
    
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadArchiveData().catch((error) => {
                // Silently fail - archive data will load on-demand if needed
                console.warn('[Puzzle Data Loader] Idle loading failed:', error);
            });
        }, { timeout: 3000 });
    } else {
        // Fallback: use setTimeout
        setTimeout(() => {
            loadArchiveData().catch((error) => {
                console.warn('[Puzzle Data Loader] Delayed loading failed:', error);
            });
        }, 1000);
    }
}

/**
 * Checks if archive data is loaded
 * @returns {boolean}
 */
export function isArchiveDataLoaded() {
    return archiveDataLoaded;
}
