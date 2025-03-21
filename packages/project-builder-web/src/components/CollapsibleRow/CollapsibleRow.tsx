import type React from 'react';

import { Button } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { useState } from 'react';

interface Props {
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  collapsedContents: React.ReactNode;
  onRemove?: () => void;
}

export function CollapsibleRow({
  className,
  defaultOpen,
  children,
  collapsedContents,
  onRemove,
}: Props): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={clsx('', className)}>
      {isOpen ? (
        <div className="space-y-4 border border-gray-200">
          <div className="flex flex-row space-x-4">
            <Button
              variant="link"
              size="none"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Close
            </Button>
            <Button variant="link" size="none" onClick={onRemove}>
              Remove
            </Button>
          </div>
          {children}
        </div>
      ) : (
        <div className="flex flex-row items-center space-x-4">
          <Button
            variant="link"
            size="none"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            Edit
          </Button>
          {collapsedContents}
          <Button variant="link" size="none" onClick={onRemove}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
