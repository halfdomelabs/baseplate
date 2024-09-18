import {
  EnumUtils,
  modelEnumEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { useParams } from 'react-router-dom';

import EnumEditForm from './EnumEditForm';
import { EnumHeaderBar } from './EnumHeaderBar';
import { useEnumForm } from '../hooks/useEnumForm';
import { NotFoundCard } from 'src/components';

function EnumEditPage(): JSX.Element {
  const { uid } = useParams<'uid'>();
  const { definition } = useProjectDefinition();

  const id = modelEnumEntityType.fromUid(uid);

  const enumDefinition = EnumUtils.byId(definition, id ?? '');

  const { form, onSubmit } = useEnumForm();

  if (!enumDefinition) {
    return <NotFoundCard />;
  }

  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden"
      key={id}
    >
      <div className="border-b py-4">
        <EnumHeaderBar
          form={form}
          enumDefinition={enumDefinition}
          className="max-w-3xl"
        />
      </div>
      <div
        className="mb-[var(--action-bar-height)] max-w-3xl flex-1 overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <EnumEditForm form={form} onSubmit={onSubmit} />
      </div>
    </div>
  );
}

export default EnumEditPage;
