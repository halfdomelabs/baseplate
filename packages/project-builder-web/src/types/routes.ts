import type {
  DefinitionEntityType,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

type RouteCrumb = string | { label: string; url?: string };

export type RouteCrumbOrFunction =
  | RouteCrumb
  | ((
      params: Record<string, string | undefined>,
      definition: ProjectDefinitionContainer,
    ) => RouteCrumb);

export function createRouteCrumb(
  crumb: RouteCrumbOrFunction,
): RouteCrumbOrFunction {
  return crumb;
}

export function createCrumbFromUid(
  entityType: DefinitionEntityType,
  defaultName: string,
  url?: string,
): RouteCrumbOrFunction {
  return createRouteCrumb((params, definition) => ({
    label:
      (params.uid &&
        definition.safeNameFromId(entityType.fromUid(params.uid))) ??
      defaultName,
    url: url?.replace(':uid', params.uid ?? ''),
  }));
}
