import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Breadcrumb, Button } from '@halfdomelabs/ui-components';
import { upperFirst } from 'lodash';
import { Fragment, useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { Link, useMatches } from 'react-router-dom';

import { ProjectChooserDialog } from '../components/ProjectChooserDialog';
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
  const [showProjectChooser, setShowProjectChooser] = useState(false);
  const projectsLength = useProjects((state) => state.projects.length);

  return (
    <Breadcrumb>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <div className="flex items-center">
            <div>{upperFirst(definitionContainer.definition.name)} project</div>
            {projectsLength > 1 && (
              <Button
                onClick={() => setShowProjectChooser(true)}
                size="icon"
                variant="ghost"
                className="-mr-2"
              >
                <Button.Icon icon={MdKeyboardArrowDown} />
              </Button>
            )}
          </div>
        </Breadcrumb.Item>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.id}>
            <Breadcrumb.Separator />
            {index === crumbs.length - 1 ? (
              <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
            ) : (
              <Breadcrumb.Item>
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
        <ProjectChooserDialog
          isOpen={showProjectChooser}
          onClose={() => setShowProjectChooser(false)}
        />
      </Breadcrumb.List>
    </Breadcrumb>
  );
}
