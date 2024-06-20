import { PluginUtils, webConfigSpec } from '@halfdomelabs/project-builder-lib';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { loadPluginImplementationStoreWithNewPlugin } from './utils';
import NotFoundPage from '../NotFound.page';
import { useProjectDefinition } from '@src/hooks/useProjectDefinition';

export function PluginConfigPage(): JSX.Element {
  const { definitionContainer, pluginContainer, schemaParserContext } =
    useProjectDefinition();
  const { id } = useParams<'id'>();

  const pluginDefinition = PluginUtils.byId(
    definitionContainer.definition,
    id ?? '',
  );

  const Container = useMemo(() => {
    if (!id) {
      return;
    }

    const pluginSpec = pluginContainer.getPluginSpec(webConfigSpec);
    const webConfigComponent = pluginSpec.getWebConfigComponent(id);
    if (webConfigComponent) {
      return webConfigComponent;
    }
    // it may not be activated yet
    const plugin = schemaParserContext.pluginStore.availablePlugins.find(
      (p) => p.metadata.id === id,
    );
    if (!plugin) {
      return;
    }
    const newPluginContainer = loadPluginImplementationStoreWithNewPlugin(
      schemaParserContext.pluginStore,
      plugin.metadata,
      definitionContainer.definition,
    );

    return newPluginContainer
      .getPluginSpec(webConfigSpec)
      .getWebConfigComponent(id);
  }, [id, schemaParserContext, definitionContainer, pluginContainer]);

  if (!Container) {
    return <NotFoundPage />;
  }

  return <Container plugin={pluginDefinition} />;
}
