# Build System Documentation

This document describes the build system for the Sum Tile project.

## Overview

The build system handles:
- CSS compilation (Tailwind CSS → compiled CSS)
- Puzzle data encoding (source → encoded)
- Asset optimization

## Build Tools

### PostCSS

**Purpose**: CSS processing and compilation

**Configuration**: `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},      // Tailwind CSS processing
    autoprefixer: {},    // Vendor prefix addition
  },
}
```

**Process:**
1. Reads `src/styles.css` (source with Tailwind directives)
2. Processes Tailwind directives (`@tailwind base`, etc.)
3. Adds vendor prefixes (Autoprefixer)
4. Outputs `styles.css` (compiled CSS)

### Node.js Scripts

**Purpose**: Puzzle data encoding and other build tasks

**Scripts:**
- `scripts/encode-puzzle-data.js` - Encodes puzzle data
- `scripts/update-cursor-rules.js` - Generates Cursor rules

## Build Process

### CSS Build

**Source**: `src/styles.css`
**Output**: `styles.css`

**Command:**
```bash
npm run build:css
```

**Process:**
1. PostCSS reads `src/styles.css`
2. Tailwind processes directives:
   - `@tailwind base` - Base styles
   - `@tailwind components` - Component classes
   - `@tailwind utilities` - Utility classes
3. Autoprefixer adds vendor prefixes
4. Outputs compiled CSS to `styles.css`

**Watch Mode:**
```bash
npm run watch:css
```
Automatically rebuilds CSS when `src/styles.css` changes.

### Data Build

**Source**: `puzzle-data.js`
**Output**: `puzzle-data-encoded.js`

**Command:**
```bash
npm run build:data
```

**Process:**
1. Reads `puzzle-data.js`
2. Encodes `PUZZLE_DATA` using:
   - XOR cipher (puzzle-number-based keys)
   - Base64 encoding
   - Chunked loading
3. Generates decoder functions
4. Outputs `puzzle-data-encoded.js`

**Encoding Layers:**
1. **XOR Cipher**: Encrypts with seed-based key
2. **Base64**: Encodes encrypted data
3. **Chunking**: Splits into chunks for lazy loading

### Combined Build

**Command:**
```bash
npm run build:all
```

**Process:**
1. Runs `npm run build:css`
2. Runs `npm run build:data`
3. Both outputs are generated

## Build Configuration

### Tailwind Configuration

**File**: `tailwind.config.js`

```javascript
module.exports = {
  content: [
    "./index.html",
    "./puzzle.html",
    "./archive.html",
    "./script.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Content Paths:**
- Specifies files to scan for Tailwind classes
- Only classes found in these files are included
- Reduces CSS file size

### PostCSS Configuration

**File**: `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Plugins:**
- `tailwindcss`: Processes Tailwind directives
- `autoprefixer`: Adds vendor prefixes

## Build Scripts

### npm Scripts

Defined in `package.json`:

```json
{
  "scripts": {
    "build:css": "postcss src/styles.css -o styles.css",
    "watch:css": "postcss src/styles.css -o styles.css --watch",
    "build:data": "node scripts/encode-puzzle-data.js",
    "build:all": "npm run build:css && npm run build:data"
  }
}
```

**Scripts:**
- `build:css`: Build CSS only
- `watch:css`: Watch CSS and auto-rebuild
- `build:data`: Build encoded puzzle data
- `build:all`: Build both CSS and data

## Development Workflow

### During Development

```bash
# Watch CSS for changes
npm run watch:css

# In another terminal, edit files
# CSS rebuilds automatically
```

### Before Committing

```bash
# Build all assets
npm run build:all

# Commit generated files
git add styles.css puzzle-data-encoded.js
```

### Before Deployment

```bash
# Ensure everything is built
npm run build:all

# Verify files exist
ls -lh styles.css puzzle-data-encoded.js
```

## Generated Files

### styles.css

**Source**: `src/styles.css`
**Size**: ~100-200KB (compiled)
**Location**: Root directory
**Status**: Must be committed

**Contents:**
- Tailwind base styles
- Tailwind component classes
- Tailwind utility classes
- Custom CSS (if any)
- Vendor-prefixed properties

### puzzle-data-encoded.js

**Source**: `puzzle-data.js`
**Size**: Varies (encoded)
**Location**: Root directory
**Status**: Must be committed

**Contents:**
- Encoded puzzle data
- Decoder functions
- Obfuscated variable names

## Build Optimization

### CSS Optimization

**PurgeCSS** (via Tailwind):
- Removes unused CSS classes
- Scans content files for classes
- Only includes classes that are used

**Result**: Smaller CSS file size

### Data Optimization

**Chunked Loading**:
- Data split into chunks
- Chunks decode only when needed
- Reduces initial load time

**Result**: Faster page load

## Troubleshooting

### CSS Not Updating

**Check:**
- Did you rebuild? Run `npm run build:css`
- Is watch mode running? Check terminal
- Browser cache? Hard refresh (Cmd+Shift+R)

### Data Not Updating

**Check:**
- Did you rebuild? Run `npm run build:data`
- Is source file correct? Check `puzzle-data.js`
- Browser cache? Hard refresh

### Build Errors

**Check:**
- Node.js version (v14+)
- Dependencies installed? Run `npm install`
- File permissions
- Disk space

## Best Practices

### 1. Always Build Before Committing

```bash
npm run build:all
git add styles.css puzzle-data-encoded.js
```

### 2. Use Watch Mode During Development

```bash
npm run watch:css
```

### 3. Verify Build Before Deployment

```bash
npm run build:all
# Test locally
python3 -m http.server 8000
```

### 4. Commit Generated Files

Both `styles.css` and `puzzle-data-encoded.js` must be committed:
- Required for GitHub Pages
- No build process on GitHub Pages
- Files must be pre-built

## Next Steps

- [Development Workflow](../development/workflow.md)
- [Puzzle Data Management](../development/puzzle-data.md)
- [Deployment Process](../deployment/process.md)
