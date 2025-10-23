/**
 * Defines the duration of a user session before it expires, in seconds.
 */
export const USER_SESSION_DURATION_SEC = 14 * 24 * 60 * 60; // 14 days

/**
 * Defines the duration after which a user session should be renewed, in seconds.
 */
export const USER_SESSION_RENEWAL_THRESHOLD_SEC = 1 * 24 * 60 * 60; // 1 day

/**
 * Sets the maximum possible lifespan of a user session, in seconds, including renewals.
 *
 * A value of 0 allows the session to persist indefinitely, provided it is renewed
 * before the session expiration.
 */
export const USER_SESSION_MAX_LIFETIME_SEC = 0 as number;
