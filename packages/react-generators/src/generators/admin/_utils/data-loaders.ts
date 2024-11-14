import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import type {
  GraphQLFragment,
  GraphQLRoot,
} from '@src/writers/graphql/index.js';

import { mergeGraphQLFragments } from '@src/writers/graphql/index.js';

import type { DataLoader } from '../_providers/admin-loader.js';

export interface AdminCrudDataDependency {
  propName: string;
  propType: TypescriptCodeExpression;
  propLoaderValueGetter: (value: string) => string;
  loader: DataLoader;
  graphRoots?: GraphQLRoot[];
  graphFragments?: GraphQLFragment[];
}

/**
 * Checks if two `AdminCrudDataDependency` objects are mergeable.
 *
 * @param depOne - The first data dependency.
 * @param depTwo - The second data dependency.
 * @returns `true` if the dependencies are mergeable (i.e., they have the same `propName`), otherwise `false`.
 */
export function areDepsMergeable(
  depOne: AdminCrudDataDependency,
  depTwo: AdminCrudDataDependency,
): boolean {
  // TODO: Check other properties
  return depOne.propName === depTwo.propName;
}

/**
 * Merges an array of `AdminCrudDataDependency` objects, combining any mergeable dependencies.
 *
 * This function iterates through the input dependencies and combines entries with the same `propName`,
 * merging their `graphFragments` if they are found to be mergeable. Non-mergeable entries are added directly to the result.
 *
 * @param deps - An array of `AdminCrudDataDependency` objects to merge.
 * @returns An array of merged `AdminCrudDataDependency` objects.
 */
export function mergeAdminCrudDataDependencies(
  deps: AdminCrudDataDependency[],
): AdminCrudDataDependency[] {
  const mergedDeps: AdminCrudDataDependency[] = [];

  for (const dep of deps) {
    // Find an existing dependency in the merged results that is mergeable with the current dependency
    const existingDep = mergedDeps.find((mergedDep) =>
      areDepsMergeable(mergedDep, dep),
    );

    if (existingDep) {
      // If a mergeable dependency is found, merge `graphFragments`
      existingDep.graphFragments = mergeGraphQLFragments([
        ...(existingDep.graphFragments ?? []),
        ...(dep.graphFragments ?? []),
      ]);
    } else {
      // If no mergeable dependency is found, add the current dependency to the result
      mergedDeps.push(dep);
    }
  }

  return mergedDeps;
}
export function getLoaderExtraProps(
  dataDependencies: AdminCrudDataDependency[],
): string {
  return dataDependencies
    .map(
      (d) =>
        `${d.propName}={${d.propLoaderValueGetter(d.loader.loaderValueName)}}`,
    )
    .join(' ');
}

export function getPassthroughExtraProps(
  dataDependencies: AdminCrudDataDependency[],
): string {
  return dataDependencies.map((d) => `${d.propName}={${d.propName}}`).join(' ');
}
