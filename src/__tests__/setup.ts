import '@testing-library/jest-dom';

// Suppress canvas-related jsdom warnings
HTMLCanvasElement.prototype.getContext = () => null;
