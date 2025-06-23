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

export function createCrumbFromKey(
  entityType: DefinitionEntityType,
  defaultName: string,
  url?: string,
): RouteCrumbOrFunction {
  return createRouteCrumb((params, definition) => ({
    label:
      (params.key &&
        definition.safeNameFromId(entityType.idFromKey(params.key))) ??
      defaultName,
    url: url?.replace(':key', params.key ?? ''),
  }));
}
