import {
  DefinitionEntityType,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';

export type RouteCrumb = string | { label: string; url: string };

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
): RouteCrumbOrFunction {
  return createRouteCrumb(
    (params, definition) =>
      (params.uid &&
        definition.safeNameFromId(entityType.fromUid(params.uid))) ??
      defaultName,
  );
}
