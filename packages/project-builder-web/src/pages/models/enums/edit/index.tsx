import {
  EnumConfig,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useConfirmDialog } from '@halfdomelabs/ui-components';
import _ from 'lodash';
import { useNavigate, useParams } from 'react-router-dom';

import EnumEditForm from './EnumEditForm';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { RefDeleteError } from '@src/utils/error';
import { Alert, Button } from 'src/components';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';
import { useStatus } from 'src/hooks/useStatus';
import { useToast } from 'src/hooks/useToast';
import { formatError, logAndFormatError } from 'src/services/error-formatter';

function EnumEditPage(): JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { uid } = useParams<'uid'>();
  const { parsedProject, setConfigAndFixReferences } = useProjectDefinition();
  const { status, setError } = useStatus();
  const toast = useToast();
  const navigate = useNavigate();
  const { showRefIssues } = useDeleteReferenceDialog();

  const id = uid ? modelEnumEntityType.fromUid(uid) : undefined;

  const isNew = !id;

  const enumBlock = parsedProject.getEnums().find((m) => m.id === id);

  const handleDelete = (): void => {
    requestConfirm({
      title: 'Delete Model',
      content: `Are you sure you want to delete ${enumBlock?.name ?? 'model'}?`,
      onConfirm: () => {
        try {
          setConfigAndFixReferences((draftConfig) => {
            draftConfig.enums = draftConfig.enums?.filter((m) => m.id !== id);
          });
          navigate('..');
        } catch (err) {
          if (err instanceof RefDeleteError) {
            showRefIssues({ issues: err.issues });
            return;
          }
          setError(logAndFormatError(err));
        }
      },
    });
  };

  const handleSubmit = (config: EnumConfig): void => {
    try {
      const id = config.id || modelEnumEntityType.generateNewId();
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.enums = _.sortBy(
          [
            ...(draftConfig.enums?.filter((m) => m.id !== id) ?? []),
            { ...config, id },
          ],
          (c) => c.name,
        );
      });

      navigate(`../edit/${modelEnumEntityType.toUid(id)}`);

      toast.success(`Successfully saved enum ${config.name}`);
    } catch (err) {
      setError(formatError(err));
    }
  };

  if (!enumBlock && id) {
    return <Alert type="error">Unable to find enum {id}</Alert>;
  }

  return (
    <div className="space-y-4" key={id}>
      <div className="flex flex-row space-x-8">
        <h1>{enumBlock?.name ?? 'New Enum'}</h1>
        {!isNew && (
          <Button color="light" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
      <Alert.WithStatus status={status} />
      <EnumEditForm onSubmit={handleSubmit} config={enumBlock} />
    </div>
  );
}

export default EnumEditPage;
