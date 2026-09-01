---
'@baseplate-dev/plugin-auth': patch
---

Guesses at an emailed verification code are now counted before the code is compared, so a burst of concurrent guesses can no longer exceed the code's attempt budget, and simultaneous guesses no longer surface a Prisma error or discard a code another request is still redeeming. Every validation spends an attempt, including a correct one.
