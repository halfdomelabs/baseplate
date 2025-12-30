// @ts-nocheck

import type { AuthUserSessionInfo } from '%authContextImports';
import type { AuthRole } from '%authRolesImports';
import type { RequestServiceContext } from '%requestServiceContextImports';
import type {
  UserSessionPayload,
  UserSessionService,
} from '%userSessionTypesImports';
import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { signObject, unsignObject } from '$cookieSigner';
import { getUserSessionCookieName } from '$sessionCookie';
import {
  USER_SESSION_DURATION_SEC,
  USER_SESSION_MAX_LIFETIME_SEC,
  USER_SESSION_RENEWAL_THRESHOLD_SEC,
} from '$userSessionConstants';
import { verifyRequestOrigin } from '$verifyRequestOrigin';
import { InvalidSessionError } from '%authContextImports';
import { DEFAULT_USER_ROLES } from '%authRolesImports';
import { config } from '%configServiceImports';
import { ForbiddenError } from '%errorHandlerServiceImports';
import { prisma } from '%prismaImports';
import { randomBytes } from 'node:crypto';

interface SessionCookieValue {
  // Session token
  token: string;
}

const COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.APP_ENVIRONMENT !== 'dev',
  maxAge: USER_SESSION_DURATION_SEC,
  path: '/',
};

/**
 * Validates the expiry of a user session and determines if it needs to be renewed.
 *
 * @param currentDate The current date and time.
 * @param userSession The session details.
 * @param userSession.expiresAt The date and time when the session expires.
 * @param userSession.createdAt The date and time when the session was created.
 * @param userSession.renewedAt The date and time when the session was last renewed.
 * @returns The validity of the session and the new expiry date if applicable.
 */
function validateSessionExpiry(
  currentDate: Date,
  userSession: {
    expiresAt: Date;
    createdAt: Date;
    renewedAt: Date;
  },
): { valid: boolean; newExpiry: Date | null } {
  // check if session is expired
  if (userSession.expiresAt < currentDate) {
    return { valid: false, newExpiry: null };
  }

  // check if session needs renewal
  const shouldRenewBy =
    userSession.renewedAt.getTime() + USER_SESSION_RENEWAL_THRESHOLD_SEC * 1000;

  if (shouldRenewBy < currentDate.getTime()) {
    const newExpiry = currentDate.getTime() + USER_SESSION_DURATION_SEC * 1000;
    const maxExpiry =
      USER_SESSION_MAX_LIFETIME_SEC === 0
        ? undefined
        : userSession.createdAt.getTime() +
          USER_SESSION_MAX_LIFETIME_SEC * 1000;
    return {
      valid: true,
      newExpiry: new Date(Math.min(newExpiry, maxExpiry ?? newExpiry)),
    };
  }

  return { valid: true, newExpiry: null };
}

/**
 * Generates a session token
 *
 * @returns The session token
 */
function generateSessionToken(): string {
  return randomBytes(16).toString('base64url');
}

