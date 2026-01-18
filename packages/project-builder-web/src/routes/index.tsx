import type React from 'react';

import {
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@baseplate-dev/ui-components';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index(): React.JSX.Element {
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
            <CardHeader>
              <CardTitle>Models</CardTitle>
              <CardDescription>
                Models are the core of your app. They define the data that your
                app will store and manipulate.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link to="/data">
                <Button>Configure Models</Button>
              </Link>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Plugins</CardTitle>
              <CardDescription>
                Baseplate comes with a number of plugins that you can enable or
                disable, such as email and authentication.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link to="/plugins">
                <Button>Configure Plugins</Button>
              </Link>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Packages</CardTitle>
              <CardDescription>
                Each package represents an app or library in your project. Apps
                are runnable applications (backend, frontend, etc.) while
                libraries are shared code packages.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link className="inline-block" to="/packages">
                <Button>Configure Packages</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
