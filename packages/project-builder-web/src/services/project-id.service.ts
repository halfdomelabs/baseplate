/**
 * Set the projectId in localStorage
 */
export function setLocalStorageProjectId(value: string | null): void {
  if (value) {
    localStorage.setItem('projectId', value);
  } else {
    localStorage.removeItem('projectId');
  }
}

/**
 * Get the projectId from localStorage, or from the URL query parameters if it's not set in localStorage
 */
export function getLocalStorageProjectId(): string | null {
  const projectId = localStorage.getItem('projectId');
  if (projectId) {
    return projectId;
  }
  // Check if the URL has a projectId query parameter and use that if so
  if (globalThis.location.search.includes('projectId=')) {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const projectId = urlParams.get('projectId');
    if (projectId) {
      setLocalStorageProjectId(projectId);
      return projectId;
    }
  }
  return null;
}
