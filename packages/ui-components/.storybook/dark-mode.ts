const LOCAL_STORAGE_KEY = 'is-storybook-dark-mode-enabled';

export const isDarkModeEnabled = (): boolean =>
  Boolean(localStorage.getItem(LOCAL_STORAGE_KEY));

export const setDarkModeEnabled = (enabled: boolean): void => {
  if (enabled) {
    localStorage.setItem(LOCAL_STORAGE_KEY, '1');
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};