export class CookieUserSessionService implements UserSessionService {
  /**
   * Creates a user session cookie and sets it in the response.
   *
   * @param userId The ID of the user for whom the session is being created.
   * @param context The request service context
   * @param currentDate The current date and time. Defaults to the current date and time.
   * @returns The session payload
   */
  async createSession(
    userId: string,
    context: RequestServiceContext,
    currentDate: Date = new Date(),
  ): Promise<UserSessionPayload> {
    const token = generateSessionToken();
    const expiresAt = new Date(
      currentDate.getTime() + USER_SESSION_DURATION_SEC * 1000,
    );

    await TPL_PRISMA_USER_SESSION.create({
      data: {
        user: { connect: { id: userId } },
        token,
        expiresAt,
      },
    });

    // Fetch user roles to include in the session payload
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { roles: true },
    });

    const roles: readonly AuthRole[] = [
      ...DEFAULT_USER_ROLES,
      ...user.roles.map((role) => role.role as AuthRole),
    ];

    const cookieName = getUserSessionCookieName(context.reqInfo.headers);
    const cookieValue = signObject({ token }, config.AUTH_SECRET);

    context.cookieStore.set(cookieName, cookieValue, COOKIE_OPTIONS);

    return { userId, expiresAt, roles };
  }

  /**
   * Ends the user session by clearing the session cookie and deleting the session from the database.
   *
   * @param sessionInfo The session info
   * @param context The request service context
   */
  async clearSession(
    sessionInfo: AuthUserSessionInfo,
    context: RequestServiceContext,
  ): Promise<void> {
    await TPL_PRISMA_USER_SESSION.delete({
      where: { id: sessionInfo.id },
    });

    const cookieName = getUserSessionCookieName(context.reqInfo.headers);
    context.cookieStore.clear(cookieName, COOKIE_OPTIONS);
  }

  /**
   * Retrieves the user session information from the request.
   *
   * @param req - The Fastify request object containing the cookies.
   * @param reply - The Fastify reply object used to set or clear cookies.
   * @param currentDate - The current date used for session validation. Defaults to the current date and time.
   * @returns A promise that resolves to the authenticated user session information or null if the session is invalid.
   * @throws {InvalidSessionError} If the session is invalid or expired.
   */
  async getSessionInfoFromRequest(
    req: FastifyRequest,
    reply?: FastifyReply,
  ): Promise<AuthUserSessionInfo | undefined> {
    const currentDate = new Date();

    const cookieName = getUserSessionCookieName(req.headers);

    // Check if the session cookie is present
    const sessionCookieValue = req.cookies[cookieName];
    if (!sessionCookieValue) return undefined;

    // Check Origin header for non-GET/HEAD requests to prevent CSRF attacks
    if (
      (req.method !== 'GET' ||
        req.headers.upgrade?.toLowerCase() === 'websocket') &&
      req.method !== 'HEAD' &&
      !verifyRequestOrigin(req, [req.host, ...config.ALLOWED_ORIGINS])
    ) {
      throw new ForbiddenError('Invalid Origin header');
    }
    try {
      // Unsign the session cookie
      const sessionCookieResult = unsignObject(
        sessionCookieValue,
        config.AUTH_SECRET,
      ) as SessionCookieValue | undefined;
      if (!sessionCookieResult) throw new InvalidSessionError();

      const { token } = sessionCookieResult;
      if (typeof token !== 'string') throw new InvalidSessionError();

      // Fetch and validate user session
      const userSession = await TPL_PRISMA_USER_SESSION.findUnique({
        where: { token },
        include: { user: { select: { id: true, roles: true } } },
      });
      if (!userSession) throw new InvalidSessionError();

      const sessionExpiryResult = validateSessionExpiry(
        currentDate,
        userSession,
      );
      if (!sessionExpiryResult.valid)
        throw new InvalidSessionError('Session expired');

      // renew the session if needed
      if (sessionExpiryResult.newExpiry && reply) {
        await TPL_PRISMA_USER_SESSION.update({
          where: { id: userSession.id },
          data: {
            renewedAt: currentDate,
            expiresAt: sessionExpiryResult.newExpiry,
          },
        });
        const newSignedCookie = signObject({ token }, config.AUTH_SECRET);
        reply.setCookie(cookieName, newSignedCookie, COOKIE_OPTIONS);
      }

      const { user } = userSession;
      const expiresAt = sessionExpiryResult.newExpiry ?? userSession.expiresAt;

      return {
        id: userSession.id,
        type: 'user',
        roles: [
          ...DEFAULT_USER_ROLES,
          ...user.roles.map((role) => role.role as AuthRole),
        ],
        userId: user.id,
        expiresAt,
      };
    } catch (err) {
      // clear the cookie if it's invalid
      if (err instanceof InvalidSessionError && reply) {
        reply.clearCookie(cookieName, COOKIE_OPTIONS);
      }
      throw err;
    }
  }

  /**
   * Retrieves the user session information from the authentication token
   *
   * Note: Since we use cookies, we ignore the authToken parameter
   *
   * @param req The request object
   * @returns The session info or undefined if no session is found
   */
  async getSessionInfoFromToken(
    req: FastifyRequest,
  ): Promise<AuthUserSessionInfo | undefined> {
    return this.getSessionInfoFromRequest(req, undefined);
  }
}

export const userSessionService = new CookieUserSessionService();
