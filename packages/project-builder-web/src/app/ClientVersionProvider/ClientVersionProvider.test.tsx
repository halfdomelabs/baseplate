import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useClientVersion } from '@src/hooks/useClientVersion';
import { getVersionInfo } from '@src/services/api';
import { trpcWebsocketEvents } from '@src/services/trpc';

import { ClientVersionProvider } from './ClientVersionProvider';

vi.mock('@src/services/api');
vi.mock('@src/services/error-logger');

describe('ClientVersionProvider', () => {
  const mockVersionInfo = {
    version: '1.0.0',
    featureFlags: [],
    userConfig: {},
  };

  const mockChild = <div data-testid="child">Test Child</div>;

  const reloadMock = vi.fn();
  const originalLocation = globalThis.location;

  beforeEach(() => {
    vi.mocked(getVersionInfo).mockResolvedValue(mockVersionInfo);
    trpcWebsocketEvents.clearListeners();

    // Mock location.reload
    Object.defineProperty(globalThis, 'location', {
      value: { reload: reloadMock, origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('should fetch version info on mount', async () => {
    render(<ClientVersionProvider>{mockChild}</ClientVersionProvider>);

    expect(getVersionInfo).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('should show loader while fetching version info', () => {
    let cleanUp: (() => void) | undefined;
    vi.mocked(getVersionInfo).mockImplementation(
      () =>
        new Promise((_, r) => {
          cleanUp = r;
        }),
    );

    render(<ClientVersionProvider>{mockChild}</ClientVersionProvider>);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();

    cleanUp?.();
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(getVersionInfo).mockRejectedValue(error);

    render(<ClientVersionProvider>{mockChild}</ClientVersionProvider>);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should reload page when version changes', async () => {
    render(<ClientVersionProvider>{mockChild}</ClientVersionProvider>);

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    // Simulate version change
    vi.mocked(getVersionInfo).mockResolvedValue({
      ...mockVersionInfo,
      version: '2.0.0',
    });

    // Trigger websocket reconnect
    trpcWebsocketEvents.emit('open', undefined);

    await waitFor(() => {
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  it('should not reload page when version does not change', async () => {
    render(<ClientVersionProvider>{mockChild}</ClientVersionProvider>);

    // Trigger websocket reconnect
    trpcWebsocketEvents.emit('open', undefined);

    await waitFor(() => {
      expect(reloadMock).not.toHaveBeenCalled();
    });
  });

  it('should provide version info via context', async () => {
    const ContextConsumer = (): React.JSX.Element => {
      const { version } = useClientVersion();
      return <div data-testid="version">{version}</div>;
    };

    render(
      <ClientVersionProvider>
        <ContextConsumer />
      </ClientVersionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('version')).toHaveTextContent(
        mockVersionInfo.version,
      );
    });
  });
});
