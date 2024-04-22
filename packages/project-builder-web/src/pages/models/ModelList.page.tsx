import { Button, EmptyDisplay } from '@halfdomelabs/ui-components';
import { HiDatabase } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useProjectDefinition } from 'src/hooks/useProjectDefinition';

function ModelListPage(): JSX.Element {
  const { parsedProject } = useProjectDefinition();

  const models = parsedProject.getModels();

  if (!models.length) {
    return (
      <EmptyDisplay
        icon={HiDatabase}
        header="No Models"
        subtitle="Create a model to get started"
        actions={
          <Link to="/models/new" className="inline-block">
            <Button>New Model</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1>Models</h1>
      <p>
        Models are the building blocks of your app. They define the data
        structure of your app.
      </p>
      <p>
        Choose a model to edit from the sidebar or{' '}
        <Link to="new">create a new one</Link>.
      </p>
    </div>
  );
}

export default ModelListPage;
