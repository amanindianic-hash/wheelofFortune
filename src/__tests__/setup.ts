import '@testing-library/jest-dom';

// Suppress canvas-related jsdom warnings (not available in node environment)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}
