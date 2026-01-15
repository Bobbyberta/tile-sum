# Quick Reference Guide

Quick reference for common tasks, commands, and file locations.

## Common Commands

| Task | Command |
|------|---------|
| Build all assets | `npm run build:all` |
| Build CSS only | `npm run build:css` |
| Build data only | `npm run build:data` |
| Watch CSS | `npm run watch:css` |
| Run unit tests | `npm test` |
| Run E2E tests | `npm run test:e2e` |
| Run all tests | `npm run test:all` |
| Update Cursor rules | `npm run update-rules` |
| Validate anagrams | `npm run validate:anagrams` |
| Validate scores | `npm run validate:scores` |

## Common Tasks

### Add a New Puzzle

```bash
# 1. Edit puzzle data
# Edit puzzle-data.js, add puzzle entry

# 2. Rebuild encoded data
npm run build:data

# 3. Test in browser
# Navigate to puzzle.html?day=X
```

### Fix CSS Issues

```bash
# 1. Rebuild CSS
npm run build:css

# 2. Hard refresh browser
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Fix Puzzle Data Issues

```bash
# 1. Validate data
npm run validate:anagrams
npm run validate:scores

# 2. Fix issues
npm run fix:scores

# 3. Rebuild
npm run build:data
```

### Run Tests

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

## File Locations

| File Type | Location |
|-----------|----------|
| Source CSS | `src/styles.css` |
| Compiled CSS | `styles.css` |
| Puzzle Data (Source) | `puzzle-data.js` |
| Puzzle Data (Encoded) | `puzzle-data-encoded.js` |
| Main Entry Point | `script.js` |
| JavaScript Modules | `js/` |
| Test Files | `tests/` |
| Build Scripts | `scripts/` |
| Documentation | `docs/` |

## Element ID Patterns

| Element | Pattern | Example |
|---------|---------|---------|
| Tiles Container | `${prefix}tiles-container` | `tiles-container`, `daily-tiles-container` |
| Word Slots | `${prefix}word-slots` | `word-slots`, `archive-word-slots` |
| Hint Button | `${prefix}hint-btn` | `hint-btn`, `daily-hint-btn` |
| Submit Button | `${prefix}submit-btn` | `submit-btn`, `archive-submit-btn` |
| Score Display | `${prefix}word1-score-display` | `word1-score-display` |

## Prefix System

| Prefix | Usage |
|--------|-------|
| `''` (empty) | Regular puzzle page |
| `'daily-'` | Daily puzzle on homepage |
| `'archive-'` | Archive puzzle |

## Test Modes

| Mode | URL Parameter | Description |
|------|---------------|-------------|
| Archive Test | `?test=archive` | Enables archive testing features |
| Advent Test | `?test=advent` | Enables advent calendar testing |

## Common Issues & Solutions

### Site Not Loading
```bash
# Check files exist
ls styles.css puzzle-data-encoded.js

# Rebuild if missing
npm run build:all
```

### CSS Not Updating
```bash
# Rebuild CSS
npm run build:css

# Hard refresh browser
# Cmd+Shift+R / Ctrl+Shift+R
```

### Module Errors
- Check you're using a local server (not `file://`)
- Verify import paths are correct
- Check element IDs match

### Tests Failing
```bash
# Rebuild data
npm run build:data

# Clear cache
rm -rf node_modules/.cache

# Reinstall
npm install
```

## Development Workflow

```
1. Edit source files
   ↓
2. Build assets (if needed)
   npm run build:css  # CSS changes
   npm run build:data # Data changes
   ↓
3. Test locally
   python3 -m http.server 8001
   ↓
4. Run tests
   npm test
   ↓
5. Commit changes
   git add .
   git commit -m "Description"
   ↓
6. Push
   git push origin main
```

## Deployment Checklist

- [ ] All tests pass (`npm run test:all`)
- [ ] Assets built (`npm run build:all`)
- [ ] No console errors
- [ ] Tested in multiple browsers
- [ ] Tested on mobile
- [ ] Documentation updated (if needed)

## Useful Links

- [Getting Started](./development/getting-started.md)
- [Development Workflow](./development/workflow.md)
- [API Documentation](./api/)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Glossary](./GLOSSARY.md)
