export function getPluginStaticUrl(
  projectId: string,
  pluginKey: string,
  path: string,
): string {
  return `/api/plugins/${projectId}/${pluginKey}/static/${path}`;
}
