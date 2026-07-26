// @ts-nocheck

import type { ReactElement } from 'react';

import { graphql } from '%graphqlImports';
import { ErrorableLoader } from '%reactComponentsImports';
import { useQuery } from '@apollo/client/react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: HomePage,
});

const homePageQuery = graphql(`
  query HomePage {
    viewer {
      id
      email
    }
  }
`);

function HomePage(): ReactElement {
  const { data, error } = useQuery(homePageQuery);

  if (!data) {
    return <ErrorableLoader error={error} />;
  }

  return (
    <div className="space-y-4">
      <p>Welcome {data.viewer?.email ?? 'an anonymous user'}!</p>
    </div>
  );
}
