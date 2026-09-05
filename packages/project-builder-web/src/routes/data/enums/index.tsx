import type React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { NewEnumDialog } from './-components/new-enum-dialog.js';

export const Route = createFileRoute('/data/enums/')({
  component: EnumsListPage,
});

function EnumsListPage(): React.JSX.Element {
  return (
    <div className="typeset max-w-4xl p-4">
      <h1>Enums</h1>
      <p>
        Enums are a way to define a set of named values. They can be used to
        define a type that can only have a certain set of values. For example,
        you might have an enum called <strong>Color</strong> with values{' '}
        <code>RED</code>, <code>GREEN</code>, and <code>BLUE</code>.
      </p>
      <p>
        Choose an enum to edit from the sidebar or{' '}
        <NewEnumDialog
          trigger={
            <button type="button" className="inline-link">
              create a new enum
            </button>
          }
        />
        .
      </p>
    </div>
  );
}
