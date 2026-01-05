import type React from 'react';

import { packageEntityType } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baseplate-dev/ui-components';
import {
  createFileRoute,
  notFound,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';

import { logAndFormatError } from '#src/services/error-formatter.js';

export const Route = createFileRoute('/apps/packages/$key')({
  component: EditPackagePage,
  beforeLoad: ({ params: { key }, context: { projectDefinition } }) => {
    const id = packageEntityType.idFromKey(key);
    const pkg = id && projectDefinition.packages.find((p) => p.id === id);
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
  const { saveDefinitionWithFeedbackSync, definition, isSavingDefinition } =
    useProjectDefinition();

  const { pkg } = Route.useLoaderData();

  const navigate = useNavigate({ from: Route.fullPath });

  const handleDelete = (): void => {
    saveDefinitionWithFeedbackSync(
      (definition) => {
        definition.packages = definition.packages.filter(
          (p) => p.id !== pkg.id,
        );
      },
      {
        successMessage: 'Successfully unlinked package!',
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate({ to: '/apps' }).catch(logAndFormatError);
        },
      },
    );
  };

  const { packageScope } = definition.settings.general;

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={pkg.id}
    >
      <div className="max-w-7xl space-y-4 p-4">
        <div className="flex items-center justify-between space-x-4">
          <div>
            <h2>{packageScope ? `@${packageScope}/${pkg.name}` : pkg.name}</h2>
            <p className="text-base text-muted-foreground">
              {pkg.type} package
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {pkg.name}</DialogTitle>
              </DialogHeader>
              <p>
                Are you sure you want to delete <strong>{pkg.name}</strong>?
              </p>
              <p className="text-style-muted">
                This action will unlink the package from the generation process,
                so it will no longer be updated or managed through Baseplate. If
                already generated, the package will remain on the file system.
                You can manually delete it afterwards if no longer needed.
              </p>

              <DialogFooter>
                <DialogClose>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSavingDefinition}
                >
                  Unlink Package
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
