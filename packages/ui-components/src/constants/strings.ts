/**
 * Default strings for components that can be overriden by the ComponentStringContext.
 */
export const DEFAULT_COMPONENT_STRINGS = {
  emptyDisplayDefaultHeader: 'No items found',
  emptyDisplayDefaultContent: 'There is no content here yet.',
  errorDisplayDefaultHeader: 'Sorry, something went wrong',
  errorDisplayDefaultContent: 'We encountered an error showing this page.',
  buttonCancel: 'Cancel',
  buttonConfirm: 'Confirm',
};

export type ComponentStrings = typeof DEFAULT_COMPONENT_STRINGS;
