import { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';

import { cn } from '@src/utils/cn';

export function StorageConfig({ plugin }: WebConfigProps): JSX.Element {
  const { definitionContainer } = useProjectDefinition();

  const definition = definitionContainer.definition;

  return (
    <div>
      <h1 className={cn('text-2xl font-bold')}>Storage Configuration 2</h1>
      <div className={cn('mt-4')}>
        <p>Configure your storage settings here.</p>
        <p>{plugin?.packageName}</p>
        <p>{definition.name}</p>
      </div>
    </div>
  );
}
