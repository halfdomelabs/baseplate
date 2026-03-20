import type React from 'react';

import { libraryEntityType } from '@baseplate-dev/project-builder-lib';
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
import {
  createFileRoute,
  notFound,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { HiDotsVertical } from 'react-icons/hi';

import { logAndFormatError } from '#src/services/error-formatter.js';

export const Route = createFileRoute('/packages/libs/$key')({
  component: EditPackagePage,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = libraryEntityType.idFromKey(key);
    const pkg = id && projectDefinition.libraries.find((lib) => lib.id === id);
    if (!pkg) {
      return {};
    }
    return {
      getTitle: () => pkg.name,
      pkg,
    };
  },
  // Workaround for https://github.com/TanStack/router/issues/2139#issuecomment-2632375738
  // where throwing notFound() in beforeLoad causes the not found component to be rendered incorrectly
  loader: ({ context: { pkg } }) => {
    if (!pkg) throw notFound();
    return { pkg };
  },
});

function EditPackagePage(): React.JSX.Element {
  const { definition, saveDefinitionWithFeedbackSync, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();

  const { pkg } = Route.useLoaderData();

  const { packageScope } = definition.settings.general;

  function handleUnlink(): void {
    saveDefinitionWithFeedbackSync(
      (draft) => {
        draft.libraries = draft.libraries.filter((lib) => lib.id !== pkg.id);
      },
      {
        successMessage: 'Successfully unlinked library!',
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate({ to: '/packages' }).catch(logAndFormatError);
        },
      },
    );
  }

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={pkg.id}
    >
      <div className="max-w-7xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2>{packageScope ? `@${packageScope}/${pkg.name}` : pkg.name}</h2>
            <Badge variant="secondary">{pkg.type}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <HiDotsVertical aria-label="More Actions" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSavingDefinition}
                  onClick={() => {
                    requestConfirm({
                      title: 'Unlink Library',
                      content: `Are you sure you want to unlink ${pkg.name}? The library will be removed from Baseplate but generated files will remain on disk.`,
                      onConfirm: handleUnlink,
                    });
                  }}
                >
                  Unlink Library
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div
        className="mb-(--action-bar-height) flex flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <Outlet />
      </div>
    </div>
  );
}
