import type { ReactElement } from 'react';

import { useQuery } from '@apollo/client/react';
import { ErrorableLoader } from '@prisma-crud/ui-shared';
import { createFileRoute } from '@tanstack/react-router';

import { graphql } from '@src/gql';

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/' /* TPL_ROUTE_PATH:END */,
)({
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
