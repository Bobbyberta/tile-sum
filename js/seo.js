// SEO and social meta tags management

import { PUZZLE_DATA, formatDateString, getDateForPuzzleNumber } from '../puzzle-data.js';
import { getDaySuffix } from './utils.js';

// Update social sharing meta tags for puzzle pages
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
        title = `Puzzle Day ${day} - Christmas Word Game | Advent Puzzle`;
    }
    
    const description = `Daily word challenge puzzle - Scrabble anagram game! Arrange letter tiles to form the words: ${puzzle.words.join(' and ')}. Festive brain teaser with Scrabble scoring.`;
    
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
    const ogUrl = document.getElementById('og-url');
    
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDescription) ogDescription.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', puzzleUrl);
    
    // Update Twitter Card tags
    const twitterTitle = document.getElementById('twitter-title');
    const twitterDescription = document.getElementById('twitter-description');
    
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDescription) twitterDescription.setAttribute('content', description);
    
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

