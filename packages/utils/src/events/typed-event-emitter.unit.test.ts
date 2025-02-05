import { describe, expect, it, vi } from 'vitest';

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
});
