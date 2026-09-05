import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/index.js';

/**
 * The markup a markdown renderer emits. Rendered unchanged in every story so
 * the same content can be compared across container sizes.
 */
function SampleContent(): React.JSX.Element {
  return (
    <>
      <h1>Defining a data model</h1>
      <p>
        A model describes one table in your database and the GraphQL type built
        on top of it. Every model needs a name, at least one scalar field, and a
        primary key. See the{' '}
        <a href="https://www.baseplate.dev" target="_blank" rel="noreferrer">
          schema reference
        </a>{' '}
        for the full list of field types.
      </p>
      <h2>Scalar fields</h2>
      <p>
        Field names are <strong>camelCase</strong> and are converted to
        <code>snake_case</code> column names when the Prisma schema is written.
      </p>
      <ul>
        <li>
          <code>string</code> — maps to <code>text</code>
        </li>
        <li>
          <code>int</code> — maps to <code>integer</code>
        </li>
        <li>
          <code>dateTime</code> — maps to <code>timestamptz</code>
        </li>
      </ul>
      <h3>Relations</h3>
      <p>
        A relation field points at another model. Baseplate infers the foreign
        key column, so you only declare the direction:
      </p>
      <pre>
        <code>{`model Post {\n  author  User  @relation(fields: [authorId])\n}`}</code>
      </pre>
      <blockquote>
        <p>
          Deleting a model that is still referenced raises a reference error at
          sync time rather than at runtime.
        </p>
      </blockquote>
      <hr />
      <h3>Field options</h3>
      <div className="typeset-scroll">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>optional</code>
              </td>
              <td>boolean</td>
              <td>false</td>
              <td>Allows the column to hold null</td>
            </tr>
            <tr>
              <td>
                <code>unique</code>
              </td>
              <td>boolean</td>
              <td>false</td>
              <td>Adds a unique index covering the column</td>
            </tr>
            <tr>
              <td>
                <code>default</code>
              </td>
              <td>scalar</td>
              <td>—</td>
              <td>Value written when the field is omitted on create</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Rendered content on a full-width page. `--typeset-size` is `1em`, so the
 * typeset follows whatever font size its container sets.
 */
function FullWidth(): React.JSX.Element {
  return (
    <div className="typeset max-w-3xl p-6">
      <SampleContent />
    </div>
  );
}

/**
 * The same content inside a `text-sm` card. Everything scales down with the
 * container because typeset sizes in `em`.
 */
function InsideCard(): React.JSX.Element {
  return (
    <div className="max-w-md p-6 text-sm">
      <Card>
        <CardHeader>
          <CardTitle>Help</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="typeset">
            <SampleContent />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * `not-typeset` covers a component and everything inside it, and text-size
 * utilities beat typeset because typeset lives in `@layer components`.
 */
function EscapeHatches(): React.JSX.Element {
  return (
    <div className="typeset max-w-3xl p-6">
      <h2>Opting out</h2>
      <p>
        A component dropped into rendered content keeps its own styling when it
        is marked <code>not-typeset</code>:
      </p>
      <div className="not-typeset flex items-center gap-2 rounded-lg border p-4">
        <Button size="sm">Run sync</Button>
        <span className="text-sm text-muted-foreground">
          Untouched by typeset, including this text.
        </span>
      </div>
      <p className="text-sm">
        This paragraph carries <code>text-sm</code>, which wins over
        typeset&apos;s own sizing.
      </p>
    </div>
  );
}

const meta: Meta = {
  title: 'Typeset',
  tags: ['!autodocs'],
};

export default meta;

export const Page: StoryObj = {
  name: 'Full width page',
  render: () => <FullWidth />,
};

export const InCard: StoryObj = {
  name: 'Inside a text-sm card',
  render: () => <InsideCard />,
};

export const Overrides: StoryObj = {
  name: 'Escape hatches',
  render: () => <EscapeHatches />,
};
