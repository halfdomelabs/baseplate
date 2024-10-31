const LOCAL_STORAGE_KEY = 'is-storybook-dark-mode-enabled';

export const isDarkModeEnabled = () =>
  Boolean(localStorage.getItem(LOCAL_STORAGE_KEY));

export const setDarkModeEnabled = (enabled: boolean) =>
  { enabled
    ? localStorage.setItem(LOCAL_STORAGE_KEY, '1')
    : localStorage.removeItem(LOCAL_STORAGE_KEY); };
