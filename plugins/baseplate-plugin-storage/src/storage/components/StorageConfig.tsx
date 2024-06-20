import { WebConfigProps } from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';

export function StorageConfig({ plugin }: WebConfigProps): JSX.Element {
  return (
    <div>
      <h1 className={clsx('text-2xl font-bold')}>Storage Configuration</h1>
      <div className={clsx('mt-4')}>
        <p>Configure your storage settings here.</p>
        <p>{plugin?.packageName}</p>
      </div>
    </div>
  );
}
