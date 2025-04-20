import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import { TsCodeUtils, tsImportBuilder } from '@halfdomelabs/core-generators';
import { groupBy, sortBy } from 'es-toolkit';

import type { ReactRoute, ReactRouteLayout } from '@src/providers/routes.js';

export function renderRoutes(
  routes: ReactRoute[],
  layouts: ReactRouteLayout[],
): TsCodeFragment {
  // group routes by layout key
  const routesByLayoutKey = groupBy(routes, (route) => route.layoutKey ?? '');

  // Sort layout keys to ensure empty string (no layout) is at the bottom
  const sortedLayoutKeys = Object.keys(routesByLayoutKey).sort((a, b) => {
    if (a === '') return 1;
    if (b === '') return -1;
    return a.localeCompare(b);
  });

  const renderedRoutes = sortedLayoutKeys.flatMap((layoutKey) => {
    const isNoLayout = layoutKey === '';
    const layout = isNoLayout ? null : layouts.find((l) => layoutKey === l.key);

    if (!isNoLayout && !layout) {
      throw new Error(`Layout with key ${layoutKey} not found`);
    }

    const routesGroup = routesByLayoutKey[layoutKey];
    const sortedRoutesGroup = sortBy(routesGroup, [
      (route) => (route.index ? 0 : 1),
      (route) => (route.path === '*' ? 1 : 0),
      (route) => route.path,
    ]);
    const routeExpressions = TsCodeUtils.mergeFragmentsPresorted(
      sortedRoutesGroup.map((route) =>
        TsCodeUtils.mergeFragmentsAsJsxElement(
          'Route',
          {
            path: route.path,
            index: route.index,
            element: route.element,
            children: route.children,
          },
          [tsImportBuilder(['Route']).from('react-router-dom')],
        ),
      ),
    );
    if (layout) {
      return TsCodeUtils.mergeFragmentsAsJsxElement(
        'Route',
        {
          element: layout.element,
          children: routeExpressions,
        },
        [tsImportBuilder(['Route']).from('react-router-dom')],
      );
    }
    return routeExpressions;
  });

  return TsCodeUtils.mergeFragmentsPresorted(renderedRoutes, '\n\n');
}
