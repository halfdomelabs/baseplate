/**
 * Plugin context module for tracking the current plugin being initialized.
 *
 * Uses a simple synchronous context that works on both Node and browser platforms.
 * This is safe because plugin initialization is synchronous and single-threaded.
 */

export interface PluginContext {
  /** Full module key: "{pluginKey}/{moduleDir}/{name}" or "core/{platform}/{name}" */
  moduleKey: string;
  /** The plugin key (or "core" for core modules) */
  pluginKey: string;
}

// Simple synchronous context - works on both Node and browser
// Safe because plugin initialization is synchronous and single-threaded
let currentPluginContext: PluginContext | undefined;

/**
 * Runs a function within a plugin context.
 *
 * This sets the current plugin context for the duration of the function execution,
 * allowing nested functions to access the plugin key via `getPluginContext()`.
 *
 * @param context - The plugin context to set
 * @param fn - The function to run within the context
 * @returns The result of the function
 */
export function runInPluginContext<T>(context: PluginContext, fn: () => T): T {
  const prev = currentPluginContext;
  currentPluginContext = context;
  try {
    return fn();
  } finally {
    currentPluginContext = prev;
  }
}

/**
 * Gets the current plugin context if one exists.
 *
 * @returns The current plugin context, or undefined if not in a plugin context
 */
export function getPluginContext(): PluginContext | undefined {
  return currentPluginContext;
}
