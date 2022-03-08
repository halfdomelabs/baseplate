// @ts-nocheck
import { JwtPayload, sign, verify } from 'jsonwebtoken';

export class InvalidTokenError extends UNAUTHORIZED_ERROR {
  constructor(message = 'Invalid token') {
    super(message, 'invalid-token');
  }
}

export const jwtService = {
  async sign<PayloadType extends JwtPayload = JwtPayload>(
    payload: PayloadType,
    expiresIn: string | number
  ): Promise<string> {
    return sign(payload, CONFIG.JWT_SECRET, {
      expiresIn,
    });
  },
  async verify<PayloadType extends JwtPayload = JwtPayload>(
    token: string
  ): Promise<PayloadType> {
    try {
      return verify(token, CONFIG.JWT_SECRET) as PayloadType;
    } catch (err) {
      throw new InvalidTokenError('Error validating token');
    }
  },
};
