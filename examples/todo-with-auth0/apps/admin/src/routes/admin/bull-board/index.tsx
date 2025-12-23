import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import { AuthenticateBullBoardDocument } from '@src/generated/graphql';
import { config } from '@src/services/config.js';
import { logAndFormatError } from '@src/services/error-formatter';

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/bull-board/' /* TPL_ROUTE_PATH:END */,
)({
  component: BullBoardPage,
});

function BullBoardPage(): ReactElement {
  const [authenticateBullBoard] = useMutation(AuthenticateBullBoardDocument);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const bullBoardUrl = `/api/bull-board/ui`;

  useEffect(() => {
    async function authenticateBullBoardAction(): Promise<void> {
      const { data } = await authenticateBullBoard();
      if (!data?.authenticateBullBoard.success) {
        throw new Error('Failed to authenticate bull board');
      }

      setIsAuthenticated(true);
    }
    authenticateBullBoardAction().catch((err: unknown) => {
      setError(logAndFormatError(err));
    });
  }, [authenticateBullBoard]);

  if (error) {
    return <ErrorableLoader error={error} />;
  }

  if (!isAuthenticated) {
    return <ErrorableLoader />;
  }

  return (
    <div className="-m-4 h-[calc(100%+2rem)]">
      <iframe
        src={bullBoardUrl}
        className="h-full w-full border-0"
        title="Bull Board Dashboard"
      />
    </div>
  );
}
