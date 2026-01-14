# Configuration Files Documentation

This document describes all configuration files in the Sum Tile project.

## Overview

Configuration files control build tools, testing frameworks, and project settings.

## Configuration Files

### `package.json`

**Purpose**: npm package configuration and scripts

**Key Sections:**
- `scripts`: Build and test commands
- `devDependencies`: Development dependencies
- `name`, `version`: Package metadata

**Scripts:**
```json
{
  "scripts": {
    "build:css": "postcss src/styles.css -o styles.css",
    "build:data": "node scripts/encode-puzzle-data.js",
    "build:all": "npm run build:css && npm run build:data",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

**Dependencies:**
- Tailwind CSS
- PostCSS
- Vitest
- Playwright

---

### `tailwind.config.js`

**Purpose**: Tailwind CSS configuration

**Configuration:**
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

**Settings:**
- `content`: Files to scan for Tailwind classes
- `theme`: Custom theme extensions
- `plugins`: Tailwind plugins

**Content Paths:**
- Specifies which files contain Tailwind classes
- Only classes found in these files are included
- Reduces CSS file size

**Customization:**
- Add custom colors in `theme.extend.colors`
- Add custom spacing in `theme.extend.spacing`
- Add plugins in `plugins` array

---

### `postcss.config.js`

**Purpose**: PostCSS configuration

**Configuration:**
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
- `autoprefixer`: Adds vendor prefixes automatically

**Process:**
1. Tailwind processes `@tailwind` directives
2. Autoprefixer adds vendor prefixes
3. Outputs compiled CSS

---

### `vitest.config.js`

**Purpose**: Vitest testing framework configuration

**Configuration:**
```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  }
});
```

**Settings:**
- `environment: 'jsdom'`: Simulates browser environment
- `globals: true`: Makes `describe`, `it`, `expect` global
- `setupFiles`: Test setup file
- `coverage`: Coverage configuration

**Coverage Thresholds:**
- Lines: 70%
- Functions: 70%
- Branches: 60%
- Statements: 70%

---

### `playwright.config.js`

**Purpose**: Playwright E2E testing configuration

**Configuration:**
```javascript
export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000'
  }
});
```

**Settings:**
- `testDir`: E2E test directory
- `projects`: Browser configurations
- `webServer`: Auto-starts local server

**Browsers:**
- Chromium (Chrome)
- Firefox
- WebKit (Safari)

---

## Customization

### Adding Tailwind Classes

If you add Tailwind classes in new files, update `tailwind.config.js`:

```javascript
content: [
  "./index.html",
  "./puzzle.html",
  "./archive.html",
  "./script.js",
  "./new-file.html"  // Add new file
],
```

Then rebuild:
```bash
npm run build:css
```

### Custom Tailwind Theme

Extend theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'custom-blue': '#1e40af',
    },
    spacing: {
      '72': '18rem',
    }
  },
}
```

### Coverage Thresholds

Adjust in `vitest.config.js`:

```javascript
coverage: {
  thresholds: {
    lines: 80,      // Increase to 80%
    functions: 80,
    branches: 70,
    statements: 80
  }
}
```

### Playwright Browsers

Add/remove browsers in `playwright.config.js`:

```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  // Add more browsers
]
```

## File Locations

```
tile-sum/
├── package.json              # npm configuration
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
├── vitest.config.js          # Vitest config
└── playwright.config.js      # Playwright config
```

## Best Practices

### 1. Version Control

All config files should be committed:
- They define project setup
- Required for consistent builds
- Needed for CI/CD

### 2. Document Changes

When modifying configs:
- Document why changes were made
- Update relevant documentation
- Test changes thoroughly

### 3. Keep Configs Simple

- Avoid unnecessary complexity
- Use defaults when possible
- Only customize what's needed

## Troubleshooting

### Config Not Working

**Check:**
- File syntax (JSON/JavaScript)
- File location (root directory)
- Node.js version compatibility

### Tailwind Classes Not Working

**Check:**
- File in `content` array?
- Rebuilt CSS? Run `npm run build:css`
- Class name correct?

### Tests Not Running

**Check:**
- Config file syntax
- Test directory exists
- Dependencies installed

## Next Steps

- [Build System](../architecture/build-system.md)
- [Development Workflow](../development/workflow.md)
- [Testing Overview](../testing/overview.md)
