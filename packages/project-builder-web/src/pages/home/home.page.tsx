import type React from 'react';

import { Button, Card } from '@halfdomelabs/ui-components';
import { Link } from 'react-router-dom';

function HomePage(): React.JSX.Element {
  return (
    <div className="flex-1 bg-white">
      <div className="mx-auto w-160 space-y-4 p-4">
        <div className="space-y-2">
          <h1>Baseplate Project Builder</h1>
          <p>
            When you&apos;ve set everything up, just click the{' '}
            <strong>Sync</strong> button and Baseplate will sync the project
            configuration to your codebase.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <Card.Header>
              <Card.Title>Features</Card.Title>
              <Card.Description>
                Baseplate comes with a number of features that you can enable or
                disable, such as email and authentication.
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link to="/features">
                <Button>Configure Features</Button>
              </Link>
            </Card.Footer>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>Models</Card.Title>
              <Card.Description>
                Models are the core of your app. They define the data that your
                app will store and manipulate.
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link to="/models">
                <Button>Configure Models</Button>
              </Link>
            </Card.Footer>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>Apps & Repositories</Card.Title>
              <Card.Description>
                Each app represents a separate application that can be run, e.g.
                backend, frontend, mobile app, etc. You can also configure how
                the apps are organized into repositories, e.g. monorepos.
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Link className="inline-block" to="/apps">
                <Button>Configure Apps</Button>
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
