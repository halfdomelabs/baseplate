import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { useNavigate } from '@tanstack/react-router';

import { logAndFormatError } from '#src/services/error-formatter.js';

interface UnlinkSectionProps {
  entityType: 'app' | 'package';
  entityId: string;
  name: string;
}

function UnlinkSection({
  entityType,
  entityId,
  name,
}: UnlinkSectionProps): React.JSX.Element {
  const { saveDefinitionWithFeedbackSync, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();

  const entityLabel = entityType === 'app' ? 'App' : 'Package';

  const handleUnlink = (): void => {
    saveDefinitionWithFeedbackSync(
      (definition) => {
        if (entityType === 'app') {
          definition.apps = definition.apps.filter((a) => a.id !== entityId);
        } else {
          definition.packages = definition.packages.filter(
            (p) => p.id !== entityId,
          );
        }
      },
      {
        successMessage: `Successfully unlinked ${entityType}!`,
        disableDeleteRefDialog: true,
        onSuccess: () => {
          navigate({ to: '/apps' }).catch(logAndFormatError);
        },
      },
    );
  };

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Danger Zone</SectionListSectionTitle>
      </SectionListSectionHeader>
      <SectionListSectionContent>
        <Alert variant="error">
          <AlertTitle>Unlink {entityLabel}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>
              This will remove the {entityType} from Baseplate. Generated files
              will remain on disk.
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Unlink {entityLabel}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unlink {name}</DialogTitle>
                </DialogHeader>
                <p>
                  Are you sure you want to unlink <strong>{name}</strong>?
                </p>
                <p className="text-style-muted">
                  This action will unlink the {entityType} from the generation
                  process, so it will no longer be updated or managed through
                  Baseplate. If already generated, the {entityType} will remain
                  on the file system. You can manually delete it afterwards if
                  no longer needed.
                </p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleUnlink}
                    disabled={isSavingDefinition}
                  >
                    Unlink {entityLabel}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </AlertDescription>
        </Alert>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

export default UnlinkSection;
