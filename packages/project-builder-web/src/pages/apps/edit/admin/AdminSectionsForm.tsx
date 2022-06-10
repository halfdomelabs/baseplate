import { AdminAppConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminSectionsForm({ className, appConfig }: Props): JSX.Element {
  return <div className={classNames('', className)}>Contents</div>;
}

export default AdminSectionsForm;
