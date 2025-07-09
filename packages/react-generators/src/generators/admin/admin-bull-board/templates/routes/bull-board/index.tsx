// @ts-nocheck

import type { ReactElement } from 'react';

import { CreateBullBoardAuthCodeDocument } from '%generatedGraphqlImports';
import { ErrorableLoader } from '%reactComponentsImports';
import { config } from '%reactConfigImports';
import { logAndFormatError } from '%reactErrorImports';
import { useMutation } from '@apollo/client';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: BullBoardPage,
});

function BullBoardPage(): ReactElement {
  const [createBullBoardAuthCode] = useMutation(
    CreateBullBoardAuthCodeDocument,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createPath(): Promise<void> {
      const { data } = await createBullBoardAuthCode();
      if (!data) {
        throw new Error('Failed to create bull board auth code');
      }

      const { code } = data.createBullBoardAuthCode;

      // submit auth code
      const form = document.createElement('form');
      const codeInput = document.createElement('input');

      form.method = 'POST';
      form.action = `${config.VITE_BULL_BOARD_BASE}/bull-board/auth`;

      codeInput.value = code;
      codeInput.name = 'code';
      form.append(codeInput);

      document.body.append(form);

      form.submit();
    }
    createPath().catch((err: unknown) => {
      setError(logAndFormatError(err));
    });
  }, [createBullBoardAuthCode]);

  return <ErrorableLoader error={error} />;
}
