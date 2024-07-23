import {
  EnumConfig,
  enumSchema,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { useResettableForm } from '@halfdomelabs/project-builder-lib/web';
import { useConfirmDialog } from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { useToast } from '@src/hooks/useToast';
import { formatError } from '@src/services/error-formatter';
import { logger } from '@src/services/logger';
import { RefDeleteError } from '@src/utils/error';

interface UseEnumFormOptions {
  setError?: (error: string) => void;
  onSubmitSuccess?: () => void;
  uid?: string;
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
  setError,
  onSubmitSuccess,
  uid,
}: UseEnumFormOptions): {
  form: UseFormReturn<EnumConfig>;
  handleSubmit: (data: EnumConfig) => void;
  handleDelete: () => void;
} {
  const { parsedProject, setConfigAndFixReferences } = useProjectDefinition();
  const toast = useToast();
  const navigate = useNavigate();
  const urlEnumId = uid ? modelEnumEntityType.fromUid(uid) : undefined;
  const enumBlock = parsedProject.getEnums().find((m) => m.id === urlEnumId);
  const { showRefIssues } = useDeleteReferenceDialog();
  const { requestConfirm } = useConfirmDialog();

  const newEnumBlock = useMemo(() => createNewEnum(), []);

  const defaultValues = enumBlock ?? newEnumBlock;

  const form = useResettableForm({
    defaultValues,
    resolver: zodResolver(enumSchema),
  });

  const { getValues, formState, reset } = form;

  useEffect(() => {
    const { id } = getValues();
    if (formState.isSubmitSuccessful) {
      if (!urlEnumId) {
        navigate(`/models/enums/edit/${modelEnumEntityType.toUid(id)}`);
      }
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    }
  }, [
    formState.isSubmitSuccessful,
    getValues,
    navigate,
    onSubmitSuccess,
    urlEnumId,
  ]);

  const handleDelete = (): void => {
    requestConfirm({
      title: 'Delete Model',
      content: `Are you sure you want to delete ${enumBlock?.name ?? 'model'}?`,
      onConfirm: () => {
        try {
          setConfigAndFixReferences((draftConfig) => {
            draftConfig.enums = draftConfig.enums?.filter(
              (m) => m.id !== enumBlock?.id,
            );
          });
          navigate('..');
        } catch (err) {
          if (err instanceof RefDeleteError) {
            showRefIssues({ issues: err.issues });
            return;
          }
          logger.error(err);
          if (setError) {
            setError(formatError(err));
          } else {
            toast.error(formatError(err));
          }
        }
      },
    });
  };

  const handleSubmit = useCallback(
    (data: EnumConfig): void => {
      try {
        setConfigAndFixReferences((draftConfig) => {
          draftConfig.enums = _.sortBy(
            [
              ...(draftConfig.enums?.filter((e) => e.id !== data.id) ?? []),
              data,
            ],
            (e) => e.name,
          );
        });
        toast.success(`Successfully saved enum ${data.name}`);
        reset(data);
      } catch (err) {
        if (err instanceof RefDeleteError) {
          showRefIssues({ issues: err.issues });
          return;
        }
        logger.error(err);
        if (setError) {
          setError(formatError(err));
        } else {
          toast.error(formatError(err));
        }
      }
    },
    [reset, setConfigAndFixReferences, setError, showRefIssues, toast],
  );

  return { form, handleSubmit, handleDelete };
}
