# Development Workflow

This document describes the development workflow and best practices for working on the Sum Tile project.

## Development Cycle

### 1. Planning

Before making changes:
- Understand the requirement or bug
- Identify which modules are affected
- Plan the implementation approach
- Consider edge cases and error handling

### 2. Development

1. **Create/Edit Files**
   - Make changes to source files
   - Follow code style guidelines
   - Add JSDoc comments for new functions

2. **Build Assets**
   - Run `npm run build:css` after CSS changes
   - Run `npm run build:data` after puzzle data changes
   - Or use `npm run watch:css` for CSS auto-rebuild

3. **Test Locally**
   - Start local server
   - Test in browser
   - Test different scenarios (test modes, edge cases)

### 3. Testing

1. **Manual Testing**
   - Test the feature/bug fix
   - Test in different browsers
   - Test on mobile devices (if applicable)
   - Test accessibility (keyboard navigation, screen readers)

2. **Automated Testing**
   - Run unit tests: `npm test`
   - Run E2E tests: `npm run test:e2e`
   - Fix any failing tests
   - Add tests for new features

### 4. Code Review

- Review your own code
- Check for:
  - Code style compliance
  - Error handling
  - Edge cases
  - Performance considerations
  - Accessibility

### 5. Documentation

- Update JSDoc comments if needed
- Update relevant documentation files
- Add examples if introducing new patterns

## File Editing Workflow

### JavaScript Modules

1. **Edit Source File** (`js/my-module.js`)
2. **No Build Required** (JavaScript is used directly)
3. **Refresh Browser** to see changes

### CSS/Styling

1. **Edit Source File** (`src/styles.css`)
2. **Build CSS**: `npm run build:css` (or use `npm run watch:css`)
3. **Refresh Browser** to see changes

### Puzzle Data

1. **Edit Source File** (`puzzle-data.js`)
2. **Build Data**: `npm run build:data`
3. **Refresh Browser** to see changes

### HTML

1. **Edit HTML File** (`index.html`, `puzzle.html`, `archive.html`)
2. **Build CSS** if you added/modified Tailwind classes: `npm run build:css`
3. **Refresh Browser** to see changes

## Build Commands

### Individual Builds

```bash
# Build CSS only
npm run build:css

# Build puzzle data only
npm run build:data
```

### Combined Build

```bash
# Build both CSS and puzzle data
npm run build:all
```

**Use before**: Deployment, committing changes, testing

### Watch Mode

```bash
# Auto-rebuild CSS on changes
npm run watch:css
```

## Testing Workflow

### During Development

1. **Manual Testing**
   - Test feature in browser
   - Test different scenarios
   - Test edge cases

2. **Unit Tests** (if applicable)
   ```bash
   npm run test:watch
   ```

3. **E2E Tests** (for critical flows)
   ```bash
   npm run test:e2e:ui
   ```

### Before Committing

1. **Run All Tests**
   ```bash
   npm run test:all
   ```

2. **Check Linting** (if configured)
   - Fix any linting errors

3. **Build Assets**
   ```bash
   npm run build:all
   ```

## Git Workflow

### Before Making Changes

1. **Check Current Branch**
   ```bash
   git branch
   ```

2. **Pull Latest Changes**
   ```bash
   git pull origin main
   ```

3. **Create Feature Branch** (if working on feature)
   ```bash
   git checkout -b feature/my-feature
   ```

### Making Changes

1. **Edit Files**
2. **Build Assets** (if needed)
3. **Test Changes**
4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

### Before Pushing

1. **Build All Assets**
   ```bash
   npm run build:all
   ```

2. **Run Tests**
   ```bash
   npm run test:all
   ```

3. **Check Status**
   ```bash
   git status
   ```

4. **Push Changes**
   ```bash
   git push origin branch-name
   ```

## Debugging

### Browser DevTools

1. **Open DevTools** (F12 or Cmd+Option+I)
2. **Console Tab**: Check for errors
3. **Network Tab**: Check for failed requests
4. **Elements Tab**: Inspect DOM

### Debug Logging

Use `debugLog()` from `utils.js` for development logging:

```javascript
import { debugLog } from './js/utils.js';

debugLog('Puzzle loaded:', puzzleNumber);
debugLog('State:', { hints: 3 });
```

This only logs in development (localhost or test mode).

### Test Modes

Use test modes for easier debugging:

- `?test=archive`: Archive test mode
- `?test=advent`: Advent test mode

### Breakpoints

Set breakpoints in browser DevTools:
1. Open Sources tab
2. Find your file
3. Click line number to set breakpoint
4. Refresh page

## Code Quality

### Before Committing

- [ ] Code follows style guidelines
- [ ] Functions have JSDoc comments
- [ ] Error handling is in place
- [ ] Edge cases are handled
- [ ] Tests pass
- [ ] Assets are built
- [ ] No console errors in browser

### Code Review Checklist

- [ ] Code is readable and well-structured
- [ ] Functions are focused and single-purpose
- [ ] Error handling is appropriate
- [ ] Accessibility is maintained
- [ ] Performance is acceptable
- [ ] Tests cover new functionality

## Common Patterns

### Adding Event Handlers

```javascript
// In module
export function initMyFeature() {
    const element = document.getElementById('my-element');
    if (!element) return;
    
    element.addEventListener('click', handleClick);
}

function handleClick(e) {
    // Handle click
}
```

### Using Prefixes

```javascript
// Support multiple puzzle instances
export function initFeature(prefix = '') {
    const container = document.getElementById(`${prefix}container`);
    // ...
}
```

### State Management

```javascript
// Use state manager for isolated state
import { createStateManager } from './puzzle-state.js';

const stateManager = createStateManager(prefix);
stateManager.setHintsRemaining(3);
```

## Performance Considerations

- **Minimize DOM Queries**: Cache element references
- **Debounce Events**: For frequent events (scroll, resize)
- **Lazy Loading**: Load data only when needed
- **Event Delegation**: Use for dynamic content

## Accessibility Considerations

- **Keyboard Navigation**: Ensure all features are keyboard accessible
- **ARIA Labels**: Add appropriate ARIA attributes
- **Focus Management**: Manage focus appropriately
- **Screen Readers**: Test with screen readers

## Deployment Checklist

Before deploying:

- [ ] All tests pass
- [ ] Assets are built (`npm run build:all`)
- [ ] No console errors
- [ ] Tested in multiple browsers
- [ ] Tested on mobile devices
- [ ] Accessibility verified
- [ ] Performance is acceptable
- [ ] Documentation is updated
