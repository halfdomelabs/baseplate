import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './error-boundary';

vi.mock('@src/services/error-logger', () => ({
  logError: vi.fn(),
}));

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('should render children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('should render the fallback when a child throws', () => {
    // React logs the caught error to console.error; silence it for this test.
    vi.spyOn(console, 'error').mockImplementation(() => {
      /* no-op */
    });

    render(
      <ErrorBoundary resetButtonLabel="Try again">
        <Boom />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });
});
