# Troubleshooting Guide

Common issues and their solutions for the Sum Tile project.

## Table of Contents

- [Site Not Loading](#site-not-loading)
- [CSS Not Updating](#css-not-updating)
- [Puzzle Data Issues](#puzzle-data-issues)
- [Module Errors](#module-errors)
- [Test Failures](#test-failures)
- [Build Errors](#build-errors)
- [Deployment Issues](#deployment-issues)

---

## Site Not Loading

### Symptoms
- Blank page
- 404 errors
- "Cannot GET /" errors
- Console errors about missing files

### Solutions

#### 1. Check Required Files Exist

```bash
# Check compiled CSS exists
ls -lh styles.css

# Check encoded puzzle data exists
ls -lh puzzle-data-encoded.js

# If missing, rebuild
npm run build:all
```

#### 2. Verify You're Using a Local Server

**Problem**: ES6 modules require HTTP(S) protocol, not `file://`

**Solution**: Use a local server:

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

#### 3. Check File Paths

**Problem**: Absolute paths won't work on GitHub Pages

**Solution**: Ensure all paths are relative:

```html
<!-- ✅ Good -->
<script type="module" src="./script.js"></script>
<link rel="stylesheet" href="./styles.css">

<!-- ❌ Bad -->
<script type="module" src="/script.js"></script>
```

#### 4. Check `.nojekyll` File

**Problem**: GitHub Pages may process files with Jekyll

**Solution**: Ensure `.nojekyll` file exists in root:

```bash
touch .nojekyll
```

---

## CSS Not Updating

### Symptoms
- Style changes not appearing
- Old styles still showing
- Tailwind classes not working

### Solutions

#### 1. Rebuild CSS

```bash
npm run build:css
```

#### 2. Hard Refresh Browser

**Mac**: `Cmd + Shift + R`  
**Windows/Linux**: `Ctrl + Shift + R`

#### 3. Clear Browser Cache

- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

#### 4. Check Tailwind Config

**Problem**: New HTML files not scanned for classes

**Solution**: Update `tailwind.config.js`:

```javascript
content: [
  "./index.html",
  "./puzzle.html",
  "./archive.html",
  "./script.js",
  "./new-file.html"  // Add new file
],
```

Then rebuild: `npm run build:css`

#### 5. Verify CSS File is Not Empty

```bash
# Check file size
ls -lh styles.css

# Should be > 100KB
# If empty or very small, rebuild
npm run build:css
```

---

## Puzzle Data Issues

### Symptoms
- Puzzles not loading
- "Puzzle not found" errors
- Wrong puzzle data displayed

### Solutions

#### 1. Rebuild Encoded Data

```bash
npm run build:data
```

**Important**: Always rebuild after editing `puzzle-data.js`

#### 2. Validate Puzzle Data

```bash
# Check anagrams
npm run validate:anagrams

# Check scores
npm run validate:scores
```

#### 3. Check Puzzle Number

**Problem**: Puzzle number doesn't exist

**Solution**: Verify puzzle exists in `puzzle-data.js`:

```javascript
// Check if puzzle 1 exists
console.log(PUZZLE_DATA[1]);
```

#### 4. Verify Data Structure

**Problem**: Incorrect puzzle data format

**Solution**: Ensure correct structure:

```javascript
1: {
    words: ['WORD1', 'WORD2'],
    solution: ['WORD1', 'WORD2']
}
```

---

## Module Errors

### Symptoms
- "Cannot find module" errors
- "Module not found" errors
- Import errors in console

### Solutions

#### 1. Check Import Paths

**Problem**: Incorrect relative paths

**Solution**: Verify paths are correct:

```javascript
// ✅ Good - relative path
import { createTile } from './js/puzzle-core.js';

// ❌ Bad - absolute path
import { createTile } from '/js/puzzle-core.js';
```

#### 2. Verify File Exists

```bash
# Check file exists
ls js/puzzle-core.js

# Check file extension
# Should be .js, not .jsx or .ts
```

#### 3. Check Module Exports

**Problem**: Function not exported

**Solution**: Ensure function is exported:

```javascript
// ✅ Good
export function createTile() { }

// ❌ Bad
function createTile() { }
```

#### 4. Verify ES6 Module Support

**Problem**: Browser doesn't support ES6 modules

**Solution**: Use modern browser (Chrome, Firefox, Safari, Edge - latest versions)

---

## Test Failures

### Symptoms
- `npm test` fails
- Tests timeout
- Module import errors in tests

### Solutions

#### 1. Rebuild Puzzle Data

```bash
npm run build:data
```

Tests require encoded puzzle data to exist.

#### 2. Clear Test Cache

```bash
# Clear Vitest cache
rm -rf node_modules/.cache

# Reinstall if needed
rm -rf node_modules
npm install
```

#### 3. Check Node.js Version

**Problem**: Node.js version too old

**Solution**: Requires Node.js v14 or higher:

```bash
node --version
# Should be v14.0.0 or higher
```

#### 4. Verify Test Setup

**Problem**: Test setup file issues

**Solution**: Check `tests/setup.js` exists and is correct

#### 5. E2E Test Issues

**Problem**: E2E tests fail

**Solutions**:

```bash
# Install Playwright browsers
npx playwright install

# Check server is running
# Playwright should auto-start server, but verify
python3 -m http.server 8000

# Run with UI for debugging
npm run test:e2e:ui
```

---

## Build Errors

### Symptoms
- `npm run build:css` fails
- `npm run build:data` fails
- PostCSS errors
- Encoding errors

### Solutions

#### 1. Check Dependencies

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Check Node.js Version

```bash
node --version
# Requires v14+
```

#### 3. PostCSS Errors

**Problem**: PostCSS configuration issues

**Solution**: Verify `postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 4. Encoding Errors

**Problem**: Puzzle data syntax errors

**Solution**: 
1. Check `puzzle-data.js` syntax
2. Validate JSON structure
3. Check for missing commas, brackets

```bash
# Validate data
node -e "require('./puzzle-data.js')"
```

#### 5. File Permissions

**Problem**: Cannot write output files

**Solution**: Check file permissions:

```bash
# Make files writable
chmod 644 styles.css puzzle-data-encoded.js
```

---

## Deployment Issues

### Symptoms
- Site not updating on GitHub Pages
- 404 errors on live site
- Styling broken on live site

### Solutions

#### 1. Verify Files Are Committed

```bash
# Check git status
git status

# Ensure generated files are committed
git add styles.css puzzle-data-encoded.js
git commit -m "Update generated files"
git push
```

#### 2. Check GitHub Pages Settings

1. Go to repository Settings → Pages
2. Verify source branch is correct
3. Verify folder is `/ (root)`
4. Wait 1-2 minutes for deployment

#### 3. Verify Custom Domain

**Problem**: Custom domain not working

**Solutions**:
- Check DNS settings (A records, CNAME)
- Wait up to 48 hours for DNS propagation
- Verify domain in GitHub Pages settings
- Check HTTPS is enabled

#### 4. Hard Refresh Live Site

**Problem**: Browser cache showing old version

**Solution**: Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

#### 5. Check Build Output

**Problem**: Generated files not in repository

**Solution**: 
1. Build locally: `npm run build:all`
2. Commit files: `git add styles.css puzzle-data-encoded.js`
3. Push: `git push`

---

## Common Error Messages

### "Cannot find module"

**Cause**: Import path incorrect or file missing

**Solution**: 
- Check file exists
- Verify import path is relative
- Check file extension (.js)

### "Cannot read property of undefined"

**Cause**: Element doesn't exist in DOM

**Solution**:
- Check element ID is correct
- Verify element exists before accessing
- Use optional chaining: `element?.property`

### "Module is not defined"

**Cause**: Not using ES6 module syntax

**Solution**:
- Use `import`/`export`, not `require`/`module.exports`
- Ensure `<script type="module">` in HTML

### "Unexpected token"

**Cause**: Syntax error in JavaScript

**Solution**:
- Check for missing brackets, commas
- Verify JSON syntax in puzzle data
- Check for typos

---

## Getting More Help

If issues persist:

1. **Check Documentation**:
   - [Getting Started Guide](./development/getting-started.md)
   - [Development Workflow](./development/workflow.md)
   - [API Documentation](./api/)

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Check Build Output**:
   - Review build command output
   - Look for error messages
   - Check file sizes

4. **Review Recent Changes**:
   - Check git log for recent commits
   - Review what changed
   - Consider reverting if needed

5. **Open an Issue**:
   - Include error messages
   - Include steps to reproduce
   - Include browser/OS information

---

## Prevention Tips

### Before Making Changes

1. ✅ Run tests: `npm test`
2. ✅ Build assets: `npm run build:all`
3. ✅ Test locally: Start server and verify

### Before Committing

1. ✅ All tests pass: `npm run test:all`
2. ✅ Build succeeds: `npm run build:all`
3. ✅ No console errors in browser
4. ✅ Tested in multiple browsers

### Before Deploying

1. ✅ All changes committed
2. ✅ Generated files committed
3. ✅ Tests pass
4. ✅ Local testing successful

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Site not loading | `npm run build:all` + use local server |
| CSS not updating | `npm run build:css` + hard refresh |
| Puzzle not loading | `npm run build:data` |
| Tests failing | `npm run build:data` + clear cache |
| Build errors | Check Node.js version + reinstall deps |

---

## See Also

- [Getting Started Guide](./development/getting-started.md)
- [Development Workflow](./development/workflow.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Build System](./architecture/build-system.md)
