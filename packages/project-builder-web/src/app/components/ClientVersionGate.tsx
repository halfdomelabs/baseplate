import type { ClientVersionInfo } from '@halfdomelabs/project-builder-server';
import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ClientVersionContext,
  UseClientVersionResult,
} from 'src/hooks/useClientVersion';
import { logError } from 'src/services/error-logger';
import { getVersionInfo } from 'src/services/remote';

interface ClientVersionGateProps {
  children?: React.ReactNode;
}

export function ClientVersionGate({
  children,
}: ClientVersionGateProps): JSX.Element {
  const [clientVersionInfo, setClientVersionInfo] = useState<
    ClientVersionInfo | undefined
  >();
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    getVersionInfo()
      .then((version) => {
        setClientVersionInfo(version);
      })
      .catch((err) => {
        logError(err);
        setError(err as Error);
      });
  }, []);

  const previousClientVersion = useRef<string | undefined>();
  useEffect(() => {
    if (
      clientVersionInfo &&
      previousClientVersion.current &&
      previousClientVersion.current !== clientVersionInfo.version
    ) {
      window.location.reload();
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
            refreshVersion: () => getVersionInfo().then(setClientVersionInfo),
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
