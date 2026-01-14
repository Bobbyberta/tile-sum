# Contributing to Sum Tile

Thank you for your interest in contributing to Sum Tile! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to see if the bug is already reported
2. **Create a new issue** with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Features

1. **Check existing issues** for similar suggestions
2. **Create a new issue** with:
   - Clear title and description
   - Use case and motivation
   - Proposed implementation (if you have ideas)

### Submitting Code

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Make your changes**:
   - Follow code style guidelines
   - Add JSDoc comments
   - Write tests for new features
   - Update documentation
4. **Test your changes**:
   ```bash
   npm run build:all
   npm run test:all
   ```
5. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/my-feature
   ```
7. **Create a Pull Request**

## Development Setup

See [Getting Started Guide](docs/development/getting-started.md) for detailed setup instructions.

Quick setup:
```bash
git clone https://github.com/YOUR_USERNAME/tile-sum.git
cd tile-sum
npm install
npm run build:all
```

## Coding Standards

### JavaScript Style

- Use modern ES6+ syntax
- Follow naming conventions (see [Code Style Guide](docs/development/code-style.md))
- Add JSDoc comments for exported functions
- Use `const` over `let`; only use `let` when reassignment is needed

### Function Naming

- Event handlers: `handle*` (e.g., `handleTileClick`)
- Initialization: `init*` (e.g., `initPuzzle`)
- Updates: `update*` (e.g., `updateScore`)
- Getters: `get*` (e.g., `getHintsRemaining`)
- Setters: `set*` (e.g., `setHintsRemaining`)

### Code Organization

- Each module should have a single responsibility
- Group related functions together
- Export only what's needed
- Import dependencies at the top

### Comments

- Use JSDoc for exported functions
- Explain "why" not "what" for complex logic
- Document test mode behavior

## Testing

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

### Writing Tests

- Write tests for new features
- Test edge cases and error conditions
- Follow existing test patterns
- Aim for good coverage

See [Testing Documentation](docs/testing/) for more details.

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Assets are built (`npm run build:all`)
- [ ] Documentation is updated
- [ ] JSDoc comments are added
- [ ] No console errors

### PR Description

Include:
- Description of changes
- Related issues (if any)
- Testing performed
- Screenshots (if UI changes)

### Review Process

- Maintainers will review your PR
- Address any feedback
- Keep PR focused (one feature/fix per PR)
- Respond to comments promptly

## Project Structure

```
tile-sum/
├── js/              # JavaScript modules
├── src/             # Source CSS
├── scripts/         # Build scripts
├── tests/           # Test files
├── docs/            # Documentation
└── ...
```

See [Architecture Overview](docs/architecture/overview.md) for details.

## Areas for Contribution

### High Priority

- Bug fixes
- Accessibility improvements
- Performance optimizations
- Test coverage improvements

### Medium Priority

- New features (discuss in issues first)
- Documentation improvements
- Code refactoring
- UI/UX improvements

### Low Priority

- Code style improvements
- Comment improvements
- Minor optimizations

## Questions?

- Check [Documentation](docs/)
- Review [README](README.md)
- Open an issue for questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
