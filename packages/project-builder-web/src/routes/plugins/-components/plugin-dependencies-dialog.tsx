import type React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseplate-dev/ui-components';

import type { UnmetPluginDependency } from './unmet-dependency-list.js';

import { UnmetDependencyList } from './unmet-dependency-list.js';

interface PluginDependenciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pluginDisplayName: string;
  dependencies: UnmetPluginDependency[];
}

export function PluginDependenciesDialog({
  open,
  onOpenChange,
  pluginDisplayName,
  dependencies,
}: PluginDependenciesDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Required Dependencies</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {pluginDisplayName} requires the following plugins to be enabled
          first.
        </DialogDescription>
        <UnmetDependencyList
          dependencies={dependencies}
          onNavigate={() => {
            onOpenChange(false);
          }}
        />
        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
