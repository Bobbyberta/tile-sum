# Deployment Process

This document describes the deployment process for the Sum Tile project to GitHub Pages.

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All tests pass (`npm run test:all`)
- [ ] Assets are built (`npm run build:all`)
- [ ] No console errors in browser
- [ ] Tested in multiple browsers
- [ ] Tested on mobile devices
- [ ] Accessibility verified
- [ ] Performance is acceptable
- [ ] Documentation is updated (if needed)

## Build Process

### Step 1: Build All Assets

```bash
npm run build:all
```

This command:
- Compiles Tailwind CSS from `src/styles.css` to `styles.css`
- Encodes puzzle data from `puzzle-data.js` to `puzzle-data-encoded.js`

**Important:** Both generated files must be committed to the repository.

### Step 2: Verify Build

Check that generated files exist and are correct:

```bash
# Check CSS file
ls -lh styles.css

# Check encoded data file
ls -lh puzzle-data-encoded.js
```

### Step 3: Test Locally

Test the built site locally:

```bash
# Start local server
python3 -m http.server 8000

# Or
npx http-server
```

Navigate to:
- `http://localhost:8000` - Homepage
- `http://localhost:8000/puzzle.html?day=1` - Puzzle page
- `http://localhost:8000/archive.html` - Archive page

Verify:
- Site loads correctly
- Puzzles work
- No console errors
- Styling is correct

## GitHub Pages Setup

### Initial Setup

1. **Go to repository Settings**
   - Navigate to Settings → Pages

2. **Configure Source**
   - Source: "Deploy from a branch"
   - Branch: `main` (or your default branch)
   - Folder: `/ (root)`
   - Click Save

3. **Wait for Deployment**
   - GitHub will deploy your site
   - Usually takes 1-2 minutes
   - Site will be available at: `https://YOUR_USERNAME.github.io/tile-sum/`

### Custom Domain Setup

This site uses the custom domain `sum-tile.uk`.

#### DNS Configuration

In your domain registrar, add:

**A Records:**
- `@` → `185.199.108.153`
- `@` → `185.199.109.153`
- `@` → `185.199.110.153`
- `@` → `185.199.111.153`

**CNAME Record:**
- `www` → `YOUR_USERNAME.github.io`

#### GitHub Pages Settings

1. **Go to repository Settings → Pages**
2. **Enter custom domain**: `sum-tile.uk`
3. **Check "Enforce HTTPS"** (after verification)
4. **Save**

#### Verification

- DNS propagation may take up to 48 hours
- Visit `https://sum-tile.uk` to verify
- Check DNS with: `dig sum-tile.uk`

## Deployment Steps

### Step 1: Prepare Changes

```bash
# Make your changes
# Edit files, add features, etc.

# Build assets
npm run build:all

# Run tests
npm run test:all
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Description of changes"
```

**Important:** Include generated files:
- `styles.css`
- `puzzle-data-encoded.js`

### Step 3: Push to GitHub

```bash
git push origin main
```

### Step 4: Verify Deployment

1. **Check GitHub Actions** (if configured)
   - Go to Actions tab
   - Verify deployment succeeded

2. **Wait for GitHub Pages**
   - Usually 1-2 minutes
   - Check repository Settings → Pages

3. **Test Live Site**
   - Visit `https://sum-tile.uk`
   - Test key functionality
   - Check for errors

## File Requirements

### Required Files

These files must be in the repository root:

- `index.html` - Homepage
- `puzzle.html` - Puzzle page
- `archive.html` - Archive page
- `script.js` - Main JavaScript
- `puzzle-data-encoded.js` - Encoded puzzle data (generated)
- `styles.css` - Compiled CSS (generated)
- `.nojekyll` - Prevents Jekyll processing

### Generated Files

These files are generated and must be committed:

- `styles.css` - Compiled from `src/styles.css`
- `puzzle-data-encoded.js` - Encoded from `puzzle-data.js`

**Why commit generated files?**
- GitHub Pages serves static files
- No build process on GitHub Pages
- Files must be pre-built

## Troubleshooting

### Site Not Loading

**Check:**
- Is `index.html` in root?
- Are file paths relative (not absolute)?
- Does `.nojekyll` exist?

### 404 Errors

**Check:**
- File paths are relative
- Files exist in repository
- No typos in paths

### Styling Broken

**Check:**
- `styles.css` exists and is committed
- `.nojekyll` file exists
- CSS file is not empty

### Puzzle Data Not Working

**Check:**
- `puzzle-data-encoded.js` exists and is committed
- File is not empty
- Build process completed successfully

### Changes Not Appearing

**Check:**
- Did you rebuild? (`npm run build:all`)
- Did you commit generated files?
- Did you push to GitHub?
- Wait a few minutes for deployment

## Rollback Procedure

If deployment has issues:

### Option 1: Revert Commit

```bash
# Revert last commit
git revert HEAD

# Push revert
git push origin main
```

### Option 2: Restore Previous Version

```bash
# Find previous good commit
git log

# Reset to previous commit
git reset --hard <commit-hash>

# Force push (use with caution)
git push origin main --force
```

**Warning:** Force push rewrites history. Only use if necessary.

## Best Practices

### 1. Always Build Before Committing

```bash
npm run build:all
git add .
git commit -m "Changes"
```

### 2. Test Locally First

```bash
npm run build:all
python3 -m http.server 8000
# Test in browser
```

### 3. Commit Generated Files

```bash
# Include generated files
git add styles.css puzzle-data-encoded.js
git commit -m "Update generated files"
```

### 4. Verify After Deployment

- Check live site works
- Test key functionality
- Verify no errors

### 5. Use Descriptive Commit Messages

```bash
# ✅ Good
git commit -m "Add new puzzle for day 25"

# ❌ Bad
git commit -m "Update"
```

## Continuous Deployment

### Manual Deployment

Current process is manual:
1. Make changes
2. Build assets
3. Commit and push
4. GitHub Pages auto-deploys

### Automated Deployment (Future)

Could be automated with:
- GitHub Actions
- Automated testing
- Automated building
- Automated deployment

## See Also

- [Troubleshooting](../TROUBLESHOOTING.md) - Common deployment issues
- [Build System](../architecture/build-system.md) - Build process details
- [Quick Reference](../QUICK_REFERENCE.md) - Common commands

## Next Steps

- [CI/CD Documentation](./ci-cd.md) (if applicable)
- [Environment Configuration](./environment.md)
- [Troubleshooting Deployment](./troubleshooting.md)
