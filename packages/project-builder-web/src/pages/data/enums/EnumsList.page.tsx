import { Button } from '@halfdomelabs/ui-components';

import { NewEnumDialog } from './new/NewEnumDialog';

function EnumsListPage(): JSX.Element {
  return (
    <div className="max-w-4xl space-y-4 p-4 text-style-prose">
      <h1>Enums</h1>
      <p>
        Enums are a way to define a set of named values. They can be used to
        define a type that can only have a certain set of values. For example,
        you might have an enum called <code>Color</code> with values{' '}
        <code>RED</code>, <code>GREEN</code>, and <code>BLUE</code>.
      </p>
      <p>
        Choose a model to edit from the sidebar or{' '}
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
