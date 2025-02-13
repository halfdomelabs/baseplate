import type { InferCustomEventPayload } from 'vite';

/**
 * Subscribes to a Vite hot reload event.
 *
 * @param name - The name of the event to subscribe to.
 * @param callback - The callback to call when the event is triggered.
 * @returns A function to unsubscribe from the event.
 */
export function subscribeToViteHotReloadEvent<T extends string>(
  name: T,
  callback: (payload: InferCustomEventPayload<T>) => void,
): () => void {
  if (!import.meta.hot) {
    return () => {
      /* no-op */
    };
  }
  import.meta.hot.on(name, callback);
  return () => {
    import.meta.hot?.off(name, callback);
  };
}
