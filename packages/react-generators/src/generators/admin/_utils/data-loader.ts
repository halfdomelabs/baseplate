import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils, tsTemplate } from '@baseplate-dev/core-generators';
import { assertNoDuplicates, notEmpty } from '@baseplate-dev/utils';
import { uniq } from 'es-toolkit';

/**
 * Data loading requirements for the route loader
 */
export interface RouteLoaderField {
  /**
   * The property key to pass through the loader
   */
  key: string;
  /**
   * The value to pass through the loader
   */
  value: TsCodeFragment;
  /**
   * Optional content to put into the body of the loader
   */
  loaderBody?: TsCodeFragment;
  /**
   * Any fields that need to be destructured from the context
   */
  contextFields?: string[];
  /**
   * Skip destructure (avoids destructuring in the component - useful for crumb)
   */
  skipDestructure?: boolean;
}

export interface DataLoader {
  /** Fields to pass through the route loader to the component */
  routeLoaderFields?: RouteLoaderField[];
  /** Fragment to render inside the page component */
  pageComponentBody?: TsCodeFragment;
  /** The property name to use to pass through to the component */
  propName: string;
  /** The type of the property on the component */
  propType: TsCodeFragment;
  /** The value of the prop (used in the page component) */
  propPageValue: TsCodeFragment;
}

function renderRouteLoaderFunction(
  loaders: DataLoader[],
): TsCodeFragment | undefined {
  const routeLoaderFields = loaders.flatMap((l) => l.routeLoaderFields ?? []);

  if (routeLoaderFields.length === 0) return undefined;

  assertNoDuplicates(routeLoaderFields, 'route loader fields');

  const contextFields = uniq(
    routeLoaderFields.flatMap((r) => r.contextFields ?? []),
  );

  const loaderArgs =
    contextFields.length === 0
      ? ''
      : `{ context: { ${contextFields.join(' ')} } }`;

  const bodyFragments = Object.fromEntries(
    routeLoaderFields
      .map((r) =>
        r.loaderBody
          ? ([r.key, r.loaderBody] as [string, TsCodeFragment])
          : undefined,
      )
      .filter(notEmpty),
  );
  const loaderBody =
    Object.keys(bodyFragments).length === 0
      ? undefined
      : TsCodeUtils.mergeFragments(bodyFragments, '\n\n');

  const loaderReturn = TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      routeLoaderFields.map(
        (r) => [r.key, r.value] as [string, TsCodeFragment],
      ),
    ),
  );

  return tsTemplate`(${loaderArgs}) => ${
    loaderBody
      ? tsTemplate`{
      ${loaderBody}

      return ${loaderReturn};
    }`
      : tsTemplate`(${loaderReturn})`
  }`;
}

export function renderDataLoaders(loaders: DataLoader[]): {
  routeLoader: TsCodeFragment | undefined;
  componentBody: TsCodeFragment;
  tableProps: Record<string, TsCodeFragment>;
} {
  const routeLoader = renderRouteLoaderFunction(loaders);

  const loaderFieldsToDestructure = loaders
    .flatMap((l) => l.routeLoaderFields ?? [])
    .filter((r) => !r.skipDestructure)
    .map((r) => r.key);
  const useLoaderDataFragment =
    loaderFieldsToDestructure.length === 0
      ? tsTemplate``
      : tsTemplate`const { ${loaderFieldsToDestructure.join(', ')} } = Route.useLoaderData();`;

  const componentBody = TsCodeUtils.mergeFragments(
    Object.fromEntries(
      loaders.map(
        (l) =>
          [l.propName, l.pageComponentBody] as [
            string,
            TsCodeFragment | undefined,
          ],
      ),
    ),
    '\n\n',
  );

  return {
    routeLoader,
    componentBody: TsCodeUtils.mergeFragmentsPresorted(
      [useLoaderDataFragment, componentBody],
      '\n\n',
    ),
    tableProps: Object.fromEntries(
      loaders.map((l) => [l.propName, l.propPageValue]),
    ),
  };
}
