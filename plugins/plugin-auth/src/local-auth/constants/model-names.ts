export const LOCAL_AUTH_MODELS = {
  /**
   * Model name for the user model that represents a user in the local auth system.
   */
  user: 'User',
  /**
   * Model name for the user account model that represents a user account in the local auth system, e.g. email / password.
   */
  userAccount: 'UserAccount',
  /**
   * Model name for the user role model that represents a user role in the local auth system.
   */
  userRole: 'UserRole',
  /**
   * Model name for the user session model that represents a user session in the local auth system.
   */
  userSession: 'UserSession',
  /**
   * Model name for the auth verification model used for secure token-based verification flows (e.g. password reset, email verification).
   */
  authVerification: 'AuthVerification',
} as const;
