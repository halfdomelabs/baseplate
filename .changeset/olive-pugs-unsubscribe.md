---
'@baseplate-dev/plugin-notifications': patch
---

Notification emails now carry one-click `List-Unsubscribe` headers, backed by a signed endpoint that turns email off for the topics that email covered; a notification belonging to no topic carries no header, since the user cannot switch it off.
