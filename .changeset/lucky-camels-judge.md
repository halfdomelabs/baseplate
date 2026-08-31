---
'@baseplate-dev/plugin-auth': patch
---

Simultaneous guesses at the same verification code no longer surface a Prisma error when one of them spends the last attempt and discards the code first; the losing caller now gets the same rejection as every other invalid guess.
