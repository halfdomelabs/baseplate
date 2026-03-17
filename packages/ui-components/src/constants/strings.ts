/**
 * Default strings for components that can be overriden by the ComponentStringContext.
 */
export const DEFAULT_COMPONENT_STRINGS = {
  errorDisplayDefaultHeader: 'Sorry, something went wrong',
  errorDisplayDefaultContent: 'We encountered an error showing this page.',
  buttonCancel: 'Cancel',
  buttonConfirm: 'Confirm',
  comboboxNoResults: 'No results found',
  comboboxTypeToSearch: 'Type to search...',
  comboboxLoading: 'Loading...',
};

export type ComponentStrings = typeof DEFAULT_COMPONENT_STRINGS;
