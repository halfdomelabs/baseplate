import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@halfdomelabs/ui-components';
import { notEmpty } from '@halfdomelabs/utils';
import { orderBy, upperFirst } from 'es-toolkit';
import { Fragment } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { Link, useMatches, useNavigate } from 'react-router-dom';

import type { RouteCrumbOrFunction } from '@src/types/routes';

import { useProjects } from '@src/hooks/useProjects';

export function AppBreadcrumbs(): React.JSX.Element {
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
  const projects = useProjects((state) => state.projects);
  const setCurrentProjectId = useProjects((state) => state.setCurrentProjectId);
  const navigate = useNavigate();

  const orderedProjects = orderBy(projects, ['name'], ['asc']);

  return (
    <div className="flex items-center space-x-2">
      {projects.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="none"
              className="-ml-2 h-8 px-2 text-muted-foreground"
            >
              <div className="flex items-center text-sm">
                {upperFirst(definitionContainer.definition.name)} project
              </div>
              <MdKeyboardArrowDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {orderedProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onSelect={() => {
                    setCurrentProjectId(project.id);
                    navigate('/');
                  }}
                >
                  <div className="flex flex-col space-y-1">
                    <div>
                      <strong>{project.name}</strong>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {project.directory}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Breadcrumb>
        <BreadcrumbList>
          {projects.length <= 1 && (
            <>
              <BreadcrumbItem>
                {upperFirst(definitionContainer.definition.name)} project
              </BreadcrumbItem>
              {crumbs.length > 0 && <BreadcrumbSeparator />}
            </>
          )}
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.id}>
              {index !== 0 && (
                <BreadcrumbSeparator className="hidden sm:block" />
              )}
              {index === crumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbItem className="hidden sm:block">
                  {crumb.url ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.url}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    crumb.label
                  )}
                </BreadcrumbItem>
              )}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
