import type { UIEventHandler } from 'react';

import { toast } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { formatError } from '@src/services/error-formatter';
import { trpc } from '@src/services/trpc';

import { AnsiText } from '../AnsiText/AnsiText';

interface Props {
  className?: string;
}

export const Console = ({ className }: Props): React.JSX.Element => {
  const [consoleText, setConsoleText] = useState('');

  const shouldScrollToBottom = useRef(true);

  const codeRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { currentProjectId } = useProjects();

  // Load the current sync console output
  useEffect(() => {
    if (!currentProjectId) {
      return;
    }

    trpc.sync.getCurrentSyncConsoleOutput
      .query({
        id: currentProjectId,
      })
      .then((output) => {
        setConsoleText((oldOutput) => `${output.join('\n')}\n${oldOutput}`);
      })
      .catch((err: unknown) => {
        toast.error(formatError(err, 'Error loading sync console output'));
      });
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }

    const unsubscribeConsoleEmitted = trpc.sync.onConsoleEmitted.subscribe(
      { id: currentProjectId },
      {
        onData: (msg) => {
          setConsoleText((prev) =>
            prev ? `${prev}\n${msg.message}` : msg.message,
          );
        },
      },
    );
    const unsubscribeSyncStarted = trpc.sync.onSyncStarted.subscribe(
      { id: currentProjectId },
      {
        onData: () => {
          setConsoleText('');
        },
      },
    );
    return () => {
      unsubscribeConsoleEmitted.unsubscribe();
      unsubscribeSyncStarted.unsubscribe();
    };
  }, [currentProjectId]);

  useEffect(() => {
    // check if we should scroll to bottom
    if (shouldScrollToBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleText]);

  const lastScrollTop = useRef(0);

  const handleScroll: UIEventHandler<HTMLElement> = (e): void => {
    const codeElem = codeRef.current;
    // turn off scroll to bottom if we scroll up, reset if we scroll to bottom
    if (lastScrollTop.current > e.currentTarget.scrollTop) {
      shouldScrollToBottom.current = false;
    } else if (
      // check if we are scrolled to bottom
      codeElem &&
      codeElem.scrollHeight - codeElem.scrollTop - codeElem.clientHeight < 1
    ) {
      shouldScrollToBottom.current = true;
    }
    lastScrollTop.current = e.currentTarget.scrollTop;
  };

  return (
    <code
      className={clsx(
        'block h-72 w-full overflow-y-scroll whitespace-pre-wrap break-words border border-gray-200 bg-slate-900 p-4 text-sm text-neutral-400 shadow-inner',
        className,
      )}
      ref={codeRef}
      onScroll={handleScroll}
    >
      <AnsiText text={consoleText} />
      <div ref={bottomRef} />
    </code>
  );
};

Console.displayName = 'Console';
