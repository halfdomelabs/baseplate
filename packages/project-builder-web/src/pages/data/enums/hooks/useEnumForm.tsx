import type { EnumConfig } from '@halfdomelabs/project-builder-lib';
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
import { toast, useEventCallback } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { logAndFormatError } from '@src/services/error-formatter';
import { NotFoundError, RefDeleteError } from '@src/utils/error';

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
    feature: '',
    isExposed: false,
    values: [],
  };
}

export function useEnumForm({
  schema,
  onSubmitSuccess,
  isCreate,
}: UseEnumFormOptions = {}): {
  form: UseFormReturn<EnumConfig>;
  onSubmit: () => Promise<void>;
  defaultValues: EnumConfig;
} {
  const { uid } = useParams<'uid'>();
  const { definition, setConfigAndFixReferences } = useProjectDefinition();
  const navigate = useNavigate();

  const urlEnumId = isCreate ? undefined : modelEnumEntityType.fromUid(uid);
  const enumDefinition = urlEnumId
    ? EnumUtils.byId(definition, urlEnumId)
    : undefined;

  if (!isCreate && !enumDefinition) {
    throw new NotFoundError('Enum not found');
  }

  const { showRefIssues } = useDeleteReferenceDialog();

  // memoize it to keep the same UID when resetting
  const newEnumDefinition = useMemo(() => createNewEnum(), []);

  const enumSchemaWithPlugins = usePluginEnhancedSchema(schema ?? enumSchema);

  const defaultValues = useMemo(() => {
    const enumToUse = enumDefinition ?? newEnumDefinition;
    return schema
      ? (enumSchemaWithPlugins.parse(enumToUse) as EnumConfig)
      : enumToUse;
  }, [enumDefinition, newEnumDefinition, schema, enumSchemaWithPlugins]);

  const form = useResettableForm({
    resolver: zodResolver(enumSchemaWithPlugins),
    defaultValues,
  });

  const { reset, handleSubmit, setError } = form;

  const handleSubmitSuccess = useEventCallback(onSubmitSuccess);

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        try {
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

          setConfigAndFixReferences((draftConfig) => {
            // create feature if a new feature exists
            updatedDefinition.feature =
              FeatureUtils.ensureFeatureByNameRecursively(
                draftConfig,
                updatedDefinition.feature,
              );
            draftConfig.enums = _.sortBy(
              [
                ...(draftConfig.enums?.filter(
                  (e) => e.id !== updatedDefinition.id,
                ) ?? []),
                updatedDefinition,
              ],
              (e) => e.name,
            );
          });

          if (isCreate) {
            navigate(createEnumEditLink(updatedDefinition.id));
            reset(newEnumDefinition);
            toast.success('Successfully created enum!');
          } else {
            reset(data);
            toast.success('Successfully saved enum!');
          }

          handleSubmitSuccess?.();
        } catch (error) {
          if (error instanceof RefDeleteError) {
            showRefIssues({ issues: error.issues });
            return;
          }
          toast.error(logAndFormatError(error));
        }
      }),
    [
      navigate,
      reset,
      setConfigAndFixReferences,
      setError,
      showRefIssues,
      handleSubmit,
      definition,
      isCreate,
      enumDefinition,
      newEnumDefinition,
      handleSubmitSuccess,
    ],
  );

  return { form, onSubmit, defaultValues };
}
