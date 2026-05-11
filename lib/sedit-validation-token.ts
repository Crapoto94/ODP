import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET_KEY || 'super-secret-key-change-me-in-production';
const key = new TextEncoder().encode(secretKey);

export interface SeditValidationTokenPayload {
  billingRunId: string;
  agentEmail: string;
  agentName: string;
  dossiersCount: number;
  iat?: number;
  exp?: number;
}

/**
 * Generate a SEDIT validation token with 7-day expiration
 */
export async function generateSeditValidationToken(
  billingRunId: string,
  agentEmail: string,
  agentName: string,
  dossiersCount: number,
  expirationDays: number = 7
): Promise<string> {
  const token = await new SignJWT({
    billingRunId,
    agentEmail,
    agentName,
    dossiersCount,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expirationDays}d`)
    .sign(key);

  return token;
}

/**
 * Validate and decode a SEDIT validation token
 */
export async function validateSeditValidationToken(
  token: string
): Promise<SeditValidationTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return {
      billingRunId: (payload.billingRunId as string),
      agentEmail: (payload.agentEmail as string),
      agentName: (payload.agentName as string),
      dossiersCount: (payload.dossiersCount as number),
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
