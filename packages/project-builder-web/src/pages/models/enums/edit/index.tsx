import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { useBlockDirtyFormNavigate } from '@halfdomelabs/project-builder-lib/web';
import { useParams } from 'react-router-dom';

import EnumEditForm from './EnumEditForm';
import { useEnumForm } from '../hooks/useEnumForm';
import { useStatus } from '@src/hooks/useStatus';
import { Alert, Button } from 'src/components';

function EnumEditPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, handleSubmit, handleDelete } = useEnumForm({ setError });
  const { formState } = form;
  const { uid } = useParams<'uid'>();
  const id = uid ? modelEnumEntityType.fromUid(uid) : undefined;
  const isNew = !id;
  const { parsedProject } = useProjectDefinition();
  const enumBlock = parsedProject.getEnums().find((m) => m.id === id);

  useBlockDirtyFormNavigate(formState);

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
      <EnumEditForm onSubmit={handleSubmit} form={form} />
    </div>
  );
}

export default EnumEditPage;
