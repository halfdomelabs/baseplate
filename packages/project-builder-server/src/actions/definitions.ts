/**
 * The full service action definitions, including their handlers.
 *
 * @remarks Importing this module loads every action handler, which pulls in
 * ts-morph and the generator packages. Import it lazily (inside a command
 * handler) rather than at module scope, and prefer
 * `./action-metadata-manifest.js` when only names and schemas are needed.
 */
export * from './definition/index.js';
export * from './diff/index.js';
export * from './generators/index.js';
export * from './snapshot/index.js';
export * from './sync/index.js';
export * from './template-extractor/index.js';
export * from './templates/index.js';
export * from './test-project/index.js';
