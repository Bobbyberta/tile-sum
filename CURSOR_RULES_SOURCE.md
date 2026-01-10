# Cursor Rules Source

This file is the single source of truth for all Cursor rules. Edit this file, then run `npm run update-rules` to generate the `.mdc` files in `.cursor/rules/`.

---

## [GLOBAL] Project Context

**File:** `.cursor/rules/global/project-context.mdc`
**Description:** Project overview, tech stack, and deployment information
**Always Apply:** true

### Project Overview
- This is an Advent Puzzle Calendar web application - a daily word puzzle game
- Players arrange letter tiles to form two words with Scrabble scoring
- 25 puzzles unlock daily from December 1-25
- Hosted on GitHub Pages at https://sum-tile.uk

### Technology Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (ES6+ modules)
- **Styling:** Tailwind CSS 3.4.13 (compiled with PostCSS)
- **Build Tool:** PostCSS with Autoprefixer
- **Deployment:** GitHub Pages (static site)
- **Custom Domain:** sum-tile.uk

### Project Structure
- Root files: `index.html`, `puzzle.html`, `archive.html`, `script.js`, `puzzle-data.js` (source), `puzzle-data-encoded.js` (generated)
- JavaScript modules: `js/` directory containing modular files (archive.js, completion.js, drag-drop.js, feedback.js, hints.js, keyboard.js, modals.js, puzzle-core.js, puzzle-state.js, scoring.js, seo.js, ui.js, utils.js)
- CSS: Source in `src/styles.css`, compiled to `styles.css` in root
- Build config: `tailwind.config.js`, `postcss.config.js`
- Scripts: `scripts/encode-puzzle-data.js` for encoding puzzle data, `scripts/update-cursor-rules.js` for generating Cursor rules
- Static assets: `favicon.svg`, `og-image.svg`, `CNAME`, `robots.txt`, `sitemap.xml`

### Deployment Requirements
- Always use relative paths (not absolute) for GitHub Pages compatibility
- Compiled `styles.css` and `puzzle-data-encoded.js` must be committed to repository
- Run `npm run build:all` before deployment (builds both CSS and encoded puzzle data)
- Run `npm run build:css` after any Tailwind CSS changes
- Run `npm run build:data` after editing `puzzle-data.js` (source file)
- Ensure `.nojekyll` file exists to prevent Jekyll processing
- Test modes available via `?test=archive` (archive testing) and `?test=advent` (advent calendar testing) URL parameters for development

### Puzzle Data Protection
- Puzzle data is encoded/obfuscated using multi-layer encoding (base64 + XOR cipher + chunking)
- Source file is `puzzle-data.js` (edit this during development)
- Encoded file is `puzzle-data-encoded.js` (auto-generated, used in production)
- All imports use `puzzle-data-encoded.js` - never import `puzzle-data.js` directly in production code

### Browser Support
- Target modern browsers: Chrome, Firefox, Safari, Edge (latest versions)
- Use standard ES6+ features (no polyfills needed for target browsers)

---

## [GLOBAL] Code Style

**File:** `.cursor/rules/global/code-style.mdc`
**Description:** JavaScript coding conventions and naming patterns
**Always Apply:** true
**Globs:** ["**/*.js"]

### JavaScript Style Guide
- Use modern ES6+ syntax (arrow functions, const/let, template literals, destructuring)
- Prefer `const` over `let`; only use `let` when reassignment is needed
- Use arrow functions for callbacks and short functions
- Use template literals for string interpolation
- Use descriptive variable and function names (camelCase)

### Function Naming
- Use camelCase: `initCalendar()`, `updateCountdown()`, `handleTileClick()`
- Prefix event handlers with `handle`: `handleSubmit()`, `handleTileDrag()`
- Prefix initialization functions with `init`: `initCalendar()`, `initPuzzle()`
- Prefix update functions with `update`: `updateCountdown()`, `updateScore()`

### Code Organization
- Use ES6 modules: Import/export functions and classes between modules
- Group related functions together within modules
- Each module in `js/` directory should have a single, focused responsibility
- Main entry point is `script.js` which imports and wires together all modules
- Add comments for complex logic or non-obvious behavior
- Keep functions focused and single-purpose
- Extract reusable logic into separate functions or utility modules

### Error Handling
- Always check for element existence before DOM manipulation: `if (!element) return;`
- Use early returns to reduce nesting
- Validate user input before processing

### Comments
- Use `//` for single-line comments
- Add comments explaining "why" not "what" for complex logic
- Document test mode behavior: `// Check for test mode via URL parameter`

