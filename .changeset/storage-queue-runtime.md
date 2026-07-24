---
'@baseplate-dev/plugin-storage': patch
---

The storage plugin's clean-unused-files job now registers with the app runtime's queue service instead of the removed standalone queue-registry mechanism.
