import createPersistedState from 'use-persisted-state';

export const useProjectIdState = createPersistedState<string | null>(
  'projectId'
);
