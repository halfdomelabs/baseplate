import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Breadcrumb, Button, Dropdown } from '@halfdomelabs/ui-components';
import _, { upperFirst } from 'lodash';
import { Fragment } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { Link, useMatches, useNavigate } from 'react-router-dom';

import { useProjects } from '@src/hooks/useProjects';
import { RouteCrumbOrFunction } from '@src/types/routes';
import { notEmpty } from '@src/utils/array';

export function AppBreadcrumbs(): JSX.Element {
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

  const orderedProjects = _.orderBy(projects, ['name'], ['asc']);

  return (
    <div className="flex items-center space-x-2">
      {projects.length > 1 && (
        <Dropdown>
          <Dropdown.Trigger asChild>
            <Button
              variant="ghost"
              size="none"
              className="-ml-2 h-8 px-2 text-muted-foreground"
            >
              <div className="flex items-center text-sm">
                {upperFirst(definitionContainer.definition.name)} project
              </div>
              <Button.Icon icon={MdKeyboardArrowDown} />
            </Button>
          </Dropdown.Trigger>
          <Dropdown.Content>
            <Dropdown.Group>
              {orderedProjects.map((project) => (
                <Dropdown.Item
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
                </Dropdown.Item>
              ))}
            </Dropdown.Group>
          </Dropdown.Content>
        </Dropdown>
      )}

      <Breadcrumb>
        <Breadcrumb.List>
          {projects.length <= 1 && (
            <>
              <Breadcrumb.Item>
                {upperFirst(definitionContainer.definition.name)} project
              </Breadcrumb.Item>
              {crumbs.length > 0 && <Breadcrumb.Separator />}
            </>
          )}
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.id}>
              {index !== 0 && (
                <Breadcrumb.Separator className="hidden sm:block" />
              )}
              {index === crumbs.length - 1 ? (
                <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
              ) : (
                <Breadcrumb.Item className="hidden sm:block">
                  {crumb.url ? (
                    <Breadcrumb.Link asChild>
                      <Link to={crumb.url}>{crumb.label}</Link>
                    </Breadcrumb.Link>
                  ) : (
                    crumb.label
                  )}
                </Breadcrumb.Item>
              )}
            </Fragment>
          ))}
        </Breadcrumb.List>
      </Breadcrumb>
    </div>
  );
}
