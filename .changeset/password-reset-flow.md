---
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
---

Add OWASP-compliant password reset flow

- **Backend**: Password reset service with secure token generation (SHA-256 hashed, single-use, 1-hour expiry), rate limiting (per-IP, per-email, global), and session invalidation on reset
- **Backend**: GraphQL mutations for requesting reset, validating tokens, and completing reset
- **Backend**: `PASSWORD_RESET_DOMAIN` config field for constructing reset email links
- **Frontend**: Forgot password and reset password pages with proper error handling
- **Frontend**: Shared auth constants file for password validation limits
- **Email**: Password changed confirmation email template
- **Email**: Added `sendEmail` as a project export from the email module
