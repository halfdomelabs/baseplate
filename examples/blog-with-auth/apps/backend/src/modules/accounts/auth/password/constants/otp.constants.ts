/**
 * Number of digits in an emailed sign-in code.
 *
 * Longer than a typical SMS code because email codes are pasted rather than
 * typed, so the extra digits cost the user nothing and shrink the odds of a
 * lucky guess within the code's attempt budget.
 */
export const EMAIL_OTP_LENGTH = 8;

/**
 * Emailed sign-in code expiration time in seconds (10 minutes)
 */
export const EMAIL_OTP_EXPIRY_SEC = 60 * 10;

/**
 * Maximum number of guesses allowed per emailed sign-in code before it is
 * discarded. A short numeric code needs its own attempt budget on top of the
 * endpoint rate limits.
 */
export const EMAIL_OTP_MAX_ATTEMPTS = 5;
