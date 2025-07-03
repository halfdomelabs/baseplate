import type {
  EnumConfig,
  EnumConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import {
  createEnumBaseSchema,
  EnumUtils,
  FeatureUtils,
  modelEnumEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import { useEventCallback } from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useMemo } from 'react';

import { logAndFormatError } from '#src/services/error-formatter.js';
import { NotFoundError } from '#src/utils/error.js';

interface UseEnumFormOptions {
  enumKey?: string;
  schema?: z.ZodTypeAny;
  onSubmitSuccess?: () => void;
  isCreate?: boolean;
}

function createNewEnum(): EnumConfig {
  return {
    id: modelEnumEntityType.generateNewId(),
    name: '',
    featureRef: '',
    isExposed: false,
    values: [],
  };
}

export function useEnumForm({
  enumKey,
  schema,
  onSubmitSuccess,
  isCreate,
}: UseEnumFormOptions = {}): {
  form: UseFormReturn<EnumConfigInput>;
  onSubmit: () => Promise<void>;
  defaultValues: EnumConfigInput;
  isSavingDefinition: boolean;
} {
  const { definition, saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();

  const urlEnumId = isCreate
    ? undefined
    : modelEnumEntityType.idFromKey(enumKey);
  const enumDefinition = urlEnumId
    ? EnumUtils.byId(definition, urlEnumId)
    : undefined;

  if (!isCreate && !enumDefinition) {
    throw new NotFoundError('Enum not found');
  }

  // memoize it to keep the same key when resetting
  const newEnumDefinition = useMemo(() => createNewEnum(), []);

  const enumSchema = useDefinitionSchema(createEnumBaseSchema);

  const defaultValues = useMemo(() => {
    const enumToUse = enumDefinition ?? newEnumDefinition;
    return schema ? (enumSchema.parse(enumToUse) as EnumConfig) : enumToUse;
  }, [enumDefinition, newEnumDefinition, schema, enumSchema]);

  const form = useResettableForm<EnumConfigInput>({
    resolver: zodResolver(enumSchema),
    defaultValues,
  });

  const { reset, handleSubmit, setError } = form;

  const handleSubmitSuccess = useEventCallback(onSubmitSuccess);

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        const updatedDefinition = {
          ...enumDefinition,
          ...data,
          // generate new ID if new
          id: enumDefinition?.id ?? modelEnumEntityType.generateNewId(),
        };
        // check for enums with the same name
        const existingEnum = definition.enums?.find(
          (e) =>
            e.id !== updatedDefinition.id &&
            e.name.toLowerCase() === updatedDefinition.name.toLowerCase(),
        );
        if (existingEnum) {
          setError('name', {
            message: `Enum with name ${updatedDefinition.name} already exists.`,
          });
          return;
        }

        return saveDefinitionWithFeedback(
          (draftConfig) => {
            // create feature if a new feature exists
            updatedDefinition.featureRef =
              FeatureUtils.ensureFeatureByNameRecursively(
                draftConfig,
                updatedDefinition.featureRef,
              );
            draftConfig.enums = sortBy(
              [
                ...(draftConfig.enums?.filter(
                  (e) => e.id !== updatedDefinition.id,
                ) ?? []),
                updatedDefinition,
              ],
              [(e) => e.name],
            );
          },
          {
            successMessage: isCreate
              ? 'Successfully created enum!'
              : 'Successfully saved enum!',
            onSuccess: () => {
              if (isCreate) {
                navigate({
                  to: '/data/enums/edit/$key',
                  params: {
                    key: modelEnumEntityType.keyFromId(updatedDefinition.id),
                  },
                }).catch(logAndFormatError);
                reset(newEnumDefinition);
              } else {
                reset(data);
              }
              handleSubmitSuccess?.();
            },
          },
        );
      }),
    [
      navigate,
      reset,
      saveDefinitionWithFeedback,
      setError,
      handleSubmit,
      definition,
      isCreate,
      enumDefinition,
      newEnumDefinition,
      handleSubmitSuccess,
    ],
  );

  return { form, onSubmit, defaultValues, isSavingDefinition };
}
