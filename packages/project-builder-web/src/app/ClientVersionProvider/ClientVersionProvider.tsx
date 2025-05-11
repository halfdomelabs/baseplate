import type { ClientVersionInfo } from '@halfdomelabs/project-builder-server';
import type React from 'react';

import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UseClientVersionResult } from '@src/hooks/useClientVersion';

import { ClientVersionContext } from '@src/hooks/useClientVersion';
import { getVersionInfo } from '@src/services/api';
import { logAndFormatError } from '@src/services/error-formatter';
import { trpcSubscriptionEvents } from '@src/services/trpc';

interface ClientVersionProviderProps {
  children?: React.ReactNode;
}

export function ClientVersionProvider({
  children,
}: ClientVersionProviderProps): React.JSX.Element {
  const [clientVersionInfo, setClientVersionInfo] = useState<
    ClientVersionInfo | undefined
  >();
  const [error, setError] = useState<string>();

  const fetchVersion = useCallback(() => {
    getVersionInfo()
      .then((version) => {
        setClientVersionInfo(version);
      })
      .catch((error: unknown) => {
        setError(logAndFormatError(error, 'Failed to fetch version info.'));
      });
  }, []);

  // refresh version when we reconnect to websocket client
  useEffect(() => {
    fetchVersion();

    const unsubscribe = trpcSubscriptionEvents.on('open', fetchVersion);
    return unsubscribe;
  }, [fetchVersion]);

  // reload page when version changes
  const previousClientVersion = useRef<string | undefined>();
  useEffect(() => {
    if (
      clientVersionInfo &&
      previousClientVersion.current &&
      previousClientVersion.current !== clientVersionInfo.version
    ) {
      globalThis.location.reload();
    }
    if (clientVersionInfo) {
      previousClientVersion.current = clientVersionInfo.version;
    }
  }, [clientVersionInfo]);

  const clientVersionResult: UseClientVersionResult | undefined = useMemo(
    () =>
      clientVersionInfo
        ? {
            version: clientVersionInfo.version,
            featureFlags: clientVersionInfo.featureFlags,
            userConfig: clientVersionInfo.userConfig,
          }
        : undefined,
    [clientVersionInfo],
  );

  if (!clientVersionResult) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <ClientVersionContext.Provider value={clientVersionResult}>
      {children}
    </ClientVersionContext.Provider>
  );
}
