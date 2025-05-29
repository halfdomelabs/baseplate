import type React from 'react';

import { Button } from '@halfdomelabs/ui-components';

import { NewEnumDialog } from './new/NewEnumDialog.js';

function EnumsListPage(): React.JSX.Element {
  return (
    <div className="max-w-4xl space-y-4 p-4 text-style-prose">
      <h1>Enums</h1>
      <p>
        Enums are a way to define a set of named values. They can be used to
        define a type that can only have a certain set of values. For example,
        you might have an enum called <strong>Color</strong> with values{' '}
        <code>RED</code>, <code>GREEN</code>, and <code>BLUE</code>.
      </p>
      <p>
        Choose an enum to edit from the sidebar or{' '}
        <NewEnumDialog>
          <Button variant="link" size="none">
            create a new enum
          </Button>
        </NewEnumDialog>
        .
      </p>
    </div>
  );
}

export default EnumsListPage;
