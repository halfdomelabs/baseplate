import type React from 'react';

import { Link, useRouterState } from '@tanstack/react-router';
import { Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

export function AppBreadcrumbs(): React.JSX.Element {
  const matches = useRouterState({ select: (s) => s.matches });
  const crumbs = matches
    .map((match) => {
      const { crumb } =
        (match.loaderData as { crumb?: string } | undefined) ?? {};
      if (!crumb) return undefined;
      return {
        id: match.id,
        label: crumb,
        url: match.pathname,
      };
    })
    .filter((x) => x !== undefined);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.id}>
            {index !== 0 && <BreadcrumbSeparator />}
            {index === crumbs.length - 1 ? (
              <BreadcrumbPage className="font-medium">
                {crumb.label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={crumb.url}>{crumb.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
