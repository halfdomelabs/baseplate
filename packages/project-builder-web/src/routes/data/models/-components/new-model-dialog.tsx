import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createModelBaseSchema,
  FeatureUtils,
  modelEntityType,
  modelScalarFieldEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  useBlockBeforeContinue,
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useControlledState,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { ModelInfoForm } from '../edit.$key/-components/model-info-form.js';

interface NewModelDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function createNewModel(): ModelConfigInput {
  const idFieldId = modelScalarFieldEntityType.generateNewId();
  return {
    id: modelEntityType.generateNewId(),
    name: '',
    featureRef: '',
    service: {
      create: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
      transformers: [],
    },
    model: {
      primaryKeyFieldRefs: [idFieldId],
      fields: [
        {
          id: idFieldId,
          name: 'id',
          type: 'uuid',
          isOptional: false,
          options: {
            default: '',
            genUuid: true,
          },
        },
      ],
    },
  };
}

export function NewModelDialog({
  children,
  open,
  onOpenChange,
}: NewModelDialogProps): React.ReactElement {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const { definition, saveDefinitionWithFeedback } = useProjectDefinition();
  // memoize it to keep the same key when resetting
  const baseModelSchema = useDefinitionSchema(createModelBaseSchema);

  const defaultValues = useMemo(() => createNewModel(), []);
  const navigate = useNavigate();

  const { handleSubmit, reset, setError, control } = useForm({
    resolver: zodResolver(baseModelSchema),
    defaultValues,
  });

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        // check for models with the same name
        const existingModel = definition.models.find(
          (m) => m.name.toLowerCase() === data.name.toLowerCase(),
        );
        if (existingModel) {
          setError('name', {
            message: `Model with name ${data.name} already exists.`,
          });
          return;
        }

        return saveDefinitionWithFeedback(
          (draftConfig) => {
            // create feature if a new feature exists
            const updatedModel = { ...data };
            updatedModel.featureRef =
              FeatureUtils.ensureFeatureByNameRecursively(
                draftConfig,
                updatedModel.featureRef,
              );
            draftConfig.models = sortBy(
              [
                ...draftConfig.models.filter((m) => m.id !== updatedModel.id),
                updatedModel,
              ],
              [(m) => m.name],
            );
          },
          {
            successMessage: 'Successfully created model!',
            onSuccess: () => {
              navigate({
                to: '/data/models/edit/$key',
                params: { key: modelEntityType.keyFromId(data.id) },
              });
              reset(createNewModel());
              setIsOpen(false);
            },
          },
        );
      }),
    [
      reset,
      setError,
      handleSubmit,
      saveDefinitionWithFeedback,
      navigate,
      definition,
      setIsOpen,
    ],
  );

  const blockBeforeContinue = useBlockBeforeContinue();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (shouldOpen) {
          blockBeforeContinue({
            onContinue: () => {
              setIsOpen(true);
            },
          });
        } else {
          setIsOpen(false);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Model</DialogTitle>
          <DialogDescription>
            Models define the structure of your data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ModelInfoForm control={control} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create Model</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
