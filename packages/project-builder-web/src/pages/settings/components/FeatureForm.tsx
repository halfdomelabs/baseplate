import type { FeatureConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  ComboboxFieldController,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { sortBy } from 'es-toolkit';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { UserVisibleError } from '#src/utils/error.js';

interface FeatureFormProps {
  feature?: FeatureConfig;
  open?: boolean;
  onClose?: () => void;
}

const featureSchema = z.object({
  id: z.string(),
  childName: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Must be lowercase, numbers, and dashes only'),
  parentRef: z.string().nullish(),
});

export function FeatureForm({
  feature,
  open,
  onClose,
}: FeatureFormProps): React.JSX.Element {
  const {
    definitionContainer: { definition },
    saveDefinitionWithFeedback,
  } = useProjectDefinition();
  const defaultValues = useMemo(
    () => ({
      id: feature?.id ?? '',
      childName: feature?.name.split('/').pop() ?? '',
      parentRef: feature?.parentRef ?? null,
    }),
    [feature],
  );
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(featureSchema),
    values: defaultValues,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onUpsertFeature = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const parentName = draftConfig.features.find(
          (f) => f.id === data.parentRef,
        )?.name;
        const newName = data.parentRef
          ? `${parentName}/${data.childName}`
          : data.childName;
        if (
          draftConfig.features.some(
            (f) => f.id !== data.id && f.name === newName,
          )
        ) {
          throw new UserVisibleError('Feature with this name already exists');
        }
        const newFeatures = [
          ...draftConfig.features.filter((f) => f.id !== data.id),
          {
            id: data.id,
            name: newName,
            parentRef: data.parentRef,
          },
        ];
        // rename features based off parent ref
        function renameFeatureChildren(parentFeature?: FeatureConfig): void {
          const children = newFeatures.filter((f) =>
            parentFeature
              ? new RegExp(`^${parentFeature.name}/[^/]+$`).exec(f.name)
              : !f.name.includes('/'),
          );
          for (const f of children) {
            const name = f.name.split('/').pop();
            if (!name) throw new Error('Invalid feature name');
            f.name = parentFeature ? `${parentFeature.name}/${name}` : name;
            renameFeatureChildren(f);
          }
        }

        renameFeatureChildren();

        draftConfig.features = sortBy(newFeatures, [(f) => f.name]);
      },
      {
        onSuccess: () => {
          onClose?.();
        },
      },
    ),
  );

  const parentOptions = [
    {
      label: 'None',
      value: null,
    },
    ...definition.features
      .filter((f) => f.id !== feature?.id)
      .map((f) => ({
        label: f.name,
        value: f.id,
      })),
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      <DialogContent>
        <form className="space-y-4" onSubmit={onUpsertFeature}>
          <DialogHeader>
            <DialogTitle>{feature?.name ? 'Edit' : 'Add'} Feature</DialogTitle>
          </DialogHeader>
          <InputFieldController
            control={control}
            name="childName"
            label="Name"
            autoComplete="off"
            data-1p-ignore
          />
          <ComboboxFieldController
            control={control}
            name="parentRef"
            label="Parent Feature"
            options={parentOptions}
          />
          <DialogFooter>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
