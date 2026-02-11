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
