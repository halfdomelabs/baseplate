import type React from 'react';

import { adminSectionEntityType } from '@baseplate-dev/project-builder-lib';
import { Button, Card, EmptyDisplay } from '@baseplate-dev/ui-components';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { MdSettings } from 'react-icons/md';

import NewAdminSectionDialog from './-components/new-admin-section-dialog.js';

export const Route = createFileRoute('/admin-sections/$appKey/')({
  component: AdminSectionsIndexPage,
  loader: ({ context: { adminApp, app } }) => {
    if (!adminApp) throw notFound();
    return { adminApp, app };
  },
});

function AdminSectionsIndexPage(): React.JSX.Element {
  const { adminApp, app } = Route.useLoaderData();
  const { appKey } = Route.useParams();

  // Find the web app definition and its admin sections
  const {sections} = adminApp;

  if (sections.length === 0) {
    return (
      <EmptyDisplay
        icon={MdSettings}
        header="No Admin Sections"
        subtitle="Create your first admin section to get started with managing your data"
        actions={
          <NewAdminSectionDialog appId={app.id} appKey={appKey}>
            <Button>New Section</Button>
          </NewAdminSectionDialog>
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">{app.name} Admin Sections</h1>
        <p className="text-muted-foreground">
          Manage CRUD interfaces for your data models. Select a section from the
          sidebar to edit it.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.id} className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold">
                {section.name || 'Unnamed Section'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Type: {section.type}
              </p>
              {section.icon && (
                <p className="text-sm text-muted-foreground">
                  Icon: {section.icon}
                </p>
              )}
              <Link
                to="/admin-sections/$appKey/edit/$sectionKey"
                params={{
                  appKey,
                  sectionKey: adminSectionEntityType.keyFromId(section.id),
                }}
                className="inline-block"
              >
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
