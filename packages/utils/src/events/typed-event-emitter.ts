/**
 * Class providing typed event emitter functionality.
 *
 * @template T - Mapping of event names to payload types.
 */
export class TypedEventEmitter<T extends object> {
  private listenerMap = new Map<keyof T, ((payload: T[keyof T]) => void)[]>();

  /**
   * Abort controller for the event emitter to terminate all async generator listeners.
   */
  private eventEmitterAbortController = new AbortController();

  /**
   * Registers a listener for an event.
   *
   * @template K - The event name.
   * @param eventName - Name of the event.
   * @param listener - Callback invoked with the event payload.
   * @param options - Options for the listener.
   * @returns Function to unregister the listener.
   */
  on<K extends keyof T>(
    eventName: K,
    listener: (payload: T[K]) => void,
    options?: {
      /**
       * Abort signal for the listener. If the signal is aborted, the listener will be removed.
       */
      signal?: AbortSignal;
    },
  ): () => void {
    const { signal } = options ?? {};
    const existingListeners = this.listenerMap.get(eventName) ?? [];
    this.listenerMap.set(eventName, [
      ...existingListeners,
      listener as (payload: T[keyof T]) => void,
    ]);

    // Returns a function that unregisters this listener.
    const unregister = (): void => {
      const updatedListeners = (this.listenerMap.get(eventName) ?? []).filter(
        (l) => l !== listener,
      );
      if (updatedListeners.length > 0) {
        this.listenerMap.set(eventName, updatedListeners);
      } else {
        this.listenerMap.delete(eventName);
      }
    };

    signal?.addEventListener('abort', unregister, {
      once: true,
    });

    return unregister;
  }

  /**
   * Creates an async generator for an event.
   *
   * @template K - The event name.
   * @param eventName - Name of the event.
   * @param options - Additional options.
   * @returns An async generator yielding event payloads.
   */
  async *onAsync<K extends keyof T>(
    eventName: K,
    options: { signal?: AbortSignal },
  ): AsyncGenerator<T[K]> {
    // Create a queue to store events when consumer isn't ready
    const queue: T[K][] = [];
    let pendingNext: ((value: T[K]) => void) | undefined;
    let isDone = false;

    // Return early if the signal is aborted
    const eventEmitterAbortSignal = this.eventEmitterAbortController.signal;
    if (options.signal?.aborted || eventEmitterAbortSignal.aborted) return;

    function abortHandler(): void {
      isDone = true;
      // trigger dummy event to unblock the consumer
      pendingNext?.(undefined as T[K]);
    }

    options.signal?.addEventListener('abort', abortHandler, { once: true });
    eventEmitterAbortSignal.addEventListener('abort', abortHandler, {
      once: true,
    });

    this.on(
      eventName,
      (payload) => {
        if (pendingNext) {
          pendingNext(payload);
          pendingNext = undefined;
        } else {
          queue.push(payload);
        }
      },
      { signal: options.signal },
    );

    // Keep yielding events until done
    while (!isDone) {
      const payload =
        queue.shift() ??
        (await new Promise<T[K]>((resolve) => {
          pendingNext = resolve;
        }));

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive since isDone is set to true in the abort handler
      if (isDone) break;

      yield payload;
    }
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
    this.eventEmitterAbortController.abort();
  }

  /**
   * Aborts the event emitter to terminate all async generator listeners.
   */
  protected abortEventEmitter(): void {
    this.eventEmitterAbortController.abort();
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
