import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { quot } from '@halfdomelabs/utils';
import { groupBy } from 'es-toolkit';

import type { ReactRoute, ReactRouteLayout } from '@src/providers/routes.js';

export function renderRoutes(
  routes: ReactRoute[],
  layouts: ReactRouteLayout[],
): TypescriptCodeExpression {
  // group routes by layout key
  const routesByLayoutKey = groupBy(
    routes,
    (route) => route.layoutKey ?? 'no-layout',
  );

  const renderedRoutes = Object.keys(routesByLayoutKey).flatMap((layoutKey) => {
    const layout =
      layoutKey === 'no-layout'
        ? null
        : layouts.find((l) => layoutKey === l.key);

    if (layoutKey !== 'no-layout' && !layout) {
      throw new Error(`Layout with key ${layoutKey} not found`);
    }

    const routesGroup = routesByLayoutKey[layoutKey];
    const routeExpressions = TypescriptCodeUtils.mergeExpressions(
      routesGroup.map((route) =>
        TypescriptCodeUtils.mergeExpressionsAsJsxElement(
          'Route',
          {
            path: route.path && quot(route.path),
            index: route.index,
            element: route.element,
            children: route.children,
          },
          'import { Route } from "react-router-dom"',
        ),
      ),
    );
    if (layout) {
      return TypescriptCodeUtils.mergeExpressionsAsJsxElement(
        'Route',
        {
          element: layout.element,
          children: routeExpressions,
        },
        'import { Route } from "react-router-dom"',
      );
    }
    return routeExpressions;
  });

  return TypescriptCodeUtils.mergeExpressions(renderedRoutes, '\n\n');
}
