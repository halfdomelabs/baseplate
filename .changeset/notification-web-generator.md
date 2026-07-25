---
'@baseplate-dev/plugin-notifications': patch
---

Added a `notification-web` generator that produces the notification bell and feed panel (previously hand-authored per project) and mounts it into the generated admin layout header automatically, so any project with the notifications plugin gets a working frontend without manual wiring. The bell and panel now match the updated design: an avatar per row (actor initials or a generic icon), an unread-count badge, and an optional `viewAllHref` link to a full notifications page.
