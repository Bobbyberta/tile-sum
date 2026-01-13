// Puzzle fixtures for testing
export const TEST_PUZZLE_DAY = 1;
export const TEST_PUZZLE_WORDS = ['SNOW', 'FLAKE'];
export const TEST_PUZZLE_SOLUTION = ['SNOW', 'FLAKE'];
export const TEST_PUZZLE_LETTERS = 'SNOWFLAKE'.split('').sort().join('');

// Test dates
export function createTestDate(year = 2025, month = 11, day = 1) {
  return new Date(year, month, day);
}

export function formatTestDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseTestDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}
