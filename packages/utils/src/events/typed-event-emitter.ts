/**
 * Class providing typed event emitter functionality.
 *
 * @template T - Mapping of event names to payload types.
 */
export class TypedEventEmitter<T extends object> {
  private listenerMap = new Map<keyof T, ((payload: T[keyof T]) => void)[]>();

  /**
   * Registers a listener for an event.
   *
   * @template K - The event name.
   * @param eventName - Name of the event.
   * @param listener - Callback invoked with the event payload.
   * @returns Function to unregister the listener.
   */
  on<K extends keyof T>(
    eventName: K,
    listener: (payload: T[K]) => void,
  ): () => void {
    const existingListeners = this.listenerMap.get(eventName) ?? [];
    this.listenerMap.set(eventName, [
      ...existingListeners,
      listener as (payload: T[keyof T]) => void,
    ]);

    // Returns a function that unregisters this listener.
    return () => {
      const updatedListeners = (this.listenerMap.get(eventName) ?? []).filter(
        (l) => l !== listener,
      );
      if (updatedListeners.length > 0) {
        this.listenerMap.set(eventName, updatedListeners);
      } else {
        this.listenerMap.delete(eventName);
      }
    };
  }

  /**
   * Emits an event with the given payload.
   *
   * @template K - The event name.
   * @param eventName - Name of the event.
   * @param payload - Payload for the event.
   */
  emit<K extends keyof T>(eventName: K, payload: T[K]): void {
    const listeners = this.listenerMap.get(eventName) ?? [];
    for (const listener of listeners) {
      listener(payload);
    }
  }

  /**
   * Removes all registered event listeners.
   *
   * Note: This is dangerous and should only be used in testing.
   */
  clearListeners(): void {
    this.listenerMap.clear();
  }
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
  return new TypedEventEmitter<T>();
}
