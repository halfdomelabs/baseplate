import React, { createContext, ReactNode } from 'react';

interface ModelsFooterContentContextType {
  content: ReactNode;
  setContent: React.Dispatch<React.SetStateAction<ReactNode>>;
}

const ModelsFooterContentContext =
  createContext<ModelsFooterContentContextType>({
    content: null,
    setContent: () => {
      throw new Error('ModelsFooterContentContext not implemented');
    },
  });

interface ModelsFooterContentProviderProps {
  children: ReactNode;
}

export const ModelsFooterContentProvider: React.FC<
  ModelsFooterContentProviderProps
> = ({ children }) => {
  const [content, setContent] = React.useState<ReactNode>(null);
  return (
    <ModelsFooterContentContext.Provider
      value={{
        content,
        setContent,
      }}
    >
      {children}
    </ModelsFooterContentContext.Provider>
  );
};

export default ModelsFooterContentContext;
