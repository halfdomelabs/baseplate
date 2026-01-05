import type { ReactElement } from 'react';

import { useSuspenseQuery } from '@apollo/client/react';
import { createFileRoute } from '@tanstack/react-router';

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
  const { data } = useSuspenseQuery(homePageQuery);

  return (
    <div className="space-y-4">
      <p>Welcome {data.viewer?.email ?? 'an anonymous user'}!</p>
    </div>
  );
}
