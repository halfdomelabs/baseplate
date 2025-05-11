import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TypedEventEmitter } from './typed-event-emitter.js';

import { createTypedEventEmitter } from './typed-event-emitter.js';

// Type definition for test events
interface TestEvents {
  stringEvent: string;
  numberEvent: number;
  objectEvent: { id: string; value: number };
}

describe('TypedEventEmitter', () => {
  it('should emit events to registered listeners', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener = vi.fn();

    // act
    emitter.on('stringEvent', listener);
    emitter.emit('stringEvent', 'test');

    // assert
    expect(listener).toHaveBeenCalledWith('test');
  });

  it('should support multiple listeners for the same event', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // act
    emitter.on('numberEvent', listener1);
    emitter.on('numberEvent', listener2);
    emitter.emit('numberEvent', 42);

    // assert
    expect(listener1).toHaveBeenCalledWith(42);
    expect(listener2).toHaveBeenCalledWith(42);
  });

  it('should allow unregistering specific listeners', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // act
    emitter.on('numberEvent', listener1);
    const unsubscribe = emitter.on('numberEvent', listener2);

    unsubscribe();
    emitter.emit('numberEvent', 42);

    // assert
    expect(listener1).toHaveBeenCalledWith(42);
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should handle complex object payloads', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    const payload = { id: 'test-id', value: 123 };

    // act
    emitter.on('objectEvent', listener);
    emitter.emit('objectEvent', payload);

    // assert
    expect(listener).toHaveBeenCalledWith(payload);
  });

  it('should do nothing when emitting to non-existent listeners', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listenerMap = new Map();

    // act
    emitter.emit('stringEvent', 'test');

    // assert
    expect(() => {
      emitter.emit('stringEvent', 'test');
    }).not.toThrow();
    expect(listenerMap.size).toBe(0);
  });

  it('should clear all listeners', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // act
    emitter.on('stringEvent', listener1);
    emitter.on('numberEvent', listener2);

    emitter.clearListeners();

    emitter.emit('stringEvent', 'test');
    emitter.emit('numberEvent', 42);

    // assert
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).not.toHaveBeenCalled();
  });

  it('should remove listener when AbortSignal is aborted', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener = vi.fn();
    const controller = new AbortController();

    // act
    emitter.on('stringEvent', listener, { signal: controller.signal });
    controller.abort();
    emitter.emit('stringEvent', 'test');

    // assert
    expect(listener).not.toHaveBeenCalled();
  });

  it('should keep other listeners when one listener is aborted', () => {
    // arrange
    const emitter = createTypedEventEmitter<TestEvents>();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const controller = new AbortController();

    // act
    emitter.on('stringEvent', listener1, { signal: controller.signal });
    emitter.on('stringEvent', listener2);
    controller.abort();
    emitter.emit('stringEvent', 'test');

    // assert
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledWith('test');
  });
});

describe('TypedEventEmitter onAsync', () => {
  let emitter: TypedEventEmitter<TestEvents>;
  let abortController: AbortController;

  beforeEach(() => {
    emitter = createTypedEventEmitter<TestEvents>();
    abortController = new AbortController();
  });

  afterEach(() => {
    // Clean up resources
    abortController.abort();
  });

  it('should yield events as they arrive', async () => {
    // Arrange
    const generator = emitter.onAsync('stringEvent', {
      signal: abortController.signal,
    });

    // Schedule event emission after a short delay
    setImmediate(() => {
      emitter.emit('stringEvent', 'hello');
      setImmediate(() => {
        abortController.abort();
      });
    });

    // Act & Assert
    const result = await generator.next();
    expect(result.value).toBe('hello');
    expect(result.done).toBe(false);

    // Generator should complete after abort
    const done = await generator.next();
    expect(done.done).toBe(true);
  });

  it('should process events in the correct order when queued', async () => {
    // Arrange
    const results: string[] = [];
    const generator = emitter.onAsync('stringEvent', {
      signal: abortController.signal,
    });

    // Act: Emit multiple events before starting to consume
    setImmediate(() => {
      emitter.emit('stringEvent', 'first');
      emitter.emit('stringEvent', 'second');
      emitter.emit('stringEvent', 'third');
    });

    // Consume the events
    for await (const message of generator) {
      results.push(message);
      if (results.length === 3) {
        abortController.abort();
        break;
      }
    }

    // Assert
    expect(results).toEqual(['first', 'second', 'third']);
  });

  it('should stop yielding events when aborted', async () => {
    // Arrange
    const generator = emitter.onAsync('stringEvent', {
      signal: abortController.signal,
    });
    const yielded: string[] = [];

    // Schedule an abort followed by more events
    setImmediate(() => {
      abortController.abort();
      // These events should not be yielded
      emitter.emit('stringEvent', 'after-abort-1');
      emitter.emit('stringEvent', 'after-abort-2');
    });

    // Act: Collect all yielded values
    for await (const message of generator) {
      yielded.push(message);
    }

    // Assert: No events should be processed after abort
    expect(yielded).toEqual([]);

    // Check the generator is done
    const result = await generator.next();
    expect(result.done).toBe(true);
  });

  it('should stop yielding events when the event emitter is aborted', async () => {
    // Arrange
    const generator = emitter.onAsync('stringEvent', {
      signal: abortController.signal,
    });
    const yielded: string[] = [];

    // Schedule an abort followed by more events
    setImmediate(() => {
      emitter.clearListeners();
      // These events should not be yielded
      emitter.emit('stringEvent', 'after-abort-1');
      emitter.emit('stringEvent', 'after-abort-2');
    });

    // Act: Collect all yielded values
    for await (const message of generator) {
      yielded.push(message);
    }

    // Assert: No events should be processed after abort
    expect(yielded).toEqual([]);

    // Check the generator is done
    const result = await generator.next();
    expect(result.done).toBe(true);
  });
});
