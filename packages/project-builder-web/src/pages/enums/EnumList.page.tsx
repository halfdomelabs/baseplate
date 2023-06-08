import { Button, EmptyDisplay } from '@halfdomelabs/ui-components';
import { HiDatabase } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

function EnumListPage(): JSX.Element {
  const { parsedProject } = useProjectConfig();

  const enums = parsedProject.getEnums();

  if (!enums.length) {
    return (
      <EmptyDisplay
        icon={HiDatabase}
        header="No Enums"
        subtitle="Create an enum to get started"
        actions={
          <Link to="/enums/new" className="inline-block">
            <Button>New Enum</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1>Enums</h1>
      <p>
        Enums are used to define a list of values that can be used in your
        models.
      </p>
      <p>
        Choose an enum to edit from the sidebar or{' '}
        <Link to="new">create a new one</Link>.
      </p>
    </div>
  );
}

export default EnumListPage;
