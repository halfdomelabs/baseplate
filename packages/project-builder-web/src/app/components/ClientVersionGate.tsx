import { ErrorableLoader } from '@halfdomelabs/ui-components';
import { useEffect, useMemo, useState, useRef } from 'react';

import {
  ClientVersionContext,
  UseClientVersionResult,
} from 'src/hooks/useClientVersion';
import { logError } from 'src/services/error-logger';
import { getVersion } from 'src/services/remote';

interface ClientVersionGateProps {
  children?: React.ReactNode;
}

export function ClientVersionGate({
  children,
}: ClientVersionGateProps): JSX.Element {
  const [clientVersion, setClientVersion] = useState<string | undefined>();
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    getVersion()
      .then((version) => {
        setClientVersion(version);
      })
      .catch((err) => {
        logError(err);
        setError(err as Error);
      });
  }, []);

  const previousClientVersion = useRef<string | undefined>();
  useEffect(() => {
    if (
      clientVersion &&
      previousClientVersion.current &&
      previousClientVersion.current !== clientVersion
    ) {
      window.location.reload();
    }
    previousClientVersion.current = clientVersion;
  }, [clientVersion]);

  const clientVersionResult: UseClientVersionResult | undefined = useMemo(
    () =>
      clientVersion
        ? {
            version: clientVersion,
            refreshVersion: () => getVersion().then(setClientVersion),
          }
        : undefined,
    [clientVersion]
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
