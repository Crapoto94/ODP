import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET_KEY || 'super-secret-key-change-me-in-production';
const key = new TextEncoder().encode(secretKey);

export interface SignatureTokenPayload {
  occupationId: number;
  signatoriesId: number;
  requestId: number;
  iat?: number;
  exp?: number;
}

/**
 * Generate a signature request token with 7-day expiration
 */
export async function generateSignatureToken(
  occupationId: number,
  signatoriesId: number,
  requestId: number,
  expirationDays: number = 7
): Promise<string> {
  const token = await new SignJWT({
    occupationId,
    signatoriesId,
    requestId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expirationDays}d`)
    .sign(key);

  return token;
}

/**
 * Validate and decode a signature request token
 */
export async function validateSignatureToken(
  token: string
): Promise<SignatureTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return {
      occupationId: (payload.occupationId as number),
      signatoriesId: (payload.signatoriesId as number),
      requestId: (payload.requestId as number),
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get expiration timestamp for a token (7 days from now)
 */
export function getTokenExpirationDate(daysFromNow: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
