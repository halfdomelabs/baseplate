import classNames from 'classnames';
import { useState } from 'react';

import LinkButton from '../LinkButton';

interface Props {
  className?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  collapsedContents: React.ReactNode;
  onRemove?: () => void;
}

function CollapsibleRow({
  className,
  defaultOpen,
  children,
  collapsedContents,
  onRemove,
}: Props): JSX.Element {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={classNames('', className)}>
      {!isOpen ? (
        <div className="flex flex-row items-center space-x-4">
          <LinkButton onClick={() => setIsOpen(true)}>Edit</LinkButton>
          {collapsedContents}
          <LinkButton onClick={onRemove}>Remove</LinkButton>
        </div>
      ) : (
        <div className="space-y-4 border border-gray-200">
          <div className="flex flex-row space-x-4">
            <LinkButton onClick={() => setIsOpen(false)}>Close</LinkButton>
            <LinkButton onClick={onRemove}>Remove</LinkButton>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleRow;
