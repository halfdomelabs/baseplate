// @ts-nocheck
import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { config } from '%config';
import { UnauthorizedError } from '%http-errors';

export class InvalidTokenError extends UnauthorizedError {
  constructor(message = 'Invalid token') {
    super(message, 'invalid-token');
  }
}

export const jwtService = {
  async sign<PayloadType extends JwtPayload = JwtPayload>(
    payload: PayloadType,
    expiresIn: string | number
  ): Promise<string> {
    return sign(payload, config.JWT_SECRET, {
      expiresIn,
    });
  },
  async verify<PayloadType extends JwtPayload = JwtPayload>(
    token: string
  ): Promise<PayloadType> {
    try {
      return verify(token, config.JWT_SECRET) as PayloadType;
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired', 'token-expired');
      }
      throw new InvalidTokenError('Error validating token');
    }
  },
};
