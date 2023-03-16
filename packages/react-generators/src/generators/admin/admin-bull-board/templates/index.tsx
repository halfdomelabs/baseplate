// @ts-nocheck

import { useEffect, useState } from 'react';
import { ErrorableLoader } from '%react-components';
import { useCreateBullBoardAuthCodeMutation } from '%react-apollo/generated';
import { config } from '%react-config';
import { logAndFormatError } from '%react-error/formatter';

function BullBoardPage(): JSX.Element {
  const [createBullBoardAuthCode] = useCreateBullBoardAuthCodeMutation();
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
      form.appendChild(codeInput);

      document.body.appendChild(form);

      form.submit();
    }
    createPath().catch((err) => setError(logAndFormatError(err)));
  }, [createBullBoardAuthCode]);

  return <ErrorableLoader error={error} />;
}

export default BullBoardPage;
