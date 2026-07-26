---
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/project-builder-common': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-email': patch
---

Added a native notification plugin (`@baseplate-dev/plugin-notifications`). Notification types are declared through `AppModule.notificationTypes` and delivered in-app over GraphQL subscriptions, or by email when the email plugin is enabled and a type lists `email` in its `channels`, rendering a branded notification email through the transactional email library. A `notification-web` generator provides a notification bell and feed panel with avatars, unread badges, and an optional "View All" link, enabled per web app and mounted through a new extension point in the generated admin layout header — the slot renders empty when no plugin contributes to it, so existing generated apps are unaffected. The plugin surfaces a clear error when enabled on a backend app that has GraphQL subscriptions disabled.
