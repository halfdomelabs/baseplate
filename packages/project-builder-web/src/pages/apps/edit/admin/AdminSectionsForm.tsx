import type { AdminAppConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { adminSectionEntityType } from '@halfdomelabs/project-builder-lib';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from 'src/components';

import { registerEntityTypeUrl } from '@src/services/entity-type';

import AdminEditSectionForm from './AdminEditSectionForm';

registerEntityTypeUrl(
  adminSectionEntityType,
  `/apps/edit/{parentUid}/sections/edit/{uid}`,
);

interface Props {
  className?: string;
  appConfig: AdminAppConfig;
}

function AdminSectionsForm({ className, appConfig }: Props): React.JSX.Element {
  const sortedSections = sortBy(appConfig.sections ?? [], [
    (section) => section.name,
  ]);

  return (
    <div className={clsx('flex items-stretch', className)}>
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
