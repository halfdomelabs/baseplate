import type { ReactElement } from 'react';

import { useQuery } from '@apollo/client/react';
import { createFileRoute } from '@tanstack/react-router';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import { graphql } from '@src/graphql';

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
