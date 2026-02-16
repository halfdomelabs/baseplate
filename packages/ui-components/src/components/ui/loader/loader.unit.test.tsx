import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Loader } from './loader.js';

describe('Loader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should not show loader initially', () => {
    const { container } = render(<Loader />);

    // Should render empty container initially without progressbar role
    const loaderContainer = container.querySelector(
      '.flex.h-full.items-center.justify-center',
    );
    expect(loaderContainer).toBeInTheDocument();
    expect(loaderContainer).not.toHaveAttribute('role', 'progressbar');
    expect(loaderContainer?.children).toHaveLength(0);
  });

  it('should show loader after default delay of 300ms', () => {
    render(<Loader />);

    // Initially hidden - no progressbar role
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Advance time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should now be visible with progressbar role
    const loader = screen.getByRole('progressbar');
    expect(loader).toBeInTheDocument();
    expect(
      loader.querySelector('.flex.items-center.space-x-2'),
    ).toBeInTheDocument();
  });

  it('should show loader after custom delay', () => {
    render(<Loader delay={500} />);

    // Initially hidden
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Advance time by 400ms (should still be hidden)
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    // Advance time by another 100ms (total 500ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should now be visible
    const loader = screen.getByRole('progressbar');
    expect(loader).toBeInTheDocument();
  });

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(<Loader delay={1000} />);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
