import {
  AdminAppConfig,
  adminSectionEntityType,
} from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import _ from 'lodash';
import { Route, Routes } from 'react-router-dom';

import AdminEditSectionForm from './AdminEditSectionForm';
import { Sidebar } from 'src/components';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminSectionsForm({ className, appConfig }: Props): JSX.Element {
  const sortedSections = _.sortBy(appConfig.sections ?? [], [
    'feature',
    'name',
  ]);

  return (
    <div className={classNames('flex items-stretch', className)}>
      <Sidebar className="flex-none !bg-white">
        <Sidebar.Header className="mb-4">
          <h2>Sections</h2>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <Sidebar.LinkItem className="text-green-500" to="new">
            New Section
          </Sidebar.LinkItem>
          {sortedSections.map((section) => (
            <Sidebar.LinkItem
              key={section.id}
              to={`edit/${adminSectionEntityType.toUid(section.id)}`}
            >
              {section.name}
            </Sidebar.LinkItem>
          ))}
        </Sidebar.LinkGroup>
      </Sidebar>
      <div className="flex h-full flex-auto flex-col overflow-y-auto p-4">
        <Routes>
          <Route
            path="new"
            element={<AdminEditSectionForm key="new" appConfig={appConfig} />}
          />
          <Route
            path="edit/:sectionId"
            element={<AdminEditSectionForm appConfig={appConfig} />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default AdminSectionsForm;
