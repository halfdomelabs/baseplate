export function getLocalStorageProjectId(): string | null {
  return localStorage.getItem('projectId');
}

export function setLocalStorageProjectId(value: string | null): void {
  if (value) {
    localStorage.setItem('projectId', value);
  } else {
    localStorage.removeItem('projectId');
  }
}
