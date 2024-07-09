import { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';
import type { ClientVersionInfo } from '@halfdomelabs/project-builder-server';

import { client } from './api';
import { config as envConfig } from './config';
import PREVIEW_APP from './preview-app.json';

const IS_PREVIEW = envConfig.VITE_PREVIEW_MODE;

export interface Project {
  id: string;
  name: string;
  directory: string;
}

export async function getProjects(): Promise<Project[]> {
  if (IS_PREVIEW) {
    return [
      {
        id: 'preview-project',
        name: 'Preview Project',
        directory: '~/preview-project',
      },
    ];
  }
  const response = await client.projects.list.query();
  return response;
}

export async function getVersionInfo(): Promise<ClientVersionInfo> {
  if (IS_PREVIEW) {
    return {
      version: 'preview',
      featureFlags: [],
    };
  }
  const response = await client.version.query();
  return response;
}

export interface FilePayload {
  contents: string;
  lastModifiedAt: string;
}

export async function downloadProjectDefinition(
  id: string,
): Promise<FilePayload | null> {
  if (IS_PREVIEW) {
    return {
      lastModifiedAt: new Date().toISOString(),
      contents: JSON.stringify(PREVIEW_APP),
    };
  }
  const response = await client.projects.get.query({ id });
  return response.file;
}

export async function getPluginsMetadata(
  id: string,
): Promise<PluginMetadataWithPaths[]> {
  if (IS_PREVIEW) {
    return [];
  }
  return client.plugins.getAvailablePlugins.mutate({ id });
}

type WriteResult =
  | { type: 'success'; lastModifiedAt: string }
  | { type: 'modified-more-recently' };

export async function uploadProjectDefinition(
  id: string,
  contents: FilePayload,
): Promise<WriteResult> {
  if (IS_PREVIEW) {
    return { type: 'success', lastModifiedAt: new Date().toISOString() };
  }
  const response = await client.projects.writeConfig.mutate({
    id,
    contents: contents.contents,
    lastModifiedAt: contents.lastModifiedAt,
  });

  return response.result;
}

export async function startSync(id: string): Promise<void> {
  if (IS_PREVIEW) {
    return;
  }
  await client.sync.startSync.mutate({ id });
}
