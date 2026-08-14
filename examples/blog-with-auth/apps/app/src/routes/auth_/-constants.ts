/**
 * Minimum password length (matches backend validation)
 */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Maximum password length (matches backend validation)
 * Also used for email and token validation to prevent DoS attacks
 */
export const PASSWORD_MAX_LENGTH = 255;
