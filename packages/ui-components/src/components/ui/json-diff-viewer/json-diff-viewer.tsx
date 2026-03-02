import type * as React from 'react';

import { stringifyPrettyStable } from '@baseplate-dev/utils';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

import { cn } from '#src/utils/index.js';

interface JsonDiffViewerProps {
  /** The original value to compare */
  oldValue: unknown;
  /** The updated value to compare */
  newValue: unknown;
  /** Toggle between split and unified view (default: true) */
  splitView?: boolean;
  /** Left column title */
  leftTitle?: string;
  /** Right column title */
  rightTitle?: string;
  /** Additional class name for the wrapper */
  className?: string;
}

function JsonDiffViewer({
  oldValue,
  newValue,
  splitView = true,
  leftTitle = 'Current',
  rightTitle = 'Updated',
  className,
}: JsonDiffViewerProps): React.ReactElement {
  const oldStr = stringifyPrettyStable(oldValue as object);
  const newStr = stringifyPrettyStable(newValue as object);

  return (
    <div className={cn('overflow-auto text-xs', className)}>
      <ReactDiffViewer
        oldValue={oldStr}
        newValue={newStr}
        splitView={splitView}
        useDarkTheme
        compareMethod={DiffMethod.JSON}
        leftTitle={leftTitle}
        rightTitle={rightTitle}
        showDiffOnly
      />
    </div>
  );
}

export { JsonDiffViewer };
export type { JsonDiffViewerProps };
