import Ansi from '@cocalc/ansi-to-react';
import classNames from 'classnames';
import { UIEventHandler, useEffect, useRef, useState } from 'react';

import { useWebsocketClient } from 'src/hooks/useWebsocketClient';

interface Props {
  className?: string;
}

function Console({ className }: Props): JSX.Element {
  const [consoleText, setConsoleText] = useState('');
  const { websocketClient } = useWebsocketClient();

  const shouldScrollToBottom = useRef(true);

  const codeRef = useRef<HTMLElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!websocketClient) {
      return undefined;
    }
    const unsubscribe = websocketClient.on('message', (msg) => {
      if (msg.type === 'command-console-emitted') {
        setConsoleText((prev) =>
          prev ? `${prev}\n${msg.message}` : msg.message,
        );
      }
    });

    return () => unsubscribe();
  }, [websocketClient]);

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
      className={classNames(
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
}

export default Console;
