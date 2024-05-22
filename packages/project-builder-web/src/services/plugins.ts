export function getPluginStaticUrl(
  projectId: string,
  pluginId: string,
  path: string,
): string {
  return `/api/plugins/${projectId}/${pluginId}/static/${path}`;
}