---

## [FRONTEND] Tailwind CSS

**File:** `.cursor/rules/frontend/tailwind-css.mdc`
**Description:** Tailwind CSS guidelines and build process
**Always Apply:** false
**Globs:** ["**/*.html", "**/*.js", "src/styles.css"]

### Tailwind CSS Usage
- Use Tailwind utility classes directly in HTML and JavaScript
- Prefer utility classes over custom CSS
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Use state variants: `hover:`, `focus:`, `active:`, `disabled:`

### Build Process
- **CRITICAL:** Always run `npm run build:css` after adding or modifying Tailwind classes
- Source file: `src/styles.css` (contains Tailwind directives)
- Output file: `styles.css` (compiled, must be committed)
- For development: Use `npm run watch:css` to auto-rebuild on changes

### Tailwind Configuration
- Config file: `tailwind.config.js`
- Content paths: `./index.html`, `./puzzle.html`, `./archive.html`, `./script.js`
- Customize theme in `tailwind.config.js` if needed
- Do not edit compiled `styles.css` directly - it will be overwritten

### Common Patterns
- Use flexbox utilities: `flex`, `flex-col`, `items-center`, `justify-between`
- Use grid utilities: `grid`, `grid-cols-*`, `gap-*`
- Use spacing: `p-*`, `m-*`, `px-*`, `py-*`, `space-*`
- Use colors: `bg-*`, `text-*`, `border-*`
- Use typography: `text-*`, `font-*`, `leading-*`

### Before Committing
- Ensure `styles.css` is up to date (run build if needed)
- Verify Tailwind classes are working in browser
- Check that no custom CSS was added unnecessarily

---

## [FRONTEND] Accessibility

**File:** `.cursor/rules/frontend/accessibility.mdc`
**Description:** ARIA labels, keyboard navigation, and accessibility requirements
**Always Apply:** false
**Globs:** ["**/*.html", "**/*.js"]

### Accessibility Requirements
- All interactive elements must be keyboard accessible
- Use semantic HTML elements where possible (`<button>`, `<nav>`, `<main>`)
- Add ARIA labels for screen readers: `aria-label="Puzzle for December 1"`
- Use `role` attributes when semantic HTML isn't sufficient: `role="button"`

### Keyboard Navigation
- All clickable elements must support keyboard interaction
- Use `tabindex="0"` for focusable custom elements
- Handle `Enter` and `Space` keys for button-like elements
- Ensure focus indicators are visible (Tailwind `focus:` utilities)

### ARIA Labels
- Add descriptive `aria-label` to interactive elements without visible text
- Use `aria-hidden="true"` for decorative elements
- Ensure form inputs have associated labels or `aria-label`

### Focus Management
- Maintain logical tab order
- Don't remove focus outlines without providing alternative indicators
- Use `focus:` Tailwind utilities for custom focus styles

### Screen Reader Support
- Provide text alternatives for visual information
- Use `sr-only` class for screen-reader-only text when needed
- Ensure all content is accessible without visual context

### Testing
- Test keyboard navigation (Tab, Enter, Space, Arrow keys)
- Test with screen reader if possible
- Verify focus indicators are visible

---

## [FRONTEND] HTML Structure

**File:** `.cursor/rules/frontend/html-structure.mdc`
**Description:** HTML organization and best practices
**Always Apply:** false
**Globs:** ["**/*.html"]

### HTML Structure
- Use semantic HTML5 elements: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`
- Keep HTML clean and readable with proper indentation
- Use meaningful class names (Tailwind utilities)

### Meta Tags
- Include proper charset: `<meta charset="UTF-8">`
- Include viewport: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Add SEO meta tags: `description`, `keywords`, `robots`
- Include Open Graph tags for social sharing
- Include structured data (JSON-LD) when appropriate

### Links and Assets
- Use relative paths for all internal links and assets
- Include favicon links: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
- Use canonical URLs for SEO
- Include `lang` attribute on `<html>` tag

### Scripts and Styles
- Link compiled CSS: `<link rel="stylesheet" href="styles.css">`
- Place scripts at end of `<body>` or use `defer`
- Use CDN for external libraries (e.g., canvas-confetti)
- Include scripts conditionally when needed (e.g., only in puzzle.html)

### Forms and Inputs
- Use proper form elements with labels
- Include `type` attributes on inputs
- Use `disabled` attribute appropriately
- Provide clear error messages

### Performance
- Minimize inline styles (use Tailwind classes instead)
- Optimize images (use SVG when possible)
- Keep HTML structure flat when possible (avoid deep nesting)

