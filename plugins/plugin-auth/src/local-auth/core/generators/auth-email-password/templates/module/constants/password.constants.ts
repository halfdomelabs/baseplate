// @ts-nocheck

/**
 * Minimum password length
 */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Maximum password length (prevents DoS attacks via excessive bcrypt/argon2 computation)
 */
export const PASSWORD_MAX_LENGTH = 255;

/**
 * Password reset token expiration time in seconds (1 hour per OWASP recommendations)
 */
export const PASSWORD_RESET_TOKEN_EXPIRY_SEC = 60 * 60;

/**
 * Email verification token expiration time in seconds (24 hours)
 */
export const EMAIL_VERIFICATION_TOKEN_EXPIRY_SEC = 60 * 60 * 24;

/**
 * Invite token expiration time in seconds (7 days, since invites are
 * admin-initiated and not tied to a login attempt in progress)
 */
export const INVITE_TOKEN_EXPIRY_SEC = 60 * 60 * 24 * 7;

/**
 * Exact length of an auth verification token (password reset, invite, etc.):
 * two base64url-encoded 16-byte values (22 chars each) joined by a `.`. See
 * `generateSplitToken` in `auth-verification.service.ts`.
 */
export const AUTH_TOKEN_LENGTH = 45;
