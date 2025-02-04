/**
 * Typed event emitter interface.
 *
 * @template T - Mapping of event names to payload types.
 */
export interface TypedEventEmitter<T extends object> {
  /**
   * Registers a listener for an event.
   *
   * @template K - The event name.
   * @param {K} eventName - Name of the event.
   * @param {(payload: T[K]) => void} listener - Callback invoked with the event payload.
   * @returns {() => void} Function to unregister the listener.
   */
  on<K extends keyof T>(
    eventName: K,
    listener: (payload: T[K]) => void,
  ): () => void;

  /**
   * Emits an event with the given payload.
   *
   * @template K - The event name.
   * @param {K} eventName - Name of the event.
   * @param {T[K]} payload - Payload for the event.
   */
  emit<K extends keyof T>(eventName: K, payload: T[K]): void;

  /**
   * Removes all registered event listeners.
   *
   * Note: This is dangerous and should only be used in testing.
   */
  clear(): void;
}

/**
 * Creates a typed event emitter that supports event listening and emitting.
 *
 * @template T - Mapping of event names to payload types.
 * @returns An emitter with `on`, `emit`, and `clear` methods.
 */
export function createTypedEventEmitter<
  T extends object,
>(): TypedEventEmitter<T> {
  const listenerMap = new Map<keyof T, ((payload: unknown) => void)[]>();

  return {
    on(eventName, listener) {
      const existingListeners = listenerMap.get(eventName) ?? [];
      listenerMap.set(eventName, [
        ...existingListeners,
        listener as (payload: unknown) => void,
      ]);

      // Returns a function that unregisters this listener.
      return () => {
        const updatedListeners = (listenerMap.get(eventName) ?? []).filter(
          (l) => l !== listener,
        );
        if (updatedListeners.length > 0) {
          listenerMap.set(eventName, updatedListeners);
        } else {
          listenerMap.delete(eventName);
        }
      };
    },
    emit(eventName, payload) {
      const listeners = listenerMap.get(eventName) ?? [];
      for (const listener of listeners) {
        listener(payload);
      }
    },
    clear() {
      listenerMap.clear();
    },
  };
}
