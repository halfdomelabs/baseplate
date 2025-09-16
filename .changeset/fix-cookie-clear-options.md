---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-auth': patch
---

Fix cookie clearing by passing options to ensure secure cookies are properly cleared. The CookieStore interface now accepts optional CookieSerializeOptions when clearing cookies, and the auth module template now passes COOKIE_OPTIONS when clearing session cookies to maintain consistency with cookie creation.
