# Advent Puzzle Calendar

A daily puzzle site hosted on GitHub Pages featuring an advent calendar with 25 word puzzle challenges. Each puzzle is an anagram game where players arrange letter tiles to form two words, with Scrabble scoring.

**Live Site**: [https://bobbyberta.github.io/tile-sum/](https://bobbyberta.github.io/tile-sum/) *(Update this URL after deploying)*

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

2. The site uses vanilla HTML, CSS, and JavaScript with CDN dependencies, so no build process or npm installation is required.

3. **To test locally, use a simple HTTP server:**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

4. Open `http://localhost:8000` in your browser.

## Deployment to GitHub Pages

### Step-by-Step GitHub Pages Setup

1. **Ensure your code is pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages deployment"
   git push origin main
   ```

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

### Custom Domain (Optional)

If you want to use a custom domain:
1. Add a `CNAME` file to your repository root with your domain name
2. Configure DNS settings with your domain provider
3. Update the custom domain in GitHub Pages settings

### Troubleshooting

- **Site not loading?** Check that `index.html` is in the root directory
- **404 errors?** Ensure all file paths are relative (not absolute)
- **Styling broken?** Verify CDN links are working and `.nojekyll` file exists

## Project Structure

```
tile-sum/
├── index.html          # Home page with advent calendar
├── puzzle.html         # Puzzle page
├── puzzle-data.js      # Puzzle definitions and Scrabble scores
├── script.js           # Main JavaScript logic
├── .nojekyll           # Prevents Jekyll processing on GitHub Pages
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Dependencies

This project uses CDN dependencies (no npm installation required):

- **Tailwind CSS**: Latest version via `cdn.tailwindcss.com`
  - Used for styling and responsive design
  - Loaded via CDN in both `index.html` and `puzzle.html`

- **canvas-confetti**: Version 1.9.2
  - Used for celebration animations when puzzles are solved
  - Loaded via jsDelivr CDN: `cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js`
  - Only loaded in `puzzle.html`

All dependencies are loaded via CDN, so no build process or package manager is needed.

## How It Works

- **Calendar**: The home page displays 25 days. Days unlock based on the current date (December 1-25 of the current year).
- **Puzzles**: Each puzzle consists of scrambled letter tiles that form an anagram of two words. Players drag tiles into slots to form the words.
- **Scoring**: Each letter has a Scrabble point value displayed on the tile. The total score for each word and both words combined is calculated and displayed.
- **Validation**: When all slots are filled, the submit button becomes enabled. Clicking it validates the solution against the correct answer.

## Test Mode

To test puzzles before their unlock date, add `?test=true` to the URL. This is useful for testing and development.

### Local Testing
- **Home page**: `http://localhost:8000/index.html?test=true` - Unlocks all 25 days
- **Puzzle page**: `http://localhost:8000/puzzle.html?day=1&test=true` - Access any puzzle directly

### GitHub Pages Testing
- **Home page**: `https://bobbyberta.github.io/tile-sum/?test=true` - Unlocks all 25 days
- **Puzzle page**: `https://bobbyberta.github.io/tile-sum/puzzle.html?day=1&test=true` - Access any puzzle directly

**Note**: Replace `day=1` with any number from 1-25 to test different puzzles.

When test mode is active, a test mode indicator will appear at the top of the calendar page.

## Customization

### Adding New Puzzles

Edit `puzzle-data.js` to modify puzzle words or add new puzzles. Each puzzle requires:
- `words`: Array of two words
- `solution`: Array of the correct solution (same as words, but can be in different order)

### Styling

The site uses Tailwind CSS via CDN. You can customize colors and styles by modifying the Tailwind classes in the HTML files. To use a specific Tailwind version or customize the configuration, you would need to set up a build process, but the CDN version works well for this project.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for personal use.

