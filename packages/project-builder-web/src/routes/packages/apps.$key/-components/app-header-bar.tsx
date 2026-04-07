import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useNavigate } from '@tanstack/react-router';
import { HiDotsVertical } from 'react-icons/hi';

import { logAndFormatError } from '#src/services/error-formatter.js';

interface AppHeaderBarProps {
  app: { id: string; name: string; type: string };
}

export function AppHeaderBar({ app }: AppHeaderBarProps): React.ReactElement {
  const { definition, saveDefinitionWithFeedbackSync, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();

  const { packageScope } = definition.settings.general;

  function handleUnlink(): void {
    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.apps = draft.apps.filter((a) => a.id !== app.id);
      },
      {
        successMessage: 'Successfully unlinked app!',
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate({ to: '/packages' }).catch(logAndFormatError);
        },
      },
    );
  }

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <h2>{packageScope ? `@${packageScope}/${app.name}` : app.name}</h2>
        <Badge variant="secondary">{app.type}</Badge>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <HiDotsVertical aria-label="More Actions" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              disabled={isSavingDefinition}
              onClick={() => {
                requestConfirm({
                  title: 'Unlink App',
                  content: `Are you sure you want to unlink ${app.name}? The app will be removed from Baseplate but generated files will remain on disk.`,
                  onConfirm: handleUnlink,
                });
              }}
            >
              Unlink App
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
