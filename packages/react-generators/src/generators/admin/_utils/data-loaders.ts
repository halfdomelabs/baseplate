import { TypescriptCodeExpression } from '@baseplate/core-generators';
import { GraphQLFragment, GraphQLRoot } from '@src/writers/graphql';
import { DataLoader } from '../_providers/admin-loader';

export interface AdminCrudDataDependency {
  propName: string;
  propType: TypescriptCodeExpression;
  propLoaderValueGetter: (value: string) => string;
  loader: DataLoader;
  graphRoots?: GraphQLRoot[];
  graphFragments?: GraphQLFragment[];
}

export function getLoaderExtraProps(
  dataDependencies: AdminCrudDataDependency[]
): string {
  return dataDependencies
    ?.map(
      (d) =>
        `${d.propName}={${d.propLoaderValueGetter(d.loader.loaderValueName)}}`
    )
    .join(' ');
}

export function getPassthroughExtraProps(
  dataDependencies: AdminCrudDataDependency[]
): string {
  return dataDependencies
    ?.map((d) => `${d.propName}={${d.propName}}`)
    .join(' ');
}
