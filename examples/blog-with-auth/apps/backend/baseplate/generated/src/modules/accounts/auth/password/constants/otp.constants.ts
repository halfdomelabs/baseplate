/**
 * Number of digits in an emailed sign-in code.
 *
 * Six is the length users expect from a one-time code. At this length the
 * keyspace alone is not much of a barrier, so what keeps guessing impractical
 * is the attempt budget below, the endpoint rate limits, and the short expiry.
 */
export const EMAIL_OTP_LENGTH = 6;

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
