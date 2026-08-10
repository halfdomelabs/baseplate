# Notification Topics

This project uses the `notifications` plugin to deliver in-app and (if the email plugin is enabled) email notifications with per-user preferences.

## Configuring topics

Use the Baseplate MCP `configure-plugin` tool with `pluginKey: 'notifications'` to add or edit entries under `topics`. A topic is the unit users express a preference over. Each topic has:

- **key** — camelCase identifier stored on preference rows and referenced by `defineNotificationType`
- **label** — display name shown in the preferences UI
- **description** — optional helper copy for the preferences UI
- **defaults** — per-channel default mode (`off`, `immediate`, or `digest`) used when a user has no preference row for this topic

Every project starts with a `general` topic; add more when notification types need independent user control.

## Defining notification types

Notification types are NOT configured through the project definition — they're declared in application code with `defineNotificationType` (generated into the notification module), specifying the type's `key`, `version`, `topic` (one of the keys above), `paramsSchema`, allowed `channels`, and a `render` function. A type with no `topic` consults no preference and cannot be suppressed by the user.

Run `sync-project` after committing topic changes to regenerate the notification module.
