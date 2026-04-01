---
'@baseplate-dev/plugin-auth': patch
---

Reduce password rate limit aggressiveness (15 attempts/hour for IP, 10 consecutive fails/hour), reset login rate limits after successful password reset, and improve error messages to suggest password reset when rate limited
