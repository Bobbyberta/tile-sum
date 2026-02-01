// GDPR Consent Management Module
// Handles cookie consent banner and conditional Google Analytics loading

const CONSENT_STORAGE_KEY = 'sum-tile-consent';
const GA_MEASUREMENT_ID = 'G-E4YJ359T9L';

/**
 * Get the current consent status from localStorage.
 * @returns {Object|null} Consent object with analytics boolean and timestamp, or null if not set
 */
export function getConsentStatus() {
    try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) {
        console.debug('Error reading consent status:', e);
        return null;
    }
}

/**
 * Store the consent status in localStorage.
 * @param {boolean} analyticsConsent - Whether user consented to analytics
 */
export function setConsentStatus(analyticsConsent) {
    try {
        const consentData = {
            analytics: analyticsConsent,
            timestamp: Date.now()
        };
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    } catch (e) {
        console.debug('Error storing consent status:', e);
    }
}

/**
 * Check if user has already given consent (either accept or reject).
 * @returns {boolean} True if consent has been given, false otherwise
 */
export function hasConsentBeenGiven() {
    const consent = getConsentStatus();
    return consent !== null;
}

/**
 * Check if analytics consent has been granted.
 * @returns {boolean} True if analytics consent granted, false otherwise
 */
export function hasAnalyticsConsent() {
    const consent = getConsentStatus();
    return consent !== null && consent.analytics === true;
}

/**
 * Show the cookie consent banner.
 */
export function showConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (!banner) return;
    
    banner.classList.remove('hidden');
    banner.setAttribute('aria-hidden', 'false');
    
    // Focus management for accessibility
    const acceptButton = banner.querySelector('#consent-accept');
    if (acceptButton) {
        // Small delay to ensure banner is visible before focusing
        setTimeout(() => {
            acceptButton.focus();
        }, 100);
    }
}

/**
 * Hide the cookie consent banner.
 */
export function hideConsentBanner() {
    const banner = document.getElementById('consent-banner');
    if (!banner) return;
    
    banner.classList.add('hidden');
    banner.setAttribute('aria-hidden', 'true');
}

/**
 * Handle user accepting analytics cookies.
 */
function handleAccept() {
    setConsentStatus(true);
    hideConsentBanner();
    loadGoogleAnalytics();
    
    // Update Google Consent Mode
    if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }
}

/**
 * Handle user rejecting analytics cookies.
 */
function handleReject() {
    setConsentStatus(false);
    hideConsentBanner();
    
    // Ensure analytics storage is denied
    if (typeof window.gtag !== 'undefined') {
        window.gtag('consent', 'update', {
            'analytics_storage': 'denied'
        });
    }
}

/**
 * Load Google Analytics only if consent has been given.
 * Preserves existing Web Vitals tracking and custom events.
 */
export function loadGoogleAnalytics() {
    // Only load if consent has been granted
    if (!hasAnalyticsConsent()) {
        return;
    }
    
    // Initialize dataLayer and gtag if not already done
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        'send_page_view': false // We'll send page views manually after load
    });
    
    // Load the GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Send page view after script loads
    script.onload = function() {
        gtag('config', GA_MEASUREMENT_ID);
        
        // Track Web Vitals if available
        if ('PerformanceObserver' in window) {
            try {
                // Largest Contentful Paint (LCP)
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    gtag('event', 'web_vitals', {
                        'event_category': 'Web Vitals',
                        'event_label': 'LCP',
                        'value': Math.round(lastEntry.renderTime || lastEntry.loadTime),
                        'non_interaction': true
                    });
                }).observe({ entryTypes: ['largest-contentful-paint'] });
                
                // First Input Delay (FID)
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach((entry) => {
                        gtag('event', 'web_vitals', {
                            'event_category': 'Web Vitals',
                            'event_label': 'FID',
                            'value': Math.round(entry.processingStart - entry.startTime),
                            'non_interaction': true
                        });
                    });
                }).observe({ entryTypes: ['first-input'] });
                
                // Cumulative Layout Shift (CLS)
                let clsValue = 0;
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach((entry) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    gtag('event', 'web_vitals', {
                        'event_category': 'Web Vitals',
                        'event_label': 'CLS',
                        'value': Math.round(clsValue * 1000) / 1000,
                        'non_interaction': true
                    });
                }).observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.debug('Web Vitals tracking not available');
            }
        }
    };
}

/**
 * Initialize consent management on page load.
 * Sets up Google Consent Mode, checks for existing consent, and shows banner if needed.
 */
export function initConsent() {
    // Initialize dataLayer and gtag function immediately (for queuing)
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    
    // Set default consent state to denied (GDPR requirement)
    gtag('consent', 'default', {
        'analytics_storage': 'denied'
    });
    
    // Set up event listeners for consent buttons
    document.addEventListener('DOMContentLoaded', () => {
        const acceptButton = document.getElementById('consent-accept');
        const rejectButton = document.getElementById('consent-reject');
        
        if (acceptButton) {
            acceptButton.addEventListener('click', handleAccept);
        }
        
        if (rejectButton) {
            rejectButton.addEventListener('click', handleReject);
        }
        
        // Check if consent has already been given
        if (!hasConsentBeenGiven()) {
            // Show banner on first visit
            showConsentBanner();
        } else {
            // Load analytics if consent was previously given
            if (hasAnalyticsConsent()) {
                loadGoogleAnalytics();
                
                // Update consent mode to granted
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
        }
    });
}
