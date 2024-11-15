import type { ClientVersionInfo } from '@halfdomelabs/project-builder-server';
import type React from 'react';
import type { UseClientVersionResult } from 'src/hooks/useClientVersion';

import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ClientVersionContext } from 'src/hooks/useClientVersion';
import { logError } from 'src/services/error-logger';
import { getVersionInfo } from 'src/services/remote';

interface ClientVersionGateProps {
  children?: React.ReactNode;
}

export function ClientVersionGate({
  children,
}: ClientVersionGateProps): React.JSX.Element {
  const [clientVersionInfo, setClientVersionInfo] = useState<
    ClientVersionInfo | undefined
  >();
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    getVersionInfo()
      .then((version) => {
        setClientVersionInfo(version);
      })
      .catch((error_: unknown) => {
        logError(error_);
        setError(error_ as Error);
      });
  }, []);

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
