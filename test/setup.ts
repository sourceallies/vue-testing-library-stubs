// Registers @testing-library/jest-dom matchers (toBeVisible, toBeInTheDocument, ...)
// with Vitest's expect. @testing-library/vue auto-cleans the DOM after each test
// when run under Vitest globals.
import '@testing-library/jest-dom/vitest';
