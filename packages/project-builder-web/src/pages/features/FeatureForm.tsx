import { FeatureConfig } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  ComboboxField,
  Dialog,
  InputField,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useProjectDefinition } from '@src/hooks/useProjectDefinition';
import { useToast } from '@src/hooks/useToast';
import { logAndFormatError } from '@src/services/error-formatter';
import { UserVisibleError } from '@src/utils/error';

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

type FeatureFormData = z.infer<typeof featureSchema>;

export function FeatureForm({
  feature,
  open,
  onClose,
}: FeatureFormProps): JSX.Element {
  const {
    definitionContainer: { definition },
    setConfigAndFixReferences,
  } = useProjectDefinition();
  const toast = useToast();
  const defaultValues = useMemo(
    () => ({
      id: feature?.id ?? '',
      childName: feature?.name.split('/').pop() ?? '',
      parentRef: feature?.parentRef ?? null,
    }),
    [feature],
  );
  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(featureSchema),
    values: defaultValues,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, defaultValues, reset]);

  const onUpsertFeature = (data: FeatureFormData): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
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
              ? f.name.match(new RegExp(`^${parentFeature?.name}/[^/]+$`))
              : !f.name.includes('/'),
          );
          children.forEach((f) => {
            const name = f.name.split('/').pop();
            if (!name) throw new Error('Invalid feature name');
            f.name = parentFeature ? `${parentFeature.name}/${name}` : name;
            renameFeatureChildren(f);
          });
        }

        renameFeatureChildren();

        draftConfig.features = _.sortBy(newFeatures, (f) => f.name);
      });
      onClose?.();
    } catch (err) {
      toast.error(logAndFormatError(err));
    }
  };

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
      <Dialog.Content>
        <form className="space-y-4" onSubmit={handleSubmit(onUpsertFeature)}>
          <Dialog.Header>
            <Dialog.Title>
              {feature?.name ? 'Edit' : 'Add'} Feature
            </Dialog.Title>
          </Dialog.Header>
          <InputField.Controller
            control={control}
            name="childName"
            label="Name"
            autoComplete="off"
            data-1p-ignore
          />
          <ComboboxField.Controller
            control={control}
            name="parentRef"
            label="Parent Feature"
            options={parentOptions}
          />
          <Dialog.Footer>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
