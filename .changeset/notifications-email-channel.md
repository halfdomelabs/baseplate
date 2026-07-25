---
'@baseplate-dev/plugin-notifications': patch
'@baseplate-dev/plugin-email': patch
---

The notifications plugin now delivers an email channel alongside in-app notifications: when the email plugin is enabled, notification types can opt into email by listing `email` in their `channels`, and a branded notification email is rendered at delivery time through the transactional email library. The plugin also surfaces a clear error when enabled on a backend app that has GraphQL subscriptions disabled, and the transactional email library now exports its `Link` component for use in custom emails.
