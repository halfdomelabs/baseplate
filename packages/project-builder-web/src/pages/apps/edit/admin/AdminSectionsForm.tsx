import { AdminAppConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import _ from 'lodash';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from 'src/components';
import AdminEditSectionForm from './AdminEditSectionForm';

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminSectionsForm({ className, appConfig }: Props): JSX.Element {
  const sortedSections = _.sortBy(appConfig.sections || [], [
    'feature',
    'name',
  ]);

  return (
    <div className={classNames('items-stretch flex', className)}>
      <Sidebar className="flex-none !bg-white">
        <Sidebar.Header className="mb-4">
          <h2>Sections</h2>
        </Sidebar.Header>
        <Sidebar.LinkGroup>
          <Sidebar.LinkItem className="text-green-500" to="new">
            New Section
          </Sidebar.LinkItem>
          {sortedSections.map((section) => (
            <Sidebar.LinkItem key={section.uid} to={`edit/${section.uid}`}>
              {section.name}
            </Sidebar.LinkItem>
          ))}
        </Sidebar.LinkGroup>
      </Sidebar>
      <div className="flex flex-col flex-auto p-4 h-full overflow-y-auto">
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
