import type {
  EnumConfig,
  EnumConfigInput,
} from '@halfdomelabs/project-builder-lib';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import {
  enumSchema,
  EnumUtils,
  FeatureUtils,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  usePluginEnhancedSchema,
  useProjectDefinition,
  useResettableForm,
} from '@halfdomelabs/project-builder-lib/web';
import { useEventCallback } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { sortBy } from 'es-toolkit';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { NotFoundError } from '@src/utils/error';

import { createEnumEditLink } from '../../models/_utils/url';

interface UseEnumFormOptions {
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
  schema,
  onSubmitSuccess,
  isCreate,
}: UseEnumFormOptions = {}): {
  form: UseFormReturn<EnumConfigInput>;
  onSubmit: () => Promise<void>;
  defaultValues: EnumConfigInput;
  isSavingDefinition: boolean;
} {
  const { uid } = useParams<'uid'>();
  const { definition, saveDefinitionWithFeedback, isSavingDefinition } =
    useProjectDefinition();
  const navigate = useNavigate();

  const urlEnumId = isCreate ? undefined : modelEnumEntityType.fromUid(uid);
  const enumDefinition = urlEnumId
    ? EnumUtils.byId(definition, urlEnumId)
    : undefined;

  if (!isCreate && !enumDefinition) {
    throw new NotFoundError('Enum not found');
  }

  // memoize it to keep the same UID when resetting
  const newEnumDefinition = useMemo(() => createNewEnum(), []);

  const enumSchemaWithPlugins = usePluginEnhancedSchema(schema ?? enumSchema);

  const defaultValues = useMemo(() => {
    const enumToUse = enumDefinition ?? newEnumDefinition;
    return schema
      ? (enumSchemaWithPlugins.parse(enumToUse) as EnumConfig)
      : enumToUse;
  }, [enumDefinition, newEnumDefinition, schema, enumSchemaWithPlugins]);

  const form = useResettableForm<EnumConfigInput>({
    resolver: zodResolver(enumSchemaWithPlugins),
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
                navigate(createEnumEditLink(updatedDefinition.id));
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
