import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateSocialMetaTags } from '../../js/seo.js';
import { cleanupDOM } from '../helpers/dom-setup.js';
import * as puzzleDataModule from '../../puzzle-data-today.js';

// Mock dependencies
vi.mock('../../puzzle-data-today.js', () => ({
  PUZZLE_DATA: {
    1: { words: ['SNOW', 'FLAKE'], solution: ['SNOW', 'FLAKE'] },
    15: { words: ['CHRISTMAS', 'TREE'], solution: ['CHRISTMAS', 'TREE'] }
  },
  formatDateString: (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  getDateForPuzzleNumber: (puzzleNum) => {
    const startDate = new Date(2025, 11, 1); // Dec 1, 2025
    if (puzzleNum === 1) return startDate;
    const date = new Date(startDate);
    date.setDate(date.getDate() + (puzzleNum - 1));
    return date;
  }
}));

vi.mock('../../js/utils.js', () => ({
  getDaySuffix: (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
}));

describe('seo.js', () => {
  beforeEach(() => {
    cleanupDOM();
    
    // Clear all mocks to ensure clean state (but keep implementations)
    vi.clearAllMocks();
    
    // Create base HTML structure
    const head = document.head;
    head.innerHTML = '';
    
    // Create meta tags
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    head.appendChild(metaDescription);
    
    const canonicalUrl = document.createElement('link');
    canonicalUrl.id = 'canonical-url';
    canonicalUrl.rel = 'canonical';
    head.appendChild(canonicalUrl);
    
    // Open Graph tags
    const ogTitle = document.createElement('meta');
    ogTitle.id = 'og-title';
    ogTitle.setAttribute('property', 'og:title');
    head.appendChild(ogTitle);
    
    const ogDescription = document.createElement('meta');
    ogDescription.id = 'og-description';
    ogDescription.setAttribute('property', 'og:description');
    head.appendChild(ogDescription);
    
    const ogUrl = document.createElement('meta');
    ogUrl.id = 'og-url';
    ogUrl.setAttribute('property', 'og:url');
    head.appendChild(ogUrl);
    
    const ogType = document.createElement('meta');
    ogType.id = 'og-type';
    ogType.setAttribute('property', 'og:type');
    head.appendChild(ogType);
    
    // Twitter Card tags
    const twitterTitle = document.createElement('meta');
    twitterTitle.id = 'twitter-title';
    twitterTitle.name = 'twitter:title';
    head.appendChild(twitterTitle);
    
    const twitterDescription = document.createElement('meta');
    twitterDescription.id = 'twitter-description';
    twitterDescription.name = 'twitter:description';
    head.appendChild(twitterDescription);
    
    const twitterImageSrc = document.createElement('meta');
    twitterImageSrc.id = 'twitter-image-src';
    twitterImageSrc.name = 'twitter:image:src';
    head.appendChild(twitterImageSrc);
    
    // Page title
    const title = document.createElement('title');
    head.appendChild(title);
    
    // Structured data
    const structuredDataWebpage = document.createElement('script');
    structuredDataWebpage.id = 'structured-data-webpage';
    structuredDataWebpage.type = 'application/ld+json';
    head.appendChild(structuredDataWebpage);
    
    // Mock window.location
    delete window.location;
    window.location = {
      search: ''
    };
  });

  it('should update meta description', () => {
    updateSocialMetaTags(1);
    
    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription.getAttribute('content')).toContain('SNOW');
    expect(metaDescription.getAttribute('content')).toContain('FLAKE');
  });

  it('should update canonical URL with date parameter', () => {
    window.location.search = '?date=2025-12-01';
    
    updateSocialMetaTags(1);
    
    const canonicalUrl = document.getElementById('canonical-url');
    expect(canonicalUrl.getAttribute('href')).toBe('https://sum-tile.uk/puzzle.html?date=2025-12-01');
  });

  it('should update canonical URL without date parameter', () => {
    window.location.search = '';
    
    updateSocialMetaTags(1);
    
    const canonicalUrl = document.getElementById('canonical-url');
    expect(canonicalUrl.getAttribute('href')).toBe('https://sum-tile.uk/puzzle.html?date=2025-12-01');
  });

  it('should update canonical URL with day parameter when no date available', () => {
    // Mock puzzle without date - override getDateForPuzzleNumber to return null
    vi.spyOn(puzzleDataModule, 'getDateForPuzzleNumber').mockReturnValue(null);
    
    window.location.search = '';
    
    updateSocialMetaTags(1);
    
    const canonicalUrl = document.getElementById('canonical-url');
    expect(canonicalUrl.getAttribute('href')).toBe('https://sum-tile.uk/puzzle.html?day=1');
    
    // Restore the spy to original implementation
    vi.restoreAllMocks();
  });

  it('should update Open Graph title', () => {
    updateSocialMetaTags(1);
    
    const ogTitle = document.getElementById('og-title');
    expect(ogTitle.getAttribute('content')).toContain('Puzzle');
    expect(ogTitle.getAttribute('content')).toContain('December');
  });

  it('should update Open Graph description', () => {
    updateSocialMetaTags(1);
    
    const ogDescription = document.getElementById('og-description');
    expect(ogDescription.getAttribute('content')).toContain('SNOW');
    expect(ogDescription.getAttribute('content')).toContain('FLAKE');
  });

  it('should update Open Graph URL', () => {
    window.location.search = '?date=2025-12-01';
    
    updateSocialMetaTags(1);
    
    const ogUrl = document.getElementById('og-url');
    expect(ogUrl.getAttribute('content')).toBe('https://sum-tile.uk/puzzle.html?date=2025-12-01');
  });

  it('should update Open Graph type', () => {
    updateSocialMetaTags(1);
    
    const ogType = document.getElementById('og-type');
    expect(ogType.getAttribute('content')).toBe('article');
  });

  it('should create and update article published time', () => {
    updateSocialMetaTags(1);
    
    const articlePublishedTime = document.querySelector('meta[property="article:published_time"]');
    expect(articlePublishedTime).toBeTruthy();
    expect(articlePublishedTime.getAttribute('content')).toContain('2025-12-01');
  });

  it('should update existing article published time', () => {
    const existingMeta = document.createElement('meta');
    existingMeta.setAttribute('property', 'article:published_time');
    existingMeta.setAttribute('content', '2024-01-01');
    document.head.appendChild(existingMeta);
    
    updateSocialMetaTags(1);
    
    const articlePublishedTime = document.querySelector('meta[property="article:published_time"]');
    expect(articlePublishedTime.getAttribute('content')).toContain('2025-12-01');
  });

  it('should update Twitter Card title', () => {
    updateSocialMetaTags(1);
    
    const twitterTitle = document.getElementById('twitter-title');
    expect(twitterTitle.getAttribute('content')).toContain('Puzzle');
  });

  it('should update Twitter Card description', () => {
    updateSocialMetaTags(1);
    
    const twitterDescription = document.getElementById('twitter-description');
    expect(twitterDescription.getAttribute('content')).toContain('SNOW');
  });

  it('should update Twitter Card image', () => {
    updateSocialMetaTags(1);
    
    const twitterImageSrc = document.getElementById('twitter-image-src');
    expect(twitterImageSrc.getAttribute('content')).toBe('https://sum-tile.uk/social_share.png');
  });

  it('should update page title', () => {
    updateSocialMetaTags(1);
    
    const title = document.querySelector('title');
    expect(title.textContent).toContain('Puzzle');
    expect(title.textContent).toContain('December');
  });

  it('should update structured data with WebPage schema', () => {
    updateSocialMetaTags(1);
    
    const structuredDataWebpage = document.getElementById('structured-data-webpage');
    const data = JSON.parse(structuredDataWebpage.textContent);
    
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('WebPage');
    expect(data.name).toContain('Puzzle');
    expect(data.description).toContain('SNOW');
    expect(data.url).toContain('sum-tile.uk');
    expect(data.breadcrumb).toBeTruthy();
    expect(data.breadcrumb.itemListElement).toHaveLength(2);
  });

  it('should handle missing puzzle data gracefully', () => {
    expect(() => updateSocialMetaTags(999)).not.toThrow();
  });

  it('should format title correctly for puzzle with date', () => {
    updateSocialMetaTags(15);
    
    const title = document.querySelector('title');
    expect(title.textContent).toContain('December');
    expect(title.textContent).toContain('15');
  });

  it('should handle missing meta elements gracefully', () => {
    document.head.innerHTML = '';
    
    expect(() => updateSocialMetaTags(1)).not.toThrow();
  });

  it('should handle missing structured data element gracefully', () => {
    const structuredData = document.getElementById('structured-data-webpage');
    structuredData.remove();
    
    expect(() => updateSocialMetaTags(1)).not.toThrow();
  });
});
