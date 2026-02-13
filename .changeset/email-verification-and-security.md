---
'@baseplate-dev/plugin-auth': patch
---

Add email verification flow and security hardening

- **Backend**: Split-token auth verification service (`auth-verification.service.ts`) with constant-time comparison, SHA-256 hashed verifiers, and automatic cleanup
- **Backend**: Email verification service with rate limiting (per-user: 3/20min, per-IP: 10/hr for both request and verify endpoints)
- **Backend**: Email verification GraphQL mutations (`requestEmailVerification`, `verifyEmail`)
- **Backend**: Anti-enumeration: unified `invalid-credentials` error for login (prevents email/password oracle)
- **Frontend**: Email verification page with auto-verify, resend, and status states
- **Frontend**: Updated login error handling for unified credential errors
