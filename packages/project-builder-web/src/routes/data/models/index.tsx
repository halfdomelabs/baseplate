import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import { Button, EmptyDisplay } from '@baseplate-dev/ui-components';
import { createFileRoute } from '@tanstack/react-router';
import { HiDatabase } from 'react-icons/hi';

import { NewModelDialog } from './-components/new-model-dialog.js';

export const Route = createFileRoute('/data/models/')({
  component: ModelsIndexPage,
});

function ModelsIndexPage(): React.JSX.Element {
  const { definition } = useProjectDefinition();

  if (definition.models.length === 0) {
    return (
      <EmptyDisplay
        icon={HiDatabase}
        header="No Models"
        subtitle="Create a model to get started"
        actions={<NewModelDialog trigger={<Button>New Model</Button>} />}
      />
    );
  }

  return (
    <div className="max-w-4xl space-y-4 p-4 text-style-prose">
      <h1>Models</h1>
      <p>
        Models are the building blocks of your app. They define the data
        structure of your app.
      </p>
      <p>
        Choose a model to edit from the sidebar or{' '}
        <NewModelDialog
          trigger={
            <Button variant="link" size="none">
              create a new model
            </Button>
          }
        />
        .
      </p>
    </div>
  );
}
