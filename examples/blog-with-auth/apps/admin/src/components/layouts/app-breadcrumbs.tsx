import type React from 'react';

import { Link, useRouterState } from '@tanstack/react-router';
import { Fragment, useEffect, useState } from 'react';

import { logError } from '@src/services/error-logger';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

function BreadcrumbLabel({
  label,
}: {
  label: string | Promise<string>;
}): React.ReactNode {
  const [resolvedLabel, setResolvedLabel] = useState<string | undefined>();
  useEffect(() => {
    if (typeof label === 'string') {
      setResolvedLabel(label);
    } else {
      setResolvedLabel(undefined);
      label
        .then((value) => {
          setResolvedLabel(value);
        })
        .catch((err: unknown) => logError(err));
    }
  }, [label]);
  return resolvedLabel;
}

export function AppBreadcrumbs(): React.JSX.Element {
  const matches = useRouterState({ select: (s) => s.matches });

  const crumbs = matches
    .map((match) => {
      const { crumb } =
        (match.loaderData as
          | { crumb?: string | Promise<string> }
          | undefined) ?? {};
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
                <BreadcrumbLabel label={crumb.label} />
              </BreadcrumbPage>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={crumb.url}>
                    <BreadcrumbLabel label={crumb.label} />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
