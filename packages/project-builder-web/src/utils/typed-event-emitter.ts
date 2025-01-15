// Simple typed event emitter
type TypeConfig = Record<string, unknown>;

interface TypedEventEmitter<T extends TypeConfig> {
  on<K extends keyof T>(
    eventName: K,
    listener: (payload: T[K]) => void,
  ): () => void;
  emit<K extends keyof T>(eventName: K, payload: T[K]): void;
}

/**
 * Creates a typed event emitter that allows simple listening and emission of events
 *
 * @returns TypedEventEmitter that allows you to listen to events and emit them
 */
export function createTypedEventEmitter<
  T extends TypeConfig,
>(): TypedEventEmitter<T> {
  const listenerMap = new Map<keyof T, ((payload: unknown) => void)[]>();

  return {
    on(eventName, listener) {
      const existingListeners = listenerMap.get(eventName) ?? [];
      listenerMap.set(eventName, [
        ...existingListeners,
        listener as (payload: unknown) => void,
      ]);

      return () => {
        listenerMap.set(
          eventName,
          listenerMap.get(eventName)?.filter((l) => l !== listener) ?? [],
        );
      };
    },
    emit(eventName, payload) {
      const listeners = listenerMap.get(eventName) ?? [];
      for (const listener of listeners) listener(payload);
    },
  };
}
