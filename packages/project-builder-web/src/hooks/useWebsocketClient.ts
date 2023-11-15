import React from 'react';

import { ProjectWebsocketClient } from 'src/services/remote';

export interface UseWebsocketClientResult {
  websocketClient: ProjectWebsocketClient | undefined | null;
}

export const WebsocketClientContext =
  React.createContext<UseWebsocketClientResult | null>(null);

export function useWebsocketClient(): UseWebsocketClientResult {
  const result = React.useContext(WebsocketClientContext);
  if (!result) {
    throw new Error(
      `useWebsocketCLient must be used within a <WebsocketClientContext>`
    );
  }
  return result;
}
