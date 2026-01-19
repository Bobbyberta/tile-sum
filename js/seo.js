// SEO and social meta tags management

import { PUZZLE_DATA, formatDateString, getDateForPuzzleNumber } from '../puzzle-data-encoded.js';
import { getDaySuffix } from './utils.js';

/**
 * Updates social sharing meta tags for puzzle pages.
 * Updates Open Graph, Twitter Card, and structured data tags.
 * Generates appropriate title, description, and URL based on puzzle date.
 * 
 * @param {number} day - The puzzle number/day
 * @returns {void}
 * 
 * @example
 * // Called when puzzle page loads
 * updateSocialMetaTags(1);
 */
export function updateSocialMetaTags(day) {
    if (!PUZZLE_DATA[day]) return;
    
    const puzzle = PUZZLE_DATA[day];
    const baseUrl = 'https://sum-tile.uk';
    
    // Get date for this puzzle and determine URL format
    const puzzleDate = getDateForPuzzleNumber(day);
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    // Use date parameter if available, otherwise use day parameter
    let puzzleUrl;
    if (dateParam && puzzleDate) {
        puzzleUrl = `${baseUrl}/puzzle.html?date=${dateParam}`;
    } else if (puzzleDate) {
        puzzleUrl = `${baseUrl}/puzzle.html?date=${formatDateString(puzzleDate)}`;
    } else {
        puzzleUrl = `${baseUrl}/puzzle.html?day=${day}`;
    }
    
    // Generate title based on date or day number
    let title;
    if (puzzleDate) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[puzzleDate.getDay()];
        const daySuffix = getDaySuffix(puzzleDate.getDate());
        const monthName = puzzleDate.toLocaleDateString('en-US', { month: 'long' });
        const year = puzzleDate.getFullYear();
        title = `Puzzle - ${dayName} ${puzzleDate.getDate()}${daySuffix} ${monthName} ${year} | Sum Tile`;
    } else {
        title = `Puzzle Day ${day} | Sum Tile - Daily Word Puzzle`;
    }
    
    const description = `Daily word puzzle game - Arrange letter tiles to form the words: ${puzzle.words.join(' and ')}. Scrabble anagram challenge with scoring.`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', description);
    }
    
    // Update canonical URL
    const canonicalUrl = document.getElementById('canonical-url');
    if (canonicalUrl) {
        canonicalUrl.setAttribute('href', puzzleUrl);
    }
    
    // Update Open Graph tags
    const ogTitle = document.getElementById('og-title');
    const ogDescription = document.getElementById('og-description');
    const ogImage = document.getElementById('og-image');
    const ogUrl = document.getElementById('og-url');
    const ogType = document.getElementById('og-type');
    
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDescription) ogDescription.setAttribute('content', description);
    if (ogImage) ogImage.setAttribute('content', `${baseUrl}/social_share.png`);
    if (ogUrl) ogUrl.setAttribute('content', puzzleUrl);
    if (ogType) ogType.setAttribute('content', 'article');
    
    // Update Article metadata for Rich Pins
    if (puzzleDate) {
        // Format date as ISO 8601 for article:published_time
        const isoDate = puzzleDate.toISOString();
        let articlePublishedTime = document.querySelector('meta[property="article:published_time"]');
        if (!articlePublishedTime) {
            articlePublishedTime = document.createElement('meta');
            articlePublishedTime.setAttribute('property', 'article:published_time');
            document.head.appendChild(articlePublishedTime);
        }
        articlePublishedTime.setAttribute('content', isoDate);
    }
    
    // Update Twitter Card tags
    const twitterTitle = document.getElementById('twitter-title');
    const twitterDescription = document.getElementById('twitter-description');
    const twitterImageSrc = document.getElementById('twitter-image-src');
    
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDescription) twitterDescription.setAttribute('content', description);
    // Ensure twitter:image:src is updated if element exists
    if (twitterImageSrc) {
        twitterImageSrc.setAttribute('content', `${baseUrl}/social_share.png`);
    }
    
    // Update page title
    const pageTitle = document.querySelector('title');
    if (pageTitle) {
        pageTitle.textContent = title;
    }
    
    // Update structured data (WebPage)
    const structuredDataWebpage = document.getElementById('structured-data-webpage');
    if (structuredDataWebpage) {
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": title,
            "description": description,
            "url": puzzleUrl,
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": `${baseUrl}/`
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": puzzleDate ? `${formatDateString(puzzleDate)} Puzzle` : `Puzzle Day ${day}`,
                        "item": puzzleUrl
                    }
                ]
            }
        };
        structuredDataWebpage.textContent = JSON.stringify(structuredData);
    }
}

