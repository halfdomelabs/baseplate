import { TypescriptCodeExpression } from '@halfdomelabs/core-generators';
import {
  GraphQLFragment,
  GraphQLRoot,
  mergeGraphQLFragments,
} from '@src/writers/graphql/index.js';
import { DataLoader } from '../_providers/admin-loader.js';

export interface AdminCrudDataDependency {
  propName: string;
  propType: TypescriptCodeExpression;
  propLoaderValueGetter: (value: string) => string;
  loader: DataLoader;
  graphRoots?: GraphQLRoot[];
  graphFragments?: GraphQLFragment[];
}

export function areDepsMergeable(
  depOne: AdminCrudDataDependency,
  depTwo: AdminCrudDataDependency,
): boolean {
  if (depOne.propName !== depTwo.propName) {
    return false;
  }
  // TODO: Check the other values
  return true;
}

export function mergeAdminCrudDataDependencies(
  deps: AdminCrudDataDependency[],
): AdminCrudDataDependency[] {
  return deps.reduce((accumulator, dep) => {
    const idx = accumulator.findIndex((accumDep) =>
      areDepsMergeable(accumDep, dep),
    );
    if (idx === -1) {
      return [...accumulator, dep];
    }
    return accumulator.map((accumDep, i) => {
      // perform merge operation
      if (idx === i) {
        return {
          ...accumDep,
          graphFragments: mergeGraphQLFragments([
            ...(accumDep.graphFragments ?? []),
            ...(dep.graphFragments ?? []),
          ]),
        };
      }
      return accumDep;
    });
  }, [] as AdminCrudDataDependency[]);
}

export function getLoaderExtraProps(
  dataDependencies: AdminCrudDataDependency[],
): string {
  return dataDependencies
    ?.map(
      (d) =>
        `${d.propName}={${d.propLoaderValueGetter(d.loader.loaderValueName)}}`,
    )
    .join(' ');
}

export function getPassthroughExtraProps(
  dataDependencies: AdminCrudDataDependency[],
): string {
  return dataDependencies
    ?.map((d) => `${d.propName}={${d.propName}}`)
    .join(' ');
}
