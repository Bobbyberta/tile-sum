# Glossary

Technical terms and concepts used in the Sum Tile project.

## Terms

### A

**Archive Puzzle**: A past puzzle accessible from the archive page. Uses `archive-` prefix for element isolation.

**Auto-Complete**: Feature that automatically submits puzzle when all slots are filled correctly.

### B

**Base64 Encoding**: Encoding method used in puzzle data obfuscation. Converts binary data to ASCII text.

**Build Process**: Process of compiling source files (CSS, puzzle data) into production-ready files.

### C

**Chunked Loading**: Data loading strategy where puzzle data is split into chunks that decode only when needed, reducing initial load time.

**Completion Tracking**: System for tracking which puzzles have been completed, stored in localStorage.

### D

**Data Attributes**: HTML attributes prefixed with `data-` used to store custom data (e.g., `data-letter`, `data-tile-index`).

**Drag and Drop**: Interaction method for moving tiles by dragging them to slots.

### E

**E2E Tests**: End-to-end tests that test complete user flows in real browsers using Playwright.

**Encoded Data**: Obfuscated puzzle data in `puzzle-data-encoded.js` used in production to deter casual cheating.

**ES6 Modules**: Modern JavaScript module system using `import`/`export` syntax.

### F

**Focus Trapping**: Accessibility feature that keeps keyboard focus within a modal dialog.

### G

**Generated Files**: Files created by build process (`styles.css`, `puzzle-data-encoded.js`) that must be committed to repository.

### H

**Hint System**: Feature that provides hints by placing correct tiles in positions and locking them.

**HTML5 Drag API**: Browser API for drag and drop functionality.

### I

**Integration Tests**: Tests that verify multiple modules work together correctly.

**Interaction State**: State tracking for drag operations, touch events, and keyboard navigation.

### J

**JSDoc**: Documentation format for JavaScript code using special comment syntax.

**jsdom**: JavaScript implementation of DOM for testing in Node.js environment.

### K

**Keyboard Navigation**: Accessibility feature allowing full puzzle interaction via keyboard only.

### L

**localStorage**: Browser API for persistent client-side storage, used for completion tracking.

**Locked Tile/Slot**: Tile or slot that cannot be moved or modified, typically after a hint is provided.

### M

**Mermaid**: Markdown-based diagramming tool for creating flowcharts and diagrams.

**Modal Dialog**: Overlay dialog that appears above main content (help, success, error modals).

**Module**: Self-contained JavaScript file that exports functions for use by other modules.

### N

**Node.js**: JavaScript runtime environment for running build scripts and tests.

### O

**Obfuscation**: Process of making code/data harder to read while maintaining functionality. Used for puzzle data protection.

### P

**Playwright**: Testing framework for E2E browser testing.

**PostCSS**: CSS processing tool that transforms CSS with plugins (Tailwind, Autoprefixer).

**Prefix System**: Element ID prefixing system (`''`, `'daily-'`, `'archive-'`) that allows multiple puzzle instances on the same page with isolated state.

**Puzzle Data**: Source puzzle definitions in `puzzle-data.js` containing words, solutions, and scores.

**Puzzle Number**: Day number (1-25) identifying a specific puzzle in the advent calendar.

### Q

**Quick Reference**: Quick lookup guide for common commands and tasks.

### R

**Relative Paths**: File paths relative to current file (e.g., `./js/module.js`), required for GitHub Pages compatibility.

### S

**Scrabble Scoring**: Point system for letters based on Scrabble tile values.

**Scroll Locking**: Feature that prevents background page scrolling when modal is open.

**State Manager**: Object returned by `createStateManager()` that provides isolated state getters/setters for different puzzle instances.

**State Management**: System for managing shared application state (dragged tiles, hints, etc.).

### T

**Tailwind CSS**: Utility-first CSS framework for rapid UI development.

**Test Mode**: Development mode enabled via URL parameter (`?test=archive` or `?test=advent`) for testing features.

**Touch Events**: Browser events for touch-based interactions on mobile devices.

### U

**Unit Tests**: Tests that verify individual functions and modules work correctly in isolation.

**Utility Functions**: Shared helper functions used across multiple modules.

### V

**Validation**: Process of checking puzzle data integrity (anagrams, scores, etc.).

**Vitest**: Fast unit testing framework for JavaScript.

### W

**Watch Mode**: Development mode that automatically rebuilds files when source files change.

**Word Slots**: Containers where tiles are placed to form words in the puzzle.

### X

**XOR Cipher**: Encryption method used in puzzle data obfuscation, combining data with a key using XOR operation.

---

## Acronyms

- **API**: Application Programming Interface
- **ARIA**: Accessible Rich Internet Applications
- **CSS**: Cascading Style Sheets
- **DOM**: Document Object Model
- **E2E**: End-to-End
- **ES6**: ECMAScript 6 (JavaScript standard)
- **HTML**: HyperText Markup Language
- **HTTP**: HyperText Transfer Protocol
- **HTTPS**: HTTP Secure
- **JSON**: JavaScript Object Notation
- **npm**: Node Package Manager
- **SEO**: Search Engine Optimization
- **UI**: User Interface
- **UX**: User Experience

---

## See Also

- [Quick Reference](./QUICK_REFERENCE.md) - Common commands and tasks
- [Architecture Overview](./architecture/overview.md) - System design
- [Data Structures](./architecture/data-structures.md) - Data format details
