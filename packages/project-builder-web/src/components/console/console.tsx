import type { UIEventHandler } from 'react';

import { toast } from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { useProjects } from '#src/hooks/use-projects.js';
import { IS_PREVIEW } from '#src/services/config.js';
import { formatError } from '#src/services/error-formatter.js';
import { trpc } from '#src/services/trpc.js';

import { AnsiText } from '../ansi-text/ansi-text.js';

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

    if (IS_PREVIEW) {
      return;
    }

    trpc.sync.getCurrentSyncConsoleOutput
      .query({
        id: currentProjectId,
      })
      .then((output) => {
        setConsoleText((oldOutput) => {
          const newOutput = output.join('\n');

          // handle React strict mode which triggers multiple calls to this function
          if (oldOutput === newOutput) return oldOutput;
          return oldOutput ? `${newOutput}\n${oldOutput}` : newOutput;
        });
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
        'border-gray-200 bg-slate-900 text-neutral-400 block h-72 w-full overflow-y-scroll border p-4 text-sm break-words whitespace-pre-wrap shadow-inner',
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
