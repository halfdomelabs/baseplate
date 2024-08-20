import { modelEnumEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { useBlockDirtyFormNavigate } from '@halfdomelabs/project-builder-lib/web';
import { Button, SwitchField } from '@halfdomelabs/ui-components';
import { HiOutlineTrash } from 'react-icons/hi';
import { useParams } from 'react-router-dom';
import { Separator } from '@halfdomelabs/ui-components';

import EnumEditForm from './EnumEditForm';
import { useEnumForm } from '../hooks/useEnumForm';
import { useStatus } from '@src/hooks/useStatus';
import { Alert } from 'src/components';

function EnumEditPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { uid } = useParams<'uid'>();
  const { form, submitHandler, handleDelete } = useEnumForm({ setError, uid });
  const { control, formState, reset } = form;
  const id = uid ? modelEnumEntityType.fromUid(uid) : undefined;
  const { parsedProject } = useProjectDefinition();
  const enumBlock = parsedProject.getEnums().find((m) => m.id === id);

  useBlockDirtyFormNavigate(formState, reset);

  if (!enumBlock || !id) {
    return <Alert type="error">Unable to find enum {id}</Alert>;
  }

  return (
    <div className="space-y-6" key={id}>
      <div className="flex flex-row items-center space-x-8">
        <h1>{enumBlock?.name ?? 'New Enum'}</h1>
        <div className="flex-1" />
        <SwitchField.Controller
          control={control}
          name="isExposed"
          label="Is Exposed?"
        />
        <Button
          variant="outline"
          onClick={handleDelete}
          size="icon"
          className="hover:text-red-600"
        >
          <Button.Icon icon={HiOutlineTrash} />
        </Button>
      </div>
      <Separator />
      <Alert.WithStatus status={status} />
      <EnumEditForm onSubmit={submitHandler} form={form} />
    </div>
  );
}

export default EnumEditPage;
