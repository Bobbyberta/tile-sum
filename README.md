# Advent Puzzle Calendar

A daily puzzle site hosted on GitHub Pages featuring an advent calendar with 25 word puzzle challenges. Each puzzle is an anagram game where players arrange letter tiles to form two words, with Scrabble scoring.

**Live Site**: [https://sum-tile.uk](https://sum-tile.uk)

## Features

- **Advent Calendar Homepage**: 25 day containers that unlock based on the current date (December 1-25)
- **Daily Puzzles**: Anagram puzzles where players arrange scrambled letter tiles to form two words
- **Scrabble Scoring**: Each tile displays its letter and Scrabble point value
- **Drag and Drop**: Intuitive tile placement with drag-and-drop or click-to-move functionality
- **Solution Validation**: Submit button checks if the solution is correct
- **Accessible Design**: Clean, modern UI with proper ARIA labels and keyboard navigation
- **Responsive Layout**: Works on desktop, tablet, and mobile devices

## Getting Started

### Creating a GitHub Repository

1. **Create a new repository on GitHub:**
   - Go to [GitHub.com](https://github.com) and sign in
   - Click the "+" icon in the top right corner
   - Select "New repository"
   - Repository name: `tile-sum` (or your preferred name)
   - Description: "Advent Puzzle Calendar - Daily word puzzle game"
   - Choose Public or Private
   - **Do NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Initialize Git and push your code:**
   ```bash
   # Navigate to your project directory
   cd tile-sum
   
   # Initialize git repository (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Create initial commit
   git commit -m "Initial commit: Advent Puzzle Calendar"
   
   # Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
   git remote add origin https://github.com/YOUR_USERNAME/tile-sum.git
   
   # Rename branch to main (if needed)
   git branch -M main
   
   # Push to GitHub
   git push -u origin main
   ```

### Local Development Setup

1. **Clone this repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tile-sum.git
   cd tile-sum
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the CSS:**
   ```bash
   npm run build:css
   ```
   This compiles Tailwind CSS from `src/styles.css` to `styles.css` in the root directory.

4. **To test locally, use a simple HTTP server:**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

5. Open `http://localhost:8000` in your browser.

**Note:** If you make changes to HTML files that add or modify Tailwind classes, rebuild the CSS with `npm run build:css`. For development, you can use `npm run watch:css` to automatically rebuild on changes.

## Deployment to GitHub Pages

### Step-by-Step GitHub Pages Setup

1. **Build the CSS and ensure your code is pushed to GitHub:**
   ```bash
   npm install
   npm run build:css
   git add .
   git commit -m "Prepare for GitHub Pages deployment"
   git push origin main
   ```
   **Important:** Make sure `styles.css` is committed and pushed, as it's required for the site to display correctly.

2. **Configure GitHub Pages:**
   - Go to your repository on GitHub (e.g., `https://github.com/YOUR_USERNAME/tile-sum`)
   - Click on **Settings** (in the repository navigation bar)
   - Scroll down to **Pages** in the left sidebar
   - Under **Source**, select **"Deploy from a branch"**
   - Select the branch: **`main`**
   - Select the folder: **`/ (root)`**
   - Click **Save**

3. **Wait for deployment:**
   - GitHub will build and deploy your site (usually takes 1-2 minutes)
   - You'll see a green checkmark when deployment is complete
   - Your site will be available at: `https://YOUR_USERNAME.github.io/tile-sum/`

4. **Update your README:**
   - Replace `YOUR_USERNAME` in the README with your actual GitHub username
   - Update the "Live Site" link at the top of this README

### Custom Domain Setup

This site uses the custom domain `sum-tile.uk`. To set up a custom domain for GitHub Pages:

#### 1. Create CNAME File

A `CNAME` file has been created in the repository root containing `sum-tile.uk`. This file tells GitHub Pages which custom domain to use.

#### 2. Configure DNS in GoDaddy

1. **Log in to GoDaddy:**
   - Go to [GoDaddy.com](https://www.godaddy.com) and sign in
   - Navigate to your domain management page

2. **Access DNS Management:**
   - Find your domain `sum-tile.uk` in the list
   - Click on "DNS" or "Manage DNS"

3. **Add A Records:**
   - Add the following four A records (these point to GitHub Pages IP addresses):
     - **Type**: A
     - **Name**: @ (or leave blank for root domain)
     - **Value**: `185.199.108.153`
     - **TTL**: 600 (or default)
   
   Repeat for these additional IP addresses:
     - **Type**: A, **Name**: @, **Value**: `185.199.109.153`
     - **Type**: A, **Name**: @, **Value**: `185.199.110.153`
     - **Type**: A, **Name**: @, **Value**: `185.199.111.153`

4. **Add CNAME Record for www subdomain (optional):**
   - **Type**: CNAME
   - **Name**: www
   - **Value**: `YOUR_USERNAME.github.io` (replace YOUR_USERNAME with your GitHub username)
   - **TTL**: 600 (or default)

5. **Save Changes:**
   - Click "Save" or "Add Record" for each entry
   - DNS changes may take up to 48 hours to propagate, though usually much faster

#### 3. Configure GitHub Pages Custom Domain

1. **Go to GitHub Repository Settings:**
   - Navigate to your repository on GitHub
   - Click on **Settings** → **Pages**

2. **Add Custom Domain:**
   - In the "Custom domain" section, enter: `sum-tile.uk`
   - Click **Save**

3. **Verify Domain:**
   - GitHub will automatically verify the domain ownership
   - You may see a "DNS check in progress" message
   - Once verified, you'll see a green checkmark

4. **Enforce HTTPS:**
   - After domain verification, check the "Enforce HTTPS" checkbox
   - GitHub will automatically provision an SSL certificate (may take a few minutes)

#### 4. Verify Setup

- Wait for DNS propagation (check with `dig sum-tile.uk` or use online DNS checker tools)
- Visit `https://sum-tile.uk` in your browser
- The site should load with HTTPS enabled

**Note**: If you encounter issues, ensure:
- The CNAME file is committed and pushed to your repository
- DNS records are correctly configured in GoDaddy
- You've waited sufficient time for DNS propagation (up to 48 hours)

### Troubleshooting

- **Site not loading?** Check that `index.html` is in the root directory
- **404 errors?** Ensure all file paths are relative (not absolute)
- **Styling broken?** Ensure `styles.css` exists (run `npm run build:css` if missing) and `.nojekyll` file exists

## Project Structure

```
tile-sum/
├── index.html          # Home page with advent calendar
├── puzzle.html         # Puzzle page
├── archive.html        # Archive page for accessing past puzzles
├── puzzle-data.js      # Puzzle definitions and Scrabble scores
├── script.js           # Main JavaScript logic
├── styles.css          # Compiled Tailwind CSS (generated from src/styles.css)
├── src/
│   └── styles.css      # Source CSS with Tailwind directives
├── scripts/
│   └── update-cursor-rules.js  # Script to generate Cursor rules
├── .cursor/
│   └── rules/          # Cursor AI rules (generated from CURSOR_RULES_SOURCE.md)
│       ├── global/     # Global project rules
│       └── frontend/   # Frontend-specific rules
├── CURSOR_RULES_SOURCE.md  # Source file for Cursor rules (edit this to update rules)
├── package.json        # npm dependencies and build scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── CNAME               # Custom domain configuration for GitHub Pages
├── .nojekyll           # Prevents Jekyll processing on GitHub Pages
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Dependencies

This project uses npm for development dependencies and CDN for runtime dependencies:

### Development Dependencies (npm)
- **Tailwind CSS**: Version 3.4.13
  - Used for styling and responsive design
  - Built with PostCSS and compiled to `styles.css`
  - Source file: `src/styles.css`

- **PostCSS**: Version 8.4.47
  - Used to process Tailwind CSS

- **Autoprefixer**: Version 10.4.20
  - Automatically adds vendor prefixes to CSS

### Runtime Dependencies (CDN)
- **canvas-confetti**: Version 1.9.2
  - Used for celebration animations when puzzles are solved
  - Loaded via jsDelivr CDN: `cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js`
  - Only loaded in `puzzle.html`

**Note:** Before deploying or testing locally, run `npm install` and `npm run build:css` to generate the compiled CSS file.

## How It Works

- **Calendar**: The home page displays 25 days. Days unlock based on the current date (December 1-25 of the current year).
- **Puzzles**: Each puzzle consists of scrambled letter tiles that form an anagram of two words. Players drag tiles into slots to form the words.
- **Scoring**: Each letter has a Scrabble point value displayed on the tile. The total score for each word and both words combined is calculated and displayed.
- **Validation**: When all slots are filled, the submit button becomes enabled. Clicking it validates the solution against the correct answer.

## Test Modes

Two specialized test modes are available for testing different aspects of the game:

### Archive Test Mode (`?test=archive`)

Tests the archive functionality and daily puzzle view:
- Shows daily puzzle view (not calendar) on homepage
- Allows archive access with future dates enabled
- Shows archive links in navigation

**Local Testing:**
- **Home page**: `http://localhost:8000/index.html?test=archive` - Shows daily puzzle view
- **Archive page**: `http://localhost:8000/archive.html?test=archive` - Allows future dates
- **Puzzle page**: `http://localhost:8000/puzzle.html?day=1&test=archive` - Access any puzzle

**GitHub Pages Testing:**
- **Home page**: `https://sum-tile.uk/?test=archive` - Shows daily puzzle view
- **Archive page**: `https://sum-tile.uk/archive.html?test=archive` - Allows future dates
- **Puzzle page**: `https://sum-tile.uk/puzzle.html?day=1&test=archive` - Access any puzzle

### Advent Test Mode (`?test=advent`)

Tests the advent calendar functionality:
- Shows calendar view with all 25 days unlocked
- Hides archive links/functionality
- Shows countdown overlay if before Dec 1

**Local Testing:**
- **Home page**: `http://localhost:8000/index.html?test=advent` - Unlocks all 25 days
- **Puzzle page**: `http://localhost:8000/puzzle.html?day=1&test=advent` - Access any puzzle

**GitHub Pages Testing:**
- **Home page**: `https://sum-tile.uk/?test=advent` - Unlocks all 25 days
- **Puzzle page**: `https://sum-tile.uk/puzzle.html?day=1&test=advent` - Access any puzzle

**Note**: Replace `day=1` with any number from 1-25 to test different puzzles.

When test mode is active, a test mode indicator will appear at the top of the page showing which mode is active.

## Customization

### Adding New Puzzles

Edit `puzzle-data.js` to modify puzzle words or add new puzzles. Each puzzle requires:
- `words`: Array of two words
- `solution`: Array of the correct solution (same as words, but can be in different order)

### Styling

The site uses Tailwind CSS built with PostCSS. You can customize colors and styles by:
- Modifying Tailwind classes in the HTML files (`index.html`, `puzzle.html`, `script.js`)
- Updating `tailwind.config.js` to customize the theme, colors, or add plugins
- After making changes, rebuild the CSS with `npm run build:css` (or use `npm run watch:css` for automatic rebuilding during development)

## Cursor Rules

This project uses Cursor's folder-based rules system to guide AI assistance. The rules help maintain consistency and ensure the AI understands project conventions.

### How It Works

- **Source File**: `CURSOR_RULES_SOURCE.md` - Edit this file to update rules
- **Generated Files**: `.cursor/rules/` - Automatically generated `.mdc` files (do not edit directly)
- **Automation**: Run `npm run update-rules` to regenerate `.mdc` files from the source

### Updating Rules

1. **Edit the source file**: Open `CURSOR_RULES_SOURCE.md` and modify the rule sections
2. **Regenerate rules**: Run `npm run update-rules` to generate the `.mdc` files
3. **Verify**: The script will validate and generate all rule files

### Rule Categories

- **Global Rules** (`.cursor/rules/global/`):
  - `project-context.mdc` - Project overview, tech stack, deployment info
  - `code-style.mdc` - JavaScript coding conventions and naming patterns

- **Frontend Rules** (`.cursor/rules/frontend/`):
  - `tailwind-css.mdc` - Tailwind CSS guidelines and build process
  - `accessibility.mdc` - ARIA labels, keyboard navigation requirements
  - `html-structure.mdc` - HTML organization and best practices

### Quick Reference

```bash
# Update rules after editing CURSOR_RULES_SOURCE.md
npm run update-rules

# Validate rules (same command, validates before generating)
npm run validate-rules
```

### Rule Format

Each rule section in `CURSOR_RULES_SOURCE.md` follows this format:

```markdown
---

## [GLOBAL|FRONTEND] Rule Title

**File:** `.cursor/rules/category/rule-name.mdc`
**Description:** Brief description of what this rule covers
**Always Apply:** true|false
**Globs:** ["**/*.js"] (optional - file patterns where rule applies)

### Rule Content
- Rule details and guidelines
- More information...
```

The automation script parses this format and generates the corresponding `.mdc` files with proper frontmatter that Cursor reads automatically.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for personal use.

