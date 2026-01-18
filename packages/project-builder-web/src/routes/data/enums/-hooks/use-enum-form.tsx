import type {
  EnumConfig,
  EnumConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type { UseFormReturn } from 'react-hook-form';

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
import { useNavigate, useRouter } from '@tanstack/react-router';
import { sortBy } from 'es-toolkit';
import { useMemo, useRef } from 'react';

import { logAndFormatError } from '#src/services/error-formatter.js';
import { NotFoundError } from '#src/utils/error.js';

interface UseEnumFormOptions {
  enumKey?: string;
  omit?: string[];
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
  omit,
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
  const router = useRouter();

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

  const baseEnumSchema = useDefinitionSchema(createEnumBaseSchema);

  const fieldsToOmit = useRef(omit);

  const finalSchema = useMemo(() => {
    if (fieldsToOmit.current) {
      return baseEnumSchema.omit(
        Object.fromEntries(
          fieldsToOmit.current.map((field) => [field, true]),
        ) as Record<string | number, never>,
      ) as typeof baseEnumSchema;
    }

    return baseEnumSchema;
  }, [baseEnumSchema]);

  const defaultValues = useMemo(() => {
    const enumToUse = enumDefinition ?? newEnumDefinition;
    return fieldsToOmit.current
      ? (finalSchema.parse(enumToUse) as EnumConfigInput)
      : enumToUse;
  }, [enumDefinition, newEnumDefinition, finalSchema]);

  const form = useResettableForm<EnumConfigInput>({
    resolver: zodResolver(finalSchema),
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
                router
                  .invalidate()
                  .then(() =>
                    navigate({
                      to: '/data/enums/edit/$key',
                      params: {
                        key: modelEnumEntityType.keyFromId(
                          updatedDefinition.id,
                        ),
                      },
                    }),
                  )
                  .catch(logAndFormatError);
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
      router,
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
