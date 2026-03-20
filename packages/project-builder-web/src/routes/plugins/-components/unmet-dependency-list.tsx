import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@baseplate-dev/ui-components';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export interface UnmetPluginDependency {
  metadata: PluginMetadataWithPaths;
  hasWebConfig: boolean;
}

interface UnmetDependencyListProps {
  dependencies: UnmetPluginDependency[];
  /** Called when a "Configure" link is clicked (e.g. to close a parent dialog). */
  onNavigate?: () => void;
}

export function UnmetDependencyList({
  dependencies,
  onNavigate,
}: UnmetDependencyListProps): React.JSX.Element {
  const {
    saveDefinitionWithFeedbackSync,
    definitionContainer,
    isSavingDefinition,
  } = useProjectDefinition();
  const [enablingKey, setEnablingKey] = useState<string | null>(null);

  function handleEnable(dep: UnmetPluginDependency): void {
    setEnablingKey(dep.metadata.key);
    saveDefinitionWithFeedbackSync(
      (draft) => {
        PluginUtils.setPluginConfig(
          draft,
          dep.metadata,
          {},
          definitionContainer,
        );
      },
      {
        successMessage: `Enabled ${dep.metadata.displayName}!`,
        onSuccess: () => {
          setEnablingKey(null);
        },
      },
    );
  }

  return (
    <ItemGroup>
      {dependencies.map((dep) => (
        <Item key={dep.metadata.key} variant="outline">
          <ItemContent>
            <ItemTitle>{dep.metadata.displayName}</ItemTitle>
            <ItemDescription>{dep.metadata.description}</ItemDescription>
          </ItemContent>
          <ItemActions>
            {dep.hasWebConfig ? (
              <Link
                to="/plugins/edit/$key"
                params={{ key: dep.metadata.key }}
                onClick={onNavigate}
              >
                <Button variant="secondary" size="sm">
                  Configure
                </Button>
              </Link>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                disabled={isSavingDefinition || enablingKey !== null}
                onClick={() => {
                  handleEnable(dep);
                }}
              >
                {enablingKey === dep.metadata.key ? 'Enabling...' : 'Enable'}
              </Button>
            )}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
