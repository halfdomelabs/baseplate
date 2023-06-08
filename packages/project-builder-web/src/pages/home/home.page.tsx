import { Button, Card } from '@halfdomelabs/ui-components';
import { Link } from 'react-router-dom';

function HomePage(): JSX.Element {
  return (
    <div className="flex-1 bg-white">
      <div className="mx-auto w-[40rem] space-y-4 p-4">
        <div className="space-y-2">
          <h1>Baseplate Project Builder</h1>
          <p>
            When you&apos;ve set everything up, just click the{' '}
            <strong>Sync</strong> button and Baseplate will sync the project
            configuration to your codebase.
          </p>
        </div>
        <Card>
          <Card.Body className="space-y-2">
            <h2>Features</h2>
            <p>
              Baseplate comes with a number of features that you can enable or
              disable, such as email and authentication.
            </p>
            <Link className="block" to="/features">
              <Button>Configure Features</Button>
            </Link>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="space-y-2">
            <h2>Models</h2>
            <p>
              Models are the core of your app. They define the data that your
              app will store and manipulate.
            </p>
            <Link className="block" to="/models">
              <Button>Configure Models</Button>
            </Link>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="space-y-2">
            <h2>Apps & Repositories</h2>
            <p>
              Each app represents a separate application that can be run, e.g.
              backend, frontend, mobile app, etc. You can also configure how the
              apps are organized into repositories, e.g. monorepos.
            </p>
            <Link className="block" to="/apps">
              <Button>Configure Apps</Button>
            </Link>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default HomePage;
