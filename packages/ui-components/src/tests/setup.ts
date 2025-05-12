import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

import '@testing-library/jest-dom/vitest';

// Workaround for lack of scrollIntoView in jsdom but required in cmdk
// https://github.com/jsdom/jsdom/issues/1695
Element.prototype.scrollIntoView = () => {
  /* no op */
};

// Workaround for lack of ResizeObserver in jsdom but required in cmdk
// https://github.com/jsdom/jsdom/issues/3368
beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {
      // do nothing
    }
    unobserve(): void {
      // do nothing
    }
    disconnect(): void {
      // do nothing
    }
  };
});

afterEach(() => {
  cleanup();
});
