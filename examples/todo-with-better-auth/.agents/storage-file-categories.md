# File Storage Categories

This project uses the `storage` plugin to manage file uploads. Files are organized into **categories**, each with its own size limit, allowed MIME types, and upload authorization rules.

## Configuring categories

Use the Baseplate MCP `configure-plugin` tool with `pluginKey: 'storage'` to add or edit entries under `fileCategories`. Each category has:

- **name** — unique identifier for the category (e.g. `avatar`, `attachment`)
- **maxFileSizeMb** — maximum upload size in megabytes
- **allowedMimeTypes** — MIME types accepted for this category
- **adapterRef** — which storage adapter (from `s3Adapters`) stores files in this category
- **authorize.uploadRoles** — roles allowed to upload files to this category
- **disableAutoCleanup** — set to `true` to keep orphaned files instead of automatically deleting them when no longer referenced

## Referencing categories from models

A model field connects to a file category through a file transformer: add a `file`-typed relation on the model, then a service transformer with `type: 'file'` that references that relation and the category. This wires up presigned uploads and cleanup for that field automatically.

Run `sync-project` after committing changes to regenerate the storage module and upload components.
