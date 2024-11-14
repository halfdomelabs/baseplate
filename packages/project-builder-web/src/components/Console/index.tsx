import type { UIEventHandler } from 'react';

import Ansi from '@cocalc/ansi-to-react';
import clsx from 'clsx';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { client } from '@src/services/api';

interface Props {
  className?: string;
}

export interface ConsoleRef {
  clearConsole: () => void;
}

const Console = forwardRef<ConsoleRef, Props>(({ className }, ref) => {
  const [consoleText, setConsoleText] = useState('');

  useImperativeHandle(ref, () => ({
    clearConsole: () => {
      setConsoleText('');
    },
  }));

  const shouldScrollToBottom = useRef(true);

  const codeRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { currentProjectId } = useProjects();

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }
    const unsubscribe = client.sync.onConsoleEmitted.subscribe(
      { id: currentProjectId },
      {
        onData: (msg) => {
          setConsoleText((prev) =>
            prev ? `${prev}\n${msg.message}` : msg.message,
          );
        },
      },
    );

    return () => {
      unsubscribe.unsubscribe();
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
        'block h-72 w-full overflow-y-scroll whitespace-pre-wrap border border-gray-200 bg-slate-900 p-4 text-sm text-neutral-400 shadow-inner',
        className,
      )}
      ref={codeRef}
      onScroll={handleScroll}
    >
      <Ansi>{consoleText}</Ansi>
      <div ref={bottomRef} />
    </code>
  );
});

Console.displayName = 'Console';

export default Console;
