# Getting Started

This guide will help you set up the Sum Tile project for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) - Check version: `npm --version`
- **Git** - [Download](https://git-scm.com/)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/tile-sum.git
cd tile-sum
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Tailwind CSS and PostCSS for styling
- Vitest and Playwright for testing
- Other development dependencies

### 3. Build Assets

Build both CSS and encoded puzzle data:

```bash
npm run build:all
```

This command:
- Compiles Tailwind CSS from `src/styles.css` to `styles.css`
- Encodes puzzle data from `puzzle-data.js` to `puzzle-data-encoded.js`

**Important**: You must run this before starting development or the site won't work properly.

### 4. Start a Local Server

Since the project uses ES6 modules, you need a local server (not `file://` protocol).

**Option 1: Python 3**
```bash
python3 -m http.server 8000
```

**Option 2: Node.js (http-server)**
```bash
npx http-server
```

**Option 3: PHP**
```bash
php -S localhost:8000
```

### 5. Open in Browser

Navigate to:
- **Homepage**: `http://localhost:8000`
- **Puzzle Page**: `http://localhost:8000/puzzle.html?day=1`
- **Archive Page**: `http://localhost:8000/archive.html`

## Development Workflow

### Making Changes

1. **Edit Source Files**
   - JavaScript: Edit files in `js/` directory
   - CSS: Edit `src/styles.css` (Tailwind directives)
   - HTML: Edit `index.html`, `puzzle.html`, `archive.html`
   - Puzzle Data: Edit `puzzle-data.js` (source file)

2. **Rebuild After Changes**
   - **CSS Changes**: Run `npm run build:css` or use `npm run watch:css` for auto-rebuild
   - **Puzzle Data Changes**: Run `npm run build:data`
   - **Both**: Run `npm run build:all`

3. **Refresh Browser**
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to clear cache

### Watch Mode for CSS

During development, you can use watch mode to automatically rebuild CSS:

```bash
npm run watch:css
```

This watches `src/styles.css` and rebuilds `styles.css` on changes.

### Test Modes

For development and testing, you can use test modes:

**Archive Test Mode** (`?test=archive`):
- Shows daily puzzle view on homepage
- Enables archive access with future dates
- Shows archive links in navigation

**Advent Test Mode** (`?test=advent`):
- Shows calendar view with all 25 days unlocked
- Hides archive links
- Shows countdown overlay if before Dec 1

Example URLs:
- `http://localhost:8000/?test=archive`
- `http://localhost:8000/puzzle.html?day=1&test=archive`

## Project Structure

```
tile-sum/
├── index.html              # Home page with daily puzzle
├── puzzle.html             # Puzzle page
├── archive.html            # Archive page
├── script.js               # Main entry point
├── puzzle-data.js          # Puzzle source data (edit this)
├── puzzle-data-encoded.js  # Encoded puzzle data (generated)
├── styles.css              # Compiled CSS (generated)
├── js/                     # JavaScript modules
│   ├── puzzle-core.js      # DOM element creation
│   ├── drag-drop.js        # Drag and drop
│   ├── keyboard.js         # Keyboard navigation
│   └── ...                 # Other modules
├── src/
│   └── styles.css          # Source CSS with Tailwind
├── scripts/                # Build scripts
├── tests/                  # Test files
└── docs/                   # Documentation
```

## Common Tasks

### Adding a New Puzzle

1. Edit `puzzle-data.js`
2. Add puzzle entry:
   ```javascript
   551: {
       words: ['NEW', 'WORD'],
       solution: ['NEW', 'WORD']
   }
   ```
3. Run `npm run build:data`
4. Test in browser

### Modifying Styles

1. Edit `src/styles.css` (add Tailwind classes or custom CSS)
2. Run `npm run build:css` (or use `npm run watch:css`)
3. Refresh browser

### Adding a New Module

1. Create file in `js/` directory (e.g., `js/my-module.js`)
2. Export functions:
   ```javascript
   export function myFunction() {
       // ...
   }
   ```
3. Import in `script.js`:
   ```javascript
   import { myFunction } from './js/my-module.js';
   ```
4. Use in your code

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## Troubleshooting

For detailed troubleshooting, see the [Troubleshooting Guide](../TROUBLESHOOTING.md).

### Quick Fixes

**Site Not Loading:**
- Check `styles.css` and `puzzle-data-encoded.js` exist
- Run `npm run build:all`
- Ensure you're using a local server (not `file://`)

**CSS Not Updating:**
- Run `npm run build:css`
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

**Puzzle Data Issues:**
- Run `npm run build:data`
- Validate data: `npm run validate:anagrams`

**Module Errors:**
- Check import paths are relative
- Verify you're using a local server
- Check exports are correct

For more help, see the [Troubleshooting Guide](../TROUBLESHOOTING.md).

## Next Steps

- Read [Development Workflow](./workflow.md) for detailed development practices
- Read [Code Style Guide](./code-style.md) for coding standards
- Read [Architecture Overview](../architecture/overview.md) to understand the system
- Check [API Documentation](../api/) for module details

## Getting Help

- Check the [README.md](../../README.md) for general information
- Review [Troubleshooting](#troubleshooting) section above
- Check test files in `tests/` for usage examples
- Review existing code in `js/` modules for patterns
