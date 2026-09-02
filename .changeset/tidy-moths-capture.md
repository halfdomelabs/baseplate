---
'@baseplate-dev/plugin-email': patch
---

Backends now generate an in-memory capture email adapter, so a test can assert on the message a provider would have received — its rendered subject, body and headers — instead of mocking the send call.
