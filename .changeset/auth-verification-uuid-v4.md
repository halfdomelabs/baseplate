---
'@baseplate-dev/plugin-auth': patch
---

Use UUIDv4 (gen_random_uuid) instead of UUIDv7 for AuthVerification/Verification model IDs, since these are short-lived security tokens where timestamp leakage is undesirable and sortability provides no benefit
