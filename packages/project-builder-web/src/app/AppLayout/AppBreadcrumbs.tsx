import { Breadcrumb } from '@halfdomelabs/ui-components';
import { Fragment } from 'react';
import { Link, useMatches } from 'react-router-dom';

import { useProjectDefinition } from '@src/hooks/useProjectDefinition';
import { RouteCrumbOrFunction } from '@src/types/routes';
import { notEmpty } from '@src/utils/array';

export function AppBreadcrumbs(): JSX.Element {
  const { definitionContainer } = useProjectDefinition();
  const matches = useMatches();
  const crumbs = matches
    .map((match) => {
      const crumbOrFunction = (
        match.handle as { crumb?: RouteCrumbOrFunction } | undefined
      )?.crumb;
      if (!crumbOrFunction) return null;
      const crumb =
        typeof crumbOrFunction === 'function'
          ? crumbOrFunction(match.params, definitionContainer)
          : crumbOrFunction;
      const { label, url } =
        typeof crumb === 'string' ? { label: crumb, url: undefined } : crumb;
      return { id: match.id, label, url };
    })
    .filter(notEmpty);

  return (
    <Breadcrumb>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Link to="/">{definitionContainer.definition.name} project</Link>
        </Breadcrumb.Item>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.id}>
            <Breadcrumb.Separator />
            {index === crumbs.length - 1 ? (
              <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
            ) : (
              <Breadcrumb.Item>
                {crumb.url ? (
                  <Breadcrumb.Link asChild>
                    <Link to={crumb.url}>{crumb.label}</Link>
                  </Breadcrumb.Link>
                ) : (
                  crumb.label
                )}
              </Breadcrumb.Item>
            )}
          </Fragment>
        ))}
      </Breadcrumb.List>
    </Breadcrumb>
  );
}
