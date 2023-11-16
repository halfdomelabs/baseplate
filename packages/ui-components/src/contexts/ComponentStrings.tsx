import React from 'react';

import {
  ComponentStrings,
  DEFAULT_COMPONENT_STRINGS,
} from '@src/constants/strings';

const ComponentStringsContext = React.createContext<ComponentStrings>(
  DEFAULT_COMPONENT_STRINGS,
);

export const useComponentStrings = (): ComponentStrings =>
  React.useContext(ComponentStringsContext);

export const ComponentStringsProvider = ComponentStringsContext.Provider;
