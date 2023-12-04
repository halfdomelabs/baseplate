import { ParsedModel } from '@halfdomelabs/project-builder-lib';
import { createContext, useContext } from 'react';

interface ModelEditContextType {
  onDelete?: () => void;
  isModelNew: boolean;
  model?: ParsedModel;
}

export const ModelEditContext = createContext<ModelEditContextType>({
  isModelNew: true,
});

export const useModelEditContext = (): ModelEditContextType =>
  useContext(ModelEditContext);
