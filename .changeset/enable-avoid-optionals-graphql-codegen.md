---
'@baseplate-dev/react-generators': patch
---

Enable `avoidOptionals` in GraphQL Code Generator config to better conform to the GraphQL spec, where nullable fields are always present in the response but may be `null` (`field: T | null` instead of `field?: T | null`)
